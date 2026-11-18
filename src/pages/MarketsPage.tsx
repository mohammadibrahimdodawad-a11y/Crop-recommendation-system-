import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ChartCanvas } from '../components/ChartCanvas.tsx';
import type { ChartConfiguration } from 'chart.js';

interface MarketRecord {
  id: number;
  crop_id: number | null;
  crop_slug: string | null;
  common_name: string | null;
  common_name_kn: string | null;
  commodity_name: string;
  country: string;
  state_province: string | null;
  market_location: string;
  price_min: number | null;
  price_max: number | null;
  price_modal: number | null;
  currency: string;
  unit: string;
  price_date: string;
  data_type: string;
  source_name: string;
  source_url: string | null;
}

export function MarketsPage() {
  const { t, navigate } = useApp();
  const [prices, setPrices] = useState<MarketRecord[]>([]);
  const [cropFilter, setCropFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cropFilter !== 'all') params.set('crop', cropFilter);
    if (countryFilter !== 'all') params.set('country', countryFilter);
    fetch(`/api/markets?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setPrices(Array.isArray(d.prices) ? d.prices : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cropFilter, countryFilter]);

  const chartConfig: ChartConfiguration | null = useMemo(() => {
    const inrRecords = prices.filter((p) => p.currency === 'INR' && p.price_modal != null);
    const targetRecords = inrRecords.length > 0 ? inrRecords : prices.filter((p) => p.price_modal != null);
    if (targetRecords.length === 0) return null;

    const unitCurrency = targetRecords[0].currency;
    const grouped = new Map<string, MarketRecord[]>();
    for (const r of targetRecords) {
      if (r.currency !== unitCurrency) continue;
      const arr = grouped.get(r.commodity_name) || [];
      arr.push(r);
      grouped.set(r.commodity_name, arr);
    }

    const dates = Array.from(new Set(targetRecords.filter((r) => r.currency === unitCurrency).map((r) => r.price_date))).sort();
    const palette = ['#15803D', '#0369A1', '#B45309', '#7C3AED', '#DC2626', '#0F766E'];

    const datasets = Array.from(grouped.entries()).map(([commodity, rows], idx) => ({
      label: `${commodity} (${unitCurrency})`,
      data: dates.map((dt) => {
        const match = rows.find((r) => r.price_date === dt);
        return match ? match.price_modal : null;
      }),
      borderColor: palette[idx % palette.length],
      backgroundColor: palette[idx % palette.length],
      spanGaps: true,
      tension: 0.25,
    }));

    return {
      type: 'line',
      data: { labels: dates, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: { display: true, text: `Modal Price (${unitCurrency})` },
          },
        },
      },
    };
  }, [prices]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Historical &amp; Reference Commodity Archives</p>
        <h1 className="mt-1 text-3xl font-bold text-[#142218]">{t('markets_title')}</h1>
        <p className="mt-2 text-sm text-[#4B5E50] max-w-3xl">
          Review dated AGMARKNET Karnataka APMC benchmarks (INR / Quintal) alongside World Bank / FAOSTAT global export references (USD / Metric Tonne).
        </p>
      </div>

      {/* Explicit Transparency Notice */}
      <div className="bg-[#F3F6F3] border border-[#E2E8E2] rounded-xl p-4 text-xs text-[#4B5E50]">
        <strong className="text-[#142218]">Data Freshness Notice:</strong> All entries below are clearly dated <em>Historical Reference</em> or <em>Official Archive</em> benchmarks. They are NOT presented as live real-time auction quotes and do not guarantee future market prices or farm profitability.
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-5 flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="market-crop" className="block text-xs text-[#4B5E50] mb-1">Filter by Crop</label>
          <select
            id="market-crop"
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
          >
            <option value="all">All Tracked Commodities</option>
            <option value="finger-millet">Finger Millet (Ragi)</option>
            <option value="rice">Rice / Paddy</option>
            <option value="pigeon-pea">Pigeon Pea (Tur)</option>
            <option value="maize">Maize</option>
            <option value="cotton">Cotton</option>
            <option value="tomato">Tomato</option>
            <option value="groundnut">Groundnut</option>
            <option value="onion">Onion</option>
            <option value="wheat">Wheat</option>
            <option value="soybean">Soybean</option>
            <option value="coffee-arabica">Coffee Arabica</option>
          </select>
        </div>

        <div>
          <label htmlFor="market-country" className="block text-xs text-[#4B5E50] mb-1">Filter by Region</label>
          <select
            id="market-country"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white"
          >
            <option value="all">Karnataka &amp; Global</option>
            <option value="India">India (Karnataka APMCs)</option>
            <option value="Global">Global (World Bank / ICO)</option>
          </select>
        </div>
      </div>

      {/* Trend Chart */}
      {chartConfig && (
        <div className="bg-white border border-[#E2E8E2] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[#142218]">Dated Modal Price Trend</h2>
          <p className="text-xs text-[#4B5E50] mb-4">Historical modal commodity prices across recorded reporting dates</p>
          <ChartCanvas config={chartConfig} height={280} ariaLabel="Historical market price trend chart" />
        </div>
      )}

      {/* Price Table */}
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-[#4B5E50] py-6">Loading archived price benchmarks...</p>
        ) : prices.length === 0 ? (
          <p className="text-sm text-[#4B5E50] py-6">No market records match the selected filter.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
              <tr>
                <th className="py-2.5 pr-4">Date</th>
                <th className="py-2.5 pr-4">Commodity</th>
                <th className="py-2.5 pr-4">Market / Region</th>
                <th className="py-2.5 pr-4">Modal Price</th>
                <th className="py-2.5 pr-4">Min – Max</th>
                <th className="py-2.5 pr-4">Classification</th>
                <th className="py-2.5">Source Attribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {prices.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-4 font-mono text-xs whitespace-nowrap">{p.price_date}</td>
                  <td className="py-3 pr-4 font-semibold text-[#142218]">
                    {p.crop_slug ? (
                      <button type="button" onClick={() => navigate(`/crops/${p.crop_slug}`)} className="hover:text-emerald-800 hover:underline text-left cursor-pointer">
                        {p.commodity_name}
                      </button>
                    ) : (
                      p.commodity_name
                    )}
                  </td>
                  <td className="py-3 pr-4 text-xs text-[#4B5E50]">
                    {p.market_location} · {p.state_province ? `${p.state_province}, ` : ''}{p.country}
                  </td>
                  <td className="py-3 pr-4 font-mono font-semibold text-[#142218] whitespace-nowrap">
                    {p.currency} {p.price_modal} / {p.unit}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-[#4B5E50] whitespace-nowrap">
                    {p.price_min} – {p.price_max}
                  </td>
                  <td className="py-3 pr-4 text-xs text-[#4B5E50] whitespace-nowrap">
                    {p.data_type === 'official_archive' ? 'Official Archive' : 'Historical Reference'}
                  </td>
                  <td className="py-3 text-xs text-[#4B5E50]">{p.source_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
