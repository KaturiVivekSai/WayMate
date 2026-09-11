import { dbSignUp, dbSignIn, getJsonDatabase } from './jsonDataStore.js';
import { createSession, clearUserSession, getUserSession } from './session.js';

// ============================================================================
// WAYMATE AUTHENTICATION SERVICE (JSON POWERED + PERSISTENT SESSIONS)
// ============================================================================

export async function hashPassword(password) {
  return password || '';
}

/**
 * SIGN UP using JSON Data Store
 * - Registration Number REMOVED
 * - Bike/Vehicle Number is OPTIONAL
 * - Default starting balance: 50 Community Credits
 */
export async function signUp(form) {
  const result = dbSignUp(form);
  const user = result.user;

  // Establish persistent session and cookies
  createSession(user, { rememberMe: true });

  return {
    user,
    session: { access_token: `wm_tok_${user.id}` }
  };
}

/**
 * SIGN IN using Email OR WayMate User ID (WM...)
 * Strictly validates credentials against JSON user store.
 */
export async function signIn({ emailOrUserId, password }) {
  const result = dbSignIn({ emailOrUserId, password });
  const user = result.user;

  // Establish persistent session and cookies
  createSession(user, { rememberMe: true });

  return {
    user,
    session: { access_token: `wm_tok_${user.id}` }
  };
}

/**
 * SIGN OUT: Clears all browser cookies and session storage
 */
export async function signOut() {
  clearUserSession();
  return { success: true };
}

/**
 * GET CURRENT AUTHENTICATED USER
 */
export async function getCurrentUser() {
  const session = getUserSession();
  return session ? { id: session.userId, email: session.email } : null;
}

/**
 * GET CURRENT USER PROFILE FROM JSON STORE
 */
export async function getCurrentProfile(userId = null) {
  const session = getUserSession();
  const targetId = userId || session?.userId;
  if (!targetId) return null;

  const db = getJsonDatabase();
  const user = db.users.find(u => u.id === targetId || u.user_code === targetId);
  if (!user) return null;

  return {
    ...user,
    name: user.name || user.full_name || user.username || 'Member',
    username: user.username || user.full_name || 'Member',
    generatedUserId: user.user_code || user.generatedUserId || 'WM100001',
    avatar: user.avatar || user.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || 'U')}`,
    credits: Number(user.credits ?? 50),
    trustScore: Number(user.trust_score ?? user.trustScore ?? 5.0),
    vehicle: user.vehicle || user.bikeNumber || '',
    bikeNumber: user.bikeNumber || user.vehicle || '',
    vehicleModel: user.vehicleModel || '',
    isEv: Boolean(user.isEv),
    bikeColour: user.bikeColour || '',
    isVerified: Boolean((user.trust_score || 5.0) >= 4.0),
    community: user.college || 'PVPSIT Student Community'
  };
}