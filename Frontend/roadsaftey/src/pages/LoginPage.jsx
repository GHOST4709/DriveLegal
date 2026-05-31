/**
 * src/pages/LoginPage.jsx
 * ──────────────────────────────────────────────────────────
 * Split-screen auth page matching the dashboard's design system.
 * Left panel  → Branding + feature highlights
 * Right panel → Login / Sign-up form with smooth tab switch
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Eye, EyeOff, Mail, Lock, User,
  AlertCircle, CheckCircle2, Navigation,
  ShieldCheck, BarChart3, Bot, Globe,
} from "lucide-react";

/* ── Design tokens (mirrors Dashboard) ───────────────────── */
const T = {
  bgRoot:   "#0c0a1d",
  bgCard:   "#141130",
  bgInput:  "rgba(255,255,255,0.045)",
  purple:   "#7c3aed",
  accent:   "#8b5cf6",
  iconBg:   "rgba(124,58,237,0.18)",
  coralA:   "#ff5f70",
  coralB:   "#ff8557",
  txt1:     "#e8e3ff",
  txt2:     "#5f5c7a",
  txt3:     "#9591b0",
  border:   "rgba(255,255,255,0.07)",
  borderFocus: "#8b5cf6",
  error:    "#ff4560",
  success:  "#34d399",
};

/* ── Feature list shown on the left panel ────────────────── */
const FEATURES = [
  { Icon: ShieldCheck, color: "#8b5cf6", bg: "rgba(124,58,237,0.18)",
    label: "Live Enforcement Zones",
    desc:  "Real-time map of high-fine and speed-camera locations." },
  { Icon: BarChart3,   color: "#22d3ee", bg: "rgba(34,211,238,0.14)",
    label: "Violation Analytics",
    desc:  "Track fine trends and violation patterns over time." },
  { Icon: Bot,         color: "#34d399", bg: "rgba(52,211,153,0.14)",
    label: "AI Law Advisor",
    desc:  "Ask traffic questions in natural language via GPT-4o." },
  { Icon: Globe,       color: "#fbbf24", bg: "rgba(251,191,36,0.14)",
    label: "BIMSTEC Coverage",
    desc:  "Laws and fines for Bangladesh & Thailand in one place." },
];

/* ════════════════════════════════════════════════════════════
   Reusable controlled input with icon + focus border
════════════════════════════════════════════════════════════ */
function Field({ Icon: Ico, type = "text", placeholder, value, onChange, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: T.bgInput,
      border: `1px solid ${focused ? T.borderFocus : T.border}`,
      borderRadius: 12, padding: "12px 14px",
      transition: "border-color 0.2s",
    }}>
      {Ico && <Ico size={15} color={focused ? T.accent : T.txt2} style={{ flexShrink: 0 }} />}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          flex: 1, border: "none", background: "transparent",
          color: T.txt1, fontSize: 14, outline: "none", fontFamily: "inherit",
        }}
      />
      {right}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Main Login Page
