import { useState } from "react";
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  Home, Clock, MapPin, Settings, LogOut,
  Search, AlertTriangle, Navigation,
  Gauge, GlassWater, HardHat, Smartphone, Bot,
  BookOpen, Lightbulb, Camera, FileText,
} from "lucide-react";

/* ── Design Tokens ───────────────────────────────────────────── */
const T = {
  bgRoot:"#0c0a1d", bgSide:"#080617",   bgCard:"#141130",
  bgItem:"#1b1836", bgItemHov:"#211e40",
  purple:"#7c3aed", accent:"#8b5cf6",   soft:"#a78bfa",
  iconBg:"rgba(124,58,237,0.18)",
  coralA:"#ff5f70", coralB:"#ff8557",
  txt1:"#e8e3ff",   txt2:"#5f5c7a",
  border:"rgba(255,255,255,0.06)", borderMd:"rgba(255,255,255,0.10)",
};

/* ── Data ────────────────────────────────────────────────────── */
const violationsData = [
  {day:"Tue",hi:28,lo:8 },{day:"Wed",hi:46,lo:21},{day:"Thu",hi:37,lo:25},
  {day:"Fri",hi:71,lo:46},{day:"Sat",hi:55,lo:30},{day:"Sun",hi:50,lo:24},
];
const finesData = [
  {day:"Tue",hi:57,lo:42},{day:"Wed",hi:52,lo:40},{day:"Thu",hi:66,lo:50},
  {day:"Fri",hi:83,lo:63},{day:"Sat",hi:76,lo:59},{day:"Sun",hi:72,lo:57},
];
const REGS = [
  { Icon:Gauge,      label:"Speed Limit",   fine:"Fine up to $490"   },
  { Icon:GlassWater, label:"Drunk Driving", fine:"Fine up to $1,000" },
  { Icon:HardHat,    label:"No Helmet",     fine:"Fine up to $250"   },
  { Icon:Smartphone, label:"Phone Use",     fine:"Fine up to $162"   },
];
const RULES = [
  { id:1, text:"Always wear a seatbelt — mandatory for driver and all passengers." },
  { id:2, text:"Never exceed posted speed limits; fines scale with excess speed." },
  { id:3, text:"Mobile phone use strictly prohibited while the vehicle is in motion." },
  { id:4, text:"Helmets are mandatory for all two-wheeler riders and pillion riders." },
  { id:5, text:"Zero tolerance for driving under the influence of alcohol or drugs." },
  { id:6, text:"Yield to pedestrians at all designated zebra crossings." },
  { id:7, text:"Maintain a safe following distance from the vehicle ahead at all times." },
  { id:8, text:"Headlights must be on from sunset to sunrise and during poor visibility." },
];
const SUGGESTIONS = [
  { Icon:Navigation, title:"Use Public Transport During Peak Hours",
    desc:"Switching to transit reduces exposure to high-fine enforcement zones significantly.",
    accent:T.accent, bg:"rgba(124,58,237,0.16)" },
  { Icon:Camera,     title:"Install a Dashcam",
    desc:"Dashcam footage is crucial evidence in disputes and speeds up insurance claims.",
    accent:"#22d3ee", bg:"rgba(34,211,238,0.12)" },
  { Icon:MapPin,     title:"Plan Routes Around High-Fine Zones",
    desc:"Use the enforcement map to identify red zones before departure and choose safer corridors.",
    accent:"#f87171", bg:"rgba(248,113,113,0.12)" },
  { Icon:FileText,   title:"Keep Documents and Contacts Updated",
    desc:"Carry current registration, insurance, and licence. Store emergency contacts in the glovebox.",
    accent:"#34d399", bg:"rgba(52,211,153,0.12)" },
  { Icon:AlertTriangle, title:"Report Reckless Driving Immediately",
    desc:"Use the Report Violation button to flag dangerous behaviour to local authorities.",
    accent:"#fbbf24", bg:"rgba(251,191,36,0.12)" },
];

