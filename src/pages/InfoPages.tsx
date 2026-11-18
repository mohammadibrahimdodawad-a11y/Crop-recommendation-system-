import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { SafeImage } from '../components/SafeImage.tsx';

export function AboutPage() {
  const { navigate } = useApp();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Community Agronomy Platform</p>
        <h1 className="mt-1 text-3xl font-bold text-[#142218]">About AgriAtlas — Global Smart Crop Recommendation System</h1>
        <p className="mt-3 text-base text-[#4B5E50] leading-relaxed">
          Built as a practical college community agricultural decision-support system, AgriAtlas helps farmers evaluate crop suitability using soil classification, laboratory or estimated soil chemistry, local climate observations, water availability, and growing seasons.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="h-64 rounded-xl overflow-hidden border border-[#E2E8E2] bg-stone-100">
          <SafeImage
            src="/src/assets/images/farmer_agronomy_fieldwork_1794994419412.jpg"
            alt="Agronomist inspecting crop foliage and soil moisture in field"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-4 text-sm text-[#4B5E50] leading-relaxed">
          <h2 className="text-xl font-bold text-[#142218]">Why Karnataka &amp; Global Scope Together?</h2>
          <p>
            Dryland and irrigated farming across Karnataka — from Southern Red Loams (Mandya, Mysuru, Tumakuru) to Northern Black Cotton Soils (Kalaburagi, Dharwad, Raichur) and Malnad Laterites — requires hyper-local crop matching across Kharif, Rabi, and Zaid seasons.
          </p>
          <p>
            By grounding the database in the international <strong>FAO World Reference Base (32 WRB Soil Groups)</strong>, <strong>USDA Soil Taxonomy</strong>, and <strong>FAO EcoCrop</strong> species thresholds, the same normalized architecture scales seamlessly to farms worldwide.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/recommend')} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-lg cursor-pointer">
              Launch Recommender
            </button>
            <button type="button" onClick={() => navigate('/methodology')} className="px-4 py-2 text-sm font-semibold text-[#142218] bg-white border border-stone-300 rounded-lg cursor-pointer">
              Data Sources &amp; ML Metrics
            </button>
          </div>
        </div>
      </div>

      <section className="bg-white border border-[#E2E8E2] rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 className="font-bold text-[#142218]">Scientific Integrity</h3>
          <p className="mt-1.5 text-[#4B5E50]">
            No fabricated crop yields, no invented market quotes, and no hidden black-box rules. Missing parameters remain transparently marked as unavailable.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-[#142218]">Estimated vs Lab Priority</h3>
          <p className="mt-1.5 text-[#4B5E50]">
            ISRIC SoilGrids v2.0 spatial estimates help farmers who lack lab tests, but physical laboratory measurements always override gridded estimates.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-[#142218]">Bilingual Accessibility</h3>
          <p className="mt-1.5 text-[#4B5E50]">
            Full English and Kannada (ಕನ್ನಡ) interface support, local crop synonyms, and plain-language explanations for pH, NPK, and WRB soil classes.
          </p>
        </div>
      </section>
    </div>
  );
}

export function HowItWorksPage() {
  const { navigate } = useApp();
  const steps = [
    {
      num: '01',
      title: 'Validate Input & Check Sufficiency',
      desc: 'Every parameter (pH, N, P, K, temperature, rainfall, humidity) is validated against realistic physical bounds. If fewer than two core soil or climate signals are entered, the engine returns a clear refusal message instead of guessing.',
    },
    {
      num: '02',
      title: 'Fetch Local Weather & Soil Estimates (Optional)',
      desc: 'Farmers who do not know their soil properties can fetch 250m gridded estimates via ISRIC SoilGrids v2.0 and current weather via Open-Meteo. All estimated values are explicitly tagged as estimated.',
    },
    {
      num: '03',
      title: 'Agronomic Constraint Scoring',
      desc: 'Each canonical crop in the database is evaluated on pH fit, thermal envelope, rainfall + irrigation synergy, soil NPK readiness, WRB soil group match, texture drainage, seasonal alignment (Kharif/Rabi/Zaid), and regional presence.',
    },
    {
      num: '04',
      title: 'Random Forest Classifier Probability',
      desc: 'A 25-tree Random Forest classifier trained on 1,100 clean benchmark samples (80/20 stratified holdout split) provides learned probability scores for benchmark species alongside explicit agronomic rule weights.',
    },
    {
      num: '05',
      title: 'Explainable Ranking & Warnings',
      desc: 'Top suitable crops are returned with clear factor-by-factor reasons, soil/climate warnings (e.g., high pH or drought sensitivity), data limitations, and side-by-side comparison.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Hybrid Agronomic + ML Pipeline</p>
        <h1 className="mt-1 text-3xl font-bold text-[#142218]">How Crop Recommendations Work</h1>
        <p className="mt-2 text-sm text-[#4B5E50] max-w-2xl">
          Every recommendation combines deterministic agronomic threshold scoring with machine learning probability estimation.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((s) => (
          <div key={s.num} className="bg-white border border-[#E2E8E2] rounded-xl p-6 flex flex-col sm:flex-row gap-5">
            <div className="font-mono text-2xl font-bold text-emerald-800 shrink-0">{s.num}</div>
            <div>
              <h2 className="text-lg font-bold text-[#142218]">{s.title}</h2>
              <p className="mt-1.5 text-sm text-[#4B5E50] leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => navigate('/recommend')} className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer">
          Try the Recommendation Engine
        </button>
        <button type="button" onClick={() => navigate('/methodology')} className="px-5 py-2.5 text-sm font-semibold text-[#142218] bg-white border border-stone-300 rounded-lg cursor-pointer">
          View Held-Out ML Metrics &amp; Confusion Matrix
        </button>
      </div>
    </div>
  );
}

export function ContactFeedbackPage() {
  const { user, apiFetch } = useApp();
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [country, setCountry] = useState('India');
  const [topic, setTopic] = useState('Crop Data Correction');
  const [message, setMessage] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMsg('');
    setSubmitting(true);
    try {
      const res = await apiFetch<{ id: number; status: string }>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ name, email, country, topic, message }),
      });
      setStatusMsg(`Thank you — your feedback (#${res.id}) has been logged for agronomy team review.`);
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Community Agronomic Feedback</p>
        <h1 className="mt-1 text-3xl font-bold text-[#142218]">Contact &amp; Feedback</h1>
        <p className="mt-2 text-sm text-[#4B5E50]">
          Report missing regional cultivars, suggest Kannada translations, or share field observations with the project maintainers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">{error}</div>}
        {statusMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950">{statusMsg}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fb-name" className="block text-xs font-medium text-[#4B5E50] mb-1">Your Name *</label>
            <input id="fb-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="fb-email" className="block text-xs font-medium text-[#4B5E50] mb-1">Email Address *</label>
            <input id="fb-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="fb-country" className="block text-xs font-medium text-[#4B5E50] mb-1">Country / Region</label>
            <input id="fb-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="fb-topic" className="block text-xs font-medium text-[#4B5E50] mb-1">Topic</label>
            <select id="fb-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg bg-white">
              <option value="Crop Data Correction">Crop Data Correction</option>
              <option value="Regional Cultivar Request">Regional Cultivar Request</option>
              <option value="Soil Classification Question">Soil Classification Question</option>
              <option value="Kannada Translation Improvement">Kannada Translation Improvement</option>
              <option value="General Feedback">General Feedback</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="fb-msg" className="block text-xs font-medium text-[#4B5E50] mb-1">Message *</label>
          <textarea
            id="fb-msg"
            rows={5}
            required
            minLength={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the crop, soil observation, district, or suggestion..."
            className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-60 cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}

export function MethodologyPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [mlReport, setMlReport] = useState<any>(null);

  useEffect(() => {
    fetch('/api/datasets').then((r) => r.json()).then((d) => {
      setDatasets(d.datasets || []);
      setCoverage(d.coverage || null);
    }).catch(() => {});
    fetch('/api/ml/metrics').then((r) => r.json()).then((d) => {
      setMlReport(d.report || null);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">Verification, Attribution &amp; Model Evaluation</p>
        <h1 className="mt-1 text-3xl font-bold text-[#142218]">Data Sources &amp; Methodology</h1>
        <p className="mt-2 text-sm text-[#4B5E50] max-w-3xl">
          Full attribution of scientific agricultural sources, dataset coverage, and empirical Random Forest evaluation metrics measured on a held-out 20% stratified test split.
        </p>
      </div>

      {/* Database Coverage Summary */}
      {coverage && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Canonical Crops', val: coverage.total_crops },
            { label: 'Categories', val: coverage.categories_covered },
            { label: 'WRB Soil Groups', val: coverage.total_wrb_soils },
            { label: 'USDA Textures', val: coverage.total_textures },
            { label: 'Cultivars', val: coverage.total_varieties },
            { label: 'Countries', val: coverage.countries_covered },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-[#E2E8E2] rounded-xl p-4">
              <p className="text-xs text-[#4B5E50]">{c.label}</p>
              <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">{c.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* ML Model Evaluation Card */}
      {mlReport && (
        <section className="bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#142218]">Random Forest Classifier Evaluation ({mlReport.modelVersion})</h2>
              <p className="text-xs text-[#4B5E50] mt-1">
                {mlReport.algorithm} · {mlReport.nEstimators} trees · Max Depth {mlReport.maxDepth} · Dataset {mlReport.datasetVersion}
              </p>
            </div>
            <div className="font-mono text-xs text-[#4B5E50]">
              Train: {mlReport.trainSamples} rows · Held-Out Test: {mlReport.testSamples} rows
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#FAFBF9] border border-[#E2E8E2] rounded-lg">
              <p className="text-xs text-[#4B5E50]">Test Accuracy</p>
              <p className="mt-1 text-2xl font-bold font-mono text-emerald-800">{(mlReport.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-[#FAFBF9] border border-[#E2E8E2] rounded-lg">
              <p className="text-xs text-[#4B5E50]">Macro Precision</p>
              <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">{(mlReport.macroPrecision * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-[#FAFBF9] border border-[#E2E8E2] rounded-lg">
              <p className="text-xs text-[#4B5E50]">Macro Recall</p>
              <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">{(mlReport.macroRecall * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-[#FAFBF9] border border-[#E2E8E2] rounded-lg">
              <p className="text-xs text-[#4B5E50]">Macro F1 Score</p>
              <p className="mt-1 text-2xl font-bold font-mono text-[#142218]">{(mlReport.macroF1 * 100).toFixed(1)}%</p>
            </div>
          </div>

          <p className="text-xs text-[#4B5E50]">{mlReport.testedScope}</p>

          {/* Compact Confusion Matrix */}
          {Array.isArray(mlReport.confusionMatrix) && Array.isArray(mlReport.classes) && (
            <div>
              <h3 className="text-sm font-bold text-[#142218] mb-2">Held-Out Test Set Confusion Matrix (22 Benchmark Crops)</h3>
              <div className="overflow-x-auto border border-[#E2E8E2] rounded-lg">
                <table className="text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#F3F6F3] text-[#4B5E50]">
                      <th className="p-1.5 text-left border-b border-r border-[#E2E8E2]">Actual \ Pred</th>
                      {mlReport.classes.map((c: string, i: number) => (
                        <th key={i} className="p-1.5 border-b border-[#E2E8E2] whitespace-nowrap" title={c}>
                          {c.slice(0, 5)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mlReport.confusionMatrix.map((row: number[], rIdx: number) => (
                      <tr key={rIdx} className="border-b border-stone-100">
                        <td className="p-1.5 font-sans font-medium text-[#142218] border-r border-[#E2E8E2] whitespace-nowrap">
                          {mlReport.classes[rIdx]}
                        </td>
                        {row.map((val: number, cIdx: number) => (
                          <td
                            key={cIdx}
                            className={`p-1.5 text-center ${
                              rIdx === cIdx && val > 0
                                ? 'bg-emerald-100 text-emerald-950 font-bold'
                                : val > 0
                                ? 'bg-amber-100 text-amber-950'
                                : 'text-stone-300'
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Dataset Licences & Attribution Table */}
      <section className="bg-white border border-[#E2E8E2] rounded-xl p-6 overflow-x-auto">
        <h2 className="text-xl font-bold text-[#142218] mb-4">Authorized Data Sources &amp; Licences</h2>
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[#E2E8E2] text-xs text-[#4B5E50]">
            <tr>
              <th className="py-2 pr-4">Dataset Code</th>
              <th className="py-2 pr-4">Name &amp; Provider</th>
              <th className="py-2 pr-4">Licence</th>
              <th className="py-2">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {datasets.map((ds) => (
              <tr key={ds.id}>
                <td className="py-2.5 pr-4 font-mono font-semibold text-[#142218] whitespace-nowrap">{ds.code}</td>
                <td className="py-2.5 pr-4">
                  <span className="font-semibold text-[#142218]">{ds.name}</span>
                  <span className="block text-[#4B5E50]">{ds.provider}</span>
                </td>
                <td className="py-2.5 pr-4 text-[#4B5E50]">{ds.licence || 'Public Reference'}</td>
                <td className="py-2.5 text-[#4B5E50]">{ds.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <h1 className="text-3xl font-bold text-[#142218]">Privacy Policy</h1>
        <p className="mt-2 text-xs text-[#4B5E50]">Effective for Global Smart Crop Recommendation System</p>
      </div>
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-4 text-sm text-[#4B5E50] leading-relaxed">
        <p><strong className="text-[#142218]">1. Data Collected:</strong> Account registration stores your name, email address, preferred language, and optional region. Farm plots, soil readings, and saved recommendations are stored exclusively to power your Farmer Dashboard.</p>
        <p><strong className="text-[#142218]">2. Credential Security:</strong> Passwords are never stored in plaintext. All passwords are salted and hashed with Node.js <code className="font-mono text-xs">crypto.scryptSync</code>, and sessions use HMAC-signed HTTP-only cookies protected by CSRF verification.</p>
        <p><strong className="text-[#142218]">3. External API Queries:</strong> Location coordinates submitted for live weather or soil grid estimation are sent only to Open-Meteo and ISRIC SoilGrids v2.0 APIs without personal identity metadata.</p>
        <p><strong className="text-[#142218]">4. Data Retention &amp; Deletion:</strong> Registered farmers can delete saved farm plots and favourite crops directly from their dashboard or request account removal via the Contact page.</p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="pb-6 border-b border-[#E2E8E2]">
        <h1 className="text-3xl font-bold text-[#142218]">Terms &amp; Agricultural Decision Disclaimer</h1>
        <p className="mt-2 text-xs text-[#4B5E50]">Important usage scope and liability notice</p>
      </div>
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-6 space-y-4 text-sm text-[#4B5E50] leading-relaxed">
        <p><strong className="text-[#142218]">1. Decision-Support Tool Only:</strong> AgriAtlas provides evidence-based crop suitability guidance derived from FAO EcoCrop, FAO WRB soil classification, ICAR/UAS Bengaluru references, and machine learning models. It does not guarantee crop yields, harvest quality, or financial profit.</p>
        <p><strong className="text-[#142218]">2. Estimated vs Laboratory Soil Data:</strong> Gridded soil estimates from ISRIC SoilGrids are 250m spatial approximations and do not replace physical laboratory soil testing at local Krishi Vigyan Kendras (KVKs) or soil labs.</p>
        <p><strong className="text-[#142218]">3. Meteorological &amp; Market Disclaimers:</strong> Weather forecasts reflect probabilistic meteorological projections, and market price tables reflect dated historical archives rather than guaranteed future auction prices.</p>
        <p><strong className="text-[#142218]">4. Local Extension Verification:</strong> Farmers should verify seed rate, phytosanitary quarantine rules, and fertilizer dosages with local agricultural extension officers prior to sowing.</p>
      </div>
    </div>
  );
}
