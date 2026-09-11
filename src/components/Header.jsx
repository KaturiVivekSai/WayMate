import React from 'react';
import { Coins, ShieldCheck, Wifi, WifiOff, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export const Header = () => {
  const { user, wallet, activeTab, setActiveTab, isOffline, toggleOffline, logout } = useApp();
  const firstName = user?.username || user?.name?.split(' ')[0] || 'Member';

  return <header className="app-header">
    {isOffline && <div className="offline-banner"><WifiOff size={14} /> Offline simulation is active <button onClick={toggleOffline}>Go online</button></div>}
    <div className="app-container header-inner">
      <button className="brand-lockup" onClick={() => setActiveTab('dashboard')} aria-label="Way Mate dashboard">
        <img src="/waymate-mark.png" alt="" />
        <span>Way <span>Mate</span></span>
        <small>Student Community</small>
      </button>
      <div className="header-tools">
        <button className={`credit-pill ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')} title="Open community wallet"><Coins size={16} /><strong>{wallet.balance}</strong><span>credits</span></button>
        <button className="network-pill" onClick={toggleOffline} title="Toggle offline connectivity mode">{isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}</button>
        <button className="profile-quick" onClick={() => setActiveTab('profile')} title={`Open ${firstName}'s profile`}><img src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(firstName)}`} alt={firstName} />{user?.isVerified && <span><ShieldCheck size={12} /></span>}</button>
        <button className="logout-button" onClick={logout} title="Sign out"><LogOut size={16} /></button>
      </div>
    </div>
  </header>;
};
