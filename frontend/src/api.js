const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const ACCESS_TOKEN_KEY = 'campusConnectAccessToken';
const EMAIL_KEY = 'campusConnectEmail';

export function apiUrl(path) {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function responseJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || body.msg || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function api(path, options = {}) {
  const { auth = false, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  if (auth) {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      const error = new Error('Sign in with your Supabase account to continue.');
      error.status = 401;
      throw error;
    }
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(apiUrl(path), { ...fetchOptions, headers });
  if (response.status === 401 && auth) {
    clearSession();
  }
  return responseJson(response);
}

export async function supabaseAuth(action, email, password) {
  const config = await api('/api/config');
  const route = action === 'signup' ? 'signup' : 'token?grant_type=password';
  const response = await fetch(`${config.supabase_url.replace(/\/+$/, '')}/auth/v1/${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabase_key,
    },
    body: JSON.stringify({ email, password }),
  });
  return responseJson(response);
}

export function readSession() {
  return {
    accessToken: sessionStorage.getItem(ACCESS_TOKEN_KEY) || '',
    email: sessionStorage.getItem(EMAIL_KEY) || '',
  };
}

export function saveSession(session, email) {
  if (!session.access_token) throw new Error('Supabase did not return an access token. Confirm your email, then sign in.');
  sessionStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
  window.dispatchEvent(new Event('eventhub-auth-changed'));
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
  window.dispatchEvent(new Event('eventhub-auth-changed'));
}

export function formatDate(value) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function eventId(event) {
  return event?.id ?? event?.event_id ?? '';
}

export function eventTitle(event) {
  return event?.title || event?.name || event?.event_name || 'Campus event';
}

export function eventDate(event) {
  return event?.timestamp || event?.start_date || event?.starts_at || event?.start_time || event?.event_date || event?.date;
}

export function eventLocation(event) {
  return event?.location || event?.venue || event?.address || 'Location to be announced';
}
