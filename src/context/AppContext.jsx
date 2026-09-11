import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiFetchRides,
  apiCreateRide,
  apiDeleteRide,
  apiBookSeat,
  apiCancelTrip,
  apiFetchWallet,
  apiAddCredits,
  apiFetchTrips,
  apiFetchLending,
  apiRequestVehicleLend,
  apiUpdateProfile,
  apiFetchDemandData,
  apiFetchPlatformStats,
  apiVerifyUser,
  apiFetchNotifications,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  apiDeleteNotification,
  getSimulatedOfflineMode,
  isNetworkAvailable,
  setSimulatedOfflineMode
} from '../services/api.js';
import {
  signUp as jsonSignUp,
  signIn as jsonSignIn,
  signOut as jsonSignOut,
  getCurrentProfile
} from '../services/auth.js';
import { getUserSession } from '../services/session.js';

const AppContext = createContext(null);

const STORAGE_TAB_KEY = 'waymate_active_tab';

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(STORAGE_TAB_KEY) || 'dashboard';
    }
    return 'dashboard';
  });

  const [entryMode, setEntryMode] = useState('loading');
  const [booting, setBooting] = useState(true);
  const [isOffline, setIsOffline] = useState(() => !isNetworkAvailable());
  const [toast, setToast] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // App dynamic data from JSON database
  const [rides, setRides] = useState([]);
  const [wallet, setWallet] = useState({ balance: 50, thisMonthEarned: 0, thisMonthUsed: 0, transactions: [] });
  const [bookings, setBookings] = useState([]);
  const [lending, setLending] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [demandData, setDemandData] = useState({ activeRidesCount: 0, requestsCount: 0, bookingsCount: 0, hotCorridors: [] });
  const [platformStats, setPlatformStats] = useState({ sharedRides: 14, members: 4, carbonSaved: 0.1, todayBooked: 2, todayOffered: 4, activeRequests: 2 });
  const [searchParams, setSearchParams] = useState({ from: 'PVPSIT Parking', to: 'Green Residency PG', time: '5:30 PM' });
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);

  // Persistent Tab navigation across reloads
  const setActiveTab = useCallback((tab) => {
    setActiveTabState(tab);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_TAB_KEY, tab);
    }
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(prev => prev?.message === message ? null : prev), 3500);
  }, []);

  // Fetch all JSON database data for authenticated user
  const fetchAllData = useCallback(async (currentUserId) => {
    try {
      const [fetchedRides, fetchedWallet, fetchedTrips, fetchedLending, fetchedNotifs, fetchedDemand, fetchedStats] = await Promise.all([
        apiFetchRides(),
        currentUserId ? apiFetchWallet(currentUserId) : Promise.resolve(null),
        currentUserId ? apiFetchTrips(currentUserId) : Promise.resolve([]),
        currentUserId ? apiFetchLending(currentUserId) : Promise.resolve([]),
        currentUserId ? apiFetchNotifications(currentUserId) : Promise.resolve([]),
        apiFetchDemandData(),
        apiFetchPlatformStats()
      ]);

      setRides(fetchedRides || []);
      if (fetchedWallet) setWallet(fetchedWallet);
      setBookings(fetchedTrips || []);
      setLending(fetchedLending || []);
      setNotifications(fetchedNotifs || []);
      if (fetchedDemand) setDemandData(fetchedDemand);
      if (fetchedStats) setPlatformStats(fetchedStats);
    } catch (err) {
      console.warn('Error fetching JSON data:', err);
    }
  }, []);

  const reloadData = useCallback(async () => {
    const currentId = user?.id || getUserSession()?.userId;
    if (currentId) {
      const refreshedProfile = await getCurrentProfile(currentId);
      if (refreshedProfile) setUser(refreshedProfile);
    }
    await fetchAllData(currentId);
  }, [user?.id, fetchAllData]);

  // Initial startup: Show loading screen briefly & restore persistent session
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const minLoadTimer = new Promise(resolve => setTimeout(resolve, 800));

      try {
        let activeUser = null;
        const session = getUserSession();

        if (session?.userId) {
          activeUser = await getCurrentProfile(session.userId);
        }

        await minLoadTimer;
        if (!mounted) return;

        if (activeUser) {
          setUser(activeUser);
          await fetchAllData(activeUser.id);
          setEntryMode('app');
          const savedTab = sessionStorage.getItem(STORAGE_TAB_KEY);
          if (savedTab) setActiveTabState(savedTab);
        } else {
          setEntryMode('landing');
        }
      } catch (err) {
        console.warn('Auth startup error:', err);
        await minLoadTimer;
        if (mounted) setEntryMode('landing');
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    };

    initAuth();

    // Listen to local JSON DB updates for live UI syncing
    const handleDbUpdate = () => {
      reloadData();
    };

    window.addEventListener('waymate_db_updated', handleDbUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('waymate_db_updated', handleDbUpdate);
    };
  }, [fetchAllData, reloadData]);

  // Mutations
  const runMutation = async (action, successMessage) => {
    setIsSubmitting(true);
    setGlobalError(null);
    try {
      const result = await action();
      await reloadData();
      if (successMessage) showToast(successMessage, 'success');
      return result;
    } catch (error) {
      if (error.name === 'OfflineError') {
        setGlobalError({
          message: 'The community network is unavailable. Check your connection and try again.',
          onRetry: () => runMutation(action, successMessage)
        });
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // SIGN UP
  const signUp = async (form) => {
    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const data = await jsonSignUp(form);

      if (data?.user) {
        setUser(data.user);
        await fetchAllData(data.user.id);
        setEntryMode('app');
        setActiveTab('dashboard');
      }

      showToast(
        `Welcome to WayMate, ${data.user?.name || 'Member'}! Your account has 50 starting credits.`,
        'success'
      );

      return data;
    } catch (error) {
      setGlobalError({
        message: error.message || 'Could not create the account.'
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // LOGIN
  const login = async (form) => {
    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const data = await jsonSignIn(form);

      if (data?.user) {
        setUser(data.user);
        await fetchAllData(data.user.id);
        setEntryMode('app');
        const savedTab = sessionStorage.getItem(STORAGE_TAB_KEY);
        if (savedTab) setActiveTabState(savedTab);
      }

      showToast(
        `Welcome back, ${data.user?.name || 'Member'}!`,
        'success'
      );

      return data;
    } catch (error) {
      setGlobalError({
        message: error.message || 'Could not sign you in.'
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await jsonSignOut();
      setUser(null);
      setEntryMode('landing');
      setActiveTab('dashboard');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(STORAGE_TAB_KEY);
      }
      showToast('You have been signed out.', 'info');
    } catch (error) {
      console.warn('Logout error:', error);
      setUser(null);
      setEntryMode('landing');
    }
  };

  // ADD COMMUNITY CREDITS (Top-up)
  const addCredits = async (amount) => {
    if (!user?.id) throw new Error('You must be logged in.');
    return runMutation(
      async () => {
        const res = await apiAddCredits(user.id, amount);
        setUser(prev => ({ ...prev, credits: res.balance }));
        setWallet(prev => ({ ...prev, balance: res.balance }));
        setIsAddCreditsModalOpen(false);
        return res;
      },
      `Successfully added ${amount} Community Credits to your wallet!`
    );
  };

  // BOOK RIDE SEAT
  const bookRideSeat = ({ rideId, seats = 1, notes = '' }) => runMutation(
    () => apiBookSeat({ rideId, seats, notes }, user),
    'Seat booked! Driver has been notified & community credits transferred.'
  );

  // OFFER RIDE
  const offerRide = rideData => runMutation(
    () => apiCreateRide(rideData, user),
    'Ride offered! Your campus route is now visible.'
  );

  // DELETE / REMOVE OFFERED RIDE
  const deleteRide = (rideId) => runMutation(
    () => apiDeleteRide(rideId, user),
    'Offered ride removed. Any booked passengers were refunded.'
  );

  // CANCEL TRIP (PASSENGER)
  const cancelTrip = bookingId => runMutation(
    () => apiCancelTrip(bookingId, user),
    'Trip cancelled. Credits refunded, seat restored & driver notified.'
  );

  // REQUEST VEHICLE LEND
  const requestLend = vehicleId => runMutation(
    () => apiRequestVehicleLend(vehicleId, user),
    'Vehicle borrow request sent to the owner.'
  );

  // NOTIFICATION ACTIONS
  const markNotificationRead = async (notificationId) => {
    await apiMarkNotificationRead(notificationId);
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    if (!user?.id) return;
    await apiMarkAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (notificationId) => {
    await apiDeleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // UPDATE PROFILE
  const updateProfile = data => runMutation(
    async () => {
      const res = await apiUpdateProfile(data, user);
      if (res?.user) {
        setUser(prev => ({ ...prev, ...res.user }));
      }
      return res;
    },
    'Profile details updated successfully.'
  );

  const verifyAccount = () => runMutation(
    () => apiVerifyUser(),
    'Community verification updated.'
  );

  const toggleOffline = () => {
    const next = !getSimulatedOfflineMode();
    setSimulatedOfflineMode(next);
    setIsOffline(!isNetworkAvailable());
    showToast(next ? 'Offline simulation enabled.' : 'Network restored.', next ? 'info' : 'success');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    user,
    rides,
    wallet,
    bookings,
    lending,
    notifications,
    unreadCount,
    isNotificationsOpen,
    setIsNotificationsOpen,
    demandData,
    events: demandData.hotCorridors || [],
    platformStats,
    activeTab,
    setActiveTab,
    searchParams,
    setSearchParams,
    entryMode,
    setEntryMode,
    booting,
    isOffline,
    toggleOffline,
    toast,
    showToast,
    globalError,
    clearGlobalError: () => setGlobalError(null),
    isSubmitting,
    isAddCreditsModalOpen,
    setIsAddCreditsModalOpen,
    addCredits,
    signUp,
    login,
    logout,
    verifyAccount,
    bookRideSeat,
    offerRide,
    deleteRide,
    cancelTrip,
    requestLend,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    updateProfile,
    reloadData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used within AppProvider');
  return value;
};

