// Small dependency-free Supabase REST client.
// This keeps the project install-light while giving the UI a clean seam for
// the exact PostgreSQL tables in backend/supabase-schema.sql.

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

const request = async (path, options = {}) => {
  if (!supabaseConfigured) throw new Error('Supabase is not configured.');
  const token = localStorage.getItem('waymate_access_token') || anonKey;
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Supabase request failed (${response.status}).`);
  }
  return response.status === 204 ? null : response.json();
};

const query = async (table, params = '') => request(`/rest/v1/${table}?${params}`);

export const getSmartDemandData = async () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const [offers, requests, bookings, vehicles, bikeRequests] = await Promise.all([
    query('ride_offers', `select=id,driver_id,vehicle_id,from_location,to_location,departure_time,available_seats,credits_per_seat,status,created_at&departure_time=gte.${encodeURIComponent(start)}&departure_time=lt.${encodeURIComponent(end)}&order=departure_time.asc`),
    query('ride_requests', `select=id,ride_offer_id,requester_id,driver_id,seats_requested,status,created_at&created_at=gte.${encodeURIComponent(start)}&created_at=lt.${encodeURIComponent(end)}`),
    query('bookings', `select=id,user_id,ride_offer_id,vehicle_id,ride_request_id,start_time,end_time,credits_paid,status,created_at&created_at=gte.${encodeURIComponent(start)}&created_at=lt.${encodeURIComponent(end)}`),
    query('vehicles', 'select=id,owner_id,vehicle_type,brand,model,registration_number,seats,is_available,created_at,updated_at'),
    query('bike_requests', `select=id,vehicle_id,requester_id,owner_id,start_time,end_time,status,created_at&created_at=gte.${encodeURIComponent(start)}&created_at=lt.${encodeURIComponent(end)}`)
  ]);

  return { offers, requests, bookings, vehicles, bikeRequests, fetchedAt: now.toISOString() };
};

export const signUpWithSupabase = async ({ email, password, fullName, phone, avatarUrl }) => {
  const auth = await request('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, data: { full_name: fullName, phone } })
  });
  return auth;
};

export const loginWithSupabase = async ({ email, password }) => {
  const auth = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (auth?.access_token) localStorage.setItem('waymate_access_token', auth.access_token);
  return auth;
};

export const insertRows = (table, rows) => request(`/rest/v1/${table}`, {
  method: 'POST',
  headers: { Prefer: 'return=representation' },
  body: JSON.stringify(rows)
});

export const clearSupabaseToken = () => localStorage.removeItem('waymate_access_token');
