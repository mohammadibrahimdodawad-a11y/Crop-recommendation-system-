import { useEffect, useMemo, useState } from 'react';
import { CloudSun, MapPin, Search, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ChartCanvas } from '../components/ChartCanvas.tsx';
import type { ChartConfiguration } from 'chart.js';

interface WeatherPayload {
  location_label: string;
  latitude: number;
  longitude: number;
  retrieved_at: string;
  source_name: string;
  data_status: 'live_api' | 'cached_fallback' | 'unavailable';
  current_observation: {
    temperature_c: number;
    humidity_pct: number;
    precipitation_mm: number;
    wind_speed_kmh: number;
    observation_time: string;
    label: string;
  } | null;
  forecast_7day: {
    date: string;
    temp_max_c: number;
    temp_min_c: number;
    precipitation_mm: number;
    precipitation_prob_pct: number | null;
  }[];
  forecast_disclaimer: string;
  seasonal_climate_note: string;
}

interface GeoResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

const QUICK_LOCATIONS = [
  { label: 'Mandya, Karnataka, India', lat: 12.5847, lon: 77.0439 },
  { label: 'Bengaluru, Karnataka, India', lat: 12.9716, lon: 77.5946 },
  { label: 'Dharwad, Karnataka, India', lat: 15.4589, lon: 75.0078 },
  { label: 'Des Moines, Iowa, USA', lat: 41.5868, lon: -93.625 },
  { label: 'Nakuru, Kenya', lat: -0.3031, lon: 36.08 },
];

