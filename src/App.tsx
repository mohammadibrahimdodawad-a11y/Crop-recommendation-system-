/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Layout } from './components/Layout.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { RecommendPage } from './pages/RecommendPage.tsx';
import { CropsPage } from './pages/CropsPage.tsx';
import { CropDetailPage } from './pages/CropDetailPage.tsx';
import { SoilsPage } from './pages/SoilsPage.tsx';
import { WeatherPage } from './pages/WeatherPage.tsx';
import { MarketsPage } from './pages/MarketsPage.tsx';
import { FarmerDashboardPage } from './pages/FarmerDashboardPage.tsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import {
  AboutPage,
  ContactFeedbackPage,
  HowItWorksPage,
  MethodologyPage,
  PrivacyPolicyPage,
  TermsPage,
} from './pages/InfoPages.tsx';

function RouteView() {
  const { route, navigate } = useApp();
  const cleanPath = route.replace(/\/+$/, '') || '/';

  if (cleanPath === '/') return <HomePage />;
  if (cleanPath === '/about') return <AboutPage />;
  if (cleanPath === '/how-it-works') return <HowItWorksPage />;
  if (cleanPath === '/recommend') return <RecommendPage />;
  if (cleanPath === '/soils') return <SoilsPage />;
  if (cleanPath === '/crops') return <CropsPage />;
  if (cleanPath.startsWith('/crops/')) {
    const slug = decodeURIComponent(cleanPath.slice('/crops/'.length));
    return <CropDetailPage slug={slug} />;
  }
  if (cleanPath === '/weather') return <WeatherPage />;
  if (cleanPath === '/markets') return <MarketsPage />;
  if (cleanPath === '/dashboard') return <FarmerDashboardPage />;
  if (cleanPath === '/login') return <LoginPage />;
  if (cleanPath === '/register') return <RegisterPage />;
  if (cleanPath === '/contact') return <ContactFeedbackPage />;
  if (cleanPath === '/admin') return <AdminDashboardPage />;
  if (cleanPath === '/privacy') return <PrivacyPolicyPage />;
  if (cleanPath === '/terms') return <TermsPage />;
  if (cleanPath === '/methodology') return <MethodologyPage />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
      <h1 className="text-2xl font-bold text-[#142218]">Page Not Found</h1>
      <p className="text-sm text-[#4B5E50]">The requested page path does not exist in AgriAtlas.</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
      >
        Return to Home
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <RouteView />
      </Layout>
    </AppProvider>
  );
}
