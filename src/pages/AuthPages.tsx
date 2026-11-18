import { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';

export function LoginPage() {
  const { t, setUser, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error || 'Sign in failed.');
        setLoading(false);
        return;
      }
      setUser(json.user);
      navigate(json.user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      setError('Network error while signing in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-7 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#142218]">{t('login_title')}</h1>
          <p className="mt-1 text-sm text-[#4B5E50]">Access your saved farms, crops, and recommendation history.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
            {error}
          </div>
        )}

        <form onSubmit={submitLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-[#4B5E50] mb-1">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-[#4B5E50] mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Credentials for College Project Testing */}
        <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
          <p className="font-semibold text-[#142218]">Verified Demo Accounts (for testing)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('farmer@karnataka.ag');
                setPassword('Farmer@2026');
              }}
              className="px-3 py-2 text-left border border-stone-200 rounded-lg hover:bg-[#F3F6F3] cursor-pointer"
            >
              <span className="block font-semibold text-[#142218]">Karnataka Farmer</span>
              <span className="block font-mono text-[11px] text-[#4B5E50]">farmer@karnataka.ag</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@globalcrops.org');
                setPassword('Admin@2026');
              }}
              className="px-3 py-2 text-left border border-stone-200 rounded-lg hover:bg-[#F3F6F3] cursor-pointer"
            >
              <span className="block font-semibold text-[#142218]">Agronomy Admin</span>
              <span className="block font-mono text-[11px] text-[#4B5E50]">admin@globalcrops.org</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-[#4B5E50]">
          New farmer?{' '}
          <button type="button" onClick={() => navigate('/register')} className="text-emerald-800 font-semibold hover:underline cursor-pointer">
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { t, setUser, navigate, language } = useApp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('India');
  const [stateProvince, setStateProvince] = useState('Karnataka');
  const [districtRegion, setDistrictRegion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          country,
          state_province: stateProvince,
          district_region: districtRegion,
          preferred_language: language,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) {
        setError(json.error || 'Registration failed.');
        setLoading(false);
        return;
      }
      setUser(json.user);
      navigate('/dashboard');
    } catch {
      setError('Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white border border-[#E2E8E2] rounded-xl p-7 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#142218]">{t('register_title')}</h1>
          <p className="mt-1 text-sm text-[#4B5E50]">Store your farm plots, soil tests, and crop recommendation history securely.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
            {error}
          </div>
        )}

        <form onSubmit={submitRegister} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-medium text-[#4B5E50] mb-1">Full Name *</label>
            <input id="reg-name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-[#4B5E50] mb-1">Email Address *</label>
            <input id="reg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-xs font-medium text-[#4B5E50] mb-1">Password (min 8 chars) *</label>
            <input id="reg-password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-stone-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="reg-country" className="block text-xs font-medium text-[#4B5E50] mb-1">Country</label>
              <input id="reg-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
            </div>
            <div>
              <label htmlFor="reg-state" className="block text-xs font-medium text-[#4B5E50] mb-1">State / Province</label>
              <input id="reg-state" type="text" value={stateProvince} onChange={(e) => setStateProvince(e.target.value)} className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
            </div>
            <div>
              <label htmlFor="reg-dist" className="block text-xs font-medium text-[#4B5E50] mb-1">District</label>
              <input id="reg-dist" type="text" value={districtRegion} onChange={(e) => setDistrictRegion(e.target.value)} placeholder="e.g., Mandya" className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Creating account...' : 'Create Farmer Account'}
          </button>
        </form>

        <p className="text-xs text-center text-[#4B5E50]">
          Already registered?{' '}
          <button type="button" onClick={() => navigate('/login')} className="text-emerald-800 font-semibold hover:underline cursor-pointer">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
