/**
 * src/components/Dashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * Road Safety AI — Main Dashboard
 * Compatible with: React 18 + Vite + Tailwind + Leaflet
 * ─────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  Home, Clock, MapPin, Settings, LogOut,
  Search, AlertTriangle, Navigation,
  Gauge, GlassWater, HardHat, Smartphone, Bot,
  BookOpen, Lightbulb, Camera, FileText,
} from "lucide-react";

// ── Leaflet (installed via npm, no CDN needed) ──────────────
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ═══════════════════════════════════════════════════════════
   Design Tokens
═══════════════════════════════════════════════════════════ */
const T = {
  bgRoot:   "#0c0a1d",  bgSide:    "#080617",  bgCard:   "#141130",
  bgItem:   "#1b1836",  bgItemHov: "#211e40",
  purple:   "#7c3aed",  accent:    "#8b5cf6",   soft:     "#a78bfa",
  iconBg:   "rgba(124,58,237,0.18)",
  coralA:   "#ff5f70",  coralB:    "#ff8557",
  txt1:     "#e8e3ff",  txt2:      "#5f5c7a",
  border:   "rgba(255,255,255,0.06)",
  borderMd: "rgba(255,255,255,0.12)",
};

/* ═══════════════════════════════════════════════════════════
   Chart Data
═══════════════════════════════════════════════════════════ */
const violationsData = [
  { day:"Tue", hi:28, lo:8  }, { day:"Wed", hi:46, lo:21 },
  { day:"Thu", hi:37, lo:25 }, { day:"Fri", hi:71, lo:46 },
  { day:"Sat", hi:55, lo:30 }, { day:"Sun", hi:50, lo:24 },
];
const finesData = [
  { day:"Tue", hi:57, lo:42 }, { day:"Wed", hi:52, lo:40 },
  { day:"Thu", hi:66, lo:50 }, { day:"Fri", hi:83, lo:63 },
  { day:"Sat", hi:76, lo:59 }, { day:"Sun", hi:72, lo:57 },
];

