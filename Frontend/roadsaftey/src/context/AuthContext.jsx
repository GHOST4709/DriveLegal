/**
 * src/context/AuthContext.jsx
 * ──────────────────────────────────────────────────────────
 * Global auth state.  Wrap your app with <AuthProvider>.
 * Consume anywhere with:  const { user, login, logout } = useAuth()
 */
import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

const TOKEN_KEY = "rsa_access_token";   // localStorage key

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);  // true while verifying saved token

  /* ── On mount: verify any saved token with /api/auth/me ── */
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    authAPI.me(token)
      .then(data => {
        if (data?.id) {
          setUser(data);
        } else {
          // Token invalid / expired — clear it
          _clear();
        }
      })
      .catch(_clear)
      .finally(() => setLoading(false));
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helpers ── */
  function _save(tok, userData) {
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    setUser(userData);
  }

  function _clear() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  /* ── Public API ── */
  async function login(email, password) {
    const data = await authAPI.login(email, password);
    if (data?.detail) throw new Error(data.detail);   // FastAPI error shape
    _save(data.access_token, data.user);
    return data;
  }

  async function register(fullName, email, password) {
    const data = await authAPI.register(fullName, email, password);
    if (data?.detail) throw new Error(data.detail);
    _save(data.access_token, data.user);
    return data;
  }

  function logout() {
    _clear();
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