/* ══ City Map SVG ════════════════════════════════════════════════ */
function CityMapSVG() {
  return (
    <div style={{ position:"relative", width:"100%", height:"100%" }}>
      <svg viewBox="0 0 720 390" preserveAspectRatio="xMidYMid slice"
        style={{ width:"100%", height:"100%", display:"block" }}>
        <rect width="720" height="390" fill="#cac6bc"/>
        {[30,60,90,120,150,180,210,240,270,300,330,360].map(y=>(
          <line key={"h"+y} x1="0" y1={y} x2="720" y2={y} stroke="#b6b2a8" strokeWidth="0.8"/>))}
        {[36,72,108,144,180,216,252,288,324,360,396,432,468,504,540,576,612,648,684].map(x=>(
          <line key={"v"+x} x1={x} y1="0" x2={x} y2="390" stroke="#b6b2a8" strokeWidth="0.8"/>))}
        {[[4,4,102,53],[4,63,102,53],[4,122,49,53],[59,122,47,53],[4,181,102,53],
          [4,240,49,53],[59,240,47,53],[112,4,64,53],[112,63,64,53],[112,122,64,53],
          [112,181,64,53],[182,4,58,53],[182,63,28,53],[216,63,24,53],[182,122,58,53],
          [182,181,58,53],[246,4,50,53],[246,122,50,53],[246,181,50,53],
          [508,4,94,53],[508,63,94,53],[508,122,94,53],[508,181,94,53],
          [608,4,108,53],[608,63,108,53],[608,122,108,53],[608,181,108,53],
        ].map(([x,y,w,h],i)=>(
          <rect key={"b"+i} x={x} y={y} width={w} height={h}
            fill={i%2===0?"#d5d1c7":"#d2cec4"} rx="2"/>))}
        <path d="M308,70 Q382,46 448,90 Q500,126 485,204 Q470,274 406,290 Q338,306 294,260 Q250,214 265,148 Q280,90 308,70Z" fill="#578958"/>
        <path d="M318,80 Q384,59 442,99 Q490,132 476,204 Q462,268 400,283 Q340,298 299,255 Q259,212 273,150 Q288,97 318,80Z" fill="#6a9e6a"/>
        {[[358,148,18],[402,168,22],[378,207,15],[344,188,17],[418,228,20],[352,232,12],[392,138,14]].map(([cx,cy,r])=>(
          <circle key={cx+"-"+cy} cx={cx} cy={cy} r={r} fill="#4d7e4d" opacity="0.72"/>))}
        <path d="M0,292 C75,274 168,298 260,280 C352,262 444,286 528,270 C610,254 666,268 720,260 L720,340 C666,332 610,318 528,334 C444,350 352,326 260,344 C168,362 75,338 0,356Z" fill="#3e72a0" opacity="0.92"/>
        <path d="M-5,155 C85,145 170,153 268,172 C366,191 454,186 556,172 C626,162 674,156 725,153" stroke="#4888cc" strokeWidth="11" fill="none" strokeLinecap="round"/>
        <path d="M-5,167 C85,157 170,165 268,184 C366,203 454,198 556,184 C626,174 674,168 725,165" stroke="#4888cc" strokeWidth="11" fill="none" strokeLinecap="round"/>
        <path d="M-5,161 C85,151 170,159 268,178 C366,197 454,192 556,178 C626,168 674,162 725,159" stroke="white" strokeWidth="1.8" fill="none" strokeDasharray="24,16" opacity="0.85"/>
        <path d="M725,28 C640,56 546,92 448,132 C350,172 252,216 158,252 C100,276 50,290 -5,310" stroke="#c87030" strokeWidth="7" fill="none" strokeLinecap="round"/>
        <path d="M725,40 C640,68 546,104 448,144 C350,184 252,228 158,264 C100,288 50,302 -5,322" stroke="#c87030" strokeWidth="7" fill="none" strokeLinecap="round"/>
        <path d="M725,34 C640,62 546,98 448,138 C350,178 252,222 158,258 C100,282 50,296 -5,316" stroke="white" strokeWidth="1.4" fill="none" strokeDasharray="18,14" opacity="0.75"/>
      </svg>

      {/* Zone badge */}
      <div style={{ position:"absolute", top:14, left:14,
        display:"flex", alignItems:"center", gap:7,
        background:"rgba(8,6,23,0.84)", backdropFilter:"blur(12px)",
        border:`1px solid ${T.borderMd}`, borderRadius:20,
        padding:"6px 14px", color:T.txt1, fontSize:12, fontWeight:700, userSelect:"none" }}>
        <Navigation size={13} color={T.accent}/>
        Downtown Enforcement Zone
      </div>

      {/* Legend */}
      <div style={{ position:"absolute", bottom:14, left:14, display:"flex", gap:8 }}>
        {[{color:"#ff4560",shadow:"rgba(255,69,96,0.6)",label:"High Fine Area"},
          {color:T.accent, shadow:"rgba(139,92,246,0.6)",label:"Speed Camera"}].map(({color,shadow,label})=>(
          <div key={label} style={{ display:"flex", alignItems:"center", gap:7,
            background:"rgba(8,6,23,0.84)", backdropFilter:"blur(12px)",
            border:`1px solid ${T.borderMd}`, borderRadius:20,
            padding:"5px 12px", color:T.txt1, fontSize:11, fontWeight:600, userSelect:"none" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:color,
              boxShadow:`0 0 7px 2px ${shadow}` }}/>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ Period Tabs ═════════════════════════════════════════════════ */
function PeriodTabs({ active, onChange }) {
  return (
    <div style={{ display:"flex", gap:3, background:"rgba(255,255,255,0.04)",
      border:`1px solid ${T.border}`, borderRadius:9, padding:3 }}>
      {["1D","1W","1M"].map(t=>(
        <button key={t} onClick={()=>onChange(t)} style={{
          padding:"4px 11px", borderRadius:7, border:"none", cursor:"pointer",
          fontSize:11, fontWeight:700, fontFamily:"inherit",
          background:active===t?T.purple:"transparent",
          color:active===t?"#fff":T.txt2, transition:"background 0.18s,color 0.18s",
        }}>{t}</button>
      ))}
    </div>
  );
}

/* ══ Chart Card ══════════════════════════════════════════════════ */
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
        <PeriodTabs active={period} onChange={setPeriod}/>
      </div>
      <div style={{ flex:1, minHeight:0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top:4, right:6, bottom:0, left:-28 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.045)" strokeDasharray="" vertical={false}/>
            <XAxis dataKey="day" tick={{ fill:T.txt2, fontSize:11, fontFamily:"inherit" }}
              axisLine={false} tickLine={false}/>
            <Line type="monotone" dataKey="hi" stroke={T.accent} strokeWidth={2.5} dot={false}
              activeDot={{ r:4, fill:T.accent, strokeWidth:0 }}/>
            <Line type="monotone" dataKey="lo" stroke="rgba(139,92,246,0.38)" strokeWidth={2}
              dot={false} activeDot={{ r:3, fill:T.soft, strokeWidth:0 }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ══ Rules & Regulations Card ════════════════════════════════════ */
function RulesCard() {
  return (
    <div style={{ flex:1, background:T.bgCard, borderRadius:16,
      border:`1px solid ${T.border}`, padding:"20px",
      display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12,
        paddingBottom:14, borderBottom:`1px solid ${T.border}`,
        marginBottom:4, flexShrink:0 }}>
        <div style={{ width:38, height:38, background:T.iconBg, borderRadius:11,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <BookOpen size={17} color={T.accent} strokeWidth={2}/>
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

      {/* Scrollable list */}
      <div style={{ flex:1, overflowY:"auto", paddingRight:2 }}>
        {RULES.map(({ id, text }, i) => (
          <div key={id} style={{ display:"flex", alignItems:"flex-start", gap:12,
            padding:"10px 0",
            borderBottom: i < RULES.length-1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width:24, height:24, borderRadius:"50%",
              background:T.iconBg, border:"1px solid rgba(139,92,246,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, fontSize:11, fontWeight:800, color:T.accent }}>
              {id}
            </div>
            <span style={{ fontSize:13, fontWeight:500, color:T.txt1, lineHeight:"1.6" }}>
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ Suggestions Card ════════════════════════════════════════════ */
function SuggestionsCard() {
  return (
    <div style={{ flex:1, background:T.bgCard, borderRadius:16,
      border:`1px solid ${T.border}`, padding:"20px",
      display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12,
        paddingBottom:14, borderBottom:`1px solid ${T.border}`,
        marginBottom:4, flexShrink:0 }}>
        <div style={{ width:38, height:38, background:"rgba(251,191,36,0.14)",
          borderRadius:11, display:"flex", alignItems:"center",
          justifyContent:"center", flexShrink:0 }}>
          <Lightbulb size={17} color="#fbbf24" strokeWidth={2}/>
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

      {/* Scrollable list */}
      <div style={{ flex:1, overflowY:"auto", paddingRight:2 }}>
        {SUGGESTIONS.map(({ Icon, title, desc, accent, bg }, i) => (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12,
            padding:"11px 0",
            borderBottom: i < SUGGESTIONS.length-1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width:34, height:34, background:bg, borderRadius:9,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, marginTop:1 }}>
              <Icon size={15} color={accent} strokeWidth={2.2}/>
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

/* ══ Nav Item ════════════════════════════════════════════════════ */
function NavItem({ id, Icon, active, onClick }) {
  const on = active === id;
  return (
    <button onClick={()=>onClick(id)} title={id} style={{
      width:40, height:40, borderRadius:11, border:"none", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center",
      background: on ? "rgba(124,58,237,0.22)" : "transparent",
      color: on ? T.accent : T.txt2,
      transition:"background 0.18s,color 0.18s", flexShrink:0 }}>
      <Icon size={17} strokeWidth={on?2.5:1.8}/>
    </button>
  );
}

/* ══ Main Dashboard ══════════════════════════════════════════════ */
export default function RoadSafetyDashboard() {
  const [nav, setNav] = useState("home");
  const [hovReg, setHovReg] = useState(null);
  const [fabHov, setFabHov] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        button { font-family:inherit; }
        input  { font-family:inherit; }
        input::placeholder { color:#5f5c7a; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(124,58,237,0.28); border-radius:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <div style={{ display:"flex", width:"100%", height:"100vh",
        background:T.bgRoot, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",
        color:T.txt1, overflow:"hidden" }}>

        {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
        <aside style={{ width:"66px", minWidth:"66px", background:T.bgSide,
          display:"flex", flexDirection:"column", alignItems:"center",
          padding:"20px 0", borderRight:`1px solid ${T.border}`, gap:6, zIndex:10 }}>

          {/* Logo */}
          <div style={{ width:40, height:40, borderRadius:12,
            background:"linear-gradient(145deg,#8b5cf6 0%,#6d28d9 55%,#4c1d95 100%)",
            display:"flex", alignItems:"center", justifyContent:"center",
            marginBottom:20, boxShadow:"0 4px 20px rgba(109,40,217,0.50)", flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2.5L18.5 6.75V15.25L11 19.5L3.5 15.25V6.75L11 2.5Z"
                stroke="rgba(255,255,255,0.45)" strokeWidth="1" fill="rgba(255,255,255,0.1)"/>
              <circle cx="11" cy="11" r="2.6" fill="white"/>
              <path d="M11 4.8V8M11 14V17.2M5.2 11H8.4M13.6 11H16.8"
                stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {[{id:"home",Icon:Home},{id:"history",Icon:Clock},
            {id:"map",Icon:MapPin},{id:"settings",Icon:Settings}].map(({id,Icon})=>(
            <NavItem key={id} id={id} Icon={Icon} active={nav} onClick={setNav}/>
          ))}

          <div style={{ marginTop:"auto" }}>
            <button style={{ width:40, height:40, borderRadius:11, border:"none",
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"transparent", color:T.txt2, cursor:"pointer" }}>
              <LogOut size={17} strokeWidth={1.8}/>
            </button>
          </div>
        </aside>

        {/* ══ MAIN ═════════════════════════════════════════════════ */}
        <main style={{ flex:1, display:"flex", flexDirection:"column",
          overflow:"hidden", minWidth:0 }}>

          {/* ── Top Bar ── */}
          <header style={{ display:"flex", alignItems:"center", gap:10,
            padding:"16px 18px", flexShrink:0 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10,
              background:"rgba(255,255,255,0.038)", border:`1px solid ${T.border}`,
              borderRadius:12, padding:"11px 15px" }}>
              <Search size={15} color={T.txt2} style={{ flexShrink:0 }}/>
              <input placeholder="Search traffic laws, violations, or locations..."
                style={{ flex:1, border:"none", background:"transparent",
                  color:T.txt1, fontSize:13, fontWeight:500, outline:"none" }}/>
            </div>
            <button style={{ display:"flex", alignItems:"center", gap:8,
              background:"rgba(255,255,255,0.038)", border:`1px solid ${T.border}`,
              borderRadius:12, padding:"8px 14px", flexShrink:0, cursor:"pointer" }}>
              <MapPin size={13} color={T.accent} style={{ flexShrink:0 }}/>
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
              <AlertTriangle size={14}/>
              Report Violation
            </button>
          </header>

          {/* ── Scrollable Body ── */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12,
            padding:"0 18px 24px", overflowY:"auto", overflowX:"hidden" }}>

            {/* Row 1 — Map + Regulations (fixed height) */}
            <div style={{ height:310, flexShrink:0, display:"flex", gap:12 }}>

              {/* Map */}
              <div style={{ flex:"1 1 0", background:T.bgCard, borderRadius:16,
                border:`1px solid ${T.border}`, overflow:"hidden",
                position:"relative", minWidth:0 }}>
                <CityMapSVG/>
              </div>

              {/* Regulations panel */}
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
                    onMouseEnter={()=>setHovReg(i)}
                    onMouseLeave={()=>setHovReg(null)}
                    style={{ display:"flex", alignItems:"center", gap:12,
                      background: hovReg===i ? T.bgItemHov : T.bgItem,
                      borderRadius:12, padding:"11px 12px",
                      border:`1px solid ${T.border}`, cursor:"pointer",
                      transition:"background 0.18s" }}>
                    <div style={{ width:36, height:36, background:T.iconBg, borderRadius:10,
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={15} color={T.accent} strokeWidth={2}/>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.txt1, letterSpacing:"-0.01em" }}>
                        {label}
                      </div>
                      <div style={{ fontSize:11, fontWeight:500, color:T.txt2, marginTop:2 }}>
                        {fine}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 — Charts */}
            <div style={{ height:210, flexShrink:0, display:"flex", gap:12 }}>
              <ChartCard title="Violations Trend" data={violationsData}/>
              <ChartCard title="Fine Collection"  data={finesData}/>
            </div>

            {/* Row 3 — Rules & Suggestions ✦ NEW ✦ */}
            <div style={{ height:340, flexShrink:0, display:"flex", gap:12 }}>
              <RulesCard/>
              <SuggestionsCard/>
            </div>

          </div>{/* end scrollable body */}
        </main>
      </div>

      {/* ── FAB ── */}
      <button
        onMouseEnter={()=>setFabHov(true)}
        onMouseLeave={()=>setFabHov(false)}
        style={{ position:"fixed", bottom:22, right:22, width:52, height:52,
          borderRadius:"50%",
          background:"linear-gradient(145deg,#8b5cf6 0%,#6d28d9 100%)",
          border:"none", display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", zIndex:50,
          boxShadow: fabHov
            ? "0 6px 28px rgba(109,40,217,0.68)"
            : "0 4px 22px rgba(109,40,217,0.55)",
          transform: fabHov ? "scale(1.08)" : "scale(1)",
          transition:"transform 0.18s,box-shadow 0.18s" }}>
        <Bot size={22} color="white"/>
      </button>
    </>
  );
}