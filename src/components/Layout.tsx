import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, language, setLanguage, t, route, navigate } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryLinks = [
    { path: '/recommend', label: t('nav_recommend') },
    { path: '/crops', label: t('nav_crops') },
    { path: '/soils', label: t('nav_soils') },
    { path: '/weather', label: t('nav_weather') },
    { path: '/markets', label: t('nav_markets') },
  ];

  const handleLink = (to: string) => {
    setMobileMenuOpen(false);
    navigate(to);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBF9] text-[#142218]">
      {/* Top Bar Contract: strictly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E2E8E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => handleLink('/')}
            className="text-xl font-bold tracking-tight text-[#142218] hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            {t('brand')}
          </button>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5E50]" aria-label="Primary navigation">
            {primaryLinks.map((item) => {
              const active = route === item.path || (item.path === '/crops' && route.startsWith('/crops/'));
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleLink(item.path)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-700 ${
                    active
                      ? 'border-emerald-700 text-[#142218] font-semibold'
                      : 'border-transparent hover:text-[#142218] hover:border-stone-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleLink(user ? '/dashboard' : '/login')}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {user ? t('nav_dashboard') : t('nav_signin')}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg border border-stone-200 text-[#142218] hover:bg-stone-100 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8E2] bg-white px-4 py-4 space-y-2">
            {primaryLinks.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => handleLink(item.path)}
                className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#142218] hover:bg-[#F3F6F3] cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-stone-200 flex flex-wrap gap-2">
              <button type="button" onClick={() => handleLink('/about')} className="px-3 py-2 text-xs text-[#4B5E50] hover:text-[#142218] cursor-pointer">{t('nav_about')}</button>
              <button type="button" onClick={() => handleLink('/how-it-works')} className="px-3 py-2 text-xs text-[#4B5E50] hover:text-[#142218] cursor-pointer">{t('nav_how')}</button>
              <button type="button" onClick={() => handleLink('/methodology')} className="px-3 py-2 text-xs text-[#4B5E50] hover:text-[#142218] cursor-pointer">{t('nav_methodology')}</button>
              <button type="button" onClick={() => handleLink('/contact')} className="px-3 py-2 text-xs text-[#4B5E50] hover:text-[#142218] cursor-pointer">{t('nav_contact')}</button>
              {user?.role === 'admin' && (
                <button type="button" onClick={() => handleLink('/admin')} className="px-3 py-2 text-xs font-semibold text-emerald-800 cursor-pointer">{t('nav_admin')}</button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Workspace Utility Bar below Header: Secondary Links + Bilingual Switcher */}
      <div className="bg-[#F3F6F3] border-b border-[#E2E8E2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-[#4B5E50]">
            <button type="button" onClick={() => handleLink('/about')} className="hover:text-[#142218] whitespace-nowrap cursor-pointer">{t('nav_about')}</button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => handleLink('/how-it-works')} className="hover:text-[#142218] whitespace-nowrap cursor-pointer">{t('nav_how')}</button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => handleLink('/methodology')} className="hover:text-[#142218] whitespace-nowrap cursor-pointer">{t('nav_methodology')}</button>
            <span aria-hidden="true">·</span>
            <button type="button" onClick={() => handleLink('/contact')} className="hover:text-[#142218] whitespace-nowrap cursor-pointer">{t('nav_contact')}</button>
            {user?.role === 'admin' && (
              <>
                <span aria-hidden="true">·</span>
                <button type="button" onClick={() => handleLink('/admin')} className="font-semibold text-emerald-800 hover:underline whitespace-nowrap cursor-pointer">
                  {t('nav_admin')}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0" role="group" aria-label="Language selection">
            <span className="text-[#4B5E50] hidden sm:inline">Language:</span>
            <div className="inline-flex rounded-md bg-white border border-stone-200 p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  language === 'en' ? 'bg-emerald-700 text-white' : 'text-[#4B5E50] hover:text-[#142218]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('kn')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  language === 'kn' ? 'bg-emerald-700 text-white' : 'text-[#4B5E50] hover:text-[#142218]'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Clean 3-Column Footer */}
      <footer className="bg-white border-t border-[#E2E8E2] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <p className="text-lg font-bold text-[#142218]">{t('brand')}</p>
              <p className="mt-2 text-sm text-[#4B5E50] leading-relaxed">
                Global Smart Crop Recommendation System — An open agricultural intelligence platform supporting Karnataka, India, and worldwide farming communities.
              </p>
              <p className="mt-3 text-xs text-[#4B5E50]">
                Data references: FAO EcoCrop · FAO WRB (32 Soil Groups) · ISRIC SoilGrids v2.0 · Open-Meteo · ICAR / UAS Bengaluru
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#142218] mb-3">Platform Tools</h3>
              <ul className="space-y-2 text-sm text-[#4B5E50]">
                <li><button type="button" onClick={() => handleLink('/recommend')} className="hover:text-emerald-800 cursor-pointer">{t('nav_recommend')}</button></li>
                <li><button type="button" onClick={() => handleLink('/crops')} className="hover:text-emerald-800 cursor-pointer">{t('nav_crops')}</button></li>
                <li><button type="button" onClick={() => handleLink('/soils')} className="hover:text-emerald-800 cursor-pointer">{t('nav_soils')}</button></li>
                <li><button type="button" onClick={() => handleLink('/weather')} className="hover:text-emerald-800 cursor-pointer">{t('nav_weather')}</button></li>
                <li><button type="button" onClick={() => handleLink('/markets')} className="hover:text-emerald-800 cursor-pointer">{t('nav_markets')}</button></li>
                <li><button type="button" onClick={() => handleLink('/dashboard')} className="hover:text-emerald-800 cursor-pointer">{t('nav_dashboard')}</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#142218] mb-3">Documentation & Governance</h3>
              <ul className="space-y-2 text-sm text-[#4B5E50]">
                <li><button type="button" onClick={() => handleLink('/about')} className="hover:text-emerald-800 cursor-pointer">{t('nav_about')}</button></li>
                <li><button type="button" onClick={() => handleLink('/how-it-works')} className="hover:text-emerald-800 cursor-pointer">{t('nav_how')}</button></li>
                <li><button type="button" onClick={() => handleLink('/methodology')} className="hover:text-emerald-800 cursor-pointer">{t('nav_methodology')}</button></li>
                <li><button type="button" onClick={() => handleLink('/contact')} className="hover:text-emerald-800 cursor-pointer">{t('nav_contact')}</button></li>
                <li><button type="button" onClick={() => handleLink('/privacy')} className="hover:text-emerald-800 cursor-pointer">{t('nav_privacy')}</button></li>
                <li><button type="button" onClick={() => handleLink('/terms')} className="hover:text-emerald-800 cursor-pointer">{t('nav_terms')}</button></li>
                <li><button type="button" onClick={() => handleLink('/admin')} className="hover:text-emerald-800 cursor-pointer">{t('nav_admin')}</button></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#4B5E50]">
            <span>Global Smart Crop Recommendation System · Agricultural Decision Support</span>
            <span>Never guarantees yield or profit · Verify critical decisions with local extension officers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
