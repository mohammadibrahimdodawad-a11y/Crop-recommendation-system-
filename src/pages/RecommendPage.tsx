import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudSun, Compass, HelpCircle, Info, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface PresetLocation {
  label: string;
  country: string;
  state: string;
  district: string;
  lat: number;
  lon: number;
  defaultRain: number;
  defaultTemp: number;
  defaultHumidity: number;
  defaultSoil: string;
  defaultTexture: string;
  defaultPh: number;
}

const REGION_PRESETS: PresetLocation[] = [
  { label: 'Mandya, Karnataka (Southern Dry Zone)', country: 'India', state: 'Karnataka', district: 'Mandya', lat: 12.5218, lon: 76.8951, defaultRain: 740, defaultTemp: 26.5, defaultHumidity: 68, defaultSoil: 'Lixisols', defaultTexture: 'Sandy loam', defaultPh: 6.4 },
  { label: 'Dharwad, Karnataka (Northern Transition)', country: 'India', state: 'Karnataka', district: 'Dharwad', lat: 15.4589, lon: 75.0078, defaultRain: 780, defaultTemp: 25.5, defaultHumidity: 64, defaultSoil: 'Vertisols', defaultTexture: 'Clay', defaultPh: 7.7 },
  { label: 'Kalaburagi, Karnataka (North Eastern Dry)', country: 'India', state: 'Karnataka', district: 'Kalaburagi', lat: 17.3297, lon: 76.8343, defaultRain: 680, defaultTemp: 28.0, defaultHumidity: 52, defaultSoil: 'Vertisols', defaultTexture: 'Clay loam', defaultPh: 7.9 },
  { label: 'Chikkamagaluru, Karnataka (Malnad Hills)', country: 'India', state: 'Karnataka', district: 'Chikkamagaluru', lat: 13.3161, lon: 75.7720, defaultRain: 1950, defaultTemp: 21.5, defaultHumidity: 78, defaultSoil: 'Nitisols', defaultTexture: 'Loamy', defaultPh: 5.7 },
  { label: 'Shivamogga / Coastal Belt, Karnataka', country: 'India', state: 'Karnataka', district: 'Shivamogga', lat: 13.9299, lon: 75.5681, defaultRain: 2100, defaultTemp: 26.0, defaultHumidity: 80, defaultSoil: 'Ferralsols', defaultTexture: 'Sandy clay loam', defaultPh: 5.5 },
  { label: 'Ludhiana, Punjab (Indo-Gangetic Plain)', country: 'India', state: 'Punjab', district: 'Ludhiana', lat: 30.9010, lon: 75.8573, defaultRain: 650, defaultTemp: 21.0, defaultHumidity: 60, defaultSoil: 'Fluvisols', defaultTexture: 'Silty loam', defaultPh: 7.4 },
  { label: 'Des Moines, Iowa, USA (Corn Belt)', country: 'United States', state: 'Iowa', district: 'Polk County', lat: 41.5868, lon: -93.6250, defaultRain: 880, defaultTemp: 20.5, defaultHumidity: 66, defaultSoil: 'Phaeozems', defaultTexture: 'Loamy', defaultPh: 6.5 },
  { label: 'Nakuru, Kenya (Rift Valley Highlands)', country: 'Kenya', state: 'Rift Valley', district: 'Nakuru', lat: -0.3031, lon: 36.0800, defaultRain: 960, defaultTemp: 19.5, defaultHumidity: 65, defaultSoil: 'Andosols', defaultTexture: 'Loamy', defaultPh: 6.0 },
  { label: 'Ribeirão Preto, São Paulo, Brazil', country: 'Brazil', state: 'São Paulo', district: 'Ribeirão Preto', lat: -21.1775, lon: -47.8103, defaultRain: 1450, defaultTemp: 24.5, defaultHumidity: 68, defaultSoil: 'Ferralsols', defaultTexture: 'Clay loam', defaultPh: 5.8 },
];

