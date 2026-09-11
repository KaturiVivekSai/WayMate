import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { TrustBadge } from '../components/TrustBadge.jsx';
import {
  Bike,
  CheckCircle,
  ShieldCheck,
  LogOut,
  UserRound
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, showToast, updateProfile, logout } = useApp();
  const [activeCommunity, setActiveCommunity] = useState(user?.community || 'Green Residency & PES Campus Circle');
  const [bikeColour, setBikeColour] = useState(user?.bikeColour || 'Not specified');
  const [isEv, setIsEv] = useState(Boolean(user?.isEv));
  const [vehicleModel, setVehicleModel] = useState(user?.vehicleModel || user?.vehicle || '');
  const [fullName, setFullName] = useState(user?.name || '');

  if (!user) {
    return (
      <div className="app-container" style={{ maxWidth: '680px', margin: '40px auto', textAlign: 'center' }}>
        <h2>Loading Profile...</h2>
        <p>Connecting to Supabase...</p>
      </div>
    );
  }

  const handleSaveCommunity = () => {
    showToast('Community preferences updated.', 'success');
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        full_name: fullName,
        bikeColour,
        isEv,
        vehicleModel
      });
    } catch (err) {
      showToast(err.message || 'Could not update profile', 'error');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
          Community Trust Profile
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Your verified credentials stored in Supabase and visible to fellow students.
        </p>
      </div>

      {/* Main Student Profile Card */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
          <img
            src={user.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || 'Member')}`}
            alt={user.name || 'User'}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--primary)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                {user.name || user.username}
              </h2>
              <span className="badge badge-verified">
                ✓ Verified
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {user.email} · {user.college || 'PVPSIT Campus'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '3px', fontWeight: '700' }}>
              WayMate ID: {user.generatedUserId || user.user_code || (user.id ? `WM${user.id.slice(0, 6).toUpperCase()}` : 'WM-USER')} · {user.credits ?? 0} Community Credits
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Member of {user.community || 'PVPSIT Student Community'}
            </div>
          </div>
        </div>

        {/* Trust Badges & Reliability breakdown from Supabase */}
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '18px'
        }}>
          <TrustBadge
            isVerified={true}
            rating={user.rating || user.trust_score || 5.0}
            reviewsCount={user.ridesCompleted || 0}
            ridesCompleted={user.ridesCompleted || 0}
            ridesShared={user.ridesShared || 0}
            reliabilityScore={user.reliabilityScore || '99%'}
            showFullStats
          />
        </div>

        {/* Detailed Stats Grid from Supabase */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          marginBottom: '18px'
        }}>
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Rides Completed</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
              {user.ridesCompleted || 0}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Rides Shared</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
              {user.ridesShared || 0}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Mutual Peers</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--teal)' }}>
              {user.mutualConnections || 5}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Reliability</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>
              {user.reliabilityScore || '99%'}
            </div>
          </div>
        </div>

        {/* Vehicle registered */}
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bike size={16} color="var(--text-tertiary)" />
          <span>Registered Vehicle: <strong>{user.vehicle || user.bikeNumber || 'None (Passenger)'}</strong>{user.bikeColour ? ` · ${user.bikeColour}` : ''}{user.isEv ? ' · EV' : ''}</span>
        </div>
      </div>

      {/* Profile & Vehicle Details Edit Form */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Edit Profile & Vehicle</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label className="form-label" htmlFor="user-fullname">Full Name</label>
          <input
            id="user-fullname"
            className="form-input"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="bike-colour">Bike colour</label>
            <input
              id="bike-colour"
              className="form-input"
              value={bikeColour}
              onChange={e => setBikeColour(e.target.value)}
              placeholder="e.g. Matte Black"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="vehicle-model">Vehicle model</label>
            <input
              id="vehicle-model"
              className="form-input"
              value={vehicleModel}
              onChange={e => setVehicleModel(e.target.value)}
              placeholder="e.g. Classic 350 / Activa 6G"
            />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          <input type="checkbox" checked={isEv} onChange={e => setIsEv(e.target.checked)} /> This vehicle is electric (EV)
        </label>
        <button onClick={handleSaveProfile} className="btn btn-primary btn-sm">Save Details to Supabase</button>
      </div>

      {/* Community Circle Settings */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>
          Primary Campus Corridor
        </h3>
        <div className="form-group">
          <label className="form-label" htmlFor="comm-select">Hostel / PG Community</label>
          <select
            id="comm-select"
            className="form-select"
            value={activeCommunity}
            onChange={e => setActiveCommunity(e.target.value)}
          >
            <option value="Green Residency & PES Campus Circle">Green Residency & Campus Circle</option>
            <option value="Central PG & Library Corridor">Central PG & Library Corridor</option>
            <option value="Lakeview Hostel Block">Lakeview Hostel Block</option>
            <option value="Student Housing Complex">Student Housing Complex</option>
          </select>
        </div>
        <button onClick={handleSaveCommunity} className="btn btn-secondary btn-sm">
          Update Campus Circle
        </button>
      </div>

      {/* Session Management */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Supabase Authentication Session</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Logged in as {user.email} · WayMate ID: {user.generatedUserId || user.user_code || (user.id ? `WM${user.id.slice(0, 6).toUpperCase()}` : 'WM-USER')}
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-sm"
          style={{ border: '1px solid #f0cccc', color: '#b91c1c', background: '#fff5f5' }}
        >
          <LogOut size={13} style={{ marginRight: 4, verticalAlign: -1 }} /> Sign out of WayMate
        </button>
      </div>
    </div>
  );
};