export function WeatherPage() {
  const { t, navigate } = useApp();
  const [searchText, setSearchText] = useState('');
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [selectedLoc, setSelectedLoc] = useState(QUICK_LOCATIONS[0]);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWeather = (lat: number, lon: number, label: string) => {
    setLoading(true);
    fetch(`/api/weather?lat=${lat}&lon=${lon}&label=${encodeURIComponent(label)}`)
      .then((r) => r.json())
      .then((d) => {
        setWeather(d.weather || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadWeather(selectedLoc.lat, selectedLoc.lon, selectedLoc.label);
  }, [selectedLoc]);

  const handleGeocode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim().length < 2) return;
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchText.trim())}`).then((r) => r.json()).catch(() => ({ results: [] }));
    setGeoResults(res.results || []);
  };

  const chartConfig: ChartConfiguration | null = useMemo(() => {
    if (!weather?.forecast_7day?.length) return null;
    return {
      type: 'bar',
      data: {
        labels: weather.forecast_7day.map((d) => d.date.slice(5)),
        datasets: [
          {
            type: 'line',
            label: 'Max Temp (°C)',
            data: weather.forecast_7day.map((d) => d.temp_max_c),
            borderColor: '#15803D',
            backgroundColor: '#15803D',
            yAxisID: 'y',
            tension: 0.3,
          },
          {
            type: 'line',
            label: 'Min Temp (°C)',
            data: weather.forecast_7day.map((d) => d.temp_min_c),
            borderColor: '#0284C7',
            backgroundColor: '#0284C7',
            yAxisID: 'y',
            tension: 0.3,
          },
          {
            type: 'bar',
            label: 'Forecast Rain (mm)',
            data: weather.forecast_7day.map((d) => d.precipitation_mm),
            backgroundColor: 'rgba(14, 116, 144, 0.28)',
            borderColor: '#0E7490',
            borderWidth: 1,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { position: 'left', title: { display: true, text: 'Temp (°C)' } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Rain (mm)' }, beginAtZero: true },
        },
      },
    };
  }, [weather]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Open-Meteo Meteorological Service</p>
        <h1 className="mt-1 text-3xl font-bold text-[#142218]">{t('weather_title')}</h1>
        <p className="mt-2 text-sm text-[#4B5E50] max-w-3xl">
          Search any farming town globally or select a regional preset to inspect current observations separately from 7-day forecasts.
        </p>
      </div>

      {/* Location Search & Presets */}
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 space-y-4">
        <form onSubmit={handleGeocode} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <label htmlFor="weather-search" className="sr-only">Search town or district</label>
            <Search className="w-4 h-4 text-[#4B5E50] absolute left-3.5 top-3.5" aria-hidden="true" />
            <input
              id="weather-search"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search city, district, or village (e.g., Hassan, Hubballi, Nairobi, Fresno)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-300 rounded-lg"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer">
            Search Location
          </button>
        </form>

        {geoResults.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
            {geoResults.map((g, i) => {
              const label = [g.name, g.admin1, g.country].filter(Boolean).join(', ');
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedLoc({ label, lat: g.latitude, lon: g.longitude });
                    setGeoResults([]);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-[#F3F6F3] hover:bg-emerald-50 border border-[#E2E8E2] rounded-lg text-[#142218] cursor-pointer"
                >
                  {label} ({g.latitude.toFixed(2)}, {g.longitude.toFixed(2)})
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#4B5E50]">Regional Presets:</span>
          {QUICK_LOCATIONS.map((loc) => (
            <button
              key={loc.label}
              type="button"
              onClick={() => setSelectedLoc(loc)}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                selectedLoc.label === loc.label
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-[#FAFBF9] text-[#4B5E50] border-stone-200 hover:text-[#142218]'
              }`}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-[#E2E8E2] rounded-xl p-10 text-center text-sm text-[#4B5E50]">
          Retrieving meteorological observations and 7-day forecast...
        </div>
      ) : weather ? (
        <>
          {/* Current Observation vs Forecast Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{weather.location_label}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-[#142218]">Current Weather Observation</h2>
                  <p className="text-xs text-[#4B5E50]">
                    Status: {weather.data_status === 'live_api' ? 'Live Open-Meteo API' : weather.data_status === 'cached_fallback' ? 'Cached Fallback' : 'Unavailable'} · Retrieved {new Date(weather.retrieved_at).toLocaleString()}
                  </p>
                </div>
                <CloudSun className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />
              </div>

              {weather.current_observation ? (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                  <div>
                    <p className="text-xs text-[#4B5E50]">Air Temperature</p>
                    <p className="text-2xl font-bold font-mono text-[#142218]">{weather.current_observation.temperature_c} °C</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4B5E50]">Relative Humidity</p>
                    <p className="text-2xl font-bold font-mono text-[#142218]">{weather.current_observation.humidity_pct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4B5E50]">Current Precipitation</p>
                    <p className="text-lg font-semibold font-mono text-[#142218]">{weather.current_observation.precipitation_mm} mm</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4B5E50]">Wind Speed</p>
                    <p className="text-lg font-semibold font-mono text-[#142218]">{weather.current_observation.wind_speed_kmh} km/h</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
                  Live weather service is currently unreachable. Enter temperature, humidity, and seasonal rainfall manually in the Crop Recommender.
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 text-xs text-[#4B5E50] space-y-2">
                <p>{weather.seasonal_climate_note}</p>
                <button
                  type="button"
                  onClick={() => navigate('/recommend')}
                  className="text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  Open Crop Recommendation Engine →
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-[#E2E8E2] rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#142218]">7-Day Weather Forecast</h2>
                  <p className="text-xs text-[#4B5E50]">Daily min/max temperature and projected precipitation</p>
                </div>
                <span className="font-mono text-xs text-[#4B5E50]">
                  {weather.latitude.toFixed(3)}, {weather.longitude.toFixed(3)}
                </span>
              </div>

              {chartConfig ? (
                <ChartCanvas config={chartConfig} height={260} ariaLabel="7-day temperature and rainfall forecast chart" />
              ) : (
                <p className="text-sm text-[#4B5E50] py-12 text-center">Forecast chart unavailable offline.</p>
              )}
            </div>
          </div>

          {/* 7-Day Forecast Table + Mandatory Non-Guarantee Disclaimer */}
          {weather.forecast_7day.length > 0 && (
            <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Min Temp (°C)</th>
                    <th className="py-2 pr-4">Max Temp (°C)</th>
                    <th className="py-2 pr-4">Projected Rainfall (mm)</th>
                    <th className="py-2">Rain Probability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {weather.forecast_7day.map((day) => (
                    <tr key={day.date}>
                      <td className="py-2 pr-4 font-mono text-xs">{day.date}</td>
                      <td className="py-2 pr-4 font-mono">{day.temp_min_c} °C</td>
                      <td className="py-2 pr-4 font-mono">{day.temp_max_c} °C</td>
                      <td className="py-2 pr-4 font-mono">{day.precipitation_mm} mm</td>
                      <td className="py-2 font-mono text-xs text-[#4B5E50]">
                        {day.precipitation_prob_pct != null ? `${day.precipitation_prob_pct}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">Meteorological Forecast Disclaimer</p>
              <p className="mt-0.5">{weather.forecast_disclaimer} Source: {weather.source_name}.</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
