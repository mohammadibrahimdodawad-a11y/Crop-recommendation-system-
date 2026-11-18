import { useEffect, useState } from 'react';
import { ArrowRight, Compass, Database, CloudSun, Sprout } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { SafeImage } from '../components/SafeImage.tsx';

interface CoverageStats {
  total_crops: number;
  total_wrb_soils: number;
  total_textures: number;
  total_varieties: number;
  countries_covered: number;
  categories_covered: number;
}

export function HomePage() {
  const { t, navigate } = useApp();
  const [coverage, setCoverage] = useState<CoverageStats | null>(null);

  useEffect(() => {
    fetch('/api/datasets')
      .then((r) => r.json())
      .then((d) => {
        if (d.coverage) setCoverage(d.coverage);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section: 2-column balanced split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-4">
            <p className="text-xs font-semibold tracking-wider text-emerald-800 mb-3">
              {t('hero_kicker')}
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[#142218] leading-[1.15]">
              {t('hero_title')}
            </h1>
            <p className="mt-4 text-base text-[#4B5E50] leading-relaxed max-w-xl">
              {t('hero_subtitle')}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/recommend')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t('hero_cta_primary')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/crops')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#142218] bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{t('hero_cta_secondary')}</span>
              </button>
            </div>
            <p className="mt-5 text-xs text-[#4B5E50]">
              Prioritized regional testing in Karnataka &amp; India · Scalable global WRB &amp; FAO EcoCrop architecture
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="h-72 sm:h-96 lg:h-full min-h-[340px] rounded-xl overflow-hidden border border-[#E2E8E2] bg-stone-100">
              <SafeImage
                src="/src/assets/images/hero_agronomy_field_1794994417762.jpg"
                alt="Aerial view of terraced green agricultural farmlands and diverse crop plots"
                className="w-full h-full object-cover"
                fallbackTitle="Global Agricultural Landscapes"
              />
            </div>
          </div>
        </div>

        {/* 4-column Verified Database Coverage Strip below Hero */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-b border-[#E2E8E2] py-6 bg-white rounded-xl px-6">
          <div>
            <p className="text-xs text-[#4B5E50]">Documented Crops</p>
            <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">
              {coverage ? coverage.total_crops : '—'}
            </p>
            <p className="text-xs text-[#4B5E50] mt-0.5">Across {coverage ? coverage.categories_covered : 13} categories</p>
          </div>
          <div>
            <p className="text-xs text-[#4B5E50]">WRB Soil Groups</p>
            <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">
              {coverage ? coverage.total_wrb_soils : 32}
            </p>
            <p className="text-xs text-[#4B5E50] mt-0.5">Plus {coverage ? coverage.total_textures : 12} USDA texture classes</p>
          </div>
          <div>
            <p className="text-xs text-[#4B5E50]">Countries Documented</p>
            <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">
              {coverage ? `${coverage.countries_covered}+` : '—'}
            </p>
            <p className="text-xs text-[#4B5E50] mt-0.5">Karnataka focus &amp; global scope</p>
          </div>
          <div>
            <p className="text-xs text-[#4B5E50]">Climate &amp; Soil APIs</p>
            <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">Live</p>
            <p className="text-xs text-[#4B5E50] mt-0.5">Open-Meteo &amp; ISRIC SoilGrids</p>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#142218]">Scientific modules built for real farm workflows</h2>
            <p className="mt-1 text-sm text-[#4B5E50]">
              Every data point distinguishes between laboratory measurements, gridded estimates, forecasts, and verified historical references.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/how-it-works')}
            className="text-sm font-semibold text-emerald-800 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Read how scoring works →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2E8E2] rounded-xl overflow-hidden flex flex-col">
            <div className="h-48 bg-stone-100">
              <SafeImage
                src="/src/assets/images/soil_profile_cross_section_1794994418063.jpg"
                alt="Scientific soil horizon cross-section showing topsoil and root zone"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#4B5E50] mb-2">
                  <Compass className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>FAO WRB · USDA Taxonomy</span>
                </div>
                <h3 className="text-lg font-semibold text-[#142218]">32 Global Soil Groups</h3>
                <p className="mt-2 text-sm text-[#4B5E50] leading-relaxed">
                  Explore Black Cotton Soil (Vertisols), Red Loams (Lixisols), Laterites (Ferralsols/Plinthosols), and all 32 WRB soil groups in simple language.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/soils')}
                className="mt-5 text-sm font-semibold text-emerald-800 hover:underline text-left cursor-pointer"
              >
                Open Soil Database →
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8E2] rounded-xl overflow-hidden flex flex-col">
            <div className="h-48 bg-stone-100">
              <SafeImage
                src="/src/assets/images/karnataka_ragi_harvest_1794994418449.jpg"
                alt="Finger millet (Ragi) and rice paddy harvest in rural Karnataka"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#4B5E50] mb-2">
                  <Database className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>FAO EcoCrop · ICAR · UAS</span>
                </div>
                <h3 className="text-lg font-semibold text-[#142218]">Canonical Crop Catalogue</h3>
                <p className="mt-2 text-sm text-[#4B5E50] leading-relaxed">
                  Search cereals, millets, pulses, oilseeds, cash crops, fruits, vegetables, and spices with pH, NPK, climate thresholds, and Kannada names.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/crops')}
                className="mt-5 text-sm font-semibold text-emerald-800 hover:underline text-left cursor-pointer"
              >
                Browse Global Crops →
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8E2] rounded-xl overflow-hidden flex flex-col">
            <div className="h-48 bg-stone-100">
              <SafeImage
                src="/src/assets/images/farmer_agronomy_fieldwork_1794994419412.jpg"
                alt="Agronomist inspecting crop foliage and soil moisture in field"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#4B5E50] mb-2">
                  <CloudSun className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Open-Meteo · Random Forest ML</span>
                </div>
                <h3 className="text-lg font-semibold text-[#142218]">Weather &amp; Market Benchmarks</h3>
                <p className="mt-2 text-sm text-[#4B5E50] leading-relaxed">
                  Fetch live observations and 7-day forecasts for any farm coordinate, and review dated AGMARKNET &amp; World Bank price trends.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/weather')}
                  className="text-sm font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  Weather →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/markets')}
                  className="text-sm font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  Markets →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Methodology Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#F3F6F3] border border-[#E2E8E2] rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-2">
              <Sprout className="w-4 h-4" aria-hidden="true" />
              <span>Transparent Agricultural Decision Support</span>
            </div>
            <h2 className="text-xl font-bold text-[#142218]">No fabricated data, no guaranteed yields.</h2>
            <p className="mt-2 text-sm text-[#4B5E50] leading-relaxed">
              When soil or weather information is missing or estimated from global grids, the platform tells you clearly. Laboratory soil tests always take priority over spatial estimates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/methodology')}
            className="px-5 py-2.5 text-sm font-semibold bg-white border border-stone-300 text-[#142218] hover:bg-stone-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inspect Methodology &amp; ML Metrics
          </button>
        </div>
      </section>
    </div>
  );
}
