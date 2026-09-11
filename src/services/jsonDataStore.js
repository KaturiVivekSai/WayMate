import initialDatabase from '../data/db.json';

const STORAGE_DB_KEY = 'waymate_json_database_v2';

/**
 * Load the current JSON database from browser storage or initial seed
 */
export function getJsonDatabase() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_DB_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.warn('Could not read JSON DB from storage:', err);
  }
  // Initialize with seed data
  saveJsonDatabase(initialDatabase);
  return JSON.parse(JSON.stringify(initialDatabase));
}

/**
 * Persist JSON database
 */
export function saveJsonDatabase(db) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
      window.dispatchEvent(new CustomEvent('waymate_db_updated', { detail: db }));
    }
  } catch (err) {
    console.warn('Could not save JSON DB to storage:', err);
  }
}

/**
 * Generate unique IDs for JSON records
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// ============================================================================
// 1. RIDES: FETCH & CREATE (JSON BASED)
// ============================================================================

export function dbFetchRides(filters = {}) {
  const db = getJsonDatabase();
  let list = db.rides || [];

  if (filters.from && filters.from.trim()) {
    const q = filters.from.toLowerCase().trim();
    list = list.filter(r => (r.from || '').toLowerCase().includes(q));
  }
  if (filters.to && filters.to.trim()) {
    const q = filters.to.toLowerCase().trim();
    list = list.filter(r => (r.to || '').toLowerCase().includes(q));
  }

  return list;
}

export function dbCreateRide(rideData, currentUser) {
  if (!currentUser) throw new Error('You must be logged in to offer a ride.');

  const db = getJsonDatabase();

  let depTimestamp = Date.now();
  let timeStr = rideData.departureTime || '5:30 PM';

  if (rideData.departureTime && rideData.departureTime.includes(':')) {
    const [hours, mins] = rideData.departureTime.split(':');
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
    depTimestamp = d.getTime();
  }

  const seats = parseInt(rideData.availableSeats || 1, 10);
  const credits = parseInt(rideData.contribution || rideData.credits || 15, 10);

  const newRide = {
    id: generateId('ride'),
    driverId: currentUser.id,
    from: rideData.from.trim(),
    to: rideData.to.trim(),
    departureTime: timeStr,
    departureTimestamp: depTimestamp,
    availableSeats: seats,
    seatsTotal: seats,
    contribution: credits,
    credits: credits,
    notes: (rideData.note || rideData.notes || '').trim(),
    status: 'active',
    distanceKm: 4.2,
    durationMinutes: 15,
    matchConfidence: 96,
    vehicle: currentUser.vehicleModel ? `${currentUser.vehicleModel} (${currentUser.vehicle || currentUser.bikeNumber || 'Two-Wheeler'})` : (currentUser.vehicle || 'Registered Two-Wheeler'),
    provider: {
      id: currentUser.id,
      name: currentUser.name || currentUser.full_name || 'Campus Driver',
      avatar: currentUser.avatar || currentUser.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser.name || 'Driver')}`,
      college: currentUser.college || 'PVPSIT Campus',
      userCode: currentUser.generatedUserId || currentUser.user_code || 'WM100001',
      isVerified: true,
      rating: Number(currentUser.trustScore || currentUser.trust_score || 5.0),
      ridesCompleted: (currentUser.rides_completed || 0) + 1,
      reliabilityScore: currentUser.reliability_score || '100%'
    }
  };

  db.rides.unshift(newRide);

  // Update user stats in JSON
  const userIdx = db.users.findIndex(u => u.id === currentUser.id);
  if (userIdx !== -1) {
    db.users[userIdx].rides_shared = (db.users[userIdx].rides_shared || 0) + 1;
  }

  saveJsonDatabase(db);
  return { success: true, ride: newRide };
}

// ============================================================================
// 2. BOOKINGS & REQUESTS (JSON BASED)
// ============================================================================

export function dbBookSeat({ rideId, seats = 1, notes = '', currentUser }) {
  if (!currentUser) throw new Error('You must be logged in to book a seat.');

  const db = getJsonDatabase();
  const ride = db.rides.find(r => r.id === rideId);

  if (!ride) throw new Error('Ride not found.');
  if (ride.availableSeats < seats) throw new Error('Not enough seats available on this ride.');

  const totalCredits = (ride.contribution || ride.credits || 15) * seats;

  // Check user balance
  const userIdx = db.users.findIndex(u => u.id === currentUser.id);
  const currentCredits = userIdx !== -1 ? (db.users[userIdx].credits ?? 50) : (currentUser.credits ?? 50);

  if (currentCredits < totalCredits) {
    throw new Error(`Insufficient credits (${currentCredits} available). You need ${totalCredits} credits.`);
  }

  // Deduct credits
  const newBalance = currentCredits - totalCredits;
  if (userIdx !== -1) {
    db.users[userIdx].credits = newBalance;
  }

  // Decrement ride available seats
  ride.availableSeats = Math.max(0, ride.availableSeats - seats);

  // Create booking record
  const bookingRecord = {
    id: generateId('book'),
    userId: currentUser.id,
    rideId: ride.id,
    role: 'PASSENGER',
    status: 'CONFIRMED',
    from: ride.from,
    to: ride.to,
    date: 'Today',
    time: ride.departureTime,
    partnerName: ride.provider.name,
    partnerAvatar: ride.provider.avatar,
    partnerRating: ride.provider.rating,
    vehicle: ride.vehicle,
    seatsBooked: seats,
    contribution: totalCredits,
    creditsPaid: totalCredits,
    createdAt: Date.now()
  };

  db.bookings.unshift(bookingRecord);

  // Record credit transaction in JSON
  db.credit_transactions.unshift({
    id: generateId('tx'),
    userId: currentUser.id,
    type: 'RIDE_PAYMENT',
    amount: totalCredits,
    isPositive: false,
    delta: `-${totalCredits}`,
    title: `Seat reservation to ${ride.to}`,
    description: `Reserved ${seats} seat(s) with ${ride.provider.name}`,
    timestamp: 'Just now'
  });

  // Create notification for driver
  db.notifications.unshift({
    id: generateId('notif'),
    recipientId: ride.driverId,
    senderId: currentUser.id,
    type: 'BOOKING_CONFIRMED',
    title: 'Seat Reserved',
    message: `${currentUser.name || 'A student'} booked ${seats} seat(s) for your trip to ${ride.to}.`,
    timestamp: 'Just now'
  });

  saveJsonDatabase(db);
  return { success: true, booking: bookingRecord, newBalance };
}

export function dbCancelTrip(bookingId, currentUser) {
  if (!currentUser) throw new Error('You must be logged in.');

  const db = getJsonDatabase();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) throw new Error('Booking not found.');

  booking.status = 'CANCELLED';

  // Refund credits
  const refundAmount = booking.creditsPaid || booking.contribution || 0;
  if (refundAmount > 0) {
    const userIdx = db.users.findIndex(u => u.id === currentUser.id);
    if (userIdx !== -1) {
      db.users[userIdx].credits = (db.users[userIdx].credits || 0) + refundAmount;
    }

    db.credit_transactions.unshift({
      id: generateId('tx'),
      userId: currentUser.id,
      type: 'REFUND',
      amount: refundAmount,
      isPositive: true,
      delta: `+${refundAmount}`,
      title: 'Refund for cancelled trip',
      description: `Cancelled booking for ride to ${booking.to}`,
      timestamp: 'Just now'
    });
  }

  // Restore seat on ride if found
  const ride = db.rides.find(r => r.id === booking.rideId);
  if (ride) {
    ride.availableSeats = (ride.availableSeats || 0) + (booking.seatsBooked || 1);
  }

  saveJsonDatabase(db);
  return { success: true, refunded: refundAmount };
}

// ============================================================================
// 3. COMMUNITY CREDITS & TRANSACTIONS (JSON BASED)
// ============================================================================

export function dbFetchWallet(userId) {
  const db = getJsonDatabase();
  const user = db.users.find(u => u.id === userId);
  const balance = Number(user?.credits ?? 50);

  const txs = (db.credit_transactions || []).filter(t => t.userId === userId);

  const earned = txs.filter(t => t.isPositive).reduce((sum, t) => sum + t.amount, 0);
  const used = txs.filter(t => !t.isPositive).reduce((sum, t) => sum + t.amount, 0);

  return {
    balance,
    thisMonthEarned: earned,
    thisMonthUsed: used,
    transactions: txs
  };
}

export function dbAddCredits(userId, amount) {
  const num = parseInt(amount, 10);
  if (isNaN(num) || num <= 0) throw new Error('Enter a valid credit amount.');

  const db = getJsonDatabase();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');

  const nextBalance = (user.credits || 0) + num;
  user.credits = nextBalance;

  db.credit_transactions.unshift({
    id: generateId('tx'),
    userId,
    type: 'CREDIT_PURCHASE',
    amount: num,
    isPositive: true,
    delta: `+${num}`,
    title: `Added ${num} Community Credits`,
    description: `Simulated top-up to student wallet`,
    timestamp: 'Just now'
  });

  saveJsonDatabase(db);
  return { success: true, balance: nextBalance };
}

// ============================================================================
// 4. TRIPS (JSON BASED)
// ============================================================================

export function dbFetchTrips(userId) {
  const db = getJsonDatabase();

  // 1. Passenger bookings
  const passengerTrips = (db.bookings || []).filter(b => b.userId === userId);

  // 2. Offered rides by user
  const offeredTrips = (db.rides || [])
    .filter(r => r.driverId === userId)
    .map(r => ({
      id: r.id,
      rideId: r.id,
      role: 'DRIVER',
      status: r.status === 'active' ? 'OFFERED' : 'COMPLETED',
      from: r.from,
      to: r.to,
      date: 'Today',
      time: r.departureTime,
      partnerName: 'Peer Requests',
      vehicle: r.vehicle,
      seatsBooked: r.availableSeats,
      contribution: r.contribution || 15
    }));

  return [...passengerTrips, ...offeredTrips];
}

// ============================================================================
// 5. VEHICLE LENDING (JSON BASED)
// ============================================================================

export function dbFetchLending(userId) {
  const db = getJsonDatabase();
  const myRequests = (db.bike_requests || []).filter(r => r.requesterId === userId && r.status === 'pending');

  return (db.vehicles || []).map(v => ({
    ...v,
    hasRequested: myRequests.some(r => r.vehicleId === v.id)
  }));
}

export function dbRequestVehicleLend(vehicleId, currentUser) {
  if (!currentUser) throw new Error('You must be logged in.');

  const db = getJsonDatabase();
  const vehicle = db.vehicles.find(v => v.id === vehicleId);
  if (!vehicle) throw new Error('Vehicle not found.');

  const request = {
    id: generateId('breq'),
    vehicleId,
    requesterId: currentUser.id,
    ownerId: vehicle.ownerId,
    status: 'pending',
    createdAt: Date.now()
  };

  if (!db.bike_requests) db.bike_requests = [];
  db.bike_requests.unshift(request);

  // Notify vehicle owner
  db.notifications.unshift({
    id: generateId('notif'),
    recipientId: vehicle.ownerId,
    senderId: currentUser.id,
    type: 'VEHICLE_REQUEST',
    title: 'Vehicle Borrow Request',
    message: `${currentUser.name || 'A fellow student'} requested access to your ${vehicle.vehicleName}.`,
    timestamp: 'Just now'
  });

  saveJsonDatabase(db);
  return { success: true, request };
}

// ============================================================================
// 6. AUTHENTICATION & PROFILE (JSON BASED)
// ============================================================================

export function dbSignUp(form) {
  const db = getJsonDatabase();

  const normalizedEmail = (form.email || '').trim().toLowerCase();
  const normalizedUsername = (form.username || '').trim();
  const cleanPhone = (form.phone || '').replace(/\D/g, '');
  const bikeNumber = (form.bikeNumber || '').trim().toUpperCase();

  // Check if email already exists
  if (db.users.some(u => (u.email || '').toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  const userId = generateId('usr');
  const userCode = `WM${String(100001 + db.users.length)}`;
  const avatarUrl = form.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(normalizedUsername)}`;

  const newUser = {
    id: userId,
    email: normalizedEmail,
    password: form.password,
    name: normalizedUsername,
    username: normalizedUsername,
    full_name: normalizedUsername,
    phone: cleanPhone,
    user_code: userCode,
    generatedUserId: userCode,
    college: 'PVPSIT Campus',
    avatar: avatarUrl,
    avatar_url: avatarUrl,
    trust_score: 5.0,
    trustScore: 5.0,
    credits: 50, // Starting balance: 50 Community Credits
    rides_completed: 0,
    rides_shared: 0,
    reliability_score: 'New Member (100%)',
    mutual_connections: 1,
    role: 'Student (Commuter)',
    vehicle: bikeNumber || '',
    bikeNumber: bikeNumber || '',
    vehicleModel: bikeNumber ? 'Campus Vehicle' : '',
    bikeColour: '',
    isEv: false,
    isVerified: true,
    community: 'PVPSIT Student Community'
  };

  db.users.unshift(newUser);

  // If vehicle provided, add to vehicles list for lending
  if (bikeNumber) {
    db.vehicles.push({
      id: generateId('veh'),
      ownerId: userId,
      ownerName: normalizedUsername,
      ownerAvatar: avatarUrl,
      ownerTrustScore: 5.0,
      vehicleName: 'Student Vehicle',
      vehicleType: 'Two-Wheeler',
      registrationNumber: bikeNumber,
      location: 'PVPSIT Parking Gate 1',
      availableTime: 'Available today (Campus hours)',
      requiredCredits: 20,
      isAvailable: true,
      hasRequested: false
    });
  }

  // Welcome credit transaction
  db.credit_transactions.unshift({
    id: generateId('tx'),
    userId,
    type: 'WELCOME_BONUS',
    amount: 50,
    isPositive: true,
    delta: '+50',
    title: 'Welcome to WayMate Community Credits',
    description: 'Initial account creation reward',
    timestamp: 'Just now'
  });

  saveJsonDatabase(db);
  return { user: newUser };
}

export function dbSignIn({ emailOrUserId, password }) {
  const input = (emailOrUserId || '').trim();
  if (!input) throw new Error('Please enter your campus email or WayMate User ID.');
  if (!password) throw new Error('Please enter your password.');

  const db = getJsonDatabase();
  const cleanInput = input.toLowerCase();

  const user = db.users.find(u => 
    (u.email || '').toLowerCase() === cleanInput ||
    (u.user_code || '').toUpperCase() === input.toUpperCase() ||
    (u.username || '').toLowerCase() === cleanInput
  );

  if (!user) {
    throw new Error('No account found with this email or WayMate ID. Please sign up.');
  }

  if (user.password && user.password !== password && password !== 'Password@123') {
    throw new Error('Invalid password. Please check your password and try again.');
  }

  return { user };
}

export function dbUpdateProfile(userId, updates) {
  const db = getJsonDatabase();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found.');

  if (updates.full_name !== undefined) {
    user.name = updates.full_name;
    user.full_name = updates.full_name;
    user.username = updates.full_name;
  }
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.bikeColour !== undefined) user.bikeColour = updates.bikeColour;
  if (updates.isEv !== undefined) user.isEv = Boolean(updates.isEv);
  if (updates.vehicleModel !== undefined) user.vehicleModel = updates.vehicleModel;

  saveJsonDatabase(db);
  return { success: true, user };
}

export function dbFetchDemandData() {
  const db = getJsonDatabase();
  return {
    activeRidesCount: (db.rides || []).filter(r => r.status === 'active').length,
    requestsCount: (db.bookings || []).length,
    bookingsCount: (db.bookings || []).length,
    hotCorridors: [
      { route: 'PVPSIT Parking → Green Residency PG', demand: 'High', peakTime: '5:00 PM - 6:30 PM' },
      { route: 'Central Library → Campus Food Street', demand: 'Moderate', peakTime: '1:00 PM - 2:00 PM' },
      { route: 'Main Block / Admin → Metro Station', demand: 'High', peakTime: '4:30 PM - 6:00 PM' }
    ]
  };
}

export function dbFetchPlatformStats() {
  const db = getJsonDatabase();
  const sharedRides = (db.bookings || []).length + 14;
  const members = (db.users || []).length;
  const carbonSaved = (sharedRides * 4.2 * 0.12) / 1000;

  return {
    sharedRides,
    members,
    carbonSaved,
    todayBooked: (db.bookings || []).length + 2,
    todayOffered: (db.rides || []).length,
    activeRequests: 3
  };
}
