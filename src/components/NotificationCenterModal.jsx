import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bike,
  Coins,
  Sparkles,
  Key,
  Trash2,
  CheckCheck,
  X,
  ArrowRight
} from 'lucide-react';

export const NotificationCenterModal = () => {
  const {
    notifications,
    unreadCount,
    isNotificationsOpen,
    setIsNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    setActiveTab
  } = useApp();

  if (!isNotificationsOpen) return null;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E8F5E9', color: '#2E7D32', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bike size={18} /></div>;
      case 'BOOKING_CANCELLED':
      case 'RIDE_CANCELLED_BY_DRIVER':
        return <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFEBEE', color: '#D32F2F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><XCircle size={18} /></div>;
      case 'VEHICLE_REQUEST':
        return <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E0F2F1', color: '#00796B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Key size={18} /></div>;
      case 'WELCOME_BONUS':
        return <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFF8E1', color: '#F57F17', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Coins size={18} /></div>;
      default:
        return <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bell size={18} /></div>;
    }
  };

  const handleActionClick = (notif) => {
    markNotificationRead(notif.id);
    setIsNotificationsOpen(false);
    if (notif.type === 'BOOKING_CONFIRMED' || notif.type === 'BOOKING_CANCELLED' || notif.type === 'RIDE_CANCELLED_BY_DRIVER') {
      setActiveTab('trips');
    } else if (notif.type === 'VEHICLE_REQUEST') {
      setActiveTab('lending');
    } else if (notif.type === 'WELCOME_BONUS') {
      setActiveTab('wallet');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsNotificationsOpen(false)} style={{ zIndex: 1050 }}>
      <div
        className="modal-content notif-drawer"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                Notifications
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="btn btn-subtle btn-sm"
                style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Mark all as read"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(false)}
              className="btn btn-subtle btn-sm"
              style={{ padding: '4px 6px', borderRadius: '50%' }}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'var(--bg-subtle)'
        }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Bell size={22} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-main)' }}>No notifications yet</h4>
              <p style={{ fontSize: '12.5px', margin: 0, maxWidth: '320px', marginInline: 'auto' }}>
                When students reserve seats on your rides, cancel trips, or request vehicles, alerts will appear here in real-time.
              </p>
            </div>
          ) : (
            notifications.map(notif => {
              const isUnread = !notif.read;
              return (
                <div
                  key={notif.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    border: isUnread ? '1.5px solid var(--primary-border)' : '1px solid var(--border-light)',
                    boxShadow: isUnread ? '0 2px 8px rgba(30, 122, 60, 0.08)' : 'none',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                >
                  {getNotifIcon(notif.type)}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: isUnread ? '800' : '700', color: 'var(--text-main)' }}>
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            display: 'inline-block'
                          }} />
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {notif.timestamp || 'Just now'}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '12.5px',
                      color: 'var(--text-muted)',
                      margin: '0 0 8px 0',
                      lineHeight: '1.45'
                    }}>
                      {notif.message}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleActionClick(notif)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontSize: '11.5px',
                          fontWeight: '700',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>View Details</span>
                        <ArrowRight size={12} />
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(notif.id)}
                            style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(notif.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            Real-time peer mobility alerts
          </span>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(false)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
