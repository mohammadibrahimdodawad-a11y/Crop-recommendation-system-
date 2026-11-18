import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { SafeImage } from '../components/SafeImage.tsx';

interface WrbSoil {
  id: number;
  wrb_code: string;
  wrb_name: string;
  usda_equivalent: string | null;
  regional_names: string;
  simple_explanation: string;
  simple_explanation_kn: string | null;
  ph_typical_min: number | null;
  ph_typical_max: number | null;
  drainage_notes: string | null;
  fertility_notes: string | null;
  global_occurrence: string | null;
  source_attribution: string | null;
}

interface SoilTexture {
  id: number;
  name: string;
  name_kn: string | null;
  sand_pct_range: string | null;
  silt_pct_range: string | null;
  clay_pct_range: string | null;
  water_retention: string | null;
  drainage_rate: string | null;
  simple_explanation: string;
}

export function SoilsPage() {
  const { language, t, navigate } = useApp();
  const [query, setQuery] = useState('');
  const [soils, setSoils] = useState<WrbSoil[]>([]);
  const [textures, setTextures] = useState<SoilTexture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const url = query.trim() ? `/api/soils?q=${encodeURIComponent(query.trim())}` : '/api/soils';
      fetch(url, { signal: controller.signal })
        .then((r) => r.json())
        .then((d) => {
          setSoils(Array.isArray(d.wrb_soils) ? d.wrb_soils : []);
          setTextures(Array.isArray(d.textures) ? d.textures : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-8 border-b border-[#E2E8E2]">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">FAO WRB · USDA Soil Taxonomy · ISRIC</p>
          <h1 className="mt-1 text-3xl font-bold text-[#142218]">{t('soils_title')}</h1>
          <p className="mt-3 text-sm text-[#4B5E50] leading-relaxed">
            This catalogue covers all 32 official FAO World Reference Base (WRB) Reference Soil Groups alongside USDA Soil Taxonomy equivalents and commonly used regional descriptors such as Black Cotton Soil, Red Soil, Alluvial Soil, and Laterite.
          </p>
          <p className="mt-2 text-xs text-[#4B5E50]">
            Important scientific distinction: regional soil names describe local appearance or parent material and map into one or more WRB groups — they are never treated as separate WRB classifications. Soil texture (Sand/Silt/Clay) is stored separately from soil classification.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/recommend')}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
            >
              Use Soil in Crop Recommender
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 h-60 rounded-xl overflow-hidden border border-[#E2E8E2] bg-stone-100">
          <SafeImage
            src="/src/assets/images/soil_profile_cross_section_1794994418063.jpg"
            alt="Scientific soil horizon cross-section illustrating O, A, B, and C soil layers"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <label htmlFor="soil-search" className="sr-only">Search soils</label>
          <Search className="w-4 h-4 text-[#4B5E50] absolute left-3.5 top-3.5" aria-hidden="true" />
          <input
            id="soil-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search WRB group, USDA order, or regional name (e.g., Vertisols, Black Cotton, Red Soil, Laterite, Alluvial)..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
        <span className="text-sm font-mono text-[#142218] shrink-0">
          {loading ? 'Searching...' : `${soils.length} WRB groups`}
        </span>
      </div>

      {/* 32 WRB Soil Groups Grid */}
      <section>
        <h2 className="text-xl font-bold text-[#142218] mb-4">WRB Reference Soil Groups</h2>
        {soils.length === 0 && !loading ? (
          <div className="bg-white border border-[#E2E8E2] rounded-xl p-8 text-center text-sm text-[#4B5E50]">
            No soil groups match "{query}". Try clearing the search box.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {soils.map((s) => (
              <article key={s.id} className="bg-white border border-[#E2E8E2] rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold text-[#142218]">
                      {s.wrb_name} <span className="font-mono text-xs font-medium text-[#4B5E50]">({s.wrb_code})</span>
                    </h3>
                    <span className="font-mono text-xs text-emerald-800 shrink-0">
                      {s.ph_typical_min != null && s.ph_typical_max != null ? `pH ${s.ph_typical_min}–${s.ph_typical_max}` : 'pH varies'}
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5E50] mt-1">
                    USDA Equivalent: <span className="text-[#142218] font-medium">{s.usda_equivalent || 'Varies'}</span>
                  </p>
                  <p className="text-xs text-[#4B5E50] mt-1">
                    Regional terms: <span className="text-[#142218]">{s.regional_names}</span>
                  </p>

                  <p className="mt-3 text-sm text-[#142218] leading-relaxed">
                    {language === 'kn' && s.simple_explanation_kn ? s.simple_explanation_kn : s.simple_explanation}
                  </p>
                  {language === 'en' && s.simple_explanation_kn && (
                    <p className="mt-1.5 text-xs text-[#4B5E50]">{s.simple_explanation_kn}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-1 text-xs text-[#4B5E50]">
                  {s.drainage_notes && <p><strong className="text-[#142218]">Drainage:</strong> {s.drainage_notes}</p>}
                  {s.fertility_notes && <p><strong className="text-[#142218]">Fertility:</strong> {s.fertility_notes}</p>}
                  {s.global_occurrence && <p><strong className="text-[#142218]">Occurrence:</strong> {s.global_occurrence}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 12 USDA Soil Texture Classes */}
      <section className="bg-white border border-[#E2E8E2] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[#142218]">12 Recognized Soil Texture Classes (USDA Triangle)</h2>
        <p className="mt-1 text-sm text-[#4B5E50]">
          Texture describes particle size distribution (Sand, Silt, Clay) and controls water holding capacity, root aeration, and workability.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
              <tr>
                <th className="py-2.5 pr-4">Texture Class</th>
                <th className="py-2.5 pr-4">Sand %</th>
                <th className="py-2.5 pr-4">Silt %</th>
                <th className="py-2.5 pr-4">Clay %</th>
                <th className="py-2.5 pr-4">Water Retention</th>
                <th className="py-2.5">Farmer Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {textures.map((tx) => (
                <tr key={tx.id}>
                  <td className="py-2.5 pr-4 font-semibold text-[#142218]">
                    {tx.name}
                    {tx.name_kn ? <span className="block text-xs font-normal text-[#4B5E50]">{tx.name_kn}</span> : null}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{tx.sand_pct_range || '—'}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{tx.silt_pct_range || '—'}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{tx.clay_pct_range || '—'}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#142218]">{tx.water_retention || '—'} · {tx.drainage_rate || '—'}</td>
                  <td className="py-2.5 text-xs text-[#4B5E50]">{tx.simple_explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
