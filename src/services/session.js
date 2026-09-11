// ============================================================================
// WAYMATE SESSION & COOKIE MANAGEMENT SERVICE
// ============================================================================
// Provides standard browser Cookie persistence (document.cookie) with fallback
// and synchronization to LocalStorage / SessionStorage.

export const COOKIE_SESSION_TOKEN = 'waymate_session_token';
export const COOKIE_SESSION_DATA = 'waymate_session_data';
export const COOKIE_USER_ID = 'waymate_user_id';
export const STORAGE_SESSION_KEY = 'waymate_session_v1';
export const STORAGE_ACCESS_TOKEN = 'waymate_access_token';

// Default session duration: 30 days for "remember me", 1 day for standard
export const PERSISTENT_SESSION_DAYS = 30;
export const STANDARD_SESSION_DAYS = 1;

/**
 * Set a browser cookie with standard attributes
 * @param {string} name 
 * @param {string} value 
 * @param {object} options { days, path, sameSite, secure }
 */
export function setCookie(name, value, options = {}) {
  if (typeof document === 'undefined') return;

  const {
    days = STANDARD_SESSION_DAYS,
    path = '/',
    sameSite = 'Lax',
    secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;

  if (days) {
    const expiresDate = new Date();
    expiresDate.setTime(expiresDate.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${expiresDate.toUTCString()}; max-age=${days * 24 * 60 * 60}`;
  }

  if (secure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

/**
 * Read a cookie by name
 * @param {string} name 
 * @returns {string|null}
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const encodedName = encodeURIComponent(name) + '=';

  for (const cookie of cookies) {
    if (cookie.startsWith(encodedName)) {
      try {
        return decodeURIComponent(cookie.substring(encodedName.length));
      } catch {
        return cookie.substring(encodedName.length);
      }
    }
  }

  return null;
}

/**
 * Delete a cookie by setting its expiration to the past
 * @param {string} name 
 * @param {string} path 
 */
export function deleteCookie(name, path = '/') {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
}

/**
 * Generate a unique session token
 * @param {string} userId 
 * @returns {string}
 */
export function generateSessionToken(userId = 'anon') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const idPrefix = String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `wm_tok_${idPrefix}_${timestamp}_${random}`;
}

/**
 * Create and persist a full user session across Cookies and LocalStorage
 * @param {object} user - User profile object
 * @param {object} options - { rememberMe, token, supabaseSession }
 * @returns {object} Session data payload
 */
export function createSession(user, options = {}) {
  if (!user || !user.id) {
    throw new Error('Valid user data is required to create a session');
  }

  const {
    rememberMe = true,
    token = generateSessionToken(user.id),
    supabaseSession = null
  } = options;

  const days = rememberMe ? PERSISTENT_SESSION_DAYS : STANDARD_SESSION_DAYS;
  const createdAt = Date.now();
  const expiresAt = createdAt + days * 24 * 60 * 60 * 1000;

  const sessionData = {
    token,
    userId: user.id,
    userCode: user.generatedUserId || user.user_code || 'WM-MEMBER',
    name: user.name || user.full_name || user.username,
    email: user.email,
    role: user.role || 'Student Member',
    avatar: user.avatar || user.avatar_url || '',
    rememberMe: Boolean(rememberMe),
    createdAt,
    expiresAt,
    hasSupabaseSession: Boolean(supabaseSession)
  };

  const serializedData = JSON.stringify(sessionData);

  // 1. Write to Browser Cookies
  setCookie(COOKIE_SESSION_TOKEN, token, { days });
  setCookie(COOKIE_SESSION_DATA, serializedData, { days });
  setCookie(COOKIE_USER_ID, user.id, { days });

  // 2. Synchronize to LocalStorage / SessionStorage
  try {
    localStorage.setItem(STORAGE_SESSION_KEY, serializedData);
    localStorage.setItem(STORAGE_ACCESS_TOKEN, token);
    if (supabaseSession?.access_token) {
      localStorage.setItem('waymate_access_token', supabaseSession.access_token);
    }
  } catch (err) {
    console.warn('Could not write session to localStorage:', err);
  }

  return sessionData;
}

/**
 * Retrieve the current active session from Cookies or LocalStorage
 * Validates expiration timestamp and returns null if expired.
 * @returns {object|null}
 */
export function getUserSession() {
  let session = null;

  // 1. Try reading from cookie first
  const cookieData = getCookie(COOKIE_SESSION_DATA);
  if (cookieData) {
    try {
      session = JSON.parse(cookieData);
    } catch {
      session = null;
    }
  }

  // 2. Fallback to localStorage if cookie was missing or blocked
  if (!session && typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_SESSION_KEY);
      if (stored) {
        session = JSON.parse(stored);
      }
    } catch {
      session = null;
    }
  }

  if (!session) return null;

  // 3. Verify expiration
  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearUserSession();
    return null;
  }

  return session;
}

/**
 * Clear all authentication session cookies and stored tokens
 */
export function clearUserSession() {
  // Delete Cookies
  deleteCookie(COOKIE_SESSION_TOKEN);
  deleteCookie(COOKIE_SESSION_DATA);
  deleteCookie(COOKIE_USER_ID);

  // Clear Local Storage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      localStorage.removeItem(STORAGE_ACCESS_TOKEN);
      localStorage.removeItem('waymate_access_token');
    } catch (err) {
      console.warn('Could not clear session storage:', err);
    }
  }
}

/**
 * Check whether a valid non-expired session currently exists
 * @returns {boolean}
 */
export function isSessionActive() {
  const session = getUserSession();
  return Boolean(session && session.userId);
}

/**
 * Touch / extend the active session timestamp
 * @param {number} additionalDays
 */
export function touchSession(additionalDays = STANDARD_SESSION_DAYS) {
  const current = getUserSession();
  if (!current) return null;

  const days = current.rememberMe ? PERSISTENT_SESSION_DAYS : additionalDays;
  current.expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;

  const serialized = JSON.stringify(current);
  setCookie(COOKIE_SESSION_DATA, serialized, { days });
  setCookie(COOKIE_SESSION_TOKEN, current.token, { days });
  setCookie(COOKIE_USER_ID, current.userId, { days });

  try {
    localStorage.setItem(STORAGE_SESSION_KEY, serialized);
  } catch {}

  return current;
}
