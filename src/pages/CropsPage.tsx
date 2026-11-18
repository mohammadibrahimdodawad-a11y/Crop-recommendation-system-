import { useEffect, useState } from 'react';
import { Search, ArrowRight, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface CategoryItem {
  id: number;
  slug: string;
  name: string;
  name_kn: string | null;
  description: string | null;
  crop_count: number;
}

interface CropListItem {
  id: number;
  slug: string;
  common_name: string;
  common_name_kn: string | null;
  scientific_name: string;
  family_name: string | null;
  verification_status: string;
  source_reference: string | null;
  ph_min: number | null;
  ph_max: number | null;
  temp_min_c: number | null;
  temp_max_c: number | null;
  rainfall_min_mm: number | null;
  rainfall_max_mm: number | null;
  water_requirement: string | null;
  suitable_wrb_groups: string[];
  categories: { slug: string; name: string; name_kn: string | null }[];
  seasons: { season_name: string; duration_days_min: number | null; duration_days_max: number | null }[];
}

export function CropsPage() {
  const { language, t, navigate } = useApp();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [crops, setCrops] = useState<CropListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [country, setCountry] = useState('all');
  const [season, setSeason] = useState('all');
  const [soil, setSoil] = useState('all');

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.categories)) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category !== 'all') params.set('category', category);
    if (country !== 'all') params.set('country', country);
    if (season !== 'all') params.set('season', season);
    if (soil !== 'all') params.set('soil', soil);

    const timer = setTimeout(() => {
      fetch(`/api/crops?${params.toString()}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d) => {
          setCrops(Array.isArray(d.crops) ? d.crops : []);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setError('Failed to load crop database.');
            setLoading(false);
          }
        });
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category, country, season, soil]);

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setCountry('all');
    setSeason('all');
    setSoil('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2E8E2]">
        <div>
          <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Canonical Agricultural Catalogue</p>
          <h1 className="mt-1 text-3xl font-bold text-[#142218]">{t('crops_title')}</h1>
          <p className="mt-2 text-sm text-[#4B5E50] max-w-2xl">
            Every species has one canonical record linked across multiple agricultural categories. Search by English, Kannada (ಕನ್ನಡ), scientific name, or regional synonym.
          </p>
        </div>
        <div className="text-sm font-mono text-[#142218] bg-white border border-[#E2E8E2] rounded-lg px-4 py-2 shrink-0">
          {loading ? 'Loading...' : `${crops.length} verified records`}
        </div>
      </div>

      {/* Search and Secondary Dropdown Filters */}
      <div className="mt-6 bg-white border border-[#E2E8E2] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 relative">
            <label htmlFor="crop-search" className="sr-only">Search crops</label>
            <Search className="w-4 h-4 text-[#4B5E50] absolute left-3.5 top-3.5" aria-hidden="true" />
            <input
              id="crop-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crop, scientific name, or Kannada (e.g., Ragi, ರಾಗಿ, Oryza)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-country" className="sr-only">Filter by region</label>
            <select
              id="filter-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg bg-white"
            >
              <option value="all">All Countries / Regions</option>
              <option value="Karnataka">Karnataka (India)</option>
              <option value="India">India (National)</option>
              <option value="United States">United States</option>
              <option value="Brazil">Brazil</option>
              <option value="Ethiopia">Ethiopia</option>
              <option value="Kenya">Kenya</option>
              <option value="China">China</option>
              <option value="Nigeria">Nigeria</option>
              <option value="France">France</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-season" className="sr-only">Filter by season</label>
            <select
              id="filter-season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg bg-white"
            >
              <option value="all">All Seasons</option>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Zaid">Zaid / Summer</option>
              <option value="Perennial">Perennial</option>
              <option value="Spring">Spring / Temperate</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <select
              aria-label="Filter by WRB Soil Group"
              value={soil}
              onChange={(e) => setSoil(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg bg-white"
            >
              <option value="all">All WRB Soil Groups</option>
              <option value="Vertisols">Vertisols (Black Cotton)</option>
              <option value="Lixisols">Lixisols (Red Loam)</option>
              <option value="Fluvisols">Fluvisols (Alluvial)</option>
              <option value="Ferralsols">Ferralsols (Laterite)</option>
              <option value="Luvisols">Luvisols</option>
              <option value="Cambisols">Cambisols</option>
              <option value="Nitisols">Nitisols</option>
              <option value="Arenosols">Arenosols (Sandy)</option>
              <option value="Chernozems">Chernozems</option>
              <option value="Andosols">Andosols (Volcanic)</option>
            </select>
            {(query || category !== 'all' || country !== 'all' || season !== 'all' || soil !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2.5 text-xs font-medium text-[#4B5E50] hover:text-[#142218] border border-stone-200 rounded-lg shrink-0 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2 text-xs text-[#4B5E50] mb-2">
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Filter by Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                category === 'all'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-[#FAFBF9] text-[#4B5E50] border-stone-200 hover:text-[#142218]'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setCategory(cat.slug)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  category === cat.slug
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-[#FAFBF9] text-[#4B5E50] border-stone-200 hover:text-[#142218]'
                }`}
              >
                {language === 'kn' && cat.name_kn ? cat.name_kn : cat.name} ({cat.crop_count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900">
          {error}
        </div>
      )}

      {/* Results Grid */}
      {!loading && crops.length === 0 ? (
        <div className="mt-8 bg-white border border-[#E2E8E2] rounded-xl p-10 text-center">
          <p className="text-base font-semibold text-[#142218]">No matching crops found</p>
          <p className="mt-1 text-sm text-[#4B5E50]">Try clearing a filter or searching with the botanical or English crop name.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {crops.map((crop) => {
            const catText = crop.categories
              .map((c) => (language === 'kn' && c.name_kn ? c.name_kn : c.name))
              .join(' · ');
            const seasonText = crop.seasons.map((s) => s.season_name).join(' · ') || 'Regional season varies';
            return (
              <article
                key={crop.id}
                className="bg-white border border-[#E2E8E2] rounded-xl p-5 flex flex-col justify-between hover:border-emerald-600/50 transition-colors"
              >
                <div>
                  <p className="text-xs text-[#4B5E50] font-medium truncate">{catText || 'Agricultural Crop'}</p>
                  <h2 className="mt-1 text-lg font-bold text-[#142218]">
                    {crop.common_name}
                    {crop.common_name_kn ? (
                      <span className="ml-2 text-sm font-normal text-[#4B5E50]">({crop.common_name_kn})</span>
                    ) : null}
                  </h2>
                  <p className="text-xs italic text-[#4B5E50]">{crop.scientific_name}</p>

                  <dl className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs">
                    <div>
                      <dt className="text-[#4B5E50]">Soil pH Range</dt>
                      <dd className="font-mono font-semibold text-[#142218] mt-0.5">
                        {crop.ph_min != null && crop.ph_max != null ? `${crop.ph_min} – ${crop.ph_max}` : 'Unavailable'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#4B5E50]">Temp Range</dt>
                      <dd className="font-mono font-semibold text-[#142218] mt-0.5">
                        {crop.temp_min_c != null && crop.temp_max_c != null ? `${crop.temp_min_c}–${crop.temp_max_c} °C` : 'Unavailable'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#4B5E50]">Rainfall</dt>
                      <dd className="font-mono font-semibold text-[#142218] mt-0.5">
                        {crop.rainfall_min_mm != null && crop.rainfall_max_mm != null
                          ? `${crop.rainfall_min_mm}–${crop.rainfall_max_mm} mm`
                          : 'Unavailable'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#4B5E50]">Water Need</dt>
                      <dd className="font-medium text-[#142218] mt-0.5">{crop.water_requirement || 'Unavailable'}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs text-[#4B5E50] line-clamp-1">
                    Seasons: <span className="text-[#142218]">{seasonText}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#4B5E50] truncate">
                    {crop.source_reference || crop.verification_status}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/crops/${crop.slug}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline shrink-0 cursor-pointer"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
