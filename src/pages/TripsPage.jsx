import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  CalendarCheck,
  Clock,
  MapPin,
  ArrowRight,
  User,
  Bike,
  Coins,
  AlertCircle,
  XCircle,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Trash2
} from 'lucide-react';

export const TripsPage = () => {
  const { bookings, cancelTrip, deleteRide, isSubmitting, globalError, setActiveTab } = useApp();

  const [activeTab, setActiveTabFilter] = useState('UPCOMING'); // 'UPCOMING' | 'OFFERED' | 'COMPLETED'
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [removingRide, setRemovingRide] = useState(null);
  const [actionError, setActionError] = useState('');

  // Filter bookings according to active tab
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'UPCOMING') {
      return (b.role === 'PASSENGER' || b.type === 'PASSENGER') && (b.status === 'CONFIRMED' || b.status === 'UPCOMING');
    }
    if (activeTab === 'OFFERED') {
      return b.role === 'DRIVER' || b.status === 'OFFERED' || b.type === 'PROVIDER';
    }
    if (activeTab === 'COMPLETED') {
      return b.status === 'COMPLETED' || b.status === 'CANCELLED';
    }
    return true;
  });

  const handleOpenCancelBooking = (booking) => {
    setCancellingBooking(booking);
    setActionError('');
  };

  const handleOpenRemoveRide = (trip) => {
    setRemovingRide(trip);
    setActionError('');
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setActionError('');
    try {
      await cancelTrip(cancellingBooking.id);
      setCancellingBooking(null);
    } catch (err) {
      if (err.name !== 'OfflineError') {
        setActionError(err.message || 'Failed to cancel trip.');
      }
    }
  };

  const handleConfirmRemoveRide = async () => {
    if (!removingRide) return;
    setActionError('');
    try {
      await deleteRide(removingRide.rideId || removingRide.id);
      setRemovingRide(null);
    } catch (err) {
      if (err.name !== 'OfflineError') {
        setActionError(err.message || 'Failed to remove offered ride.');
      }
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '780px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-verified">
            Trips & Activity
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Real-time ride management
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
          My Journeys
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Track reserved seats, manage rides you’ve offered, and review past shared trips.
        </p>
      </div>

      {/* Offline Error Banner with Retry */}
      {globalError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '2px' }}>Connection Error</div>
            <div>{globalError.message}</div>
            {globalError.onRetry && (
              <button
                onClick={globalError.onRetry}
                className="btn btn-sm btn-danger"
                style={{ marginTop: '8px' }}
              >
                <RefreshCw size={12} /> Retry Action
              </button>
            )}
          </div>
        </div>
      )}

      {/* Segmented Tab Controls */}
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-subtle)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        gap: '4px'
      }}>
        {[
          { id: 'UPCOMING', label: 'Upcoming Trips' },
          { id: 'OFFERED', label: 'Offered by Me' },
          { id: 'COMPLETED', label: 'Past & Cancelled' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTabFilter(tab.id)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Empty States */}
      {filteredBookings.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <CalendarCheck size={26} />
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px' }}>
            {activeTab === 'UPCOMING' && 'No upcoming trips'}
            {activeTab === 'OFFERED' && 'No rides offered yet'}
            {activeTab === 'COMPLETED' && 'No past trips recorded'}
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 20px' }}>
            {activeTab === 'UPCOMING' && 'Find a ride when you are ready to head out, or reserve an empty seat on a shared route.'}
            {activeTab === 'OFFERED' && 'Already heading somewhere? Share your empty seats with fellow students to offset fuel costs.'}
            {activeTab === 'COMPLETED' && 'Your completed journeys and history will show up here.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {activeTab === 'UPCOMING' && (
              <button onClick={() => setActiveTab('find')} className="btn btn-primary btn-sm">
                Find a Ride
              </button>
            )}
            {activeTab === 'OFFERED' && (
              <button onClick={() => setActiveTab('offer')} className="btn btn-primary btn-sm">
                + Offer a Ride
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trips List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredBookings.map(trip => {
          const isCancelled = trip.status === 'CANCELLED';
          const isOffered = trip.role === 'DRIVER' || trip.type === 'PROVIDER' || trip.status === 'OFFERED';

          return (
            <div
              key={trip.id}
              className="card"
              style={{
                borderLeft: isCancelled
                  ? '4px solid #CBD5E1'
                  : isOffered
                    ? '4px solid var(--teal)'
                    : '4px solid var(--primary)',
                opacity: isCancelled ? 0.7 : 1
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`badge ${
                      trip.status === 'CONFIRMED' || trip.status === 'UPCOMING' ? 'badge-verified' :
                      trip.status === 'OFFERED' ? 'badge-seats' :
                      trip.status === 'COMPLETED' ? 'badge-subtle' :
                      'badge-warning'
                    }`}>
                      {trip.status}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {isOffered ? 'Offered by You' : 'Passenger Booking'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                    <span>{trip.from}</span>
                    <ArrowRight size={14} color="var(--text-tertiary)" />
                    <span style={{ color: 'var(--primary)' }}>{trip.to}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: isOffered ? 'var(--teal)' : 'var(--primary)' }}>
                    {isOffered ? `+${trip.contribution} Credits` : `${trip.contribution} Credits`}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {isOffered ? 'est. community credits' : 'credits contributed'}
                  </div>
                </div>
              </div>

              {/* Meta details */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12px',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} />
                    {trip.date} · {trip.time}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Bike size={13} />
                    {trip.vehicle || 'Two Wheeler'}
                  </span>
                </div>

                <div style={{ fontWeight: '600' }}>
                  {isOffered ? `${trip.seatsBooked || 1} seat(s) on route` : `Ride with ${trip.partnerName || 'Driver'}`}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
                {/* 1. Driver can Remove / Cancel Offered Ride */}
                {isOffered && trip.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleOpenRemoveRide(trip)}
                    disabled={isSubmitting}
                    className="btn btn-danger btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={13} />
                    <span>Remove Offered Ride</span>
                  </button>
                )}

                {/* 2. Passenger can Cancel Booking */}
                {!isOffered && (trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') && (
                  <button
                    onClick={() => handleOpenCancelBooking(trip)}
                    disabled={isSubmitting}
                    className="btn btn-danger btn-sm"
                  >
                    Cancel Booking & Refund Credits
                  </button>
                )}

                {trip.status === 'CANCELLED' && (
                  <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}>
                    Cancelled
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. Remove Offered Ride Confirmation Modal */}
      {removingRide && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setRemovingRide(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Remove Offered Ride
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Cancels this ride and removes it from public search
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Are you sure you want to remove your offered ride from <strong>{removingRide.from} → {removingRide.to}</strong>?
            </p>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '12.5px'
            }}>
              <div style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '4px' }}>
                Automatic Protections:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)' }}>
                <li>Any booked passengers will automatically receive 100% credit refunds.</li>
                <li>Affected passengers will be immediately notified.</li>
                <li>The ride will be removed from community search results.</li>
              </ul>
            </div>

            {actionError && (
              <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRemovingRide(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Keep Ride
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveRide}
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Removing...' : 'Confirm & Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Passenger Cancel Booking Confirmation Modal */}
      {cancellingBooking && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setCancellingBooking(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Confirm Trip Cancellation
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Restores seat to community & refunds fuel credits
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Are you sure you want to cancel your seat for <strong>{cancellingBooking.from} → {cancellingBooking.to}</strong>?
            </p>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Refund amount:</span>
                <strong style={{ color: 'var(--success)' }}>+{cancellingBooking.contribution} credits</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                <span>Seat capacity restored:</span>
                <span>+{cancellingBooking.seatsBooked || 1} seat</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '2px' }}>
                <span>Driver notification:</span>
                <span>Will be alerted automatically</span>
              </div>
            </div>

            {actionError && (
              <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
                <AlertCircle size={14} />
                <span>{actionError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

