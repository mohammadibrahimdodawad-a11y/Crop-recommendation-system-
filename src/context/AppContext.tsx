import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS, type Language } from '../i18n/translations.ts';

export interface UserSession {
  id: number;
  email: string;
  fullName: string;
  role: string;
  preferredLanguage: string;
  csrfToken: string;
}

interface AppContextValue {
  user: UserSession | null;
  authLoading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  route: string;
  navigate: (to: string) => void;
  refreshUser: () => Promise<void>;
  setUser: (u: UserSession | null) => void;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gscrs_lang');
    return saved === 'kn' ? 'kn' : 'en';
  });
  const [route, setRoute] = useState<string>(() => window.location.pathname || '/');

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname) {
      window.history.pushState({}, '', to);
      setRoute(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const apiFetch = useCallback(
    async <T = any,>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers || {});
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const method = (options.method || 'GET').toUpperCase();
      if (method !== 'GET' && method !== 'HEAD' && user?.csrfToken) {
        headers.set('X-CSRF-Token', user.csrfToken);
      }

      const resp = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(json?.error || `Request failed (${resp.status})`);
      }
      return json as T;
    },
    [user?.csrfToken],
  );

  const refreshUser = useCallback(async () => {
    try {
      const data = await fetch('/api/auth/me', { credentials: 'same-origin' }).then((r) => r.json());
      setUser(data.user || null);
      if (data.user?.preferredLanguage === 'kn' || data.user?.preferredLanguage === 'en') {
        setLanguageState(data.user.preferredLanguage);
        localStorage.setItem('gscrs_lang', data.user.preferredLanguage);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      localStorage.setItem('gscrs_lang', lang);
      document.documentElement.lang = lang === 'kn' ? 'kn' : 'en';
      if (user?.csrfToken) {
        fetch('/api/auth/language', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': user.csrfToken,
          },
          credentials: 'same-origin',
          body: JSON.stringify({ language: lang }),
        }).catch(() => {});
      }
    },
    [user?.csrfToken],
  );

  const t = useCallback(
    (key: string): string => {
      return TRANSLATIONS[language][key] || TRANSLATIONS.en[key] || key;
    },
    [language],
  );

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        language,
        setLanguage,
        t,
        route,
        navigate,
        refreshUser,
        setUser,
        apiFetch,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
