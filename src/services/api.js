import {
  dbFetchRides,
  dbCreateRide,
  dbDeleteRide,
  dbBookSeat,
  dbCancelTrip,
  dbFetchWallet,
  dbAddCredits,
  dbFetchTrips,
  dbFetchLending,
  dbRequestVehicleLend,
  dbUpdateProfile,
  dbFetchDemandData,
  dbFetchPlatformStats,
  dbFetchNotifications,
  dbMarkNotificationRead,
  dbMarkAllNotificationsRead,
  dbDeleteNotification,
  getJsonDatabase,
  saveJsonDatabase
} from './jsonDataStore.js';
import { getUserSession } from './session.js';

// Connectivity helpers
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

// ============================================================================
// WAYMATE API SERVICE (POWERED BY PERSISTENT JSON STORE)
// ============================================================================

export async function apiFetchRides(filters = {}) {
  return dbFetchRides(filters);
}

export async function apiCreateRide(rideData, currentUser) {
  const sessionUser = currentUser || getUserSession();
  if (!sessionUser) throw new Error('You must be logged in to offer a ride.');
  return dbCreateRide(rideData, sessionUser);
}

export async function apiDeleteRide(rideId, currentUser) {
  const sessionUser = currentUser || getUserSession();
  if (!sessionUser) throw new Error('You must be logged in to remove a ride.');
  return dbDeleteRide(rideId, sessionUser);
}

export async function apiBookSeat({ rideId, seats = 1, notes = '' }, currentUser) {
  const sessionUser = currentUser || getUserSession();
  if (!sessionUser) throw new Error('You must be logged in to book a seat.');
  return dbBookSeat({ rideId, seats, notes, currentUser: sessionUser });
}

export async function apiCancelTrip(bookingId, currentUser) {
  const sessionUser = currentUser || getUserSession();
  return dbCancelTrip(bookingId, sessionUser);
}

export async function apiFetchWallet(userId) {
  return dbFetchWallet(userId);
}

export async function apiAddCredits(userId, amount) {
  return dbAddCredits(userId, amount);
}

export async function apiFetchTrips(userId) {
  return dbFetchTrips(userId);
}

export async function apiFetchLending(userId) {
  return dbFetchLending(userId);
}

export async function apiRequestVehicleLend(vehicleId, currentUser) {
  const sessionUser = currentUser || getUserSession();
  return dbRequestVehicleLend(vehicleId, sessionUser);
}

export async function apiUpdateProfile(updateData, currentUser) {
  const sessionUser = currentUser || getUserSession();
  if (!sessionUser?.userId && !sessionUser?.id) throw new Error('You must be logged in.');
  const targetId = sessionUser.id || sessionUser.userId;
  return dbUpdateProfile(targetId, updateData);
}

export async function apiVerifyUser() {
  return { success: true, verified: true };
}

export async function apiFetchDemandData() {
  return dbFetchDemandData();
}

export async function apiFetchPlatformStats() {
  return dbFetchPlatformStats();
}

export async function apiFetchNotifications(userId) {
  return dbFetchNotifications(userId);
}

export async function apiMarkNotificationRead(notificationId) {
  return dbMarkNotificationRead(notificationId);
}

export async function apiMarkAllNotificationsRead(userId) {
  return dbMarkAllNotificationsRead(userId);
}

export async function apiDeleteNotification(notificationId) {
  return dbDeleteNotification(notificationId);
}

export const loadDatabase = () => getJsonDatabase();
export const resetDatabase = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('waymate_json_database_v2');
  }
  return getJsonDatabase();
};
export const saveDatabase = (db) => saveJsonDatabase(db);
export const clearSession = () => {};

