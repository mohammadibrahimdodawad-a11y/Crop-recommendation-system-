import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase } from './server/db.ts';
import {
  attachAuth,
  createSession,
  destroySession,
  hashPassword,
  logAudit,
  rateLimit,
  requireAdmin,
  requireAuth,
  verifyCsrf,
  verifyPassword,
} from './server/auth.ts';
import { seedSoils } from './server/seedSoils.ts';
import { seedCropsAndDatasets, upsertCropEntry } from './server/seedCrops.ts';
import { seedUsersAndMarkets } from './server/seedMarketsAndUsers.ts';
import { ensureTrainedModel, runRecommendationEngine } from './server/mlEngine.ts';
import { fetchSoilEstimate, fetchWeatherForLocation, geocodePlace } from './server/externalApis.ts';
import type { CropSeedEntry } from './server/cropTypes.ts';

// Initialize database, seed verified agricultural datasets, and ensure ML model is trained
initDatabase();
seedSoils();
seedCropsAndDatasets();
seedUsersAndMarkets();
ensureTrainedModel();

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(attachAuth);

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req, res) => {
    const cropsCount = (db.prepare('SELECT COUNT(*) AS cnt FROM crops').get() as { cnt: number }).cnt;
    const soilsCount = (db.prepare('SELECT COUNT(*) AS cnt FROM soil_types').get() as { cnt: number }).cnt;
    res.json({ status: 'ok', crops: cropsCount, wrb_soil_groups: soilsCount });
  });

  // ================= AUTH ROUTES =================
  app.get('/api/auth/me', (req, res) => {
    if (!req.authUser) {
      res.json({ user: null });
      return;
    }
    res.json({ user: req.authUser });
  });

  app.post('/api/auth/register', rateLimit(15, 60_000), (req, res) => {
    const { email, password, full_name, country, state_province, district_region, preferred_language } = req.body || {};
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }

    const normEmail = email.trim().toLowerCase();
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normEmail);
    if (exists) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const farmerRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('farmer') as { id: number };
    const lang = preferred_language === 'kn' ? 'kn' : 'en';

    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role_id, preferred_language)
      VALUES (?, ?, ?, ?, ?)
    `).run(normEmail, hashPassword(password), full_name.trim(), farmerRole.id, lang);
    const userId = Number(userRes.lastInsertRowid);

    let locId: number | null = null;
    if (country) {
      const locRes = db.prepare(`
        INSERT INTO locations (country, state_province, district_region)
        VALUES (?, ?, ?)
      `).run(String(country).trim(), state_province ? String(state_province).trim() : null, district_region ? String(district_region).trim() : null);
      locId = Number(locRes.lastInsertRowid);
    }

    db.prepare(`
      INSERT INTO farmer_profiles (user_id, primary_location_id)
      VALUES (?, ?)
    `).run(userId, locId);

    const { csrfToken } = createSession(userId, res);
    logAudit(userId, 'USER_REGISTER', 'users', userId, `Registered ${normEmail}`, req.ip);

    res.status(201).json({
      user: {
        id: userId,
        email: normEmail,
        fullName: full_name.trim(),
        role: 'farmer',
        preferredLanguage: lang,
        csrfToken,
      },
    });
  });

  app.post('/api/auth/login', rateLimit(20, 60_000), (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const normEmail = String(email).trim().toLowerCase();
    const row = db.prepare(`
      SELECT u.id, u.email, u.password_hash, u.full_name, u.preferred_language, u.is_active, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
    `).get(normEmail) as any;

    if (!row || !verifyPassword(String(password), row.password_hash)) {
      logAudit(null, 'LOGIN_FAILED', 'users', normEmail, 'Invalid credentials', req.ip);
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (!row.is_active) {
      res.status(403).json({ error: 'This account has been deactivated by an administrator.' });
      return;
    }

    const { csrfToken } = createSession(row.id, res);
    logAudit(row.id, 'USER_LOGIN', 'users', row.id, `Signed in as ${row.role_name}`, req.ip);

    res.json({
      user: {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role_name,
        preferredLanguage: row.preferred_language,
        csrfToken,
      },
    });
  });

  app.post('/api/auth/logout', verifyCsrf, (req, res) => {
    if (req.authUser) {
      logAudit(req.authUser.id, 'USER_LOGOUT', 'users', req.authUser.id, undefined, req.ip);
    }
    destroySession(req, res);
    res.json({ ok: true });
  });

  app.patch('/api/auth/language', requireAuth, verifyCsrf, (req, res) => {
    const lang = req.body?.language === 'kn' ? 'kn' : 'en';
    db.prepare('UPDATE users SET preferred_language = ?, updated_at = datetime(\'now\') WHERE id = ?').run(lang, req.authUser!.id);
    res.json({ preferredLanguage: lang });
  });

  // ================= CROPS & CATEGORIES =================
  app.get('/api/categories', (_req, res) => {
    const categories = db.prepare(`
      SELECT cc.id, cc.slug, cc.name, cc.name_kn, cc.description,
             COUNT(DISTINCT m.crop_id) AS crop_count
      FROM crop_categories cc
      LEFT JOIN crop_category_map m ON m.category_id = cc.id
      GROUP BY cc.id
      ORDER BY crop_count DESC, cc.name ASC
    `).all();
    res.json({ categories });
  });

  app.get('/api/crops', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const country = typeof req.query.country === 'string' ? req.query.country.trim() : '';
    const season = typeof req.query.season === 'string' ? req.query.season.trim() : '';
    const soil = typeof req.query.soil === 'string' ? req.query.soil.trim() : '';

    let sql = `
      SELECT DISTINCT c.id, c.slug, c.common_name, c.common_name_kn, c.scientific_name, c.family_name,
             c.verification_status, c.source_reference,
             sr.ph_min, sr.ph_max, sr.suitable_wrb_groups, sr.suitable_textures,
             cr.temp_min_c, cr.temp_max_c, cr.rainfall_min_mm, cr.rainfall_max_mm, cr.water_requirement
      FROM crops c
      LEFT JOIN crop_soil_requirements sr ON sr.crop_id = c.id
      LEFT JOIN crop_climate_requirements cr ON cr.crop_id = c.id
    `;
    const joins: string[] = [];
    const where: string[] = [];
    const params: any[] = [];

    if (category && category !== 'all') {
      joins.push('JOIN crop_category_map m ON m.crop_id = c.id JOIN crop_categories cc ON cc.id = m.category_id');
      where.push('cc.slug = ?');
      params.push(category);
    }
    if (country && country !== 'all') {
      joins.push('JOIN crop_regions reg ON reg.crop_id = c.id');
      where.push('(LOWER(reg.country) = LOWER(?) OR LOWER(reg.state_or_region) LIKE LOWER(?))');
      params.push(country, `%${country}%`);
    }
    if (season && season !== 'all') {
      joins.push('JOIN crop_seasons cs ON cs.crop_id = c.id');
      where.push('LOWER(cs.season_name) LIKE LOWER(?)');
      params.push(`%${season}%`);
    }
    if (q) {
      joins.push('LEFT JOIN crop_synonyms syn ON syn.crop_id = c.id');
      where.push(`(
        LOWER(c.common_name) LIKE LOWER(?) OR
        LOWER(c.scientific_name) LIKE LOWER(?) OR
        LOWER(COALESCE(c.common_name_kn, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(syn.name, '')) LIKE LOWER(?)
      )`);
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (soil && soil !== 'all') {
      where.push('LOWER(COALESCE(sr.suitable_wrb_groups, \'\')) LIKE LOWER(?)');
      params.push(`%${soil}%`);
    }

    sql += ' ' + joins.join(' ');
    if (where.length > 0) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY c.common_name ASC';

    const crops = db.prepare(sql).all(...params) as any[];

    const enriched = crops.map((c) => {
      const cats = db.prepare(`
        SELECT cc.slug, cc.name, cc.name_kn FROM crop_category_map m
        JOIN crop_categories cc ON cc.id = m.category_id
        WHERE m.crop_id = ?
      `).all(c.id);
      const seasons = db.prepare('SELECT season_name, duration_days_min, duration_days_max FROM crop_seasons WHERE crop_id = ?').all(c.id);
      return {
        ...c,
        suitable_wrb_groups: JSON.parse(c.suitable_wrb_groups || '[]'),
        suitable_textures: JSON.parse(c.suitable_textures || '[]'),
        categories: cats,
        seasons,
      };
    });

    res.json({ total: enriched.length, crops: enriched });
  });

  app.get('/api/crops/:slug', (req, res) => {
    const slug = req.params.slug;
    const crop = db.prepare('SELECT * FROM crops WHERE slug = ? OR id = ?').get(slug, Number(slug) || -1) as any;
    if (!crop) {
      res.status(404).json({ error: 'Crop record not found.' });
      return;
    }
    const categories = db.prepare(`
      SELECT cc.slug, cc.name, cc.name_kn FROM crop_category_map m
      JOIN crop_categories cc ON cc.id = m.category_id WHERE m.crop_id = ?
    `).all(crop.id);
    const synonyms = db.prepare('SELECT name, language_or_region, is_scientific_synonym FROM crop_synonyms WHERE crop_id = ?').all(crop.id);
    const varieties = db.prepare('SELECT variety_name, region, maturity_days, traits, source_reference FROM crop_varieties WHERE crop_id = ?').all(crop.id);
    const soilReq = db.prepare('SELECT * FROM crop_soil_requirements WHERE crop_id = ?').get(crop.id) as any;
    const climateReq = db.prepare('SELECT * FROM crop_climate_requirements WHERE crop_id = ?').get(crop.id);
    const seasons = db.prepare('SELECT * FROM crop_seasons WHERE crop_id = ?').all(crop.id);
    const regions = db.prepare('SELECT * FROM crop_regions WHERE crop_id = ?').all(crop.id);
    const marketPrices = db.prepare('SELECT * FROM market_prices WHERE crop_id = ? ORDER BY price_date DESC').all(crop.id);

    let isFavourite = false;
    if (req.authUser) {
      const fav = db.prepare('SELECT 1 FROM favourite_crops WHERE user_id = ? AND crop_id = ?').get(req.authUser.id, crop.id);
      isFavourite = Boolean(fav);
    }

    res.json({
      crop: {
        ...crop,
        categories,
        synonyms,
        varieties,
        soil_requirements: soilReq
          ? {
              ...soilReq,
              suitable_wrb_groups: JSON.parse(soilReq.suitable_wrb_groups || '[]'),
              suitable_textures: JSON.parse(soilReq.suitable_textures || '[]'),
            }
          : null,
        climate_requirements: climateReq || null,
        seasons,
        regions,
        market_prices: marketPrices,
        is_favourite: isFavourite,
      },
    });
  });

  // ================= SOILS =================
  app.get('/api/soils', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    let wrbSoils: any[];
    if (q) {
      const like = `%${q}%`;
      wrbSoils = db.prepare(`
        SELECT * FROM soil_types
        WHERE LOWER(wrb_name) LIKE LOWER(?)
           OR LOWER(wrb_code) LIKE LOWER(?)
           OR LOWER(COALESCE(usda_equivalent, '')) LIKE LOWER(?)
           OR LOWER(regional_names) LIKE LOWER(?)
           OR LOWER(simple_explanation) LIKE LOWER(?)
        ORDER BY wrb_name ASC
      `).all(like, like, like, like, like);
    } else {
      wrbSoils = db.prepare('SELECT * FROM soil_types ORDER BY wrb_name ASC').all();
    }
    const textures = db.prepare('SELECT * FROM soil_textures ORDER BY id ASC').all();
    res.json({ wrb_count: wrbSoils.length, wrb_soils: wrbSoils, textures });
  });

  // ================= ML MODEL METRICS =================
  app.get('/api/ml/metrics', (_req, res) => {
    const model = ensureTrainedModel();
    res.json({ report: model.report });
  });

  // ================= RECOMMENDATION ENGINE =================
  app.post('/api/recommend', rateLimit(30, 60_000), (req, res) => {
    const b = req.body || {};
    const numOrNull = (val: unknown, min: number, max: number, label: string): number | null | 'INVALID' => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      if (Number.isNaN(num) || num < min || num > max) return 'INVALID';
      void label;
      return num;
    };

    const ph = numOrNull(b.ph, 3.0, 10.5, 'Soil pH');
    const nitrogen = numOrNull(b.nitrogen, 0, 600, 'Nitrogen');
    const phosphorus = numOrNull(b.phosphorus, 0, 400, 'Phosphorus');
    const potassium = numOrNull(b.potassium, 0, 500, 'Potassium');
    const temperature = numOrNull(b.temperature, -20, 55, 'Temperature');
    const rainfall = numOrNull(b.rainfall, 0, 6000, 'Rainfall');
    const humidity = numOrNull(b.humidity, 0, 100, 'Humidity');

    if ([ph, nitrogen, phosphorus, potassium, temperature, rainfall, humidity].includes('INVALID')) {
      res.status(400).json({
        error: 'One or more soil or climate measurements are outside realistic agronomic bounds (pH 3.0–10.5, Temp -20..55°C, Humidity 0–100%, Rainfall 0–6000 mm).',
      });
      return;
    }

    const input = {
      country: b.country ? String(b.country).trim() : 'India',
      state_province: b.state_province ? String(b.state_province).trim() : undefined,
      district_region: b.district_region ? String(b.district_region).trim() : undefined,
      latitude: typeof b.latitude === 'number' ? b.latitude : null,
      longitude: typeof b.longitude === 'number' ? b.longitude : null,
      soil_type: b.soil_type ? String(b.soil_type).trim() : undefined,
      soil_texture: b.soil_texture ? String(b.soil_texture).trim() : undefined,
      soil_source_mode: (b.soil_source_mode === 'estimated' ? 'estimated' : 'manual') as 'manual' | 'estimated',
      ph: ph as number | null,
      nitrogen: nitrogen as number | null,
      phosphorus: phosphorus as number | null,
      potassium: potassium as number | null,
      temperature: temperature as number | null,
      rainfall: rainfall as number | null,
      humidity: humidity as number | null,
      water_availability: b.water_availability ? String(b.water_availability).trim() : undefined,
      irrigation_method: b.irrigation_method ? String(b.irrigation_method).trim() : undefined,
      season: b.season ? String(b.season).trim() : undefined,
      preference_category: b.preference_category ? String(b.preference_category).trim() : 'all',
    };

    const result = runRecommendationEngine(input);

    const recInsert = db.prepare(`
      INSERT INTO recommendations (
        user_id, farm_id, country, state_province, district_region, latitude, longitude,
        soil_type_input, soil_texture_input, soil_source_mode, ph_input,
        nitrogen_input, phosphorus_input, potassium_input,
        temperature_input, rainfall_input, humidity_input,
        water_availability, irrigation_method, season_input, preference_category,
        status, model_version, dataset_version, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.authUser?.id ?? null,
      typeof b.farm_id === 'number' ? b.farm_id : null,
      input.country,
      input.state_province || null,
      input.district_region || null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.soil_type || null,
      input.soil_texture || null,
      input.soil_source_mode,
      input.ph,
      input.nitrogen,
      input.phosphorus,
      input.potassium,
      input.temperature,
      input.rainfall,
      input.humidity,
      input.water_availability || null,
      input.irrigation_method || null,
      input.season || null,
      input.preference_category || null,
      result.status,
      result.model_version,
      result.dataset_version,
      result.message,
    );
    const recId = Number(recInsert.lastInsertRowid);

    const insDet = db.prepare(`
      INSERT INTO recommendation_details (
        recommendation_id, crop_id, rank_order, agronomic_score, ml_probability, combined_score,
        explanation_json, warnings_json, limitations_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const item of result.recommendations) {
      insDet.run(
        recId,
        item.crop_id,
        item.rank,
        item.agronomic_score,
        item.ml_probability,
        item.combined_score,
        JSON.stringify(item.explanations),
        JSON.stringify(item.warnings),
        JSON.stringify(item.limitations),
      );
    }

    res.json({ ...result, recommendation_id: recId });
  });

  // ================= WEATHER, GEOCODE & SOIL ESTIMATE =================
  app.get('/api/geocode', rateLimit(30, 60_000), async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) {
      res.json({ results: [] });
      return;
    }
    const results = await geocodePlace(q);
    res.json({ results });
  });

  app.get('/api/weather', rateLimit(25, 60_000), async (req, res) => {
    const lat = Number(req.query.lat ?? 12.9716);
    const lon = Number(req.query.lon ?? 77.5946);
    const label = typeof req.query.label === 'string' && req.query.label.trim() ? req.query.label.trim() : 'Bengaluru, Karnataka, India';
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Invalid latitude or longitude.' });
      return;
    }
    const weather = await fetchWeatherForLocation(lat, lon, label);
    res.json({ weather });
  });

  app.get('/api/soil-estimate', rateLimit(20, 60_000), async (req, res) => {
    const lat = Number(req.query.lat ?? 12.5847);
    const lon = Number(req.query.lon ?? 77.0439);
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Invalid coordinates.' });
      return;
    }
    const estimate = await fetchSoilEstimate(lat, lon);
    res.json({ estimate });
  });

  // ================= MARKETS & DATASETS =================
  app.get('/api/markets', (req, res) => {
    const cropSlug = typeof req.query.crop === 'string' ? req.query.crop.trim() : '';
    const country = typeof req.query.country === 'string' ? req.query.country.trim() : '';

    let sql = `
      SELECT mp.*, c.slug AS crop_slug, c.common_name, c.common_name_kn
      FROM market_prices mp
      LEFT JOIN crops c ON c.id = mp.crop_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (cropSlug && cropSlug !== 'all') {
      sql += ' AND c.slug = ?';
      params.push(cropSlug);
    }
    if (country && country !== 'all') {
      sql += ' AND LOWER(mp.country) LIKE LOWER(?)';
      params.push(`%${country}%`);
    }
    sql += ' ORDER BY mp.price_date ASC, mp.commodity_name ASC';
    const prices = db.prepare(sql).all(...params);
    res.json({ prices });
  });

  app.get('/api/datasets', (_req, res) => {
    const datasets = db.prepare('SELECT * FROM datasets ORDER BY id ASC').all();
    const coverage = {
      total_crops: (db.prepare('SELECT COUNT(*) AS cnt FROM crops').get() as { cnt: number }).cnt,
      total_wrb_soils: (db.prepare('SELECT COUNT(*) AS cnt FROM soil_types').get() as { cnt: number }).cnt,
      total_textures: (db.prepare('SELECT COUNT(*) AS cnt FROM soil_textures').get() as { cnt: number }).cnt,
      total_varieties: (db.prepare('SELECT COUNT(*) AS cnt FROM crop_varieties').get() as { cnt: number }).cnt,
      countries_covered: (db.prepare('SELECT COUNT(DISTINCT country) AS cnt FROM crop_regions').get() as { cnt: number }).cnt,
      categories_covered: (db.prepare('SELECT COUNT(*) AS cnt FROM crop_categories').get() as { cnt: number }).cnt,
    };
    res.json({ datasets, coverage });
  });

  // ================= FARMER DASHBOARD =================
  app.get('/api/farmer/dashboard', requireAuth, (req, res) => {
    const uid = req.authUser!.id;
    const profile = db.prepare(`
      SELECT fp.*, l.country, l.state_province, l.district_region, l.village_town, l.latitude, l.longitude
      FROM farmer_profiles fp
      LEFT JOIN locations l ON l.id = fp.primary_location_id
      WHERE fp.user_id = ?
    `).get(uid);

    const farms = db.prepare(`
      SELECT f.*, l.country, l.state_province, l.district_region, l.latitude, l.longitude,
             st.wrb_name AS soil_type_name, stx.name AS soil_texture_name
      FROM farms f
      LEFT JOIN locations l ON l.id = f.location_id
      LEFT JOIN soil_types st ON st.id = f.soil_type_id
      LEFT JOIN soil_textures stx ON stx.id = f.soil_texture_id
      WHERE f.user_id = ?
      ORDER BY f.updated_at DESC
    `).all(uid);

    const favourites = db.prepare(`
      SELECT c.id, c.slug, c.common_name, c.common_name_kn, c.scientific_name, fc.created_at
      FROM favourite_crops fc
      JOIN crops c ON c.id = fc.crop_id
      WHERE fc.user_id = ?
      ORDER BY fc.created_at DESC
    `).all(uid);

    const history = db.prepare(`
      SELECT r.id, r.country, r.state_province, r.district_region, r.soil_type_input, r.soil_texture_input,
             r.ph_input, r.temperature_input, r.rainfall_input, r.season_input, r.status, r.created_at
      FROM recommendations r
      WHERE r.user_id = ?
      ORDER BY r.id DESC
      LIMIT 15
    `).all(uid) as any[];

    const enrichedHistory = history.map((h) => {
      const details = db.prepare(`
        SELECT rd.rank_order, rd.combined_score, c.common_name, c.slug
        FROM recommendation_details rd
        JOIN crops c ON c.id = rd.crop_id
        WHERE rd.recommendation_id = ?
        ORDER BY rd.rank_order ASC
      `).all(h.id);
      return { ...h, top_crops: details };
    });

    res.json({ profile, farms, favourites, recommendations: enrichedHistory });
  });

  app.post('/api/farmer/farms', requireAuth, verifyCsrf, (req, res) => {
    const b = req.body || {};
    if (!b.farm_name || typeof b.farm_name !== 'string') {
      res.status(400).json({ error: 'Farm name is required.' });
      return;
    }
    const locRes = db.prepare(`
      INSERT INTO locations (country, state_province, district_region, latitude, longitude)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      b.country || 'India',
      b.state_province || null,
      b.district_region || null,
      b.latitude ?? null,
      b.longitude ?? null,
    );
    const soilType = b.soil_type ? (db.prepare('SELECT id FROM soil_types WHERE wrb_name = ?').get(b.soil_type) as { id: number } | undefined) : undefined;
    const soilTex = b.soil_texture ? (db.prepare('SELECT id FROM soil_textures WHERE name = ?').get(b.soil_texture) as { id: number } | undefined) : undefined;

    const farmRes = db.prepare(`
      INSERT INTO farms (user_id, farm_name, location_id, area_hectares, soil_type_id, soil_texture_id, irrigation_method, water_availability, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.authUser!.id,
      b.farm_name.trim(),
      Number(locRes.lastInsertRowid),
      b.area_hectares ? Number(b.area_hectares) : null,
      soilType?.id ?? null,
      soilTex?.id ?? null,
      b.irrigation_method || 'Rainfed only',
      b.water_availability || 'Moderate',
      b.notes || null,
    );
    res.status(201).json({ id: Number(farmRes.lastInsertRowid) });
  });

  app.delete('/api/farmer/farms/:id', requireAuth, verifyCsrf, (req, res) => {
    db.prepare('DELETE FROM farms WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.authUser!.id);
    res.json({ ok: true });
  });

  app.post('/api/farmer/favourites/:cropId', requireAuth, verifyCsrf, (req, res) => {
    const cropId = Number(req.params.cropId);
    db.prepare('INSERT OR IGNORE INTO favourite_crops (user_id, crop_id) VALUES (?, ?)').run(req.authUser!.id, cropId);
    res.json({ favourite: true });
  });

  app.delete('/api/farmer/favourites/:cropId', requireAuth, verifyCsrf, (req, res) => {
    const cropId = Number(req.params.cropId);
    db.prepare('DELETE FROM favourite_crops WHERE user_id = ? AND crop_id = ?').run(req.authUser!.id, cropId);
    res.json({ favourite: false });
  });

  // ================= FEEDBACK =================
  app.post('/api/feedback', rateLimit(10, 60_000), (req, res) => {
    const { name, email, country, topic, message } = req.body || {};
    if (!name || !email || !topic || !message || String(message).trim().length < 5) {
      res.status(400).json({ error: 'Name, email, topic, and a descriptive message are required.' });
      return;
    }
    const r = db.prepare(`
      INSERT INTO feedback (user_id, name, email, country, topic, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.authUser?.id ?? null, String(name).trim(), String(email).trim(), country ? String(country).trim() : null, String(topic).trim(), String(message).trim());
    res.status(201).json({ id: Number(r.lastInsertRowid), status: 'pending' });
  });

  // ================= ADMIN DASHBOARD =================
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const stats = {
      users: (db.prepare('SELECT COUNT(*) AS cnt FROM users').get() as { cnt: number }).cnt,
      crops: (db.prepare('SELECT COUNT(*) AS cnt FROM crops').get() as { cnt: number }).cnt,
      soils: (db.prepare('SELECT COUNT(*) AS cnt FROM soil_types').get() as { cnt: number }).cnt,
      recommendations: (db.prepare('SELECT COUNT(*) AS cnt FROM recommendations').get() as { cnt: number }).cnt,
      pending_feedback: (db.prepare("SELECT COUNT(*) AS cnt FROM feedback WHERE status = 'pending'").get() as { cnt: number }).cnt,
      datasets: (db.prepare('SELECT COUNT(*) AS cnt FROM datasets').get() as { cnt: number }).cnt,
    };

    const users = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.preferred_language, u.is_active, u.created_at, r.name AS role
      FROM users u JOIN roles r ON r.id = u.role_id
      ORDER BY u.id DESC
    `).all();

    const feedback = db.prepare('SELECT * FROM feedback ORDER BY id DESC LIMIT 50').all();

    const recentRecommendations = db.prepare(`
      SELECT r.id, r.country, r.state_province, r.soil_type_input, r.season_input, r.status, r.created_at, u.email AS user_email
      FROM recommendations r LEFT JOIN users u ON u.id = r.user_id
      ORDER BY r.id DESC LIMIT 25
    `).all();

    const dataQuality = db.prepare(`
      SELECT c.id, c.slug, c.common_name, c.verification_status,
             CASE WHEN sr.ph_min IS NULL THEN 1 ELSE 0 END AS missing_ph,
             CASE WHEN cr.temp_min_c IS NULL THEN 1 ELSE 0 END AS missing_temp,
             CASE WHEN c.common_pests_diseases IS NULL THEN 1 ELSE 0 END AS missing_pests,
             CASE WHEN c.storage_guidance IS NULL THEN 1 ELSE 0 END AS missing_storage
      FROM crops c
      LEFT JOIN crop_soil_requirements sr ON sr.crop_id = c.id
      LEFT JOIN crop_climate_requirements cr ON cr.crop_id = c.id
      ORDER BY c.common_name ASC
    `).all();

    const auditLogs = db.prepare(`
      SELECT a.*, u.email AS actor_email
      FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.id DESC LIMIT 40
    `).all();

    res.json({ stats, users, feedback, recentRecommendations, dataQuality, auditLogs });
  });

  app.patch('/api/admin/users/:id/role', requireAdmin, verifyCsrf, (req, res) => {
    const targetId = Number(req.params.id);
    const { role, is_active } = req.body || {};
    if (role) {
      const rRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(String(role)) as { id: number } | undefined;
      if (!rRow) {
        res.status(400).json({ error: 'Invalid role.' });
        return;
      }
      db.prepare('UPDATE users SET role_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(rRow.id, targetId);
    }
    if (typeof is_active === 'boolean') {
      db.prepare('UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?').run(is_active ? 1 : 0, targetId);
    }
    logAudit(req.authUser!.id, 'ADMIN_UPDATE_USER', 'users', targetId, JSON.stringify({ role, is_active }), req.ip);
    res.json({ ok: true });
  });

  app.patch('/api/admin/feedback/:id', requireAdmin, verifyCsrf, (req, res) => {
    const fbId = Number(req.params.id);
    const { status, admin_notes } = req.body || {};
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    db.prepare('UPDATE feedback SET status = ?, admin_notes = ? WHERE id = ?').run(status, admin_notes || null, fbId);
    logAudit(req.authUser!.id, 'ADMIN_REVIEW_FEEDBACK', 'feedback', fbId, status, req.ip);
    res.json({ ok: true });
  });

  app.post('/api/admin/crops/import', requireAdmin, verifyCsrf, (req, res) => {
    const records = Array.isArray(req.body?.crops) ? (req.body.crops as CropSeedEntry[]) : null;
    if (!records || records.length === 0) {
      res.status(400).json({ error: 'Provide a non-empty "crops" JSON array of crop records.' });
      return;
    }
    let imported = 0;
    const ds = db.prepare('SELECT id FROM datasets WHERE code = ?').get('FAO-ECOCROP-2024') as { id: number } | undefined;
    db.exec('BEGIN TRANSACTION;');
    try {
      for (const rec of records) {
        if (!rec.slug || !rec.common_name || !rec.scientific_name) continue;
        upsertCropEntry(
          {
            ...rec,
            categories: Array.isArray(rec.categories) && rec.categories.length > 0 ? rec.categories : ['cereals'],
            synonyms: rec.synonyms || [],
            suitable_wrb: rec.suitable_wrb || [],
            suitable_textures: rec.suitable_textures || [],
            seasons: rec.seasons || [],
            regions: rec.regions || [],
            growth_conditions: rec.growth_conditions || 'Imported agronomic record.',
            water_req: rec.water_req || 'Unavailable',
            irrigation_req: rec.irrigation_req || 'Unavailable',
            drought_tolerance: rec.drought_tolerance || 'Unavailable',
            frost_sensitivity: rec.frost_sensitivity || 'Unavailable',
            source: rec.source || 'Admin Dataset Import',
          },
          ds?.id ?? null,
        );
        imported++;
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      res.status(500).json({ error: 'Failed to import crop batch.' });
      return;
    }
    logAudit(req.authUser!.id, 'ADMIN_IMPORT_CROPS', 'crops', imported, `Imported/updated ${imported} crop records`, req.ip);
    res.json({ imported });
  });

  app.delete('/api/admin/crops/:id', requireAdmin, verifyCsrf, (req, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM crops WHERE id = ?').run(id);
    logAudit(req.authUser!.id, 'ADMIN_DELETE_CROP', 'crops', id, undefined, req.ip);
    res.json({ ok: true });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT || 3000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Global Smart Crop Recommendation System running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NO_LISTEN !== '1') {
  startServer();
}
