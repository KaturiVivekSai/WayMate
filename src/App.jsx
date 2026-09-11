import React from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { Header } from './components/Header.jsx';
import { Navigation } from './components/Navigation.jsx';
import { NotificationCenterModal } from './components/NotificationCenterModal.jsx';
import { FindRidePage } from './pages/FindRidePage.jsx';
import { OfferRidePage } from './pages/OfferRidePage.jsx';
import { WalletPage } from './pages/WalletPage.jsx';
import { TripsPage } from './pages/TripsPage.jsx';
import { LendingPage } from './pages/LendingPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { LoadingScreen } from './pages/LoadingScreen.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { VerificationPage } from './pages/VerificationPage.jsx';
import { DemandPage } from './pages/DemandPage.jsx';

const AppContent = () => {
  const { entryMode, setEntryMode, activeTab, toast } = useApp();

  if (entryMode === 'loading') return <LoadingScreen />;
  if (entryMode === 'landing') return <LandingPage />;
  if (entryMode === 'signup' || entryMode === 'login') return <AuthPage />;
  if (entryMode === 'verification') return <VerificationPage onDone={() => setEntryMode('app')} />;

  return (
    <div className="app-shell">
      <Header />
      <Navigation />
      <NotificationCenterModal />

      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'find' && <FindRidePage />}
        {activeTab === 'offer' && <OfferRidePage />}
        {activeTab === 'wallet' && <WalletPage />}
        {activeTab === 'lending' && <LendingPage />}
        {activeTab === 'trips' && <TripsPage />}
        {(activeTab === 'demand' || activeTab === 'smart-demand') && <DemandPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {toast && (
        <div className="toast-container" role="status" aria-live="polite">
          <div className={`toast toast-${toast.type || 'info'}`}>{toast.message}</div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
