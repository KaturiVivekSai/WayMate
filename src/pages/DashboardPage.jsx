import React from 'react';
import { ArrowUpRight, Bike, CalendarDays, Leaf, MapPin, Search, TrendingUp, Users, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export const DashboardPage = () => {
  const { user, wallet, rides, bookings, events, platformStats, setActiveTab, createEvent } = useApp();
  const [showEventForm, setShowEventForm] = React.useState(false);
  const [eventForm, setEventForm] = React.useState({ title: '', date: 'Today', time: '5:00 PM', location: 'PVPSIT Campus', demand: 'Moderate', expectedDemand: 10 });
  
  const todayBooked = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'UPCOMING').length;
  const offeredToday = bookings.filter(b => b.role === 'DRIVER').length;
  const totalOpenSeats = (rides || []).reduce((sum, r) => sum + Number(r.availableSeats || 0), 0);

  const firstName = user?.name?.split(' ')[0] || user?.username || 'Member';

  return (
    <div className="app-page dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Good to see you, {firstName}</span>
          <h1>Move through campus<br /><em>with the community.</em></h1>
          <p>Here is what is happening around WayMate on Supabase today.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('find')}><Search size={16} /> Find a ride</button>
          <button className="btn btn-primary" onClick={() => setActiveTab('offer')}><Bike size={16} /> Offer a ride</button>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <span><Bike size={17} /> Rides booked today</span>
          <strong>{todayBooked || platformStats.todayBooked}</strong>
          <small>Community demand right now</small>
        </article>
        <article className="metric-card">
          <span><ArrowUpRight size={17} /> Rides offered today</span>
          <strong>{offeredToday || platformStats.todayOffered}</strong>
          <small>Students sharing empty seats</small>
        </article>
        <article className="metric-card">
          <span><TrendingUp size={17} /> Active requests</span>
          <strong>{platformStats.activeRequests || 2}</strong>
          <small>Requests looking for a match</small>
        </article>
        <article className="metric-card accent">
          <span><Leaf size={17} /> Estimated CO₂ avoided</span>
          <strong>{platformStats.carbonSaved.toFixed(1)} t</strong>
          <small>Estimated based on shared travel</small>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="surface-card demand-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Demand</span>
              <h2>Where the campus is moving</h2>
            </div>
            <button className="text-button" onClick={() => setActiveTab('demand')}>Open Demand <ArrowUpRight size={15} /></button>
          </div>
          <div className="demand-row">
            <div><MapPin size={18} /><strong>PVPSIT Parking → Hostel / PG</strong><span>Most searched campus corridor</span></div>
            <div className="demand-value high">High</div>
          </div>
          <div className="demand-row">
            <div><CalendarDays size={18} /><strong>Active ride offers</strong><span>Available right now in Supabase</span></div>
            <div className="demand-value">{rides.length}</div>
          </div>
          <div className="demand-row">
            <div><Users size={18} /><strong>Open seats</strong><span>Total empty seats offered by peers</span></div>
            <div className="demand-value">{totalOpenSeats}</div>
          </div>
        </section>

        <section className="surface-card wallet-summary">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Community Wallet</span>
              <h2>{wallet.balance} Credits</h2>
            </div>
            <button className="text-button" onClick={() => setActiveTab('wallet')}>Open wallet <ArrowUpRight size={15} /></button>
          </div>
          <div className="wallet-mini-grid">
            <div>
              <span>Total Earned / Added</span>
              <strong>+{wallet.thisMonthEarned}</strong>
            </div>
            <div>
              <span>Total Contributed</span>
              <strong>−{wallet.thisMonthUsed}</strong>
            </div>
          </div>
          <p>Community Credits represent shared transportation fuel contributions — not monetary profits.</p>
        </section>
      </div>

      <section className="surface-card upcoming-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">Campus Demand Signals</span>
            <h2>Peak travel corridors & events</h2>
          </div>
          <button className="text-button" onClick={() => setShowEventForm(value => !value)}>
            {showEventForm ? <><X size={15} /> Close</> : <><Plus size={15} /> Add signal</>}
          </button>
        </div>

        {showEventForm && (
          <form className="event-form" onSubmit={async e => {
            e.preventDefault();
            await createEvent(eventForm);
            setEventForm({ title: '', date: 'Today', time: '5:00 PM', location: 'PVPSIT Campus', demand: 'Moderate', expectedDemand: 10 });
            setShowEventForm(false);
          }}>
            <input required placeholder="Event name" value={eventForm.title} onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))} />
            <input required placeholder="Date" value={eventForm.date} onChange={e => setEventForm(prev => ({ ...prev, date: e.target.value }))} />
            <input required placeholder="Time" value={eventForm.time} onChange={e => setEventForm(prev => ({ ...prev, time: e.target.value }))} />
            <input required placeholder="Location" value={eventForm.location} onChange={e => setEventForm(prev => ({ ...prev, location: e.target.value }))} />
            <select value={eventForm.demand} onChange={e => setEventForm(prev => ({ ...prev, demand: e.target.value }))}>
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
            <button className="btn btn-primary btn-sm" type="submit">Save signal</button>
          </form>
        )}

        <div className="event-grid compact">
          {events.map((event, idx) => (
            <article className="event-card" key={event.id || idx}>
              <div className="event-icon"><CalendarDays size={17} /></div>
              <div>
                <strong>{event.title || event.route}</strong>
                <p>{event.date || 'Campus Corridor'} · {event.time || event.peakTime || '5:30 PM'} · {event.location || 'PVPSIT'}</p>
              </div>
              <span className={`demand-chip ${(event.demand || 'Moderate').toLowerCase().replace(' ', '-')}`}>
                {event.demand || 'Active'}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
