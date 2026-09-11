// Smart Demand keeps the intelligence layer separate from the page.
// The UI can later swap these local view models for Supabase query results
// without changing the components that render the demand story.

const normalise = value => String(value || '').trim().toLowerCase();
const routeKey = (from, to) => `${normalise(from)}::${normalise(to)}`;

const minutesFromTime = value => {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const routeSimilarity = (a, b) => {
  const left = normalise(a);
  const right = normalise(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.8;
  const leftTokens = new Set(left.split(/\s+/));
  const rightTokens = new Set(right.split(/\s+/));
  const common = [...leftTokens].filter(token => rightTokens.has(token)).length;
  return common / Math.max(leftTokens.size, rightTokens.size);
};

export const buildDemandSnapshot = ({ rides = [], bookings = [], events = [], lending = [], platformStats = null, now = new Date() }) => {
  const today = now.toLocaleDateString('en-IN', { weekday: 'short' });
  const activeRides = rides.filter(ride => ride.status === 'ACTIVE' && Number(ride.seatsAvailable) > 0);
  const todayRides = rides.filter(ride => String(ride.date || '').toLowerCase() === 'today');
  const bookedToday = bookings.filter(booking => String(booking.date || '').toLowerCase() === 'today' && booking.status !== 'CANCELLED').length;
  const offeredToday = todayRides.length;
  const availableSeats = activeRides.reduce((sum, ride) => sum + Number(ride.seatsAvailable || 0), 0);

  const routeMap = new Map();
  rides.forEach(ride => {
    const key = routeKey(ride.from, ride.to);
    if (!routeMap.has(key)) routeMap.set(key, { from: ride.from, to: ride.to, bookings: 0, requests: 0, availableSeats: 0, historicalActivity: 0, departureTime: ride.departureTime });
    const route = routeMap.get(key);
    route.availableSeats += Number(ride.seatsAvailable || 0);
    route.historicalActivity += 1;
  });

  bookings.forEach(booking => {
    const key = routeKey(booking.from, booking.to);
    if (!routeMap.has(key)) routeMap.set(key, { from: booking.from, to: booking.to, bookings: 0, requests: 0, availableSeats: 0, historicalActivity: 0, departureTime: booking.time });
    routeMap.get(key).bookings += 1;
  });

  // Aggregated requests from ride_requests on ride_offer_id.
  rides.forEach(ride => {
    const key = routeKey(ride.from, ride.to);
    if (routeMap.has(key)) routeMap.get(key).requests += Number(ride.requestsCount || 0);
  });

  const eventInfluence = events.reduce((sum, event) => sum + Number(event.expectedDemand || 0), 0);
  const routeDemand = [...routeMap.values()].map(route => {
    const demand = route.requests + route.bookings + Math.round(route.historicalActivity * 0.8) + Math.round(eventInfluence / Math.max(1, routeMap.size * 3));
    const shortage = Math.max(0, demand - route.availableSeats);
    const score = Math.max(0, demand - route.availableSeats * 0.7);
    const level = score >= 10 || shortage >= 8 ? 'HIGH' : score >= 5 || shortage >= 3 ? 'MEDIUM' : 'LOW';
    return { ...route, demand, shortage, demandScore: Math.round(score * 10) / 10, demandLevel: level };
  }).sort((a, b) => b.shortage - a.shortage || b.demandScore - a.demandScore);

  const hourBuckets = [8, 10, 12, 14, 16, 17, 18, 19].map(hour => {
    const count = rides.reduce((sum, ride) => {
      const minute = minutesFromTime(ride.departureTime);
      if (minute === null) return sum;
      return sum + (Math.abs(minute - hour * 60) <= 60 ? 1 : 0) + Number(ride.requestsCount || 0);
    }, 0);
    return { hour, value: Math.min(100, count * 8) };
  });

  return {
    updatedAt: new Date().toISOString(),
    dayLabel: today,
    kpis: {
      bookedToday: platformStats?.todayBooked ?? bookedToday,
      offeredToday: platformStats?.todayOffered ?? offeredToday,
      vehiclesLentToday: lending.filter(item => ['ACTIVE', 'RETURNED'].includes(String(item.status || '').toUpperCase())).length,
      availableSeats
    },
    routes: routeDemand,
    topRoutes: routeDemand.slice(0, 4),
    peakHours: hourBuckets,
    events,
    hasSignal: routeDemand.some(route => route.demandLevel !== 'LOW'),
  };
};

export const getRoutePrefill = route => ({
  from: route.from,
  to: route.to,
  time: route.departureTime || '5:30 PM'
});

export const findBestRouteForUser = (routes, userRides = []) => {
  if (!userRides.length) return routes[0] || null;
  return [...routes].sort((a, b) => {
    const aMatch = Math.max(...userRides.map(ride => routeSimilarity(a.from, ride.from) + routeSimilarity(a.to, ride.to)));
    const bMatch = Math.max(...userRides.map(ride => routeSimilarity(b.from, ride.from) + routeSimilarity(b.to, ride.to)));
    return (bMatch + b.shortage / 10) - (aMatch + a.shortage / 10);
  })[0] || null;
};

export const buildDemandSnapshotFromDatabase = ({ offers = [], requests = [], bookings = [], vehicles = [], bikeRequests = [] }) => {
  const routeMap = new Map();
  const keyFor = (from, to) => routeKey(from, to);

  offers.forEach(offer => {
    const key = keyFor(offer.from_location, offer.to_location);
    const current = routeMap.get(key) || {
      from: offer.from_location,
      to: offer.to_location,
      requests: 0,
      bookings: 0,
      availableSeats: 0,
      historicalActivity: 0,
      departureTime: new Date(offer.departure_time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
    };
    current.availableSeats += Number(offer.available_seats || 0);
    current.historicalActivity += 1;
    routeMap.set(key, current);
  });

  requests.forEach(request => {
    const offer = offers.find(item => item.id === request.ride_offer_id);
    if (!offer) return;
    const current = routeMap.get(keyFor(offer.from_location, offer.to_location));
    if (current) current.requests += Number(request.seats_requested || 1);
  });

  bookings.forEach(booking => {
    const offer = offers.find(item => item.id === booking.ride_offer_id);
    if (!offer) return;
    const current = routeMap.get(keyFor(offer.from_location, offer.to_location));
    if (current) current.bookings += 1;
  });

  const routes = [...routeMap.values()].map(route => {
    const demand = route.requests + route.bookings;
    const shortage = Math.max(0, demand - route.availableSeats);
    const demandScore = Math.max(0, demand + route.historicalActivity - route.availableSeats);
    return {
      ...route,
      demand,
      shortage,
      demandScore,
      demandLevel: demandScore >= 10 || shortage >= 8 ? 'HIGH' : demandScore >= 5 || shortage >= 3 ? 'MEDIUM' : 'LOW'
    };
  }).sort((a, b) => b.shortage - a.shortage || b.demandScore - a.demandScore);

  const activeOffers = offers.filter(item => String(item.status).toLowerCase() === 'active');
  return {
    updatedAt: new Date().toISOString(),
    kpis: {
      bookedToday: bookings.length,
      offeredToday: offers.length,
      vehiclesLentToday: bikeRequests.filter(item => ['approved', 'active', 'completed'].includes(String(item.status || '').toLowerCase())).length,
      availableSeats: activeOffers.reduce((sum, item) => sum + Number(item.available_seats || 0), 0)
    },
    routes,
    topRoutes: routes.slice(0, 4),
    peakHours: [8,10,12,14,16,17,18,19].map(hour => ({ hour, value: routes.reduce((sum, route) => sum + (route.departureTime?.startsWith(`${hour}:`) ? route.demand : 0), 0) })),
    events: [],
    hasSignal: routes.some(route => route.demandLevel !== 'LOW')
  };
};
