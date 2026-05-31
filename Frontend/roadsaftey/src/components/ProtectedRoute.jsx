/**
 * src/components/ProtectedRoute.jsx
 * ──────────────────────────────────────────────────────────
 * Wraps any route that requires authentication.
 * Shows a full-screen spinner while the saved token is being
 * verified on first load, then either renders the children
 * or redirects to /login.
 */
import { Navigate } from "react-router-dom";
import { useAuth }  from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  /* Still verifying the saved token — show a dark spinner */
  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0c0a1d",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid rgba(124,58,237,0.18)",
          borderTopColor: "#8b5cf6",
          animation: "rsa-spin 0.75s linear infinite",
        }} />
        <span style={{ color: "#5f5c7a", fontSize: 13, fontWeight: 500 }}>
          Authenticating…
        </span>
        <style>{`@keyframes rsa-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* No token → redirect to login, preserving the intended URL */
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
