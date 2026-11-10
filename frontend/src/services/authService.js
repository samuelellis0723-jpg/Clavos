import { apiRequest } from './apiClient.js';

/**
 * Auth Service for opaque Bearer sessions:
 * - POST /api/auth/login
 * - GET /api/auth/me
 * - POST /api/auth/logout (returns 204 No Content -> null)
 */

export async function loginWithCredentials({ email, password }, options = {}) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuthRedirect: true,
    ...options,
  });
}

export async function fetchCurrentActor(token, options = {}) {
  return apiRequest('/auth/me', {
    method: 'GET',
    token,
    ...options,
  });
}

export async function logoutSession(token, options = {}) {
  return apiRequest('/auth/logout', {
    method: 'POST',
    token,
    skipAuthRedirect: true,
    ...options,
  });
}