════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  /* ── State ── */
  const [tab,      setTab]      = useState("login");       // "login" | "signup"
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const { login, register } = useAuth();
  const navigate = useNavigate();

  /* ── Tab switch — reset fields & messages ── */
  function switchTab(t) {
    setTab(t); setError(""); setSuccess("");
    setFullName(""); setEmail(""); setPassword("");
  }

  /* ── Validation ── */
  function validate() {
    if (tab === "signup" && fullName.trim().length < 2)
      return "Full name must be at least 2 characters.";
    if (!email.includes("@"))
      return "Please enter a valid email address.";
    if (password.length < 6)
      return "Password must be at least 6 characters.";
    return null;
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(fullName, email, password);
      }
      setSuccess("Success! Taking you to the dashboard…");
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ══════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{
      display: "flex", minHeight: "100vh", width: "100%",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      background: T.bgRoot, color: T.txt1,
    }}>

      {/* ══ LEFT PANEL — Branding ══════════════════════════════ */}
      <div style={{
        width: "42%", minHeight: "100vh", position: "relative",
        background: "linear-gradient(155deg, #1e1b4b 0%, #120f2e 50%, #0a0817 100%)",
        display: "flex", flexDirection: "column",
        padding: "48px 44px", overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}>

        {/* Decorative glow orbs */}
        <div style={{
          position: "absolute", top: "-80px", left: "-60px",
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)",
          filter: "blur(40px)", animation: "rsa-orb1 9s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-80px",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)",
          filter: "blur(50px)", animation: "rsa-orb2 12s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "35%", left: "15%",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)",
          filter: "blur(35px)", animation: "rsa-orb3 7s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Subtle dot grid */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px", pointerEvents: "none",
        }} />

        {/* ── Logo + Brand ── */}
        <div style={{ position: "relative", zIndex: 1, marginBottom: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: "linear-gradient(145deg,#8b5cf6,#6d28d9,#4c1d95)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 24px rgba(109,40,217,0.55)",
            }}>
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
                <path d="M11 2.5L18.5 6.75V15.25L11 19.5L3.5 15.25V6.75L11 2.5Z"
                  stroke="rgba(255,255,255,0.45)" strokeWidth="1" fill="rgba(255,255,255,0.12)"/>
                <circle cx="11" cy="11" r="2.6" fill="white"/>
                <path d="M11 4.8V8M11 14V17.2M5.2 11H8.4M13.6 11H16.8"
                  stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.txt1, letterSpacing: "-0.02em" }}>
                Road Safety AI
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: T.txt2, marginTop: 1 }}>
                BIMSTEC Traffic Intelligence
              </div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 12 }}>
            <h1 style={{
              fontSize: 34, fontWeight: 800, color: T.txt1,
              lineHeight: 1.18, letterSpacing: "-0.03em", margin: 0,
            }}>
              Navigate Smarter.
              <br />
              <span style={{ color: T.accent }}>Stay Safer.</span>
            </h1>
          </div>
          <p style={{
            fontSize: 14, color: T.txt3, lineHeight: 1.65,
            maxWidth: 320, marginBottom: 40,
          }}>
            AI-powered traffic law enforcement and violation analytics
            across Bangladesh and Thailand.
          </p>

          {/* Feature cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FEATURES.map(({ Icon, color, bg, label, desc }) => (
              <div key={label} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: "14px 16px",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={16} color={color} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt1, marginBottom: 3 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: T.txt2, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom stats ── */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", gap: 24, marginTop: 40,
          paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)",
        }}>
          {[
            { val: "2",    label: "Nations"    },
            { val: "20+",  label: "Laws"       },
            { val: "GPT",  label: "AI Powered" },
          ].map(({ val, label }) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.accent, letterSpacing: "-0.02em" }}>
                {val}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: T.txt2, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ RIGHT PANEL — Form ═════════════════════════════════ */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", background: T.bgRoot, position: "relative",
      }}>

        {/* Subtle top-right glow */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        {/* ── Form card ── */}
        <div style={{
          width: "100%", maxWidth: 420, position: "relative", zIndex: 1,
          background: T.bgCard,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22, padding: "36px 32px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}>

          {/* Tab switcher */}
          <div style={{
            display: "flex", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: 4, marginBottom: 28, gap: 4,
          }}>
            {[["login","Log In"],["signup","Sign Up"]].map(([id, label]) => (
              <button key={id} onClick={() => switchTab(id)} style={{
                flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                background: tab === id
                  ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                  : "transparent",
                color: tab === id ? "#fff" : T.txt2,
                boxShadow: tab === id ? "0 2px 12px rgba(109,40,217,0.4)" : "none",
                transition: "all 0.2s",
              }}>{label}</button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontSize: 22, fontWeight: 800, color: T.txt1,
              letterSpacing: "-0.02em", margin: 0, marginBottom: 6,
            }}>
              {tab === "login" ? "Welcome back 👋" : "Create your account"}
            </h2>
            <p style={{ fontSize: 13, color: T.txt2, margin: 0, lineHeight: 1.5 }}>
              {tab === "login"
                ? "Enter your credentials to access the dashboard."
                : "Sign up to start monitoring traffic laws across BIMSTEC."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Full name — sign-up only */}
              {tab === "signup" && (
                <div>
                  <label style={{
                    display: "block", fontSize: 12, fontWeight: 600,
                    color: T.txt3, marginBottom: 6, letterSpacing: "0.02em",
                  }}>
                    FULL NAME
                  </label>
                  <Field
                    Icon={User}
                    placeholder="John Doe"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label style={{
                  display: "block", fontSize: 12, fontWeight: 600,
                  color: T.txt3, marginBottom: 6, letterSpacing: "0.02em",
                }}>
                  EMAIL ADDRESS
                </label>
                <Field
                  Icon={Mail}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.txt3, letterSpacing: "0.02em" }}>
                    PASSWORD
                  </label>
                  {tab === "login" && (
                    <span style={{ fontSize: 12, color: T.accent, cursor: "pointer", fontWeight: 500 }}>
                      Forgot password?
                    </span>
                  )}
                </div>
                <Field
                  Icon={Lock}
                  type={showPwd ? "text" : "password"}
                  placeholder={tab === "signup" ? "Min. 6 characters" : "••••••••"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  right={
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      style={{ background: "none", border: "none", cursor: "pointer",
                        color: T.txt2, display: "flex", padding: 0 }}>
                      {showPwd
                        ? <EyeOff size={15} />
                        : <Eye    size={15} />}
                    </button>
                  }
                />
                {tab === "signup" && (
                  <p style={{ fontSize: 11, color: T.txt2, marginTop: 5, marginBottom: 0 }}>
                    Must be at least 6 characters.
                  </p>
                )}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,69,96,0.10)",
                border: "1px solid rgba(255,69,96,0.25)",
                borderRadius: 10, padding: "10px 14px", marginTop: 16,
                animation: "rsa-shake 0.35s ease",
              }}>
                <AlertCircle size={14} color={T.error} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: T.error, fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(52,211,153,0.10)",
                border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: 10, padding: "10px 14px", marginTop: 16,
              }}>
                <CheckCircle2 size={14} color={T.success} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: T.success, fontWeight: 500 }}>{success}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", marginTop: 20, padding: "13px 0",
                borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading
                  ? "rgba(124,58,237,0.4)"
                  : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "#fff", fontSize: 14, fontWeight: 800,
                letterSpacing: "0.01em", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 4px 20px rgba(109,40,217,0.45)",
                transition: "box-shadow 0.2s, background 0.2s",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "rsa-spin 0.7s linear infinite",
                  }} />
                  {tab === "login" ? "Logging in…" : "Creating account…"}
                </>
              ) : (
                tab === "login" ? "Log In to Dashboard" : "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px",
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 12, color: T.txt2, fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Switch tab link */}
          <p style={{ textAlign: "center", fontSize: 13, color: T.txt2, margin: 0 }}>
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => switchTab(tab === "login" ? "signup" : "login")}
              style={{ color: T.accent, fontWeight: 700, cursor: "pointer" }}
            >
              {tab === "login" ? "Sign Up" : "Log In"}
            </span>
          </p>
        </div>
      </div>

      {/* ── Keyframe animations (injected once) ── */}
      <style>{`
        @keyframes rsa-orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(25px,-20px) scale(1.08); }
        }
        @keyframes rsa-orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-18px,22px) scale(0.93); }
        }
        @keyframes rsa-orb3 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(12px,-14px); }
        }
        @keyframes rsa-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes rsa-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
