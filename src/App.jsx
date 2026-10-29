import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicNav, { PublicFooter, RuntimeDisplay, useShellKind } from './components/PublicShell';
import ErrorBoundary from './components/ErrorBoundary';
import { RequireAuth, GuestOnly } from './components/RequireAuth';

// 路由懒加载：首屏只拉必要 chunk
const IndexPage = lazy(() => import('./pages/IndexPage'));
const PayPage = lazy(() => import('./pages/PayPage'));
const PayPageTRX = lazy(() => import('./pages/PayPageTRX'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WalletConfigPage = lazy(() => import('./pages/WalletConfigPage'));
const UserCenterPage = lazy(() => import('./pages/UserCenterPage'));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'));
const UserManagePage = lazy(() => import('./pages/UserManagePage'));
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'));
const FAQManagePage = lazy(() => import('./pages/FAQManagePage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const AdminTicketsPage = lazy(() => import('./pages/AdminTicketsPage'));
const SwapPage = lazy(() => import('./pages/SwapPage'));
const EnergyRentalPage = lazy(() => import('./pages/EnergyRentalPage'));
const RewardSystemPage = lazy(() => import('./pages/RewardSystemPage'));
const MyRewardsPage = lazy(() => import('./pages/MyRewardsPage'));
const PaymentSystemPage = lazy(() => import('./pages/PaymentSystemPage'));
const SwapSystemPage = lazy(() => import('./pages/SwapSystemPage'));
const EnergySystemPage = lazy(() => import('./pages/EnergySystemPage'));
const TelegramManagePage = lazy(() => import('./pages/TelegramManagePage'));
const SEOManagePage = lazy(() => import('./pages/SEOManagePage'));
const ServiceOverviewPage = lazy(() => import('./pages/ServiceOverviewPage'));
const USDTPaymentDetailPage = lazy(() => import('./pages/services/USDTPaymentDetailPage'));
const TRXPaymentDetailPage = lazy(() => import('./pages/services/TRXPaymentDetailPage'));
const EnergyRentalDetailPage = lazy(() => import('./pages/services/EnergyRentalDetailPage'));
const SwapDetailPage = lazy(() => import('./pages/services/SwapDetailPage'));
const BeginnerGuidePage = lazy(() => import('./pages/guides/BeginnerGuidePage'));
const APIDocPage = lazy(() => import('./pages/guides/APIDocPage'));
const CompanyPage = lazy(() => import('./pages/about/CompanyPage'));
const SecurityPage = lazy(() => import('./pages/about/SecurityPage'));
const ContactPage = lazy(() => import('./pages/about/ContactPage'));
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const BlogManageContainer = lazy(() => import('./pages/admin/BlogManageContainer'));

const PageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm font-bold">
    加载中...
  </div>
);

const App = () => {
  const { loading } = useAuth();
  const shell = useShellKind();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[#f5fbff] text-[#0a1224] font-sans selection:bg-cyan-100 flex flex-col">
      {shell === 'public' && <PublicNav />}

        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/pay" element={<PayPage />} />
            <Route path="/pay-trx" element={<PayPageTRX />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/energy-rental" element={<EnergyRentalPage />} />
            <Route path="/services" element={<ServiceOverviewPage />} />
            <Route path="/services/usdt-payment" element={<USDTPaymentDetailPage />} />
            <Route path="/services/trx-payment" element={<TRXPaymentDetailPage />} />
            <Route path="/services/energy-rental" element={<EnergyRentalDetailPage />} />
            <Route path="/services/swap" element={<SwapDetailPage />} />
            <Route path="/guides/beginner" element={<BeginnerGuidePage />} />
            <Route path="/guides/api" element={<APIDocPage />} />
            <Route path="/guides/faq" element={<FAQPage />} />
            <Route path="/about/company" element={<CompanyPage />} />
            <Route path="/about/security" element={<SecurityPage />} />
            <Route path="/about/contact" element={<ContactPage />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />

            <Route element={<GuestOnly />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route path="/user-center" element={<UserCenterPage />} />
              <Route path="/my-rewards" element={<MyRewardsPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/my-tickets" element={<TicketsPage />} />
            </Route>

            <Route element={<RequireAuth role="admin" />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/user-manage" element={<UserManagePage />} />
              <Route path="/admin/users/:userId" element={<UserDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/wallet" element={<WalletConfigPage />} />
              <Route path="/faq-manage" element={<FAQManagePage />} />
              <Route path="/admin-tickets" element={<AdminTicketsPage />} />
              <Route path="/payment-system" element={<PaymentSystemPage />} />
              <Route path="/swap-system" element={<SwapSystemPage />} />
              <Route path="/energy-system" element={<EnergySystemPage />} />
              <Route path="/energy-price" element={<EnergySystemPage />} />
              <Route path="/energy-balance" element={<EnergySystemPage />} />
              <Route path="/reward-system" element={<RewardSystemPage />} />
              <Route path="/telegram-manage" element={<TelegramManagePage />} />
              <Route path="/seo-manage" element={<SEOManagePage />} />
              <Route path="/admin/blog" element={<BlogManageContainer />} />
            </Route>
          </Routes>
        </Suspense>

      {shell === 'public' && (
        <>
          <div className="flex-grow flex items-end">
            <div className="w-full">
              <RuntimeDisplay />
            </div>
          </div>
          <PublicFooter />
        </>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
