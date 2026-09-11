import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import {
  apiFetchRides,
  apiCreateRide,
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
  getSimulatedOfflineMode,
  isNetworkAvailable,
  setSimulatedOfflineMode
} from '../services/api.js';
import {
  signUp as supabaseSignUp,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
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

  // App dynamic data from Supabase
  const [rides, setRides] = useState([]);
  const [wallet, setWallet] = useState({ balance: 50, thisMonthEarned: 0, thisMonthUsed: 0, transactions: [] });
  const [bookings, setBookings] = useState([]);
  const [lending, setLending] = useState([]);
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

  // Fetch all Supabase backend data for authenticated user
  const fetchAllData = useCallback(async (currentUserId) => {
    try {
      const [fetchedRides, fetchedWallet, fetchedTrips, fetchedLending, fetchedDemand, fetchedStats] = await Promise.all([
        apiFetchRides(),
        currentUserId ? apiFetchWallet(currentUserId) : Promise.resolve(null),
        currentUserId ? apiFetchTrips(currentUserId) : Promise.resolve([]),
        currentUserId ? apiFetchLending(currentUserId) : Promise.resolve([]),
        apiFetchDemandData(),
        apiFetchPlatformStats()
      ]);

      setRides(fetchedRides || []);
      if (fetchedWallet) setWallet(fetchedWallet);
      setBookings(fetchedTrips || []);
      setLending(fetchedLending || []);
      if (fetchedDemand) setDemandData(fetchedDemand);
      if (fetchedStats) setPlatformStats(fetchedStats);
    } catch (err) {
      console.warn('Error fetching Supabase data:', err);
    }
  }, []);

  const reloadData = useCallback(async () => {
    if (user?.id) {
      const refreshedProfile = await getCurrentProfile(user.id);
      if (refreshedProfile) setUser(refreshedProfile);
    }
    await fetchAllData(user?.id);
  }, [user?.id, fetchAllData]);

  // Initial startup: Show loading screen briefly & check Supabase/Cookie session
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Ensure smooth loading screen presence
      const minLoadTimer = new Promise(resolve => setTimeout(resolve, 800));

      try {
        let activeUser = null;

        // 1. Check Supabase Auth session
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            activeUser = await getCurrentProfile(session.user.id);
          }
        } catch {}

        // 2. Check Cookie / Browser session fallback
        if (!activeUser) {
          const cookieSession = getUserSession();
          if (cookieSession?.userId) {
            activeUser = await getCurrentProfile(cookieSession.userId);
            if (!activeUser) {
              activeUser = {
                id: cookieSession.userId,
                name: cookieSession.name,
                username: cookieSession.name,
                email: cookieSession.email,
                credits: 50,
                user_code: cookieSession.userCode || 'WM100001',
                generatedUserId: cookieSession.userCode || 'WM100001',
                avatar: cookieSession.avatar,
                trust_score: 5.0,
                college: 'PVPSIT Campus'
              };
            }
          }
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

    // Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getCurrentProfile(session.user.id);
        if (profile) {
          setUser(profile);
          await fetchAllData(profile.id);
          setEntryMode('app');
        }
      } else if (event === 'SIGNED_OUT') {
        const localSession = getUserSession();
        if (!localSession) {
          setUser(null);
          setEntryMode('landing');
          setActiveTab('dashboard');
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchAllData, setActiveTab]);

  // Realtime subscription for Notifications & Bookings
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        payload => {
          if (payload.new?.message) {
            showToast(`${payload.new.title}: ${payload.new.message}`, 'info');
          }
          reloadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` },
        () => {
          reloadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, showToast, reloadData]);

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
      const data = await supabaseSignUp(form);

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
      const data = await supabaseSignIn(form);

      if (data?.user) {
        setUser(data.user);
        await fetchAllData(data.user.id);
        setEntryMode('app');
        // Restore saved tab if available
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
      await supabaseSignOut();
      setUser(null);
      setEntryMode('landing');
      setActiveTab('dashboard');
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(STORAGE_TAB_KEY);
      }
      showToast('You have been signed out from Supabase.', 'info');
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
    () => apiBookSeat({ rideId, seats, notes }),
    'Seat booked! Community credits transferred to escrow.'
  );

  // OFFER RIDE
  const offerRide = rideData => runMutation(
    () => apiCreateRide(rideData),
    'Ride offered! Your campus route is now visible.'
  );

  // CANCEL TRIP
  const cancelTrip = bookingId => runMutation(
    () => apiCancelTrip(bookingId),
    'Trip cancelled. Credits refunded and seat restored.'
  );

  // REQUEST VEHICLE LEND
  const requestLend = vehicleId => runMutation(
    () => apiRequestVehicleLend(vehicleId),
    'Vehicle borrow request sent to the owner in Supabase.'
  );

  // UPDATE PROFILE
  const updateProfile = data => runMutation(
    async () => {
      const res = await apiUpdateProfile(data);
      if (res?.user) {
        setUser(prev => ({ ...prev, ...res.user }));
      }
      return res;
    },
    'Profile details updated in Supabase.'
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

  const value = {
    user,
    rides,
    wallet,
    bookings,
    lending,
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
    cancelTrip,
    requestLend,
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
