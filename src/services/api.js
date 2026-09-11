import { supabase } from "../lib/supabaseClient.js";
import { getUserSession } from "./session.js";

// Helper to get active user ID from Supabase auth or session
export async function getActiveUserId() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {}
  const session = getUserSession();
  return session?.userId || null;
}

// Network connectivity helpers
export const isNetworkAvailable = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

export const setSimulatedOfflineMode = (offline) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('waymate_simulated_offline', offline ? 'true' : 'false');
    window.dispatchEvent(new Event('waymate_offline_change'));
  }
};

export const getSimulatedOfflineMode = () => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('waymate_simulated_offline') === 'true';
  }
  return false;
};

// ----------------------------------------------------------------------------
// 1. RIDES: FETCH & CREATE
// ----------------------------------------------------------------------------

/**
 * Fetch real ride offers from Supabase
 */
export async function apiFetchRides(filters = {}) {
  try {
    let query = supabase
      .from('ride_offers')
      .select(`
        id,
        driver_id,
        vehicle_id,
        from_location,
        to_location,
        departure_time,
        available_seats,
        credits_per_seat,
        notes,
        status,
        created_at,
        driver:profiles!driver_id (
          id,
          full_name,
          user_code,
          avatar_url,
          trust_score,
          rides_completed,
          reliability_score,
          college
        ),
        vehicle:vehicles!vehicle_id (
          id,
          vehicle_type,
          brand,
          model,
          registration_number
        )
      `)
      .order('departure_time', { ascending: true });

    if (filters.from && filters.from.trim()) {
      query = query.ilike('from_location', `%${filters.from.trim()}%`);
    }
    if (filters.to && filters.to.trim()) {
      query = query.ilike('to_location', `%${filters.to.trim()}%`);
    }

    const { data: offers, error } = await query;

    if (error) {
      console.warn('Error fetching ride offers from Supabase:', error.message);
      return [];
    }

    // Format for UI consumption
    return (offers || []).map(offer => {
      const driver = offer.driver || {};
      const vehicle = offer.vehicle || {};
      const depDate = new Date(offer.departure_time);
      const timeString = isNaN(depDate.getTime()) ? 'Flexible' : depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: offer.id,
        driverId: offer.driver_id,
        from: offer.from_location,
        to: offer.to_location,
        departureTime: timeString,
        departureTimestamp: depDate.getTime() || Date.now(),
        availableSeats: offer.available_seats,
        seatsTotal: Math.max(offer.available_seats, 1),
        contribution: offer.credits_per_seat, // Community Credits per seat
        credits: offer.credits_per_seat,
        notes: offer.notes || '',
        status: offer.status || 'active',
        distanceKm: 4.2,
        durationMinutes: 15,
        matchConfidence: 95,
        vehicle: vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : (vehicle.registration_number || 'Registered Two-Wheeler'),
        provider: {
          id: driver.id || offer.driver_id,
          name: driver.full_name || 'Campus Peer',
          avatar: driver.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(driver.full_name || 'Driver')}`,
          college: driver.college || 'PVPSIT Campus',
          userCode: driver.user_code || 'WM100001',
          isVerified: true,
          rating: Number(driver.trust_score || 4.9),
          ridesCompleted: driver.rides_completed || 12,
          reliabilityScore: driver.reliability_score || '99%'
        }
      };
    });
  } catch (err) {
    console.warn('apiFetchRides exception:', err);
    return [];
  }
}

/**
 * Offer a new ride in Supabase
 */
export async function apiCreateRide(rideData) {
  const userId = await getActiveUserId();
  if (!userId) throw new Error('You must be logged in to offer a ride.');

  // Find user's vehicle if available
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('owner_id', userId)
    .limit(1);

  const vehicleId = vehicles?.[0]?.id || null;

  // Compute departure timestamp
  let depTimestamp = new Date();
  if (rideData.departureTime) {
    if (rideData.departureTime.includes(':')) {
      const [hours, mins] = rideData.departureTime.split(':');
      depTimestamp.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
      if (depTimestamp.getTime() < Date.now()) {
        depTimestamp.setDate(depTimestamp.getDate() + 1);
      }
    } else {
      const parsed = new Date(rideData.departureTime);
      if (!isNaN(parsed.getTime())) depTimestamp = parsed;
    }
  }

  const payload = {
    driver_id: userId,
    vehicle_id: vehicleId,
    from_location: rideData.from.trim(),
    to_location: rideData.to.trim(),
    departure_time: depTimestamp.toISOString(),
    available_seats: parseInt(rideData.availableSeats || 1, 10),
    credits_per_seat: parseInt(rideData.contribution || rideData.credits || 15, 10),
    notes: (rideData.note || rideData.notes || '').trim(),
    status: 'active'
  };

  const { data, error } = await supabase
    .from('ride_offers')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Could not offer ride in Supabase.');
  }

  return { success: true, ride: data };
}

// ----------------------------------------------------------------------------
// 2. BOOKINGS & REQUESTS
// ----------------------------------------------------------------------------

/**
 * Request / Book a seat on a ride
 */
export async function apiBookSeat({ rideId, seats = 1, notes = '' }) {
  const userId = await getActiveUserId();
  if (!userId) throw new Error('You must be logged in to book a seat.');

  // 1. Fetch ride offer
  const { data: offer, error: offerError } = await supabase
    .from('ride_offers')
    .select('*, driver:profiles!driver_id(*)')
    .eq('id', rideId)
    .single();

  if (offerError || !offer) throw new Error('Ride offer not found.');

  if (offer.available_seats < seats) {
    throw new Error('Not enough seats available on this ride.');
  }

  const totalCredits = (offer.credits_per_seat || 15) * seats;

  // 2. Check user's current credits in Supabase
  const { data: userProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('credits, full_name')
    .eq('id', userId)
    .single();

  if (profileErr || !userProfile) throw new Error('User profile not found in Supabase.');

  if ((userProfile.credits || 0) < totalCredits) {
    throw new Error(`Insufficient credits (${userProfile.credits || 0} available). You need ${totalCredits} credits.`);
  }

  // 3. Deduct credits from requester in Supabase
  const newBalance = userProfile.credits - totalCredits;
  await supabase
    .from('profiles')
    .update({ credits: newBalance })
    .eq('id', userId);

  // 4. Create ride_request record
  const { data: requestRecord } = await supabase
    .from('ride_requests')
    .insert({
      ride_offer_id: offer.id,
      requester_id: userId,
      driver_id: offer.driver_id,
      seats_requested: seats,
      message: notes || 'Booked through WayMate campus mobility',
      status: 'accepted'
    })
    .select()
    .single();

  // 5. Create booking record
  const { data: bookingRecord, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      user_id: userId,
      ride_offer_id: offer.id,
      vehicle_id: offer.vehicle_id,
      ride_request_id: requestRecord?.id || null,
      start_time: offer.departure_time,
      credits_paid: totalCredits,
      status: 'upcoming'
    })
    .select()
    .single();

  if (bookingErr) throw bookingErr;

  // 6. Update available seats on the offer
  await supabase
    .from('ride_offers')
    .update({ available_seats: Math.max(0, offer.available_seats - seats) })
    .eq('id', offer.id);

  // 7. Record credit transaction
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: -totalCredits,
      transaction_type: 'RIDE_PAYMENT',
      description: `Reserved seat on ride to ${offer.to_location}`,
      ride_request_id: requestRecord?.id || null
    });

  // 8. Create notification for driver
  await supabase
    .from('notifications')
    .insert({
      recipient_id: offer.driver_id,
      sender_id: userId,
      type: 'BOOKING_CONFIRMED',
      title: 'New Passenger Confirmed',
      message: `${userProfile.full_name || 'A student'} booked ${seats} seat(s) for your trip to ${offer.to_location}.`
    }).catch(() => null);

  return { success: true, booking: bookingRecord, newBalance };
}

/**
 * Cancel a trip booking and refund credits
 */
export async function apiCancelTrip(bookingId) {
  const userId = await getActiveUserId();
  if (!userId) throw new Error('You must be logged in.');

  // Fetch booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, ride_offer:ride_offers(*)')
    .eq('id', bookingId)
    .single();

  if (error || !booking) throw new Error('Booking not found.');

  // Refund credits
  const refundAmount = booking.credits_paid || 0;
  if (refundAmount > 0) {
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    if (profile) {
      await supabase.from('profiles').update({ credits: (profile.credits || 0) + refundAmount }).eq('id', userId);
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: refundAmount,
        transaction_type: 'REFUND',
        description: `Refund for cancelled trip booking`
      });
    }
  }

  // Restore seat on ride offer
  if (booking.ride_offer_id && booking.ride_offer) {
    await supabase
      .from('ride_offers')
      .update({ available_seats: (booking.ride_offer.available_seats || 0) + 1 })
      .eq('id', booking.ride_offer_id);
  }

  // Update booking status
  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  return { success: true, refunded: refundAmount };
}

// ----------------------------------------------------------------------------
// 3. COMMUNITY CREDITS & TRANSACTIONS
// ----------------------------------------------------------------------------

/**
 * Fetch wallet balance and credit transactions for a user
 */
export async function apiFetchWallet(userId) {
  try {
    // 1. Current balance from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    const balance = Number(profile?.credits ?? 50);

    // 2. Transaction history from credit_transactions
    const { data: txs } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const transactions = (txs || []).map(tx => {
      const isPositive = tx.amount > 0;
      const createdDate = new Date(tx.created_at);
      return {
        id: tx.id,
        type: tx.transaction_type,
        amount: Math.abs(tx.amount),
        isPositive,
        delta: isPositive ? `+${tx.amount}` : `${tx.amount}`,
        title: tx.description,
        description: tx.description,
        timestamp: isNaN(createdDate.getTime()) ? 'Recent' : createdDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
    });

    const earned = transactions.filter(t => t.isPositive).reduce((sum, t) => sum + t.amount, 0);
    const used = transactions.filter(t => !t.isPositive).reduce((sum, t) => sum + t.amount, 0);

    return {
      balance,
      thisMonthEarned: earned,
      thisMonthUsed: used,
      transactions
    };
  } catch (err) {
    console.warn('apiFetchWallet exception:', err);
    return { balance: 50, thisMonthEarned: 0, thisMonthUsed: 0, transactions: [] };
  }
}

/**
 * Add Community Credits (Simulated Top-up)
 */
export async function apiAddCredits(userId, amount) {
  const numAmount = parseInt(amount, 10);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Please enter a valid credit amount greater than 0.');
  }

  // 1. Fetch current balance
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (error || !profile) throw new Error('User profile not found in Supabase.');

  const nextBalance = (profile.credits || 0) + numAmount;

  // 2. Update Supabase balance
  await supabase
    .from('profiles')
    .update({ credits: nextBalance })
    .eq('id', userId);

  // 3. Record credit transaction
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: numAmount,
      transaction_type: 'CREDIT_PURCHASE',
      description: `Added ${numAmount} Community Credits`
    });

  return { success: true, balance: nextBalance };
}

// ----------------------------------------------------------------------------
// 4. TRIPS: USER'S BOOKINGS & OFFERED RIDES
// ----------------------------------------------------------------------------

/**
 * Fetch all upcoming, completed, and offered trips for user
 */
export async function apiFetchTrips(userId) {
  try {
    // 1. Bookings where user is passenger
    const { data: passengerBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        ride_offer_id,
        vehicle_id,
        start_time,
        end_time,
        credits_paid,
        status,
        created_at,
        ride_offer:ride_offers!ride_offer_id (
          id,
          from_location,
          to_location,
          credits_per_seat,
          departure_time,
          driver:profiles!driver_id (
            id,
            full_name,
            avatar_url,
            trust_score,
            user_code
          ),
          vehicle:vehicles!vehicle_id (
            brand,
            model,
            registration_number
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 2. Rides offered by user
    const { data: offeredRides } = await supabase
      .from('ride_offers')
      .select(`
        id,
        driver_id,
        from_location,
        to_location,
        departure_time,
        available_seats,
        credits_per_seat,
        status,
        created_at,
        vehicle:vehicles!vehicle_id (
          brand,
          model,
          registration_number
        ),
        ride_requests (
          id,
          requester_id,
          seats_requested,
          status,
          requester:profiles!requester_id (
            id,
            full_name,
            avatar_url,
            trust_score,
            user_code
          )
        )
      `)
      .eq('driver_id', userId)
      .order('created_at', { ascending: false });

    const formattedBookings = (passengerBookings || []).map(b => {
      const offer = b.ride_offer || {};
      const driver = offer.driver || {};
      const vehicle = offer.vehicle || {};
      const depDate = new Date(b.start_time || offer.departure_time);
      const timeStr = isNaN(depDate.getTime()) ? '5:30 PM' : depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = isNaN(depDate.getTime()) ? 'Today' : depDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      return {
        id: b.id,
        rideId: offer.id || b.ride_offer_id,
        role: 'PASSENGER',
        status: b.status === 'upcoming' ? 'CONFIRMED' : (b.status === 'cancelled' ? 'CANCELLED' : 'COMPLETED'),
        from: offer.from_location || 'PVPSIT Campus',
        to: offer.to_location || 'Green Residency PG',
        date: dateStr,
        time: timeStr,
        partnerName: driver.full_name || 'Campus Driver',
        partnerAvatar: driver.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(driver.full_name || 'D')}`,
        partnerRating: Number(driver.trust_score || 4.9),
        vehicle: vehicle.brand ? `${vehicle.brand} ${vehicle.model || ''}` : (vehicle.registration_number || 'Motorcycle'),
        seatsBooked: 1,
        contribution: b.credits_paid || offer.credits_per_seat || 15
      };
    });

    const formattedOffers = (offeredRides || []).map(o => {
      const vehicle = o.vehicle || {};
      const depDate = new Date(o.departure_time);
      const timeStr = isNaN(depDate.getTime()) ? 'Flexible' : depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = isNaN(depDate.getTime()) ? 'Today' : depDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      return {
        id: o.id,
        rideId: o.id,
        role: 'DRIVER',
        status: o.status === 'active' ? 'OFFERED' : 'COMPLETED',
        from: o.from_location,
        to: o.to_location,
        date: dateStr,
        time: timeStr,
        partnerName: 'Peer Requests',
        vehicle: vehicle.brand ? `${vehicle.brand} ${vehicle.model || ''}` : 'My Vehicle',
        seatsBooked: o.available_seats,
        contribution: o.credits_per_seat || 15,
        requestsCount: o.ride_requests?.length || 0
      };
    });

    return [...formattedBookings, ...formattedOffers];
  } catch (err) {
    console.warn('apiFetchTrips error:', err);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 5. VEHICLE LENDING
// ----------------------------------------------------------------------------

/**
 * Fetch all vehicles available for lending and active lend requests
 */
export async function apiFetchLending(userId) {
  try {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select(`
        id,
        owner_id,
        vehicle_type,
        brand,
        model,
        registration_number,
        seats,
        is_available,
        owner:profiles!owner_id (
          id,
          full_name,
          avatar_url,
          trust_score,
          college
        )
      `)
      .eq('is_available', true);

    const { data: myRequests } = await supabase
      .from('bike_requests')
      .select('*')
      .eq('requester_id', userId);

    return (vehicles || []).map(v => {
      const owner = v.owner || {};
      const hasRequested = (myRequests || []).some(r => r.vehicle_id === v.id && r.status === 'pending');

      return {
        id: v.id,
        ownerId: v.owner_id,
        ownerName: owner.full_name || 'Vehicle Owner',
        ownerAvatar: owner.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(owner.full_name || 'Owner')}`,
        ownerTrustScore: Number(owner.trust_score || 4.9),
        vehicleName: v.brand && v.model ? `${v.brand} ${v.model}` : (v.registration_number || 'Campus Bike'),
        vehicleType: v.vehicle_type || 'Two-Wheeler',
        registrationNumber: v.registration_number,
        location: owner.college || 'PVPSIT Parking Gate 1',
        availableTime: 'Available today (Campus hours)',
        requiredCredits: 20,
        hasRequested
      };
    });
  } catch (err) {
    console.warn('apiFetchLending error:', err);
    return [];
  }
}

/**
 * Request access to lend a vehicle
 */
export async function apiRequestVehicleLend(vehicleId) {
  const userId = await getActiveUserId();
  if (!userId) throw new Error('You must be logged in.');

  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .select('owner_id, registration_number')
    .eq('id', vehicleId)
    .single();

  if (vErr || !vehicle) throw new Error('Vehicle not found.');

  const startTime = new Date();
  const endTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

  const { data, error } = await supabase
    .from('bike_requests')
    .insert({
      vehicle_id: vehicleId,
      requester_id: userId,
      owner_id: vehicle.owner_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      message: 'Request to borrow vehicle for campus errands.',
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Notification for owner
  await supabase
    .from('notifications')
    .insert({
      recipient_id: vehicle.owner_id,
      sender_id: userId,
      type: 'VEHICLE_REQUEST',
      title: 'Vehicle Borrow Request',
      message: `A fellow student requested access to your vehicle (${vehicle.registration_number || 'Two-Wheeler'}).`
    }).catch(() => null);

  return { success: true, request: data };
}

// ----------------------------------------------------------------------------
// 6. PROFILE & ACCOUNT UPDATE
// ----------------------------------------------------------------------------

/**
 * Update user profile and vehicle details in Supabase
 */
export async function apiUpdateProfile(updateData) {
  const userId = await getActiveUserId();
  if (!userId) throw new Error('You must be logged in.');

  const {
    full_name,
    phone,
    bikeColour,
    isEv,
    vehicleModel
  } = updateData;

  const profileUpdates = {
    updated_at: new Date().toISOString()
  };

  if (full_name !== undefined) profileUpdates.full_name = full_name.trim();
  if (phone !== undefined) profileUpdates.phone = phone.trim();
  if (bikeColour !== undefined) profileUpdates.bike_colour = bikeColour.trim();
  if (isEv !== undefined) profileUpdates.is_ev = Boolean(isEv);
  if (vehicleModel !== undefined) profileUpdates.vehicle_model = vehicleModel.trim();

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // If vehicle model was updated, update vehicles table
  if (vehicleModel) {
    const { data: existingVehicles } = await supabase.from('vehicles').select('id').eq('owner_id', userId).limit(1);
    if (existingVehicles?.[0]) {
      await supabase.from('vehicles').update({ model: vehicleModel }).eq('id', existingVehicles[0].id);
    }
  }

  return { success: true, user: updatedProfile };
}

export async function apiVerifyUser() {
  return { success: true, verified: true };
}

// ----------------------------------------------------------------------------
// 7. DEMAND DATA & PLATFORM STATS
// ----------------------------------------------------------------------------

export async function apiFetchDemandData() {
  try {
    const [offersRes, requestsRes, bookingsRes] = await Promise.all([
      supabase.from('ride_offers').select('id, from_location, to_location, departure_time, available_seats, status'),
      supabase.from('ride_requests').select('id, status, created_at'),
      supabase.from('bookings').select('id, status, created_at')
    ]);

    const activeRidesCount = (offersRes.data || []).filter(r => r.status === 'active').length;
    const requestsCount = (requestsRes.data || []).length;
    const bookingsCount = (bookingsRes.data || []).length;

    return {
      activeRidesCount,
      requestsCount,
      bookingsCount,
      hotCorridors: [
        { route: 'PVPSIT Parking → Green Residency PG', demand: 'High', peakTime: '5:00 PM - 6:30 PM' },
        { route: 'Central Library → Campus Food Street', demand: 'Moderate', peakTime: '1:00 PM - 2:00 PM' },
        { route: 'Main Block / Admin → Metro Station', demand: 'High', peakTime: '4:30 PM - 6:00 PM' }
      ]
    };
  } catch (err) {
    console.warn('apiFetchDemandData error:', err);
    return { activeRidesCount: 4, requestsCount: 6, bookingsCount: 12, hotCorridors: [] };
  }
}

export async function apiFetchPlatformStats() {
  try {
    const [profilesCountRes, bookingsCountRes, ridesCountRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('ride_offers').select('*', { count: 'exact', head: true })
    ]);

    const members = profilesCountRes.count || 4;
    const sharedRides = bookingsCountRes.count || 8;
    const totalOffered = ridesCountRes.count || 5;
    const carbonSaved = (sharedRides * 4.2 * 0.12) / 1000;

    return {
      sharedRides,
      members,
      carbonSaved,
      todayBooked: sharedRides,
      todayOffered: totalOffered,
      activeRequests: 3
    };
  } catch {
    return {
      sharedRides: 18,
      members: 4,
      carbonSaved: 0.1,
      todayBooked: 2,
      todayOffered: 4,
      activeRequests: 2
    };
  }
}

export async function apiCreateEvent(eventData) {
  return { success: true, event: eventData };
}

export const loadDatabase = () => ({});
export const resetDatabase = () => ({});
export const saveDatabase = () => ({});
export const clearSession = () => {};
