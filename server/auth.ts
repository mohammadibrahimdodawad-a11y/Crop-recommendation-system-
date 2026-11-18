import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const SESSION_COOKIE = 'gscrs_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-ephemeral-secret-change-in-production-env';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  preferredLanguage: string;
  csrfToken: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser | null;
    }
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function signSessionId(sessionId: string): string {
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
  return `${sessionId}.${sig}`;
}

function verifySignedSessionId(cookieVal: string): string | null {
  const idx = cookieVal.lastIndexOf('.');
  if (idx === -1) return null;
  const sessionId = cookieVal.slice(0, idx);
  const sig = cookieVal.slice(idx + 1);
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(sessionId).digest('hex');
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return null;
    return crypto.timingSafeEqual(a, b) ? sessionId : null;
  } catch {
    return null;
  }
}

function parseCookies(header?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > -1) {
      const k = part.slice(0, eq).trim();
      const v = decodeURIComponent(part.slice(eq + 1).trim());
      cookies[k] = v;
    }
  }
  return cookies;
}

export function createSession(userId: number, res: Response): { sessionId: string; csrfToken: string } {
  const sessionId = crypto.randomBytes(24).toString('hex');
  const csrfToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, csrf_token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, csrfToken, expiresAt);

  const signed = signSessionId(sessionId);
  res.cookie(SESSION_COOKIE, signed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return { sessionId, csrfToken };
}

export function destroySession(req: Request, res: Response): void {
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[SESSION_COOKIE];
  if (raw) {
    const sessionId = verifySignedSessionId(raw);
    if (sessionId) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export function attachAuth(req: Request, _res: Response, next: NextFunction): void {
  req.authUser = null;
  const cookies = parseCookies(req.headers.cookie);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return next();

  const sessionId = verifySignedSessionId(raw);
  if (!sessionId) return next();

  const row = db.prepare(`
    SELECT s.id AS session_id, s.csrf_token, s.expires_at,
           u.id AS user_id, u.email, u.full_name, u.preferred_language, u.is_active,
           r.name AS role_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN roles r ON r.id = u.role_id
    WHERE s.id = ?
  `).get(sessionId) as
    | {
        session_id: string;
        csrf_token: string;
        expires_at: string;
        user_id: number;
        email: string;
        full_name: string;
        preferred_language: string;
        is_active: number;
        role_name: string;
      }
    | undefined;

  if (!row || !row.is_active || new Date(row.expires_at).getTime() < Date.now()) {
    if (row) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }
    return next();
  }

  req.authUser = {
    id: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role_name,
    preferredLanguage: row.preferred_language,
    csrfToken: row.csrf_token,
  };
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required.' });
    return;
  }
  next();
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  // Only enforce CSRF header when an authenticated session cookie is present
  if (!req.authUser) return next();
  const headerToken = req.headers['x-csrf-token'];
  if (typeof headerToken !== 'string' || headerToken !== req.authUser.csrfToken) {
    res.status(403).json({ error: 'Invalid or missing CSRF security token.' });
    return;
  }
  next();
}

// Simple sliding-window rate limiter per IP
const rateBuckets = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'local'}:${req.path}`;
    const now = Date.now();
    const history = (rateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (history.length >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
      return;
    }
    history.push(now);
    rateBuckets.set(key, history);
    next();
  };
}

export function logAudit(
  userId: number | null,
  action: string,
  targetTable?: string,
  targetId?: string | number,
  details?: string,
  ipAddress?: string,
): void {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, target_table, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, action, targetTable || null, targetId != null ? String(targetId) : null, details || null, ipAddress || null);
}
