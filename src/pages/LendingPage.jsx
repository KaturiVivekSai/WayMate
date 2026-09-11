import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ShieldCheck, Star } from 'lucide-react';

export const LendingPage = () => {
  const { lending, requestLend, isSubmitting } = useApp();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [borrowPurpose, setBorrowPurpose] = useState('College project supply pickup in campus corridor');

  const handleOpenRequest = (item) => {
    setSelectedVehicle(item);
  };

  const handleConfirmRequest = async () => {
    if (!selectedVehicle) return;
    try {
      await requestLend(selectedVehicle.id);
      setSelectedVehicle(null);
    } catch (err) {
      // Handled in context toast
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-verified">
            Community Lending
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            High-Trust Peer Vehicle Sharing
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
          Vehicle Lending Circle
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Verified community owners allow trusted peers to borrow their vehicle for errands using Community Credits.
        </p>
      </div>

      {/* Trust Gate Notice */}
      <div style={{
        backgroundColor: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: '#166534' }}>
          <strong>Verified Campus Sharing:</strong> Lending vehicles requires mutual verification, valid driving credentials, and peer owner confirmation in Supabase.
        </div>
      </div>

      {/* Vehicles Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {(!lending || lending.length === 0) ? (
          <div className="card" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>No vehicles currently available for lending</h3>
            <p style={{ fontSize: '13px' }}>Registered vehicles from campus peers will appear here automatically from Supabase.</p>
          </div>
        ) : (
          lending.map(item => {
            const isRequested = Boolean(item.hasRequested);
            const vehicleTitle = item.vehicleName || item.vehicle || 'Campus Two-Wheeler';
            const plate = item.registrationNumber || item.plate || '';
            const creditsCost = item.requiredCredits || item.dailyCreditCost || 20;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderLeft: '4px solid var(--primary)',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <img
                      src={item.ownerAvatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(item.ownerName || 'Owner')}`}
                      alt={item.ownerName || 'Owner'}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {vehicleTitle}
                        </h3>
                        <span className={`badge ${isRequested ? 'badge-warning' : 'badge-verified'}`}>
                          {isRequested ? 'Request Submitted' : 'Available to lend'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        <span>Owner: <strong>{item.ownerName || 'Campus Peer'}</strong></span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Star size={12} fill="#F59E0B" color="#F59E0B" /> {item.ownerTrustScore || 4.9}
                        </span>
                        {plate && (
                          <>
                            <span>•</span>
                            <span>{plate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                      {creditsCost} Credits
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      community security deposit
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--text-muted)'
                }}>
                  <strong>Campus Location:</strong> {item.location || 'PVPSIT Parking Gate 1'} · Helmet included
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                  <button
                    onClick={() => handleOpenRequest(item)}
                    disabled={isRequested || isSubmitting}
                    className="btn btn-primary btn-sm"
                  >
                    {isRequested ? 'Request Pending in Supabase' : 'Request Temporary Access'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lending Request Modal */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setSelectedVehicle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800' }}>
                Request Vehicle Access
              </h3>
              <button
                onClick={() => setSelectedVehicle(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-tertiary)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '13px' }}>
              <div><strong>{selectedVehicle.vehicleName || selectedVehicle.vehicle}</strong> ({selectedVehicle.registrationNumber || selectedVehicle.plate || 'Two-Wheeler'})</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                Owner: {selectedVehicle.ownerName} · {selectedVehicle.ownerTrustScore || 4.9} ★ Trust Score
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lend-purpose">Purpose of Borrowing</label>
              <textarea
                id="lend-purpose"
                className="form-textarea"
                value={borrowPurpose}
                onChange={e => setBorrowPurpose(e.target.value)}
                rows={2}
              />
            </div>

            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '16px'
            }}>
              ✓ Helmet & basic emergency kit included
              <br />
              ✓ Request is stored in Supabase <code>bike_requests</code> table
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRequest}
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Send Request to Owner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