export function RecommendPage() {
  const { t, navigate, apiFetch } = useApp();

  const [wrbSoils, setWrbSoils] = useState<{ wrb_name: string; regional_names: string }[]>([]);
  const [textures, setTextures] = useState<{ name: string }[]>([]);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);

  // Form State
  const [country, setCountry] = useState('India');
  const [stateProvince, setStateProvince] = useState('Karnataka');
  const [districtRegion, setDistrictRegion] = useState('Mandya');
  const [latitude, setLatitude] = useState('12.5218');
  const [longitude, setLongitude] = useState('76.8951');
  const [season, setSeason] = useState('Kharif');

  const [unknownSoil, setUnknownSoil] = useState(false);
  const [soilSourceMode, setSoilSourceMode] = useState<'manual' | 'estimated'>('manual');
  const [soilType, setSoilType] = useState('Lixisols');
  const [soilTexture, setSoilTexture] = useState('Sandy loam');
  const [ph, setPh] = useState('6.4');
  const [nitrogen, setNitrogen] = useState('65');
  const [phosphorus, setPhosphorus] = useState('42');
  const [potassium, setPotassium] = useState('34');

  const [temperature, setTemperature] = useState('26.5');
  const [rainfall, setRainfall] = useState('740');
  const [humidity, setHumidity] = useState('68');
  const [waterAvailability, setWaterAvailability] = useState('Moderate');
  const [irrigationMethod, setIrrigationMethod] = useState('Rainfed only');
  const [preferenceCategory, setPreferenceCategory] = useState('all');

  const [weatherNote, setWeatherNote] = useState<string | null>(null);
  const [soilEstimateNote, setSoilEstimateNote] = useState<string | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingSoil, setLoadingSoil] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    fetch('/api/soils')
      .then((r) => r.json())
      .then((d) => {
        setWrbSoils(d.wrb_soils || []);
        setTextures(d.textures || []);
      })
      .catch(() => {});
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const applyPreset = (presetLabel: string) => {
    const p = REGION_PRESETS.find((x) => x.label === presetLabel);
    if (!p) return;
    setCountry(p.country);
    setStateProvince(p.state);
    setDistrictRegion(p.district);
    setLatitude(String(p.lat));
    setLongitude(String(p.lon));
    setRainfall(String(p.defaultRain));
    setTemperature(String(p.defaultTemp));
    setHumidity(String(p.defaultHumidity));
    setSoilType(p.defaultSoil);
    setSoilTexture(p.defaultTexture);
    setPh(String(p.defaultPh));
    setSoilSourceMode('manual');
    setUnknownSoil(false);
    setWeatherNote(null);
    setSoilEstimateNote(null);
  };

  const handleFetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherNote(null);
    try {
      const lat = Number(latitude) || 12.5218;
      const lon = Number(longitude) || 76.8951;
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&label=${encodeURIComponent(`${districtRegion || stateProvince}, ${country}`)}`);
      const json = await res.json();
      const w = json.weather;
      if (w?.current_observation) {
        setTemperature(String(w.current_observation.temperature_c));
        setHumidity(String(w.current_observation.humidity_pct));
        setWeatherNote(
          `Observed ${w.current_observation.temperature_c}°C & ${w.current_observation.humidity_pct}% humidity (${w.source_name}, retrieved ${new Date(w.retrieved_at).toLocaleString()}). Note: enter multi-month seasonal rainfall manually below.`,
        );
      } else {
        setWeatherNote(w?.forecast_disclaimer || 'Weather service unavailable; please enter temperature and humidity manually.');
      }
    } catch {
      setWeatherNote('Unable to fetch weather right now. Enter climate parameters manually.');
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleEstimateSoil = async (autoSelectMode = true) => {
    setLoadingSoil(true);
    setSoilEstimateNote(null);
    try {
      const lat = Number(latitude) || 12.5218;
      const lon = Number(longitude) || 76.8951;
      const res = await fetch(`/api/soil-estimate?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      const est = json.estimate;
      if (est) {
        if (autoSelectMode) setSoilSourceMode('estimated');
        if (est.estimated_wrb_group) setSoilType(est.estimated_wrb_group);
        if (est.estimated_texture) setSoilTexture(est.estimated_texture);
        if (est.estimated_ph != null) setPh(String(est.estimated_ph));
        setSoilEstimateNote(
          `ESTIMATED (${est.source_name}, ${new Date(est.retrieved_at).toLocaleDateString()}): WRB ${est.estimated_wrb_group || 'Unknown'}, Texture ${est.estimated_texture || 'Unknown'}, pH ~${est.estimated_ph ?? 'N/A'}. ${est.resolution_notes}`,
        );
      }
    } catch {
      setSoilEstimateNote('Could not retrieve location soil estimate. Enter manual values or select Unknown.');
    } finally {
      setLoadingSoil(false);
    }
  };

  const handleUnknownToggle = (checked: boolean) => {
    setUnknownSoil(checked);
    if (checked) {
      handleEstimateSoil(true);
    } else {
      setSoilSourceMode('manual');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setShowCompare(false);
    try {
      const payload = {
        country,
        state_province: stateProvince,
        district_region: districtRegion,
        latitude: latitude !== '' ? Number(latitude) : null,
        longitude: longitude !== '' ? Number(longitude) : null,
        soil_type: unknownSoil && soilSourceMode === 'manual' ? undefined : soilType,
        soil_texture: soilTexture || undefined,
        soil_source_mode: soilSourceMode,
        ph: ph !== '' ? Number(ph) : null,
        nitrogen: nitrogen !== '' ? Number(nitrogen) : null,
        phosphorus: phosphorus !== '' ? Number(phosphorus) : null,
        potassium: potassium !== '' ? Number(potassium) : null,
        temperature: temperature !== '' ? Number(temperature) : null,
        rainfall: rainfall !== '' ? Number(rainfall) : null,
        humidity: humidity !== '' ? Number(humidity) : null,
        water_availability: waterAvailability,
        irrigation_method: irrigationMethod,
        season,
        preference_category: preferenceCategory,
      };
      const data = await apiFetch('/api/recommend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unable to generate recommendations.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearInputsForTest = () => {
    setPh('');
    setNitrogen('');
    setPhosphorus('');
    setPotassium('');
    setTemperature('');
    setRainfall('');
    setHumidity('');
    setSoilType('');
    setSoilTexture('');
    setSeason('Any');
    setResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#142218]">{t('rec_title')}</h1>
          <p className="mt-1 text-sm text-[#4B5E50] max-w-2xl">{t('rec_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-[#4B5E50]">
            Quick Regional Profile:
            <select
              onChange={(e) => applyPreset(e.target.value)}
              defaultValue={REGION_PRESETS[0].label}
              className="ml-2 px-3 py-2 bg-white border border-stone-300 rounded-lg text-xs text-[#142218]"
            >
              {REGION_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={clearInputsForTest}
            className="px-3 py-2 text-xs font-medium text-[#4B5E50] bg-white border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
          >
            Clear Values
          </button>
        </div>
      </div>

      {/* Plain-Language Farmer Explainer */}
      <div className="mb-8 bg-[#F3F6F3] border border-[#E2E8E2] rounded-xl p-5">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm text-[#4B5E50] space-y-1">
            <p className="font-semibold text-[#142218]">{t('farmer_guide_title')}</p>
            <p>{t('farmer_guide_ph')}</p>
            <p>{t('farmer_guide_npk')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-6">
          {/* 1. Location & Season */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#142218] border-b border-stone-200 pb-2">
              {t('rec_location_section')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_country')}</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_state')}</label>
                <input
                  type="text"
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_district')}</label>
                <input
                  type="text"
                  value={districtRegion}
                  onChange={(e) => setDistrictRegion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_season')}</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                >
                  <option value="Kharif">Kharif (Monsoon / June–Oct)</option>
                  <option value="Rabi">Rabi (Post-Monsoon / Oct–Mar)</option>
                  <option value="Summer">Summer / Zaid (Feb–May)</option>
                  <option value="Spring">Temperate Spring / Summer</option>
                  <option value="Winter">Temperate Winter</option>
                  <option value="Perennial">Perennial / Orchard</option>
                  <option value="Any">Any Season</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">Latitude (Optional)</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">Longitude (Optional)</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* 2. Soil Classification & Nutrients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-base font-semibold text-[#142218]">{t('rec_soil_section')}</h2>
              <button
                type="button"
                onClick={() => handleEstimateSoil(true)}
                disabled={loadingSoil}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                {loadingSoil ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                <span>{t('rec_fetch_soil')}</span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-[#142218] cursor-pointer">
              <input
                type="checkbox"
                checked={unknownSoil}
                onChange={(e) => handleUnknownToggle(e.target.checked)}
                className="rounded border-stone-300 text-emerald-700"
              />
              <span>{t('rec_soil_unknown')}</span>
            </label>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F3F6F3] rounded-lg">
              <button
                type="button"
                onClick={() => { setSoilSourceMode('manual'); setUnknownSoil(false); }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  soilSourceMode === 'manual' ? 'bg-white text-[#142218] shadow-xs' : 'text-[#4B5E50]'
                }`}
              >
                Lab / Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setSoilSourceMode('estimated')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  soilSourceMode === 'estimated' ? 'bg-white text-[#142218] shadow-xs' : 'text-[#4B5E50]'
                }`}
              >
                Location Estimate
              </button>
            </div>

            {soilEstimateNote && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {soilEstimateNote}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_soil_type')}</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                >
                  <option value="">Not specified</option>
                  {wrbSoils.map((s) => (
                    <option key={s.wrb_name} value={s.wrb_name}>
                      {s.wrb_name} — {s.regional_names.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_soil_texture')}</label>
                <select
                  value={soilTexture}
                  onChange={(e) => setSoilTexture(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                >
                  <option value="">Not specified</option>
                  {textures.map((tx) => (
                    <option key={tx.name} value={tx.name}>
                      {tx.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_ph')}</label>
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="10.5"
                  value={ph}
                  onChange={(e) => setPh(e.target.value)}
                  placeholder="6.5"
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">N (kg/ha)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="600"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  placeholder="60"
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">P (kg/ha)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="400"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  placeholder="40"
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">K (kg/ha)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="500"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  placeholder="35"
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* 3. Climate & Water */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-base font-semibold text-[#142218]">{t('rec_climate_section')}</h2>
              <button
                type="button"
                onClick={handleFetchWeather}
                disabled={loadingWeather}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                {loadingWeather ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudSun className="w-3.5 h-3.5" />}
                <span>{t('rec_fetch_weather')}</span>
              </button>
            </div>

            {weatherNote && (
              <div className="p-3 rounded-lg bg-[#F3F6F3] border border-[#E2E8E2] text-xs text-[#4B5E50]">
                {weatherNote}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_temp')}</label>
                <input
                  type="number"
                  step="0.1"
                  min="-20"
                  max="55"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_rain')}</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="6000"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_hum')}</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_water')}</label>
                <select
                  value={waterAvailability}
                  onChange={(e) => setWaterAvailability(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                >
                  <option value="Low">Low (Dryland / Scarcity)</option>
                  <option value="Moderate">Moderate (Seasonal / Borewell)</option>
                  <option value="High">High (Assured Canal / Abundant)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_irrigation')}</label>
                <select
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
                >
                  <option value="Rainfed only">Rainfed only</option>
                  <option value="Drip">Drip Irrigation</option>
                  <option value="Sprinkler">Sprinkler Irrigation</option>
                  <option value="Canal / Surface">Canal / Furrow / Flood</option>
                  <option value="Borewell / Tank">Borewell / Farm Tank</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4B5E50] mb-1">{t('rec_pref')}</label>
              <select
                value={preferenceCategory}
                onChange={(e) => setPreferenceCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
              >
                <option value="all">All Agricultural Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Evaluating Soil & Climate Rules...' : t('rec_submit')}
          </button>
        </form>

        {/* Right Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {!result && (
            <div className="bg-white border border-[#E2E8E2] rounded-xl p-8 text-center">
              <p className="text-base font-semibold text-[#142218]">Ready to evaluate your farm profile</p>
              <p className="mt-2 text-sm text-[#4B5E50] max-w-md mx-auto">
                Adjust the regional preset or enter your laboratory soil values and climate conditions on the left, then submit to rank up to three evidence-backed crop options.
              </p>
            </div>
          )}

          {result && result.status !== 'recommended' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-base font-bold text-amber-950">Insufficient or Unsuitable Conditions</h2>
                  <p className="mt-1 text-sm text-amber-900">{result.message}</p>
                  {result.missing_inputs?.length > 0 && (
                    <p className="mt-3 text-xs text-amber-800">
                      Missing inputs: {result.missing_inputs.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {result && result.status === 'recommended' && (
            <>
              <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-mono text-[#4B5E50]">
                    {result.model_version} · {result.ml_applied ? 'Agronomic Rules + Random Forest ML' : 'Verified Agronomic Rules'}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#142218]">{result.message}</p>
                </div>
                {result.recommendations.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => setShowCompare((v) => !v)}
                    className="px-4 py-2 text-xs font-semibold border border-stone-300 bg-[#F3F6F3] hover:bg-stone-200 text-[#142218] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {showCompare ? 'Hide Comparison' : t('compare_title')}
                  </button>
                )}
              </div>

              {/* Side-by-Side Comparison Matrix */}
              {showCompare && result.recommendations.length >= 2 && (
                <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 overflow-x-auto">
                  <h3 className="text-base font-bold text-[#142218] mb-3">{t('compare_title')}</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-[#4B5E50]">
                        <th className="py-2 pr-4 font-medium">Attribute</th>
                        {result.recommendations.map((c: any) => (
                          <th key={c.crop_id} className="py-2 px-3 font-semibold text-[#142218]">
                            #{c.rank} {c.common_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      <tr>
                        <td className="py-2.5 pr-4 text-[#4B5E50]">Suitability Index</td>
                        {result.recommendations.map((c: any) => (
                          <td key={c.crop_id} className="py-2.5 px-3 font-mono font-semibold text-emerald-800">{c.combined_score} / 100</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-[#4B5E50]">Soil pH Range</td>
                        {result.recommendations.map((c: any) => (
                          <td key={c.crop_id} className="py-2.5 px-3 font-mono">{c.key_metrics.ph_range}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-[#4B5E50]">Temperature Window</td>
                        {result.recommendations.map((c: any) => (
                          <td key={c.crop_id} className="py-2.5 px-3 font-mono">{c.key_metrics.temp_range}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-[#4B5E50]">Rainfall Range</td>
                        {result.recommendations.map((c: any) => (
                          <td key={c.crop_id} className="py-2.5 px-3 font-mono">{c.key_metrics.rainfall_range}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-[#4B5E50]">Crop Duration</td>
                        {result.recommendations.map((c: any) => (
                          <td key={c.crop_id} className="py-2.5 px-3 font-mono">{c.key_metrics.duration_days}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 text-[#4B5E50]">Water Requirement</td>
                        {result.recommendations.map((c: any) => (
                          <td key={c.crop_id} className="py-2.5 px-3">{c.key_metrics.water_requirement}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Up to 3 Ranked Recommendation Cards */}
              <div className="space-y-4">
                {result.recommendations.map((rec: any) => (
                  <article key={rec.crop_id} className="bg-white border border-[#E2E8E2] rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#4B5E50]">
                          Rank #{rec.rank} · {rec.categories.join(', ')} · <span className="italic">{rec.scientific_name}</span>
                        </p>
                        <h3 className="mt-1 text-xl font-bold text-[#142218]">
                          {rec.common_name}
                          {rec.common_name_kn ? <span className="ml-2 text-base font-medium text-[#4B5E50]">({rec.common_name_kn})</span> : null}
                        </h3>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs text-[#4B5E50]">Suitability Match</p>
                        <p className="text-2xl font-bold font-mono text-emerald-800">{rec.combined_score} / 100</p>
                        <p className="text-xs font-mono text-[#4B5E50]">
                          Rules {rec.agronomic_score}{rec.ml_probability !== null ? ` · ML ${rec.ml_probability}%` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-t border-b border-stone-100 text-xs">
                      <div>
                        <span className="text-[#4B5E50] block">pH Range</span>
                        <span className="font-mono font-semibold text-[#142218]">{rec.key_metrics.ph_range}</span>
                      </div>
                      <div>
                        <span className="text-[#4B5E50] block">Temperature</span>
                        <span className="font-mono font-semibold text-[#142218]">{rec.key_metrics.temp_range}</span>
                      </div>
                      <div>
                        <span className="text-[#4B5E50] block">Rainfall</span>
                        <span className="font-mono font-semibold text-[#142218]">{rec.key_metrics.rainfall_range}</span>
                      </div>
                      <div>
                        <span className="text-[#4B5E50] block">Duration</span>
                        <span className="font-mono font-semibold text-[#142218]">{rec.key_metrics.duration_days}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>Why this crop is suitable</span>
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-[#142218]">
                          {rec.explanations.map((ex: string, idx: number) => (
                            <li key={idx}>{ex}</li>
                          ))}
                        </ul>
                      </div>

                      {rec.warnings.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <p className="text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                            <span>Management warnings &amp; precautions</span>
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900">
                            {rec.warnings.map((w: string, idx: number) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rec.limitations.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-[#4B5E50]">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Limitations: {rec.limitations.join(' ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/crops/${rec.slug}`)}
                        className="text-sm font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        View full cultivation &amp; nutrient guide →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Unsuitable Conditions & Disclaimer */}
          {result?.unsuitable_examples?.length > 0 && (
            <div className="bg-white border border-[#E2E8E2] rounded-xl p-5">
              <h3 className="text-sm font-bold text-[#142218] mb-2">Examples of Unsuitable Crops Filtered Out</h3>
              <ul className="space-y-1.5 text-xs text-[#4B5E50]">
                {result.unsuitable_examples.map((u: any, idx: number) => (
                  <li key={idx}>
                    <span className="font-semibold text-[#142218]">{u.common_name}:</span> {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <p className="text-xs text-[#4B5E50] leading-relaxed">{result.disclaimer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
