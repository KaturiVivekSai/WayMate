import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import {
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  PlusCircle,
  Sparkles,
  Zap,
  CheckCircle2,
  Bike
} from 'lucide-react';

/**
 * DemandPage Component
 * =====================================================================
 * Smart Demand Dashboard & Mobility Intelligence (Section 32, 33, 34, 36):
 * 1. Today's Community Mobility:
 *    • Rides Booked Today: 42
 *    • Rides Offered Today: 28
 *    • Vehicles Lent Today: 7
 *    • Available Seats: 64
 * 2. Top Campus Routes with real demand levels
 * 3. Demand Prediction Loop:
 *    • High demand corridor: Campus &rarr; PG Area (5:30-6:30 PM)
 *    • Direct CTA to [OFFER A RIDE] creating instant supply
 * 4. Community Events (Hackathon Day, Freshers Day, Exam Week)
 *    • Events &rarr; Expected Demand &rarr; Route Demand &rarr; Offer a Ride
 * 5. Lightweight Mobility Intelligence:
 *    • 84 rides shared &bull; 126 students helped &bull; 41 empty seats filled
 * =====================================================================
 */
export const DemandPage = () => {
  const { setActiveTab, searchParams, setSearchParams, rides = [], bookings = [], lending = [], demandData = {}, platformStats = {} } = useApp();

  // Dynamically calculate metrics from Supabase data
  const ridesOfferedCount = rides.length || platformStats.todayOffered || 0;
  const ridesBookedCount = demandData.bookingsCount || platformStats.todayBooked || bookings.length || 0;
  const vehiclesLentCount = lending.length || 0;
  const availableSeatsCount = rides.reduce((sum, r) => sum + (Number(r.availableSeats) || 1), 0);

  // Section 40 & 41: Demand -> Supply Connection prefilling route
  const handleOfferRoute = (from, to) => {
    setSearchParams(prev => ({
      ...prev,
      from: from || 'PVP SIT Parking',
      to: to || 'Green Residency PG'
    }));
    setActiveTab('offer');
  };

  return (
    <div className="app-container" style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-verified">
            Mobility Intelligence
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Real-time supply & demand coordination
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
          TODAY'S COMMUNITY MOBILITY
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Underutilized capacity made visible to eliminate solo walking trips.
        </p>
      </div>

      {/* Section 32: TODAY'S COMMUNITY MOBILITY METRICS */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            RIDES BOOKED TODAY
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
            {ridesBookedCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            short peer journeys
          </div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            RIDES OFFERED TODAY
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
            {ridesOfferedCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            by student riders
          </div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            VEHICLES AVAILABLE
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0D9488', marginTop: '4px' }}>
            {vehiclesLentCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            peer circle sharing
          </div>
        </div>

        <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            AVAILABLE SEATS
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#15803D', marginTop: '4px' }}>
            {availableSeatsCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ready across campus
          </div>
        </div>
      </section>

      {/* Section 33: DEMAND PREDICTION & ACTION LOOP */}
      <section
        className="card"
        style={{
          padding: '22px',
          marginBottom: '24px',
          backgroundColor: '#F0FDF4',
          borderColor: '#BBF7D0',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.5px'
                }}
              >
                HIGH DEMAND
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                Campus → PG Area Surge
              </span>
            </div>

            <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
              5:30–6:30 PM Peak Commute Corridor
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: '#166534', marginTop: '6px', flexWrap: 'wrap' }}>
              <span><strong>23 students</strong> looking for rides</span>
              <span>&bull;</span>
              <span><strong>8 available</strong> seats on current routes</span>
            </div>
          </div>

          {/* Action Loop: Direct CTA to Offer Ride */}
          <button
            onClick={() => handleOfferRoute('PVP SIT Parking', 'Green Residency PG')}
            className="btn btn-primary"
            style={{ padding: '10px 22px', fontWeight: '800' }}
          >
            <PlusCircle size={16} />
            <span>OFFER A RIDE</span>
          </button>
        </div>
      </section>

      {/* Section 32: TOP ROUTES */}
      <section style={{ marginBottom: '26px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
          TOP ROUTES TODAY
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Route 1 */}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                <span>PVP SIT Parking</span>
                <ArrowRight size={14} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--primary)' }}>Green Residency</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Peak window: 5:30–6:30 PM &bull; 23 student requests
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA', fontWeight: '700' }}>
                High demand
              </span>
              <button
                onClick={() => handleOfferRoute('PVP SIT Parking', 'Green Residency PG')}
                className="btn btn-outline-primary btn-sm"
              >
                + Offer
              </button>
            </div>
          </div>

          {/* Route 2 */}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                <span>PVP SIT Parking</span>
                <ArrowRight size={14} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--primary)' }}>Central PG</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Peak window: 5:45–6:15 PM &bull; 14 student requests
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ backgroundColor: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A', fontWeight: '700' }}>
                Medium demand
              </span>
              <button
                onClick={() => handleOfferRoute('PVP SIT Parking', 'Central PG')}
                className="btn btn-outline-primary btn-sm"
              >
                + Offer
              </button>
            </div>
          </div>

          {/* Route 3 */}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                <span>Campus</span>
                <ArrowRight size={14} color="var(--text-tertiary)" />
                <span style={{ color: 'var(--primary)' }}>Market</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Peak window: 6:30–7:30 PM &bull; 11 student requests
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ backgroundColor: '#FFFBEB', color: '#B45309', borderColor: '#FDE68A', fontWeight: '700' }}>
                Medium demand
              </span>
              <button
                onClick={() => handleOfferRoute('Campus', 'Market')}
                className="btn btn-outline-primary btn-sm"
              >
                + Offer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 34: COMMUNITY EVENTS MOBILITY COORDINATION */}
      <section style={{ marginBottom: '26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)' }}>
              UPCOMING COMMUNITY EVENTS
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Events &rarr; Expected Demand &rarr; Route Demand &rarr; Empty Seats Utilized
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {/* Event 1: PVPSIT Hackathon */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="badge badge-verified">
                Tomorrow &bull; Main Block
              </span>
              <span className="badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: '700' }}>
                HIGH DEMAND
              </span>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
              PVPSIT HACKATHON 2026
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              67 students expected. Higher morning mobility expected before 9:00 AM and post 6:00 PM.
            </p>

            <button
              onClick={() => handleOfferRoute('PVP SIT Parking', 'Green Residency PG')}
              className="btn btn-primary btn-block btn-sm"
            >
              CREATE / OFFER A RIDE
            </button>
          </div>

          {/* Event 2: Freshers Day */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="badge badge-subtle">
                Friday &bull; 9:00 AM
              </span>
              <span className="badge" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontWeight: '700' }}>
                HIGH DEMAND
              </span>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
              FRESHERS WELCOME DAY
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              140 students expected. Many newcomers needing first-time PG corridor guidance.
            </p>

            <button
              onClick={() => handleOfferRoute('PVP SIT Parking', 'Central PG')}
              className="btn btn-primary btn-block btn-sm"
            >
              CREATE / OFFER A RIDE
            </button>
          </div>
        </div>
      </section>

      {/* Section 36: COMMUNITY MOBILITY INTELLIGENCE (Compact Analytics) */}
      <section
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--primary-light)',
          border: '1px solid var(--primary-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} color="var(--primary)" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>
              TODAY'S ACCUMULATED IMPACT
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {platformStats.sharedRides || ridesBookedCount || 12} rides shared &bull; {platformStats.members || 4} verified students &bull; {availableSeatsCount || 8} empty seats shared
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
          WAYMATE INTELLIGENCE
        </div>
      </section>
    </div>
  );
};

export const SmartDemandPage = DemandPage;
export default DemandPage;
