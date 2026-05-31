/**
 * src/api.js
 * ──────────────────────────────────────────────────────────
 * All HTTP calls to the FastAPI backend.
 *
 * Base URL is read from the Vite env variable VITE_API_URL.
 * Create a  .env  file in your project root with:
 *   VITE_API_URL=http://localhost:8000
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* ── Shared fetch helper ──────────────────────────────────── */
async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  return data;   // caller handles error shape (data.detail)
}

/* ══════════════════════════════════════════════════════════
   Auth API
══════════════════════════════════════════════════════════ */
export const authAPI = {
  /**
   * POST /api/auth/register
   * Returns { access_token, token_type, user }
   */
  register: (fullName, email, password) =>
    req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name: fullName, email, password }),
    }),

  /**
   * POST /api/auth/login
   * Returns { access_token, token_type, user }
   */
  login: (email, password) =>
    req("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /**
   * GET /api/auth/me
   * Returns the current user profile.
   */
  me: (token) =>
    req("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

/* ══════════════════════════════════════════════════════════
   Traffic Laws API  (your existing endpoints)
══════════════════════════════════════════════════════════ */
export const lawsAPI = {
  /**
   * GET /api/laws/:country/:city
   * Returns an array of TrafficLaw records.
   */
  byLocation: (country, city) =>
    req(`/api/laws/${encodeURIComponent(country)}/${encodeURIComponent(city)}`),

  /**
   * GET /api/calculate?city=&violation_name=&vehicle_type=
   * Returns a single TrafficLaw with fine_amount and currency.
   */
  calculate: (city, violationName, vehicleType) => {
    const params = new URLSearchParams({
      city,
      violation_name: violationName,
      vehicle_type:   vehicleType,
    });
    return req(`/api/calculate?${params}`);
  },

  /**
   * POST /api/chat
   * Body: { message: string }
   * Returns { reply, extracted_data }
   */
  chat: (message, token) =>
    req("/api/chat", {
      method:  "POST",
      body:    JSON.stringify({ message }),
      headers: { Authorization: `Bearer ${token}` },
    }),
};