/* ═══════════════════════════════════════════════════════════
   Static Panel Data
═══════════════════════════════════════════════════════════ */
const REGS = [
  { Icon: Gauge,       label: "Speed Limit",   fine: "Fine up to $490"   },
  { Icon: GlassWater,  label: "Drunk Driving", fine: "Fine up to $1,000" },
  { Icon: HardHat,     label: "No Helmet",     fine: "Fine up to $250"   },
  { Icon: Smartphone,  label: "Phone Use",     fine: "Fine up to $162"   },
];
const RULES = [
  { id:1, text:"Always wear a seatbelt — mandatory for driver and all passengers."       },
  { id:2, text:"Never exceed posted speed limits; fines scale with excess speed."        },
  { id:3, text:"Mobile phone use strictly prohibited while the vehicle is in motion."    },
  { id:4, text:"Helmets are mandatory for all two-wheeler riders and pillion riders."    },
  { id:5, text:"Zero tolerance for driving under the influence of alcohol or drugs."     },
  { id:6, text:"Yield to pedestrians at all designated zebra crossings."                 },
  { id:7, text:"Maintain a safe following distance from the vehicle ahead at all times." },
  { id:8, text:"Headlights must be on from sunset to sunrise and during poor visibility."},
];
const SUGGESTIONS = [
  { Icon: Navigation,    title: "Use Public Transport During Peak Hours",
    desc: "Switching to transit reduces your exposure to high-fine enforcement zones.",
    accent: "#8b5cf6", bg: "rgba(124,58,237,0.16)" },
  { Icon: Camera,        title: "Install a Dashcam",
    desc: "Dashcam footage is crucial evidence in disputes and speeds up insurance claims.",
    accent: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  { Icon: MapPin,        title: "Plan Routes Around High-Fine Zones",
    desc: "Use the live enforcement map to identify red zones before departure.",
    accent: "#f87171", bg: "rgba(248,113,113,0.12)" },
  { Icon: FileText,      title: "Keep Documents and Contacts Updated",
    desc: "Carry current registration, insurance, and licence at all times.",
    accent: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { Icon: AlertTriangle, title: "Report Reckless Driving Immediately",
    desc: "Use the Report Violation button to flag dangerous behaviour to authorities.",
    accent: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
];

/* ═══════════════════════════════════════════════════════════
   Live Map — City Config (Bangkok & Dhaka)
═══════════════════════════════════════════════════════════ */
const MAP_CITIES = {
  Bangkok: {
    center: [13.7563, 100.5018], zoom: 13,
    fineZones: [
      { ll:[13.7250,100.5290], r:450, name:"Silom Road"       },
      { ll:[13.7363,100.5609], r:380, name:"Asok Intersection" },
      { ll:[13.7650,100.5378], r:320, name:"Victory Monument"  },
    ],
    cameras: [
      [13.7453,100.5347],[13.7363,100.5609],[13.7287,100.5360],
      [13.7258,100.5210],[13.7698,100.5150],[13.7466,100.5393],
    ],
  },
  Dhaka: {
    center: [23.8103, 90.4125], zoom: 13,
    fineZones: [
      { ll:[23.7388,90.3950], r:420, name:"Shahbagh"      },
      { ll:[23.7809,90.4147], r:360, name:"Gulshan Circle" },
      { ll:[23.7540,90.3909], r:300, name:"Farmgate"      },
    ],
    cameras: [
      [23.7579,90.4176],[23.7815,90.4102],[23.7669,90.4073],
      [23.7936,90.4031],[23.7540,90.3909],[23.8103,90.4125],
    ],
  },
};

/* ═══════════════════════════════════════════════════════════
   LiveMap Component
   Uses npm leaflet — no CDN / dynamic script loading needed
═══════════════════════════════════════════════════════════ */
function LiveMap() {
  const elRef    = useRef(null);
  const mapRef   = useRef(null);
  const zonesRef = useRef(null);
  const camsRef  = useRef(null);
  const [city,  setCity]  = useState("Bangkok");
  const [ready, setReady] = useState(false);

  /* ── Boot: initialise Leaflet once on mount ── */
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;

    const map = L.map(elRef.current, {
      center: MAP_CITIES.Bangkok.center,
      zoom:   MAP_CITIES.Bangkok.zoom,
      zoomControl:       false,
      attributionControl: true,
    });

    // CartoCDN dark tiles — free, no API key required
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution:"© OSM contributors © CARTO", subdomains:"abcd", maxZoom:19 }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    zonesRef.current = L.layerGroup().addTo(map);
    camsRef.current  = L.layerGroup().addTo(map);
    mapRef.current   = map;

    drawLayers("Bangkok");
    setReady(true);

    // Let Vite finish layout before Leaflet measures the container
    setTimeout(() => map.invalidateSize(), 150);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  /* ── Fly to new city + redraw markers ── */
  useEffect(() => {
    if (!mapRef.current) return;
    const cfg = MAP_CITIES[city];
    mapRef.current.flyTo(cfg.center, cfg.zoom, { duration:1.4, easeLinearity:0.3 });
    drawLayers(city);
  }, [city]);

  /* ── Draw fine-zone circles + speed-camera dots ── */
  function drawLayers(key) {
    if (!zonesRef.current || !camsRef.current) return;
    zonesRef.current.clearLayers();
    camsRef.current.clearLayers();

    const cfg = MAP_CITIES[key];

    // Red dashed circles for high-fine areas
    cfg.fineZones.forEach(({ ll, r, name }) => {
      L.circle(ll, {
        color:"#ff4560", fillColor:"#ff4560",
        fillOpacity:0.13, weight:2, dashArray:"6 5", radius:r,
      })
      .bindPopup(
        `<span style="color:#ff4560;font-weight:700;font-size:13px">● High Fine Area</span>`+
        `<br/><span style="font-size:11px;color:#9591b0">${name}</span>`
      )
      .addTo(zonesRef.current);
    });

    // Purple glowing dots for speed cameras
    const camIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:13px;height:13px;border-radius:50%;background:#8b5cf6;
        box-shadow:0 0 10px 4px rgba(139,92,246,0.65);
        border:2px solid rgba(255,255,255,0.35)">
      </div>`,
      iconSize: [13,13], iconAnchor: [6,6],
    });

    cfg.cameras.forEach(ll => {
      L.marker(ll, { icon: camIcon })
        .bindPopup(`<span style="color:#8b5cf6;font-weight:700;font-size:13px">● Speed Camera</span>`)
        .addTo(camsRef.current);
    });
  }

  /* ── Render ── */
  return (
    <div style={{ position:"relative", width:"100%", height:"100%" }}>

      {/* Leaflet mount point */}
      <div ref={elRef} style={{ width:"100%", height:"100%" }} />

      {/* Loading spinner */}
      {!ready && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:T.bgCard, borderRadius:14, gap:12, zIndex:9999,
        }}>
          <div className="lf-spinner" />
          <span style={{ color:T.txt2, fontSize:13, fontWeight:600 }}>
            Loading live map…
          </span>
        </div>
      )}

      {/* City switcher — top right */}
      {ready && (
        <div style={{
          position:"absolute", top:14, right:14, zIndex:1000,
          display:"flex", gap:4,
          background:"rgba(8,6,23,0.86)", backdropFilter:"blur(14px)",
          border:`1px solid ${T.borderMd}`, borderRadius:20, padding:3,
        }}>
          {Object.keys(MAP_CITIES).map(c => (
            <button key={c} onClick={() => setCity(c)} style={{
              padding:"4px 14px", borderRadius:16, border:"none", cursor:"pointer",
              fontSize:11, fontWeight:700, fontFamily:"inherit",
              background: city === c ? T.purple : "transparent",
              color:       city === c ? "#fff"   : T.txt2,
              transition: "background 0.18s, color 0.18s",
            }}>{c}</button>
          ))}
        </div>
      )}

      {/* Downtown badge — top left */}
      <div style={{
        position:"absolute", top:14, left:14, zIndex:1000,
        display:"flex", alignItems:"center", gap:7, pointerEvents:"none",
        background:"rgba(8,6,23,0.86)", backdropFilter:"blur(14px)",
        border:`1px solid ${T.borderMd}`, borderRadius:20,
        padding:"6px 14px", color:T.txt1, fontSize:12, fontWeight:700, userSelect:"none",
      }}>
        <Navigation size={13} color={T.accent} />
        Downtown Enforcement Zone
      </div>

      {/* Legend pills — bottom left */}
      <div style={{
        position:"absolute", bottom:14, left:14, zIndex:1000,
        display:"flex", gap:8, pointerEvents:"none",
      }}>
        {[
          { color:"#ff4560", shadow:"rgba(255,69,96,0.65)",  label:"High Fine Area" },
          { color:T.accent,  shadow:"rgba(139,92,246,0.65)", label:"Speed Camera"   },
        ].map(({ color, shadow, label }) => (
          <div key={label} style={{
            display:"flex", alignItems:"center", gap:7,
            background:"rgba(8,6,23,0.86)", backdropFilter:"blur(14px)",
            border:`1px solid ${T.borderMd}`, borderRadius:20,
            padding:"5px 12px", color:T.txt1, fontSize:11, fontWeight:600, userSelect:"none",
          }}>
            <div style={{
              width:8, height:8, borderRadius:"50%",
              background:color, boxShadow:`0 0 7px 2px ${shadow}`,
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Period Tabs
═══════════════════════════════════════════════════════════ */
function PeriodTabs({ active, onChange }) {
  return (
    <div style={{ display:"flex", gap:3, background:"rgba(255,255,255,0.04)",
      border:`1px solid ${T.border}`, borderRadius:9, padding:3 }}>
      {["1D","1W","1M"].map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding:"4px 11px", borderRadius:7, border:"none", cursor:"pointer",
          fontSize:11, fontWeight:700, fontFamily:"inherit",
          background: active === t ? T.purple : "transparent",
          color:       active === t ? "#fff"   : T.txt2,
          transition: "background 0.18s, color 0.18s",
        }}>{t}</button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Chart Card
═══════════════════════════════════════════════════════════ */
function ChartCard({ title, data }) {
  const [period, setPeriod] = useState("1D");
  return (
    <div style={{ flex:1, background:T.bgCard, borderRadius:16,
      border:`1px solid ${T.border}`, padding:"18px 20px 14px",
      display:"flex", flexDirection:"column", minWidth:0 }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:16 }}>
        <span style={{ color:T.txt1, fontSize:15, fontWeight:800, letterSpacing:"-0.01em" }}>
          {title}
        </span>
        <PeriodTabs active={period} onChange={setPeriod} />
      </div>
      <div style={{ flex:1, minHeight:0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top:4, right:6, bottom:0, left:-28 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.045)" strokeDasharray="" vertical={false} />
            <XAxis dataKey="day" tick={{ fill:T.txt2, fontSize:11, fontFamily:"inherit" }}
              axisLine={false} tickLine={false} />
            <Line type="monotone" dataKey="hi" stroke={T.accent} strokeWidth={2.5} dot={false}
              activeDot={{ r:4, fill:T.accent, strokeWidth:0 }} />
            <Line type="monotone" dataKey="lo" stroke="rgba(139,92,246,0.38)" strokeWidth={2}
              dot={false} activeDot={{ r:3, fill:T.soft, strokeWidth:0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Rules & Regulations Card
═══════════════════════════════════════════════════════════ */
function RulesCard() {
  return (
    <div style={{ flex:1, background:T.bgCard, borderRadius:16,
      border:`1px solid ${T.border}`, padding:"20px",
      display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12,
        paddingBottom:14, borderBottom:`1px solid ${T.border}`, marginBottom:4, flexShrink:0 }}>
        <div style={{ width:38, height:38, background:T.iconBg, borderRadius:11,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <BookOpen size={17} color={T.accent} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:T.txt1, letterSpacing:"-0.02em" }}>
            Rules &amp; Regulations
          </div>
          <div style={{ fontSize:11, fontWeight:500, color:T.txt2, marginTop:2 }}>
            Road safety guidelines
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", paddingRight:2 }}>
        {RULES.map(({ id, text }, i) => (
          <div key={id} style={{ display:"flex", alignItems:"flex-start", gap:12,
            padding:"10px 0",
            borderBottom: i < RULES.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width:24, height:24, borderRadius:"50%",
              background:T.iconBg, border:"1px solid rgba(139,92,246,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, fontSize:11, fontWeight:800, color:T.accent }}>{id}</div>
            <span style={{ fontSize:13, fontWeight:500, color:T.txt1, lineHeight:"1.6" }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Suggestions Card
═══════════════════════════════════════════════════════════ */
function SuggestionsCard() {
  return (
    <div style={{ flex:1, background:T.bgCard, borderRadius:16,
      border:`1px solid ${T.border}`, padding:"20px",
      display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12,
        paddingBottom:14, borderBottom:`1px solid ${T.border}`, marginBottom:4, flexShrink:0 }}>
        <div style={{ width:38, height:38, background:"rgba(251,191,36,0.14)", borderRadius:11,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Lightbulb size={17} color="#fbbf24" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:T.txt1, letterSpacing:"-0.02em" }}>
            Suggestions
          </div>
          <div style={{ fontSize:11, fontWeight:500, color:T.txt2, marginTop:2 }}>
            Smart driving tips
          </div>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", paddingRight:2 }}>
        {SUGGESTIONS.map(({ Icon, title, desc, accent, bg }, i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12,
            padding:"11px 0",
            borderBottom: i < SUGGESTIONS.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width:34, height:34, background:bg, borderRadius:9,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, marginTop:1 }}>
              <Icon size={15} color={accent} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.txt1, letterSpacing:"-0.01em" }}>
                {title}
              </div>
              <div style={{ fontSize:12, fontWeight:400, color:T.txt2, marginTop:3, lineHeight:"1.55" }}>
                {desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sidebar Nav Item
═══════════════════════════════════════════════════════════ */
function NavItem({ id, Icon, active, onClick }) {
  const on = active === id;
  return (
    <button onClick={() => onClick(id)} title={id} style={{
      width:40, height:40, borderRadius:11, border:"none", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center",
      background: on ? "rgba(124,58,237,0.22)" : "transparent",
      color:       on ? T.accent                : T.txt2,
      transition: "background 0.18s, color 0.18s", flexShrink:0,
    }}>
      <Icon size={17} strokeWidth={on ? 2.5 : 1.8} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Dashboard — default export
═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [nav,    setNav]    = useState("home");
  const [hovReg, setHovReg] = useState(null);
  const [fabHov, setFabHov] = useState(false);

  return (
    <div style={{ display:"flex", width:"100%", height:"100vh",
      background:T.bgRoot, color:T.txt1, overflow:"hidden",
      fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ══ SIDEBAR ═══════════════════════════════════════════ */}
      <aside style={{ width:"66px", minWidth:"66px", background:T.bgSide,
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"20px 0", borderRight:`1px solid ${T.border}`, gap:6, zIndex:10 }}>

        {/* Logo */}
        <div style={{ width:40, height:40, borderRadius:12, marginBottom:20, flexShrink:0,
          background:"linear-gradient(145deg,#8b5cf6 0%,#6d28d9 55%,#4c1d95 100%)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 20px rgba(109,40,217,0.50)" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2.5L18.5 6.75V15.25L11 19.5L3.5 15.25V6.75L11 2.5Z"
              stroke="rgba(255,255,255,0.45)" strokeWidth="1" fill="rgba(255,255,255,0.1)" />
            <circle cx="11" cy="11" r="2.6" fill="white" />
            <path d="M11 4.8V8M11 14V17.2M5.2 11H8.4M13.6 11H16.8"
              stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {[{id:"home",Icon:Home},{id:"history",Icon:Clock},
          {id:"map",Icon:MapPin},{id:"settings",Icon:Settings}]
          .map(({ id, Icon }) => (
            <NavItem key={id} id={id} Icon={Icon} active={nav} onClick={setNav} />
          ))
        }

        <div style={{ marginTop:"auto" }}>
          <button style={{ width:40, height:40, borderRadius:11, border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"transparent", color:T.txt2, cursor:"pointer" }}>
            <LogOut size={17} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══════════════════════════════════════════════ */}
      <main style={{ flex:1, display:"flex", flexDirection:"column",
        overflow:"hidden", minWidth:0 }}>

        {/* ── Top Bar ── */}
        <header style={{ display:"flex", alignItems:"center", gap:10,
          padding:"16px 18px", flexShrink:0 }}>

          <div style={{ flex:1, display:"flex", alignItems:"center", gap:10,
            background:"rgba(255,255,255,0.038)", border:`1px solid ${T.border}`,
            borderRadius:12, padding:"11px 15px" }}>
            <Search size={15} color={T.txt2} style={{ flexShrink:0 }} />
            <input placeholder="Search traffic laws, violations, or locations…"
              style={{ flex:1, border:"none", background:"transparent",
                color:T.txt1, fontSize:13, fontWeight:500, outline:"none" }} />
          </div>

          <button style={{ display:"flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,0.038)", border:`1px solid ${T.border}`,
            borderRadius:12, padding:"8px 14px", flexShrink:0, cursor:"pointer" }}>
            <MapPin size={13} color={T.accent} style={{ flexShrink:0 }} />
            <div style={{ textAlign:"left", lineHeight:"1.35" }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.txt1 }}>California,</div>
              <div style={{ fontSize:11, fontWeight:500, color:T.txt2 }}>USA</div>
            </div>
          </button>

          <button style={{ display:"flex", alignItems:"center", gap:8,
            background:`linear-gradient(135deg,${T.coralA},${T.coralB})`,
            border:"none", borderRadius:12, padding:"11px 18px", color:"white",
            fontSize:13, fontWeight:800, whiteSpace:"nowrap", flexShrink:0,
            boxShadow:"0 4px 18px rgba(255,95,112,0.35)", cursor:"pointer" }}>
            <AlertTriangle size={14} />
            Report Violation
          </button>
        </header>

        {/* ── Scrollable Body ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12,
          padding:"0 18px 24px", overflowY:"auto", overflowX:"hidden" }}>

          {/* Row 1 — Live Map + Regulations */}
          <div style={{ height:340, flexShrink:0, display:"flex", gap:12 }}>

            <div style={{ flex:"1 1 0", background:T.bgCard, borderRadius:16,
              border:`1px solid ${T.border}`, overflow:"hidden",
              position:"relative", minWidth:0 }}>
              <LiveMap />
            </div>

            <div style={{ width:268, minWidth:230, flexShrink:0, background:T.bgCard,
              borderRadius:16, border:`1px solid ${T.border}`, padding:"20px 16px",
              display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ marginBottom:4 }}>
                <div style={{ fontSize:16, fontWeight:800, color:T.txt1, letterSpacing:"-0.02em" }}>
                  Active Regulations
                </div>
                <div style={{ fontSize:12, fontWeight:500, color:T.txt2, marginTop:3 }}>
                  California jurisdiction
                </div>
              </div>
              {REGS.map(({ Icon, label, fine }, i) => (
                <div key={label}
                  onMouseEnter={() => setHovReg(i)}
                  onMouseLeave={() => setHovReg(null)}
                  style={{ display:"flex", alignItems:"center", gap:12,
                    background: hovReg === i ? T.bgItemHov : T.bgItem,
                    borderRadius:12, padding:"11px 12px",
                    border:`1px solid ${T.border}`, cursor:"pointer",
                    transition:"background 0.18s" }}>
                  <div style={{ width:36, height:36, background:T.iconBg, borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon size={15} color={T.accent} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:T.txt1 }}>{label}</div>
                    <div style={{ fontSize:11, fontWeight:500, color:T.txt2, marginTop:2 }}>{fine}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — Charts */}
          <div style={{ height:210, flexShrink:0, display:"flex", gap:12 }}>
            <ChartCard title="Violations Trend" data={violationsData} />
            <ChartCard title="Fine Collection"  data={finesData} />
          </div>

          {/* Row 3 — Rules & Suggestions */}
          <div style={{ height:340, flexShrink:0, display:"flex", gap:12 }}>
            <RulesCard />
            <SuggestionsCard />
          </div>
        </div>
      </main>

      {/* ── FAB ── */}
      <button
        onMouseEnter={() => setFabHov(true)}
        onMouseLeave={() => setFabHov(false)}
        style={{ position:"fixed", bottom:22, right:22, width:52, height:52,
          borderRadius:"50%",
          background:"linear-gradient(145deg,#8b5cf6 0%,#6d28d9 100%)",
          border:"none", display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", zIndex:50,
          boxShadow: fabHov ? "0 6px 28px rgba(109,40,217,0.68)"
                            : "0 4px 22px rgba(109,40,217,0.55)",
          transform: fabHov ? "scale(1.08)" : "scale(1)",
          transition:"transform 0.18s, box-shadow 0.18s" }}>
        <Bot size={22} color="white" />
      </button>
    </div>
  );
}
