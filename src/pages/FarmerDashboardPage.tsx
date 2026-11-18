import { useEffect, useState } from 'react';
import { Trash2, Plus, LogOut, Bookmark, History } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface FarmRow {
  id: number;
  farm_name: string;
  country: string | null;
  state_province: string | null;
  district_region: string | null;
  area_hectares: number | null;
  soil_type_name: string | null;
  soil_texture_name: string | null;
  irrigation_method: string | null;
  water_availability: string | null;
  notes: string | null;
}

interface FavRow {
  id: number;
  slug: string;
  common_name: string;
  common_name_kn: string | null;
  scientific_name: string;
}

interface RecHistoryRow {
  id: number;
  country: string;
  state_province: string | null;
  district_region: string | null;
  soil_type_input: string | null;
  ph_input: number | null;
  temperature_input: number | null;
  rainfall_input: number | null;
  season_input: string | null;
  status: string;
  created_at: string;
  top_crops: { rank_order: number; combined_score: number; common_name: string; slug: string }[];
}

export function FarmerDashboardPage() {
  const { user, setUser, apiFetch, navigate } = useApp();
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [favourites, setFavourites] = useState<FavRow[]>([]);
  const [recommendations, setRecommendations] = useState<RecHistoryRow[]>([]);
  const [wrbOptions, setWrbOptions] = useState<string[]>([]);
  const [textureOptions, setTextureOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddFarm, setShowAddFarm] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [country, setCountry] = useState('India');
  const [stateProvince, setStateProvince] = useState('Karnataka');
  const [districtRegion, setDistrictRegion] = useState('');
  const [areaHectares, setAreaHectares] = useState('');
  const [soilType, setSoilType] = useState('Lixisols');
  const [soilTexture, setSoilTexture] = useState('Sandy loam');
  const [irrigationMethod, setIrrigationMethod] = useState('Drip');
  const [waterAvailability, setWaterAvailability] = useState('Moderate');
  const [notes, setNotes] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const loadDashboard = () => {
    setLoading(true);
    fetch('/api/farmer/dashboard', { credentials: 'same-origin' })
      .then((r) => {
        if (!r.ok) throw new Error('Not signed in');
        return r.json();
      })
      .then((d) => {
        setFarms(d.farms || []);
        setFavourites(d.favourites || []);
        setRecommendations(d.recommendations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    } else {
      setLoading(false);
    }
    fetch('/api/soils')
      .then((r) => r.json())
      .then((d) => {
        setWrbOptions((d.wrb_soils || []).map((s: any) => s.wrb_name));
        setTextureOptions((d.textures || []).map((t: any) => t.name));
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      navigate('/');
    }
  };

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    try {
      await apiFetch('/api/farmer/farms', {
        method: 'POST',
        body: JSON.stringify({
          farm_name: farmName,
          country,
          state_province: stateProvince,
          district_region: districtRegion,
          area_hectares: areaHectares ? Number(areaHectares) : null,
          soil_type: soilType,
          soil_texture: soilTexture,
          irrigation_method: irrigationMethod,
          water_availability: waterAvailability,
          notes,
        }),
      });
      setFarmName('');
      setDistrictRegion('');
      setAreaHectares('');
      setNotes('');
      setShowAddFarm(false);
      loadDashboard();
    } catch (err: any) {
      setFormMsg(err.message || 'Unable to save farm profile.');
    }
  };

  const handleDeleteFarm = async (id: number) => {
    await apiFetch(`/api/farmer/farms/${id}`, { method: 'DELETE' });
    loadDashboard();
  };

  const handleRemoveFav = async (cropId: number) => {
    await apiFetch(`/api/farmer/favourites/${cropId}`, { method: 'DELETE' });
    loadDashboard();
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-[#E2E8E2] rounded-xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#142218]">Farmer Workspace</h1>
          <p className="text-sm text-[#4B5E50]">
            Sign in to save farm plots, laboratory soil measurements, favourite crops, and past recommendation runs.
          </p>
          <div className="flex justify-center gap-3">
            <button type="button" onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer">
              Sign In
            </button>
            <button type="button" onClick={() => navigate('/register')} className="px-5 py-2.5 text-sm font-semibold text-[#142218] bg-white border border-stone-300 rounded-lg cursor-pointer">
              Register Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8E2]">
        <div>
          <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Authenticated Workspace · {user.role}</p>
          <h1 className="mt-1 text-3xl font-bold text-[#142218]">Welcome, {user.fullName}</h1>
          <p className="text-sm text-[#4B5E50]">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === 'admin' && (
            <button type="button" onClick={() => navigate('/admin')} className="px-4 py-2 text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer">
              Open Admin Console
            </button>
          )}
          <button type="button" onClick={() => navigate('/recommend')} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer">
            New Recommendation
          </button>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#4B5E50] bg-white border border-stone-300 hover:text-[#142218] rounded-lg cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#4B5E50]">Loading farm profiles and saved records...</p>
      ) : (
        <>
          {/* Saved Farms Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#142218]">Saved Farm Plots ({farms.length})</h2>
              <button
                type="button"
                onClick={() => setShowAddFarm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddFarm ? 'Cancel' : 'Add Farm Plot'}</span>
              </button>
            </div>

            {showAddFarm && (
              <form onSubmit={handleAddFarm} className="bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-[#142218]">Register Farm Plot</h3>
                {formMsg && <p className="text-xs text-red-700">{formMsg}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">Plot Name *</label>
                    <input type="text" required value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="e.g., Maddur Red Loam Plot" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">Country</label>
                    <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">State / Province</label>
                    <input type="text" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">District / Region</label>
                    <input type="text" value={districtRegion} onChange={(e) => setDistrictRegion(e.target.value)} placeholder="e.g., Mandya" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">Area (Hectares)</label>
                    <input type="number" step="0.1" min="0.1" value={areaHectares} onChange={(e) => setAreaHectares(e.target.value)} placeholder="2.5" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">WRB Soil Group</label>
                    <select value={soilType} onChange={(e) => setSoilType(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white">
                      {wrbOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">Soil Texture</label>
                    <select value={soilTexture} onChange={(e) => setSoilTexture(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white">
                      {textureOptions.map((tx) => <option key={tx} value={tx}>{tx}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">Irrigation Method</label>
                    <select value={irrigationMethod} onChange={(e) => setIrrigationMethod(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white">
                      <option value="Rainfed only">Rainfed only</option>
                      <option value="Drip">Drip</option>
                      <option value="Sprinkler">Sprinkler</option>
                      <option value="Canal / Borewell">Canal / Borewell</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5E50] mb-1">Water Availability</label>
                    <select value={waterAvailability} onChange={(e) => setWaterAvailability(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white">
                      <option value="Scarce">Scarce</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Abundant">Abundant</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5E50] mb-1">Agronomic Notes</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lab report notes or cropping history" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
                </div>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer">
                  Save Farm Plot
                </button>
              </form>
            )}

            {farms.length === 0 ? (
              <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 text-sm text-[#4B5E50]">
                No farm plots saved yet. Click "Add Farm Plot" above to store soil and irrigation profiles.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {farms.map((f) => (
                  <div key={f.id} className="bg-white border border-[#E2E8E2] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-[#142218]">{f.farm_name}</h3>
                          <p className="text-xs text-[#4B5E50]">
                            {[f.district_region, f.state_province, f.country].filter(Boolean).join(', ')}
                            {f.area_hectares ? ` · ${f.area_hectares} ha` : ''}
                          </p>
                        </div>
                        <button type="button" onClick={() => handleDeleteFarm(f.id)} aria-label={`Delete ${f.farm_name}`} className="p-1.5 text-[#4B5E50] hover:text-red-700 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <dl className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                        <div><dt className="text-[#4B5E50]">Soil Group</dt><dd className="font-medium text-[#142218]">{f.soil_type_name || 'Unspecified'}</dd></div>
                        <div><dt className="text-[#4B5E50]">Texture</dt><dd className="font-medium text-[#142218]">{f.soil_texture_name || 'Unspecified'}</dd></div>
                        <div><dt className="text-[#4B5E50]">Irrigation</dt><dd className="font-medium text-[#142218]">{f.irrigation_method || 'Rainfed'}</dd></div>
                        <div><dt className="text-[#4B5E50]">Water</dt><dd className="font-medium text-[#142218]">{f.water_availability || 'Moderate'}</dd></div>
                      </dl>
                      {f.notes && <p className="mt-2 text-xs text-[#4B5E50]">{f.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved Favourite Crops */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-xl font-bold text-[#142218]">Saved Crops ({favourites.length})</h2>
            </div>
            {favourites.length === 0 ? (
              <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 text-sm text-[#4B5E50]">
                No saved crops yet. Open any crop in the <button type="button" onClick={() => navigate('/crops')} className="text-emerald-800 font-semibold hover:underline cursor-pointer">Global Crop Database</button> and click "Save Crop".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favourites.map((fav) => (
                  <div key={fav.id} className="bg-white border border-[#E2E8E2] rounded-xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <button type="button" onClick={() => navigate(`/crops/${fav.slug}`)} className="text-sm font-bold text-[#142218] hover:text-emerald-800 hover:underline text-left cursor-pointer">
                        {fav.common_name} {fav.common_name_kn ? `(${fav.common_name_kn})` : ''}
                      </button>
                      <p className="text-xs italic text-[#4B5E50]">{fav.scientific_name}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveFav(fav.id)} className="text-xs text-[#4B5E50] hover:text-red-700 cursor-pointer">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recommendation History */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-xl font-bold text-[#142218]">Recommendation History ({recommendations.length})</h2>
            </div>
            {recommendations.length === 0 ? (
              <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 text-sm text-[#4B5E50]">
                You have not run a recommendation while signed in yet.
              </div>
            ) : (
              <div className="bg-white border border-[#E2E8E2] rounded-xl overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
                    <tr>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4">Conditions</th>
                      <th className="py-2.5 px-4">Top Recommended Crops</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {recommendations.map((rec) => (
                      <tr key={rec.id}>
                        <td className="py-3 px-4 font-mono text-xs text-[#4B5E50] whitespace-nowrap">{rec.created_at}</td>
                        <td className="py-3 px-4 text-xs font-medium text-[#142218]">
                          {[rec.district_region, rec.state_province, rec.country].filter(Boolean).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-[#4B5E50]">
                          {rec.soil_type_input || '—'} · pH {rec.ph_input ?? '—'} · {rec.temperature_input ?? '—'}°C · {rec.rainfall_input ?? '—'}mm
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {rec.status === 'insufficient_data' ? (
                            <span className="text-amber-800">Insufficient inputs</span>
                          ) : rec.top_crops.length === 0 ? (
                            <span className="text-[#4B5E50]">No matches</span>
                          ) : (
                            rec.top_crops.map((tc, idx) => (
                              <span key={tc.slug}>
                                {idx > 0 ? ' · ' : ''}
                                <button type="button" onClick={() => navigate(`/crops/${tc.slug}`)} className="text-emerald-800 font-semibold hover:underline cursor-pointer">
                                  #{tc.rank_order} {tc.common_name} ({tc.combined_score})
                                </button>
                              </span>
                            ))
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
