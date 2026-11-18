import { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface CropDetail {
  id: number;
  slug: string;
  common_name: string;
  common_name_kn: string | null;
  scientific_name: string;
  family_name: string | null;
  crop_summary: string | null;
  growth_conditions: string | null;
  cultivation_guidance: string | null;
  nutrient_guidance: string | null;
  pest_disease_notes: string | null;
  common_pests_diseases: string | null;
  harvest_guidance: string | null;
  storage_guidance: string | null;
  verification_status: string;
  source_reference: string | null;
  licence_info: string | null;
  is_favourite: boolean;
  categories: { slug: string; name: string; name_kn: string | null }[];
  synonyms: { name: string; language_or_region: string | null; is_scientific_synonym: number }[];
  varieties: { variety_name: string; region: string | null; maturity_days: number | null; traits: string | null; source_reference: string | null }[];
  soil_requirements: {
    ph_min: number | null;
    ph_max: number | null;
    nitrogen_min_kg_ha: number | null;
    nitrogen_max_kg_ha: number | null;
    phosphorus_min_kg_ha: number | null;
    phosphorus_max_kg_ha: number | null;
    potassium_min_kg_ha: number | null;
    potassium_max_kg_ha: number | null;
    drainage_preference: string | null;
    salinity_tolerance: string | null;
    suitable_wrb_groups: string[];
    suitable_textures: string[];
  } | null;
  climate_requirements: {
    temp_min_c: number | null;
    temp_max_c: number | null;
    temp_opt_min_c: number | null;
    temp_opt_max_c: number | null;
    rainfall_min_mm: number | null;
    rainfall_max_mm: number | null;
    humidity_min_pct: number | null;
    humidity_max_pct: number | null;
    water_requirement: string | null;
    irrigation_requirement: string | null;
    drought_tolerance: string | null;
    frost_sensitivity: string | null;
  } | null;
  seasons: { season_name: string; region: string | null; sowing_window: string | null; harvest_window: string | null; duration_days_min: number | null; duration_days_max: number | null }[];
  regions: { country: string; state_or_region: string | null; suitability_note: string | null }[];
  market_prices: { id: number; market_location: string; country: string; price_min: number | null; price_max: number | null; price_modal: number | null; currency: string; unit: string; price_date: string; data_type: string; source_name: string }[];
}

export function CropDetailPage({ slug }: { slug: string }) {
  const { user, apiFetch, navigate } = useApp();
  const [crop, setCrop] = useState<CropDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favPending, setFavPending] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/crops/${encodeURIComponent(slug)}`, { credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error('Crop record not found.');
        return r.json();
      })
      .then((d) => {
        setCrop(d.crop || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Unable to load crop profile.');
        setLoading(false);
      });
  }, [slug]);

  const toggleFavourite = async () => {
    if (!crop) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setFavPending(true);
    try {
      if (crop.is_favourite) {
        await apiFetch(`/api/farmer/favourites/${crop.id}`, { method: 'DELETE' });
        setCrop({ ...crop, is_favourite: false });
      } else {
        await apiFetch(`/api/farmer/favourites/${crop.id}`, { method: 'POST' });
        setCrop({ ...crop, is_favourite: true });
      }
    } catch {
      // Leave state unchanged if request fails
    } finally {
      setFavPending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-[#4B5E50]">
        Loading verified crop specification...
      </div>
    );
  }

  if (error || !crop) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-[#E2E8E2] rounded-xl p-8 text-center">
          <h1 className="text-xl font-bold text-[#142218]">Crop Record Not Found</h1>
          <p className="mt-2 text-sm text-[#4B5E50]">{error || 'The requested crop record does not exist.'}</p>
          <button
            type="button"
            onClick={() => navigate('/crops')}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg cursor-pointer"
          >
            Back to Global Crop Database
          </button>
        </div>
      </div>
    );
  }

  const sr = crop.soil_requirements;
  const cr = crop.climate_requirements;
  const fmtRange = (a: number | null | undefined, b: number | null | undefined, unit = '') =>
    a != null && b != null ? `${a} – ${b}${unit}` : 'Unavailable in current dataset';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <button
          type="button"
          onClick={() => navigate('/crops')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4B5E50] hover:text-[#142218] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Crop Database</span>
        </button>

        <div className="mt-4 flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-[#E2E8E2]">
          <div>
            <p className="text-xs font-medium text-emerald-800">
              {crop.categories.map((c) => c.name).join(' · ')}
              {crop.family_name ? ` · Family ${crop.family_name}` : ''}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#142218]">
              {crop.common_name}
              {crop.common_name_kn ? <span className="ml-3 text-xl font-normal text-[#4B5E50]">({crop.common_name_kn})</span> : null}
            </h1>
            <p className="mt-1 text-base italic text-[#4B5E50]">{crop.scientific_name}</p>
            {crop.synonyms.length > 0 && (
              <p className="mt-2 text-xs text-[#4B5E50]">
                Synonyms &amp; local names: {crop.synonyms.map((s) => `${s.name}${s.language_or_region ? ` (${s.language_or_region})` : ''}`).join(' · ')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={favPending}
              onClick={toggleFavourite}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer ${
                crop.is_favourite
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-white text-[#142218] border-stone-300 hover:bg-stone-50'
              }`}
            >
              {crop.is_favourite ? <BookmarkCheck className="w-4 h-4 text-emerald-700" /> : <Bookmark className="w-4 h-4" />}
              <span>{crop.is_favourite ? 'Saved to Dashboard' : user ? 'Save Crop' : 'Sign in to Save'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/recommend')}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
            >
              Test Farm Suitability
            </button>
          </div>
        </div>
      </div>

      {crop.crop_summary && (
        <section className="bg-white border border-[#E2E8E2] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#142218]">Agronomic Overview</h2>
          <p className="mt-2 text-sm text-[#4B5E50] leading-relaxed">{crop.crop_summary}</p>
          {crop.growth_conditions && (
            <p className="mt-3 text-sm text-[#142218] leading-relaxed">{crop.growth_conditions}</p>
          )}
        </section>
      )}

      {/* Soil & Climate Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E2E8E2] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#142218] mb-4">Soil &amp; Nutrient Parameters</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Soil pH Range</dt>
              <dd className="font-mono font-semibold text-[#142218]">{fmtRange(sr?.ph_min, sr?.ph_max)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Nitrogen (N)</dt>
              <dd className="font-mono text-[#142218]">{fmtRange(sr?.nitrogen_min_kg_ha, sr?.nitrogen_max_kg_ha, ' kg/ha')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Phosphorus (P)</dt>
              <dd className="font-mono text-[#142218]">{fmtRange(sr?.phosphorus_min_kg_ha, sr?.phosphorus_max_kg_ha, ' kg/ha')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Potassium (K)</dt>
              <dd className="font-mono text-[#142218]">{fmtRange(sr?.potassium_min_kg_ha, sr?.potassium_max_kg_ha, ' kg/ha')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Drainage &amp; Salinity</dt>
              <dd className="text-right text-[#142218]">
                {sr?.drainage_preference || 'Unavailable'} · {sr?.salinity_tolerance || 'Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-[#4B5E50] text-xs">Suitable WRB Soil Groups</dt>
              <dd className="mt-1 text-[#142218]">
                {sr?.suitable_wrb_groups?.length ? sr.suitable_wrb_groups.join(' · ') : 'Unavailable'}
              </dd>
            </div>
            <div>
              <dt className="text-[#4B5E50] text-xs">Preferred Textures</dt>
              <dd className="mt-1 text-[#142218]">
                {sr?.suitable_textures?.length ? sr.suitable_textures.join(' · ') : 'Unavailable'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-white border border-[#E2E8E2] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#142218] mb-4">Climate &amp; Water Requirements</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Absolute Temp Range</dt>
              <dd className="font-mono font-semibold text-[#142218]">{fmtRange(cr?.temp_min_c, cr?.temp_max_c, ' °C')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Optimal Growth Temp</dt>
              <dd className="font-mono text-[#142218]">{fmtRange(cr?.temp_opt_min_c, cr?.temp_opt_max_c, ' °C')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Seasonal / Annual Rainfall</dt>
              <dd className="font-mono font-semibold text-[#142218]">{fmtRange(cr?.rainfall_min_mm, cr?.rainfall_max_mm, ' mm')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Relative Humidity</dt>
              <dd className="font-mono text-[#142218]">{fmtRange(cr?.humidity_min_pct, cr?.humidity_max_pct, '%')}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-stone-100 pb-2">
              <dt className="text-[#4B5E50]">Water &amp; Irrigation</dt>
              <dd className="text-right text-[#142218]">
                {cr?.water_requirement || 'Unavailable'} · {cr?.irrigation_requirement || 'Unavailable'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#4B5E50]">Drought / Frost Profile</dt>
              <dd className="text-right text-[#142218]">
                Drought: {cr?.drought_tolerance || 'Unavailable'} · Frost: {cr?.frost_sensitivity || 'Unavailable'}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Cultivation, Pests, Harvest & Storage Guidance */}
      <section className="bg-white border border-[#E2E8E2] rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-[#142218]">Cultivation &amp; Field Management</h3>
          <p className="mt-1.5 text-sm text-[#4B5E50] leading-relaxed">
            {crop.cultivation_guidance || 'Unavailable in verified record — consult local agricultural extension guide.'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#142218]">Nutrient Management Guidance</h3>
          <p className="mt-1.5 text-sm text-[#4B5E50] leading-relaxed">
            {crop.nutrient_guidance || 'Base fertilizer application on site-specific laboratory soil test.'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#142218]">Common Pests &amp; Diseases</h3>
          <p className="mt-1.5 text-sm text-[#4B5E50] leading-relaxed">
            {crop.common_pests_diseases || crop.pest_disease_notes || 'Unavailable in verified record.'}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#142218]">Harvest &amp; Post-Harvest Storage</h3>
          <p className="mt-1.5 text-sm text-[#4B5E50] leading-relaxed">
            {[crop.harvest_guidance, crop.storage_guidance].filter(Boolean).join(' ') || 'Unavailable in verified record.'}
          </p>
        </div>
      </section>

      {/* Seasons, Regions & Varieties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E2E8E2] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#142218] mb-3">Growing Seasons &amp; Duration</h2>
          {crop.seasons.length === 0 ? (
            <p className="text-sm text-[#4B5E50]">No season windows documented yet.</p>
          ) : (
            <div className="divide-y divide-stone-100 text-sm">
              {crop.seasons.map((s, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#142218]">{s.season_name}</p>
                    <p className="text-xs text-[#4B5E50]">
                      {s.region || 'General'} {s.sowing_window ? `· Sow: ${s.sowing_window}` : ''} {s.harvest_window ? `· Harvest: ${s.harvest_window}` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#142218] shrink-0">
                    {s.duration_days_min && s.duration_days_max ? `${s.duration_days_min}–${s.duration_days_max} days` : 'Varies'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-sm font-bold text-[#142218] mt-6 mb-2">Documented Production Regions</h3>
          <div className="space-y-1.5 text-sm text-[#4B5E50]">
            {crop.regions.length === 0 ? (
              <p>No regional distribution entries yet.</p>
            ) : (
              crop.regions.map((r, i) => (
                <p key={i}>
                  <span className="font-medium text-[#142218]">{r.country}</span>
                  {r.state_or_region ? ` — ${r.state_or_region}` : ''}
                  {r.suitability_note ? ` (${r.suitability_note})` : ''}
                </p>
              ))
            )}
          </div>
        </section>

        <section className="bg-white border border-[#E2E8E2] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#142218] mb-3">Documented Cultivars &amp; Varieties</h2>
          {crop.varieties.length === 0 ? (
            <p className="text-sm text-[#4B5E50]">No specific cultivars recorded yet for this species.</p>
          ) : (
            <div className="divide-y divide-stone-100 text-sm">
              {crop.varieties.map((v, i) => (
                <div key={i} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#142218]">{v.variety_name}</span>
                    {v.maturity_days ? <span className="font-mono text-xs text-[#4B5E50]">{v.maturity_days} days</span> : null}
                  </div>
                  <p className="text-xs text-[#4B5E50] mt-0.5">
                    {v.region || 'Multi-region'} {v.traits ? `· ${v.traits}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Historical Market Price References if available */}
      {crop.market_prices.length > 0 && (
        <section className="bg-white border border-[#E2E8E2] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#142218]">Historical / Reference Market Prices</h2>
          <p className="text-xs text-[#4B5E50] mt-1">
            Official historical archives only — verify current auction rates with local APMC boards before harvest sales.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Market</th>
                  <th className="py-2 pr-4">Modal Price</th>
                  <th className="py-2 pr-4">Range</th>
                  <th className="py-2">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {crop.market_prices.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-4 font-mono text-xs">{p.price_date}</td>
                    <td className="py-2 pr-4">{p.market_location}, {p.country}</td>
                    <td className="py-2 pr-4 font-mono font-semibold">{p.currency} {p.price_modal} / {p.unit}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-[#4B5E50]">{p.price_min}–{p.price_max}</td>
                    <td className="py-2 text-xs text-[#4B5E50]">{p.source_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Attribution Footer */}
      <div className="bg-[#F3F6F3] border border-[#E2E8E2] rounded-xl p-4 text-xs text-[#4B5E50] flex flex-wrap justify-between gap-3">
        <span>Verification Status: <strong className="text-[#142218]">{crop.verification_status}</strong></span>
        <span>Source: {crop.source_reference || 'FAO EcoCrop / ICAR / UAS Bengaluru'}</span>
        <span>Licence: {crop.licence_info || 'Public Agricultural Reference'}</span>
      </div>
    </div>
  );
}
