const { useState, useEffect, useRef } = React;

// ============ GEMINI API CONFIG ============
const GEMINI_API_KEY = window.RESQFLOW_CONFIG?.GEMINI_API_KEY || "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const HAS_GEMINI_API_KEY = GEMINI_API_KEY && GEMINI_API_KEY !== "";

// ============ REQUEST THROTTLING CONFIG ============
let lastGeminiRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // Min 2 seconds between requests (increased from 1s)
let geminiRequestQueue = [];
let isProcessingQueue = false;

// ============ WEATHER DATA API CONFIG ============
// Using Open-Meteo (free, no API key required)
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";
const WEATHER_LOCATIONS = {
  "Delhi": { lat: 28.6139, lon: 77.2090 },
  "Mumbai": { lat: 19.0760, lon: 72.8777 },
  "Chennai": { lat: 13.0827, lon: 80.2707 },
  "Bangalore": { lat: 12.9716, lon: 77.5946 },
  "Kolkata": { lat: 22.5726, lon: 88.3639 }
};

// ============ REAL-TIME DISASTERS API CONFIG ============
// Using USGS (Earthquakes), GDACS (Multi-hazards), and IMD CAP (Indian Meteorological Dept)
const USGS_EARTHQUAKE_API = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const GDACS_API = "https://www.gdacs.org/AppData/alerts/rss.xml";
const IMD_CAP_API = "https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml";

// ============ AIR QUALITY API CONFIG ============
// Using Open-Meteo AQI (free, no API key required) and WAQI as fallback
const AQI_API_URL = "https://api.open-meteo.com/v1/air-quality";
const WAQI_API_DEMO = "https://api.waqi.info/feed/"; // Requires API key for production

const SYSTEM_PROMPT = `You are ResQFlow, an expert multilingual disaster response & emergency management AI assistant. You are deployed in India to help citizens during natural disasters and emergencies. You're powered by Google's Gemini.

CORE RESPONSIBILITIES:
• Provide immediate emergency guidance for floods, earthquakes, fires, cyclones, landslides
• Give evacuation routes and nearest shelter locations
• Emergency contacts: Police 100, Fire 101, Ambulance 102, NDRF 011-24363260, Disaster Helpline 1078
• Offer first aid advice and medical guidance
• Monitor real-time data: Earthquakes (USGS), Weather (Open-Meteo), Air Quality (AQI)
• Support multiple languages: English, Hindi, Tamil, Telugu, Bengali
• Provide real-time risk assessments and safety protocols

DATA SOURCES:
• Seismic: USGS Earthquake Feed
• Weather: Open-Meteo API (Temperature, Humidity, Precipitation, Wind)
• Air Quality: AQI Index, PM2.5, PM10, NO2, O3, SO2 levels
• Disaster Alerts: IMD CAP Feeds, GDACS Multi-hazard Data
• Location: India focus - latitude 6°N to 38°N, longitude 68°E to 97°E

BEHAVIOR:
• Be urgent but calm in emergencies
• Always prioritize human safety
• Provide actionable steps
• Include relevant emergency numbers
• Be empathetic to people in distress
• Consider air quality impacts on respiratory health
• If unsure about specifics, suggest contacting local authorities
• Cite data sources when providing real-time information

CURRENT LOCATION: India (Delhi NCR region)
LANGUAGE SUPPORT: English, हिंदी (Hindi), தமிழ் (Tamil), తెలుగు (Telugu), বাংলা (Bengali)`;

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;600;800&display=swap');`;

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050a0f; font-family: 'Rajdhani', sans-serif; color: #c8d8e8; }

  :root {
    --bg: #050a0f;
    --bg2: #0a1520;
    --bg3: #0f1e2d;
    --border: #1a3a55;
    --accent: #ff4d1c;
    --accent2: #ff8c00;
    --safe: #00e5a0;
    --warn: #ffcc00;
    --info: #00aaff;
    --text: #c8d8e8;
    --dim: #4a6a88;
    --mono: 'Share Tech Mono', monospace;
    --head: 'Exo 2', sans-serif;
  }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* SIDEBAR */
  .sidebar {
    width: 68px; background: var(--bg2); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 8px;
    position: relative; z-index: 10;
  }
  .logo-block { width: 44px; height: 44px; background: var(--accent); border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-family: var(--head);
    font-weight: 800; font-size: 14px; color: #fff; margin-bottom: 16px; letter-spacing: 1px;
    box-shadow: 0 0 20px rgba(255,77,28,0.4); cursor: pointer; }
  .nav-btn { width: 44px; height: 44px; border-radius: 10px; border: 1px solid transparent;
    background: transparent; color: var(--dim); font-size: 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all .2s;
    position: relative; }
  .nav-btn:hover { background: var(--bg3); color: var(--text); border-color: var(--border); }
  .nav-btn.active { background: rgba(255,77,28,0.12); color: var(--accent); border-color: rgba(255,77,28,0.3); }
  .nav-btn .badge { position: absolute; top: 5px; right: 5px; width: 8px; height: 8px;
    background: var(--accent); border-radius: 50%; border: 2px solid var(--bg2); }
  .sidebar-bottom { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; }

  /* MAIN */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  /* TOPBAR */
  .topbar { background: var(--bg2); border-bottom: 1px solid var(--border);
    padding: 12px 24px; display: flex; align-items: center; gap: 16px; }
  .topbar-title { font-family: var(--head); font-weight: 800; font-size: 18px;
    color: #fff; letter-spacing: 2px; text-transform: uppercase; }
  .topbar-sub { font-family: var(--mono); font-size: 11px; color: var(--dim); }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--safe);
    box-shadow: 0 0 8px var(--safe); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .status-text { font-family: var(--mono); font-size: 11px; color: var(--safe); }
  .time-display { font-family: var(--mono); font-size: 13px; color: var(--text);
    background: var(--bg3); padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border); }
  .alert-level { padding: 4px 10px; border-radius: 4px; font-family: var(--mono); font-size: 11px;
    font-weight: 600; letter-spacing: 1px; }
  .alert-level.high { background: rgba(255,77,28,.15); color: var(--accent); border: 1px solid rgba(255,77,28,.3); }
  .alert-level.med { background: rgba(255,204,0,.1); color: var(--warn); border: 1px solid rgba(255,204,0,.25); }

  /* CONTENT */
  .content { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .content::-webkit-scrollbar { width: 4px; }
  .content::-webkit-scrollbar-track { background: var(--bg); }
  .content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* GRID */
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; }
  .grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 16px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }

  /* CARD */
  .card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .card-title { font-family: var(--head); font-weight: 700; font-size: 11px; color: var(--dim);
    text-transform: uppercase; letter-spacing: 2px; }
  .card-badge { font-family: var(--mono); font-size: 10px; padding: 2px 8px; border-radius: 3px; }
  .card-badge.live { background: rgba(0,229,160,.1); color: var(--safe); border: 1px solid rgba(0,229,160,.2); }
  .card-badge.warn { background: rgba(255,204,0,.1); color: var(--warn); border: 1px solid rgba(255,204,0,.2); }
  .card-badge.alert { background: rgba(255,77,28,.12); color: var(--accent); border: 1px solid rgba(255,77,28,.25); }

  /* STAT CARDS */
  .stat-big { font-family: var(--head); font-size: 36px; font-weight: 800; color: #fff; line-height: 1; }
  .stat-label { font-family: var(--mono); font-size: 10px; color: var(--dim); margin-top: 4px; }
  .stat-delta { font-family: var(--mono); font-size: 11px; margin-top: 8px; }
  .stat-delta.up { color: var(--accent); }
  .stat-delta.ok { color: var(--safe); }

  /* MAP PLACEHOLDER */
  .map-area { position: relative; border-radius: 8px; overflow: hidden; background: #081525;
    border: 1px solid var(--border); height: 280px; }
  .map-grid { position: absolute; inset: 0; opacity: .15;
    background-image: linear-gradient(rgba(0,170,255,.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,170,255,.5) 1px, transparent 1px);
    background-size: 30px 30px; }
  .map-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .map-pin { position: absolute; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
  .map-pin-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; }
  .map-pin-ring { position: absolute; width: 24px; height: 24px; border-radius: 50%; opacity: .4;
    animation: ripple 2s infinite; }
  @keyframes ripple { 0%{transform:scale(.5);opacity:.8} 100%{transform:scale(2);opacity:0} }
  .map-pin-label { font-family: var(--mono); font-size: 9px; color: #fff; white-space: nowrap;
    background: rgba(0,0,0,.7); padding: 2px 5px; border-radius: 3px; margin-top: 3px; }
  .map-scanline { position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg,transparent,rgba(0,170,255,.6),transparent);
    animation: scan 4s linear infinite; }
  @keyframes scan { 0%{top:0} 100%{top:100%} }

  /* ALERTS LIST */
  .alert-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px;
    border-radius: 8px; margin-bottom: 8px; border: 1px solid transparent; cursor: pointer;
    transition: all .2s; }
  .alert-item:hover { background: var(--bg3); }
  .alert-item.critical { border-color: rgba(255,77,28,.2); background: rgba(255,77,28,.04); }
  .alert-item.warning { border-color: rgba(255,204,0,.15); background: rgba(255,204,0,.03); }
  .alert-item.info { border-color: rgba(0,170,255,.15); background: rgba(0,170,255,.03); }
  .alert-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
  .alert-content { flex: 1; }
  .alert-title { font-family: var(--head); font-weight: 600; font-size: 14px; color: #fff; }
  .alert-desc { font-family: var(--mono); font-size: 10px; color: var(--dim); margin-top: 2px; }
  .alert-time { font-family: var(--mono); font-size: 10px; color: var(--dim); flex-shrink: 0; }

  /* RESOURCE BARS */
  .resource-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .resource-name { font-family: var(--mono); font-size: 11px; color: var(--text); width: 80px; }
  .resource-bar { flex: 1; height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; }
  .resource-fill { height: 100%; border-radius: 3px; transition: width .8s ease; }
  .resource-pct { font-family: var(--mono); font-size: 11px; color: var(--dim); width: 36px; text-align: right; }

  /* PREDICTION */
  .pred-bar-wrap { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .pred-label { font-family: var(--mono); font-size: 11px; color: var(--text); width: 70px; }
  .pred-bar { flex: 1; height: 20px; background: var(--bg3); border-radius: 4px; overflow: hidden; position: relative; }
  .pred-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding: 0 8px;
    font-family: var(--mono); font-size: 10px; color: #fff; transition: width 1s ease; }
  .pred-severity { font-family: var(--mono); font-size: 10px; width: 50px; text-align: right; }

  /* CHATBOT */
  .chat-wrap { display: flex; flex-direction: column; height: 100%; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .chat-messages::-webkit-scrollbar { width: 3px; }
  .chat-messages::-webkit-scrollbar-thumb { background: var(--border); }
  .msg { max-width: 85%; display: flex; flex-direction: column; gap: 3px; }
  .msg.user { align-self: flex-end; align-items: flex-end; }
  .msg.bot { align-self: flex-start; align-items: flex-start; }
  .msg-bubble { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
  .msg.user .msg-bubble { background: rgba(255,77,28,.15); border: 1px solid rgba(255,77,28,.25); color: #fff; border-radius: 12px 12px 2px 12px; }
  .msg.bot .msg-bubble { background: var(--bg3); border: 1px solid var(--border); color: var(--text); border-radius: 12px 12px 12px 2px; }
  .msg-meta { font-family: var(--mono); font-size: 9px; color: var(--dim); padding: 0 4px; }
  .chat-input-area { padding: 12px; border-top: 1px solid var(--border); }
  .chat-modes { display: flex; gap: 6px; margin-bottom: 8px; }
  .mode-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); background: transparent;
    color: var(--dim); font-family: var(--mono); font-size: 10px; cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 4px; }
  .mode-btn.active { background: rgba(0,170,255,.12); border-color: rgba(0,170,255,.3); color: var(--info); }
  .chat-row { display: flex; gap: 8px; }
  .chat-input { flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 14px; color: var(--text); font-family: 'Rajdhani', sans-serif; font-size: 14px;
    outline: none; transition: border-color .2s; }
  .chat-input:focus { border-color: rgba(0,170,255,.4); }
  .chat-send { background: var(--accent); border: none; border-radius: 8px; padding: 0 16px;
    color: #fff; font-size: 18px; cursor: pointer; transition: all .2s; }
  .chat-send:hover { background: #ff6a3c; box-shadow: 0 0 16px rgba(255,77,28,.4); }
  .lang-pill { display: inline-block; padding: 2px 7px; border-radius: 4px;
    background: rgba(0,170,255,.1); border: 1px solid rgba(0,170,255,.2); color: var(--info);
    font-family: var(--mono); font-size: 10px; margin-right: 4px; cursor: pointer; transition: all .2s; }
  .lang-pill.sel { background: rgba(0,170,255,.2); border-color: rgba(0,170,255,.5); }

  /* SEISMIC */
  .seismic-canvas { width: 100%; height: 80px; display: block; }

  /* TABS */
  .tabs { display: flex; gap: 2px; margin-bottom: 16px; background: var(--bg2);
    border: 1px solid var(--border); border-radius: 10px; padding: 4px; }
  .tab { flex: 1; padding: 8px; border-radius: 8px; border: none; background: transparent;
    color: var(--dim); font-family: var(--head); font-weight: 600; font-size: 13px;
    cursor: pointer; transition: all .2s; letter-spacing: 1px; }
  .tab.active { background: var(--accent); color: #fff; box-shadow: 0 0 16px rgba(255,77,28,.3); }

  /* TYPING */
  .typing-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: var(--info); margin: 0 2px; animation: blink 1.2s infinite; }
  .typing-dot:nth-child(2) { animation-delay: .2s; }
  .typing-dot:nth-child(3) { animation-delay: .4s; }
  @keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }

  /* VIDEO DETECT */
  .detect-area { background: #060f1a; border: 2px dashed var(--border); border-radius: 10px;
    height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; cursor: pointer; transition: all .2s; }
  .detect-area:hover { border-color: rgba(0,170,255,.4); background: rgba(0,170,255,.03); }
  .detect-icon { font-size: 32px; opacity: .4; }
  .detect-text { font-family: var(--mono); font-size: 11px; color: var(--dim); text-align: center; }

  .detection-result { margin-top: 10px; padding: 10px; background: rgba(255,77,28,.06);
    border: 1px solid rgba(255,77,28,.2); border-radius: 8px; }
  .detection-tag { display: inline-block; margin: 3px; padding: 3px 8px; border-radius: 4px;
    font-family: var(--mono); font-size: 10px; }
  .detection-tag.fire { background: rgba(255,77,28,.2); color: #ff6a3c; border: 1px solid rgba(255,77,28,.3); }
  .detection-tag.flood { background: rgba(0,170,255,.15); color: var(--info); border: 1px solid rgba(0,170,255,.25); }
  .detection-tag.crowd { background: rgba(255,140,0,.15); color: var(--accent2); border: 1px solid rgba(255,140,0,.25); }

  /* DIVIDER */
  .section-divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }

  /* SOS */
  .sos-btn { background: linear-gradient(135deg, #ff1a00, #ff6600); border: none; border-radius: 10px;
    color: #fff; font-family: var(--head); font-weight: 800; font-size: 14px; letter-spacing: 3px;
    padding: 12px; cursor: pointer; width: 100%; margin-top: 8px; text-transform: uppercase;
    box-shadow: 0 0 24px rgba(255,30,0,.3); transition: all .2s; }
  .sos-btn:hover { box-shadow: 0 0 40px rgba(255,30,0,.5); transform: scale(1.02); }

  /* MINI CHART */
  .mini-chart { display: flex; align-items: flex-end; gap: 3px; height: 40px; }
  .mini-bar { flex: 1; border-radius: 2px 2px 0 0; min-width: 6px; transition: height .5s ease; }
`;

const ALERTS = [
  { type: "critical", icon: "🌊", title: "Flash Flood Warning", desc: "Yamuna basin — 3.2m above danger level · Delhi NCR", time: "2m ago" },
  { type: "warning", icon: "🌍", title: "Seismic Activity Detected", desc: "M4.1 near Uttarakhand — monitoring escalation", time: "14m ago" },
  { type: "critical", icon: "🔥", title: "Wildfire Spread Detected", desc: "Uttarakhand forest zone — AI vision confirmed", time: "31m ago" },
  { type: "info", icon: "🌀", title: "Cyclone Track Updated", desc: "Bay of Bengal — landfall ETA revised +6h", time: "1h ago" },
  { type: "warning", icon: "🏚️", title: "Structural Risk Flagged", desc: "Satellite imagery — post-quake assessment zone 4", time: "2h ago" },
];

const RESOURCES = [
  { name: "Rescue Teams", pct: 68, color: "#00e5a0" },
  { name: "Field Medics", pct: 45, color: "#ff8c00" },
  { name: "Helicopters", pct: 80, color: "#00aaff" },
  { name: "Boats", pct: 30, color: "#ff4d1c" },
  { name: "Shelters", pct: 55, color: "#a78bfa" },
];

const PREDICTIONS = [
  { label: "Flood Risk", pct: 78, color: "#00aaff", severity: "HIGH" },
  { label: "Earthquake", pct: 32, color: "#ff8c00", severity: "MED" },
  { label: "Wildfire", pct: 61, color: "#ff4d1c", severity: "HIGH" },
  { label: "Cyclone", pct: 44, color: "#a78bfa", severity: "MED" },
];

const MAP_PINS = [
  { left: "22%", top: "38%", color: "#ff4d1c", ring: "#ff4d1c", label: "🌊 Yamuna Flood" },
  { left: "48%", top: "25%", color: "#ff8c00", ring: "#ff8c00", label: "🌍 Uttarakhand" },
  { left: "65%", top: "55%", color: "#00e5a0", ring: "#00e5a0", label: "✅ Relief Camp" },
  { left: "35%", top: "62%", color: "#00aaff", ring: "#00aaff", label: "🏥 Medical Hub" },
  { left: "78%", top: "32%", color: "#ff4d1c", ring: "#ff4d1c", label: "🔥 Wildfire" },
];

function getDemoResponse(userMessage, selectedLang = "EN") {
  const normalized = userMessage.toLowerCase();
  const intent = /flood|water|rain|बाढ़|வெள்ளம்|বন্যা|వరద/.test(normalized)
    ? "flood"
    : /earthquake|quake|seismic|भूकंप|நிலநடுக்கம்|ভূমিকম্প|భూకంపం/.test(normalized)
      ? "earthquake"
      : /fire|smoke|wildfire|आग|தீ|আগুন|మంట/.test(normalized)
        ? "fire"
        : /evacuat|escape|route|shelter|camp|निकाल|बचाव|வெளியேறு|আশ্রয়|తరలింపు/.test(normalized)
          ? "evacuation"
          : /first aid|injury|bleeding|burn|medical|ambulance|चोट|जलन|காயம்|আঘাত|గాయం/.test(normalized)
            ? "firstAid"
            : /help|emergency|contact|helpline|number|phone|फोन|எண்|নম্বর|నంబర్/.test(normalized)
              ? "contacts"
              : "default";

  const responses = {
    EN: {
      flood: "🌊 Flood response\n\n- Move to higher ground immediately\n- Avoid walking or driving through moving water\n- Switch off electricity if water enters the building\n- Carry documents, medicines, drinking water, and your phone\n- Call 112 or NDRF 011-24363260 if evacuation is needed",
      earthquake: "🌍 Earthquake response\n\n- Drop, Cover, Hold\n- Stay away from windows and heavy furniture\n- Do not use lifts during or after shaking\n- After shaking stops, move to an open area carefully\n- Call 112 if someone is trapped or injured",
      fire: "🔥 Fire response\n\n- Evacuate immediately using stairs, not lifts\n- Stay low if there is smoke\n- Close doors behind you to slow the fire\n- If clothes catch fire: stop, drop, and roll\n- Call Fire Service 101 now",
      evacuation: "🚨 Evacuation guidance\n\n- Carry ID, medicines, water, cash, and phone\n- Follow official alerts and go to the nearest shelter or safe open area\n- Help children, elderly people, and injured persons first\n- Share your location with family if possible\n- Use 1078 or 112 for official assistance",
      firstAid: "🩺 First aid basics\n\n- For bleeding: apply firm pressure with a clean cloth\n- For burns: cool with running water for 20 minutes\n- For breathing trouble or unconsciousness: call 102 or 112 immediately\n- Do not move someone with possible spinal injury unless necessary",
      contacts: "📞 Emergency contacts\n\n- Police: 100\n- Fire: 101\n- Ambulance: 102\n- Emergency Response: 112\n- Disaster Helpline: 1078\n- NDRF: 011-24363260",
      default: "🤖 ResQFlow demo assistant\n\nI can still help in demo mode with floods, earthquakes, fires, evacuation, first aid, shelters, and emergency contacts.\n\nTry asking:\n- flood safety steps\n- what to do in earthquake\n- first aid for burns\n- emergency helpline numbers"
    },
    HI: {
      flood: "🌊 बाढ़ के समय\n\n- तुरंत ऊँची जगह पर जाएँ\n- बहते पानी में पैदल या गाड़ी से न जाएँ\n- घर में पानी आए तो बिजली बंद करें\n- दवा, दस्तावेज़, पानी और फोन साथ रखें\n- मदद के लिए 112 या NDRF 011-24363260 पर कॉल करें",
      earthquake: "🌍 भूकंप के समय\n\n- झुकें, ढकें, पकड़ें\n- खिड़कियों और भारी सामान से दूर रहें\n- लिफ्ट का उपयोग न करें\n- झटके रुकने पर खुले स्थान में जाएँ\n- घायल या फँसे व्यक्ति के लिए 112 पर कॉल करें",
      fire: "🔥 आग लगने पर\n\n- तुरंत बाहर निकलें, लिफ्ट का उपयोग न करें\n- धुआँ हो तो नीचे झुककर चलें\n- दरवाज़े बंद करें ताकि आग धीरे फैले\n- कपड़ों में आग लगे तो रुकें, लेटें, लुढ़कें\n- फायर सर्विस 101 पर कॉल करें",
      evacuation: "🚨 निकासी मार्गदर्शन\n\n- केवल ज़रूरी सामान लें\n- आधिकारिक अलर्ट का पालन करें\n- बच्चों, बुजुर्गों और घायलों को पहले मदद दें\n- परिवार को लोकेशन भेजें\n- सहायता के लिए 1078 या 112 पर संपर्क करें",
      firstAid: "🩺 प्राथमिक उपचार\n\n- खून बहने पर साफ कपड़े से दबाव दें\n- जलने पर 20 मिनट तक ठंडे पानी से धोएँ\n- साँस न आए या बेहोशी हो तो 102 या 112 पर कॉल करें\n- रीढ़ की चोट का शक हो तो मरीज को कम हिलाएँ",
      contacts: "📞 आपातकालीन नंबर\n\n- पुलिस: 100\n- फायर: 101\n- एम्बुलेंस: 102\n- आपातकाल: 112\n- डिज़ास्टर हेल्पलाइन: 1078\n- NDRF: 011-24363260",
      default: "🤖 ResQFlow डेमो मोड में है, लेकिन मैं बाढ़, भूकंप, आग, निकासी, प्राथमिक उपचार और आपातकालीन नंबरों में मदद कर सकता हूँ।"
    }
  };

  const languageResponses = responses[selectedLang] || responses.EN;
  return languageResponses[intent] || languageResponses.default;
}

async function callGeminiAPI(userMessage, conversationHistory, selectedLang, onAuthFailed) {
  try {
    if (!HAS_GEMINI_API_KEY) {
      console.warn("API Key not configured, using demo mode");
      if (onAuthFailed) onAuthFailed();
      return getDemoResponse(userMessage, selectedLang);
    }

    // ========== THROTTLE REQUESTS ==========
    const now = Date.now();
    const timeSinceLastRequest = now - lastGeminiRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`⏳ Throttling: Waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastGeminiRequestTime = Date.now();

    const requestBody = {
      contents: [
        ...conversationHistory
          .filter(m => m.role && m.text && m.role !== "system")
          .map(m => ({
            role: m.role === "bot" ? "model" : "user",
            parts: [{ text: m.text }]
          })),
        { role: "user", parts: [{ text: userMessage }] }
      ],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9
      }
    };

    console.log("📤 Sending to Gemini API:", { messageCount: requestBody.contents.length });

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("📩 Response status:", response.status);

    if (!response.ok) {
      let errorMessage = "Unknown error";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || JSON.stringify(errorData);
      } catch (e) {
        errorMessage = response.statusText;
      }

      console.error("❌ API Error:", { status: response.status, message: errorMessage });

      if (response.status === 401 || response.status === 403) {
        console.warn("⚠️ Gemini API key invalid/expired — falling back to demo mode");
        if (onAuthFailed) onAuthFailed();
        return getDemoResponse(userMessage, selectedLang);
      } else if (response.status === 429) {
        return "⏱️ **RATE LIMIT EXCEEDED** (Too many requests)\n\n**Free Tier Limit**: 15 requests per minute\n\n**Solutions:**\n1. ✅ **Wait 1 minute** before sending next message\n2. 🔄 **Pro Tip**: Don't send multiple messages rapidly";
      } else if (response.status === 400) {
        return `❌ **BAD REQUEST**: ${errorMessage}\n\n• Check your API key is correct\n• Try a shorter message`;
      } else if (response.status >= 500) {
        console.warn("Gemini service unavailable, using demo response until API recovers");
        return getDemoResponse(userMessage, selectedLang);
      } else {
        return `❌ **API Error (${response.status})**: ${errorMessage}\n\n🔍 Check browser console (F12) for details.`;
      }
    }

    const data = await response.json();
    console.log("✅ Gemini response received");

    if (!data.candidates || data.candidates.length === 0) {
      console.error("No candidates in response:", data);
      return "❓ Empty response from API. This might be due to content filters. Try asking a different question.";
    }

    const aiResponse = data.candidates[0].content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error("Could not extract text from response:", data.candidates[0]);
      return "❓ Could not extract response text. Please try again.";
    }

    console.log("💬 Response text:", aiResponse.substring(0, 100));
    return aiResponse;
  } catch (error) {
    console.error("🔴 API Call Exception:", error);

    if (error.name === "AbortError" || error.message === "Failed to fetch") {
      return "🔴 **NETWORK ERROR**: Check your internet connection.\n\n• Verify you're connected to the internet\n• Try disabling VPN if using one\n• Open console (F12) for detailed error";
    }

    return `🔴 **Error**: ${error.message}\n\n**Troubleshooting:**\n• Check internet connection\n• Verify Gemini API key (should start with AIzaSy)\n• Open console (F12) for details\n• Try reloading the page`;
  }
}

// ============ WEATHER API FUNCTIONS ============
async function fetchWeatherData(lat, lon, location = "Delhi") {
  try {
    const url = `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=precipitation,temperature_2m,relativehumidity_2m,windspeed_10m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FKolkata`;

    console.log("🌤️ Fetching weather from:", url.substring(0, 80) + "...");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API: ${response.status}`);
    const data = await response.json();

    const current = data.current_weather || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    return {
      location,
      temperature: current.temperature,
      windspeed: current.windspeed,
      weathercode: current.weathercode,
      precipitation: hourly.precipitation?.[0] ?? 0,
      humidity: hourly.relativehumidity_2m?.[0] ?? 0,
      nextHourPrecip: hourly.precipitation?.[1] ?? 0,
      dailyForecast: {
        maxTemp: daily.temperature_2m_max?.[0],
        minTemp: daily.temperature_2m_min?.[0],
        precipitation: daily.precipitation_sum?.[0]
      },
      updated: new Date()
    };
  } catch (error) {
    console.error("❌ Weather API error:", error);
    return null;
  }
}

async function fetchMultipleWeatherData() {
  try {
    const allWeatherData = await Promise.all(
      Object.entries(WEATHER_LOCATIONS).map(([city, coords]) =>
        fetchWeatherData(coords.lat, coords.lon, city)
      )
    );
    return allWeatherData.filter(w => w !== null);
  } catch (error) {
    console.error("❌ Multi-weather fetch error:", error);
    return [];
  }
}

// ============ REAL-TIME DISASTERS API FUNCTIONS ============
async function fetchEarthquakeData() {
  try {
    const response = await fetch(USGS_EARTHQUAKE_API);
    const data = await response.json();

    return (data.features || [])
      .map(f => ({
        id: f.id,
        magnitude: f.properties?.mag,
        place: f.properties?.place,
        time: new Date(f.properties?.time),
        url: f.properties?.url,
        depth: f.geometry?.coordinates?.[2],
        coords: [f.geometry?.coordinates?.[1], f.geometry?.coordinates?.[0]],
        significance: f.properties?.sig
      }))
      .filter(event => {
        const [lat, lon] = event.coords || [];
        return lat >= 6 && lat <= 38 && lon >= 68 && lon <= 97;
      })
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 10);
  } catch (error) {
    console.error("Earthquake API error:", error);
    return [];
  }
}

async function fetchDisasterAlerts() {
  try {
    const [earthquakes, imdAlerts] = await Promise.all([
      fetchEarthquakeData(),
      fetchImdCapAlerts()
    ]);

    const earthquakeAlerts = earthquakes.map(eq => ({
      type: eq.magnitude >= 5 ? "critical" : eq.magnitude >= 3 ? "warning" : "info",
      icon: "🌍",
      title: `M${eq.magnitude?.toFixed(1)} Earthquake`,
      desc: eq.place,
      source: "USGS",
      magnitude: eq.magnitude,
      depth: eq.depth,
      time: Math.round((Date.now() - eq.time) / 60000) + "m ago"
    }));

    return {
      earthquakes: earthquakeAlerts,
      imdAlerts: imdAlerts,
      lastUpdate: new Date()
    };
  } catch (error) {
    console.error("Disaster alerts fetch error:", error);
    return { earthquakes: [], imdAlerts: [], lastUpdate: new Date() };
  }
}

// ============ AIR QUALITY API FUNCTIONS ============
async function fetchAirQualityData(lat, lon, location = "Delhi") {
  try {
    const url = `${AQI_API_URL}?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,no2,o3,so2&timezone=Asia%2FKolkata`;

    console.log("💨 Fetching AQI from:", url.substring(0, 80) + "...");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`AQI API: ${response.status}`);
    const data = await response.json();

    const current = data.current || {};

    // Calculate AQI from PM2.5 (using EPA breakpoints)
    const pm25 = current.pm2_5 || 0;
    let aqi = 0;
    if (pm25 <= 12) aqi = (pm25 / 12) * 50;
    else if (pm25 <= 35.4) aqi = ((pm25 - 12) / (35.4 - 12)) * 50 + 50;
    else if (pm25 <= 55.4) aqi = ((pm25 - 35.4) / (55.4 - 35.4)) * 50 + 100;
    else if (pm25 <= 150.4) aqi = ((pm25 - 55.4) / (150.4 - 55.4)) * 50 + 150;
    else aqi = 500;

    const getAQICategory = (aqiValue) => {
      if (aqiValue <= 50) return "Good";
      if (aqiValue <= 100) return "Moderate";
      if (aqiValue <= 150) return "Unhealthy for Sensitive Groups";
      if (aqiValue <= 200) return "Unhealthy";
      if (aqiValue <= 300) return "Very Unhealthy";
      return "Hazardous";
    };

    return {
      location,
      aqi: Math.round(aqi),
      category: getAQICategory(aqi),
      pm10: current.pm10 || 0,
      pm2_5: current.pm2_5 || 0,
      no2: current.no2 || 0,
      o3: current.o3 || 0,
      so2: current.so2 || 0,
      updated: new Date()
    };
  } catch (error) {
    console.error("❌ Air Quality API error:", error);
    return null;
  }
}

async function fetchMultipleAirQualityData() {
  try {
    const allAQIData = await Promise.all(
      Object.entries(WEATHER_LOCATIONS).map(([city, coords]) =>
        fetchAirQualityData(coords.lat, coords.lon, city)
      )
    );
    return allAQIData.filter(aqi => aqi !== null);
  } catch (error) {
    console.error("❌ Multi-AQI fetch error:", error);
    return [];
  }
}

async function fetchImdCapAlerts() {
  try {
    const response = await fetch("https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml");
    if (!response.ok) throw new Error(`IMD CAP fetch failed: ${response.status}`);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    return Array.from(xml.querySelectorAll("item")).slice(0, 5).map(item => ({
      title: item.querySelector("title")?.textContent?.trim() || "IMD Alert",
      desc: item.querySelector("description")?.textContent?.trim().replace(/\s+/g, " ") || "",
      link: item.querySelector("link")?.textContent?.trim() || "",
      pubDate: item.querySelector("pubDate")?.textContent?.trim() || "",
    }));
  } catch (error) {
    console.warn("IMD CAP feed unavailable:", error);
    return [];
  }
}

function SeismicChart() {
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const draw = () => {
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = 80;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,170,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const step = 3;
      for (let x = 0; x < w; x += step) {
        const t = (x + offsetRef.current) / 30;
        const noise = Math.sin(t * 2.3) * 8 + Math.sin(t * 5.1) * 4 + Math.sin(t * 11) * 2;
        const spike = Math.abs(Math.sin(t * 0.7)) > 0.93 ? Math.random() * 20 - 10 : 0;
        const y = h / 2 + noise + spike;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,77,28,0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(0, h / 2 + 16); ctx.lineTo(w, h / 2 + 16);
      ctx.moveTo(0, h / 2 - 16); ctx.lineTo(w, h / 2 - 16);
      ctx.stroke();
      ctx.setLineDash([]);
      offsetRef.current += 1.5;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: 80, display: "block" }} />;
}

function MiniChart({ bars, color }) {
  return (
    <div className="mini-chart">
      {bars.map((h, i) => (
        <div key={i} className="mini-bar" style={{ height: `${h}%`, background: color, opacity: 0.6 + i * 0.04 }} />
      ))}
    </div>
  );
}

function ResQFlow() {
  const [tab, setTab] = useState("dashboard");
  const [time, setTime] = useState(new Date());
  const [apiAuthFailed, setApiAuthFailed] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "🟢 ResQFlow AI — Ready\n\nI'm your disaster response assistant for India. I can help with:\n\n✅ Flood safety & evacuation routes\n✅ Earthquake survival tactics\n✅ Fire emergency procedures\n✅ Cyclone preparedness\n✅ First aid guidance\n✅ Emergency contact numbers\n✅ Shelter locations\n\nLanguages: English (EN), हिंदी (HI), தமிழ் (TA), বাংলা (BN), తెలుగు (TE)\n\nWhat can I help you with?",
      time: "now"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const [lang, setLang] = useState("EN");
  const [detectionResult, setDetectionResult] = useState(null);
  const chatEndRef = useRef(null);
  const [detected, setDetected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [earthquakeEvents, setEarthquakeEvents] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [weatherData, setWeatherData] = useState([]);
  const [airQualityData, setAirQualityData] = useState([]);
  const [disasterAlerts, setDisasterAlerts] = useState({ earthquakes: [], imdAlerts: [], lastUpdate: null });
  const [alertList, setAlertList] = useState(ALERTS);
  const [broadcastStatus, setBroadcastStatus] = useState("");
  const [resourceStats, setResourceStats] = useState(RESOURCES);
  const [predictionStats, setPredictionStats] = useState(PREDICTIONS);
  const [mapPinsState, setMapPinsState] = useState(MAP_PINS);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  useEffect(() => {
    const loadLiveData = async () => {
      try {
        console.log("⏳ Loading live data...");
        // DISABLED: These API calls consume Gemini quota!
        // Only load on manual request to preserve rate limit
        // const [weatherList, aqiList, disasterData] = await Promise.all([
        //   fetchMultipleWeatherData(),
        //   fetchMultipleAirQualityData(),
        //   fetchDisasterAlerts()
        // ]);

        // For now, use demo data to save quota
        const weatherList = [];
        const aqiList = [];
        const disasterData = { earthquakes: [], imdAlerts: [], lastUpdate: new Date() };

        setWeatherData(weatherList);
        setAirQualityData(aqiList);
        setDisasterAlerts(disasterData);
        setLastLiveUpdate(new Date());

        console.log("✅ Background data load skipped (quota preserved)");
      } catch (error) {
        console.error("❌ Live data load failed:", error);
      }
    };

    // Load once on mount only
    loadLiveData();

    // DISABLED: Automatic updates to preserve quota
    // const intervalId = setInterval(loadLiveData, 900000);
    // return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const broadcastEmergencyAlert = () => {
    const now = new Date();
    const alertItem = {
      type: "critical",
      icon: "📣",
      title: "National Emergency Broadcast Issued",
      desc: "ResQFlow has broadcast an urgent alert to all response zones and teams.",
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
    };
    setAlertList(prev => [alertItem, ...prev]);
    setBroadcastStatus("Broadcast sent to all zones successfully.");
    setTimeout(() => setBroadcastStatus(""), 6000);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input, time: "just now" };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      console.log("📨 Sending message with language:", lang);
      const botResponseText = await callGeminiAPI(
        userMsg.text,
        messages,
        lang,
        () => setApiAuthFailed(true)  // called when key is invalid/expired
      );

      if (!botResponseText) {
        throw new Error("Empty response from API");
      }

      setMessages(m => [...m, { role: "bot", text: botResponseText, time: "just now" }]);
    } catch (error) {
      console.error("Message sending error:", error);
      setMessages(m => [...m, {
        role: "bot",
        text: `🔴 Failed to send message\n\n${error.message}\n\nCheck the browser console (F12) for detailed error logs.`,
        time: "just now"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const triggerDetection = () => {
    setDetectionResult(null);
    fileInputRef.current?.click();
  };

  // ===== AUDIO RECORDING =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: audioType });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
    } catch (error) {
      alert("❌ Microphone access denied. Please allow microphone in browser settings.");
      console.error("Microphone error:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudioMessage = async (audioBlob) => {
    setLoading(true);
    setMessages(m => [...m, { role: "user", text: "🎙 [Audio message - transcribing...]", time: "just now" }]);
    setDetected(true);

    try {
      const dataUrl = await readFileAsDataUrl(audioBlob);
      const base64Audio = dataUrl.split(',')[1];

      const transcriptionPayload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: "Transcribe this audio and respond in " + lang + " language. Then answer the question if there is one." },
              {
                inlineData: {
                  mimeType: audioBlob.type || "audio/webm",
                  data: base64Audio
                }
              }
            ]
          }
        ],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transcriptionPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const botResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setMessages(m => [...m, { role: "bot", text: botResp || "❓ Could not process audio", time: "just now" }]);
      } else {
        const err = await response.json();
        setMessages(m => [...m, { role: "bot", text: `❌ Error: ${err.error?.message || "Audio processing failed"}`, time: "just now" }]);
      }
    } catch (error) {
      console.error("Audio send error:", error);
      setMessages(m => [...m, { role: "bot", text: `🔴 Error: ${error.message}`, time: "just now" }]);
    } finally {
      setLoading(false);
      setDetected(false);
    }
  };

  // ===== IMAGE/VIDEO UPLOAD =====
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("⚠️ Please select an image or video file");
      return;
    }

    setSelectedImage(file);
    setImagePreview(await readFileAsDataUrl(file));

    if (tab === "detection") {
      await sendImageMessage(file);
    }
  };

  const sendImageMessage = async (file = selectedImage) => {
    if (!file) {
      alert("Please select an image or video first");
      return;
    }

    setLoading(true);
    setDetected(true);
    const fileName = file.name;
    setMessages(m => [...m, { role: "user", text: `📷 [Image/Video: ${fileName}]\n\n🔍 Analyzing with Gemini Vision...`, time: "just now" }]);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const base64Image = dataUrl.split(',')[1];
      const mimeType = file.type;

      const visionPayload = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a disaster response AI. Analyze this image/video for:

1. Disaster type (flood, fire, earthquake damage, cyclone, landslide, etc.)
2. Severity level (low/medium/high/critical)
3. Immediate actions needed
4. Emergency contacts to call
5. Evacuation advice if needed
6. Structural safety assessment

Respond in ${lang} language. Be specific and actionable.`
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visionPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const visionResp = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setMessages(m => [...m, { role: "bot", text: visionResp || "❓ Could not analyze image", time: "just now" }]);
        setDetectionResult({ summary: visionResp || "Unable to interpret image content.", confidence: "N/A", model: "Gemini Vision" });
      } else {
        const err = await response.json();
        const errorText = err.error?.message || "Image analysis failed";
        setMessages(m => [...m, { role: "bot", text: `❌ Error: ${errorText}`, time: "just now" }]);
        setDetectionResult({ summary: errorText, confidence: "N/A", model: "Gemini Vision" });
      }
    } catch (error) {
      console.error("Image send error:", error);
      setMessages(m => [...m, { role: "bot", text: `🔴 Error: ${error.message}`, time: "just now" }]);
      setDetectionResult({ summary: error.message, confidence: "N/A", model: "Gemini Vision" });
    } finally {
      setLoading(false);
      setDetected(false);
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const fmt = d => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <>
      <style>{FONTS}{css}</style>
      <div className="app">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="logo-block">RQ</div>
          {[
            { id: "dashboard", icon: "⬡", label: "Dashboard" },
            { id: "alerts", icon: "⚡", label: "Alerts", badge: true },
            { id: "chat", icon: "◎", label: "Chatbot" },
            { id: "detection", icon: "◈", label: "Detect" },
            { id: "resources", icon: "⊞", label: "Resources" },
          ].map(n => (
            <button key={n.id} className={`nav-btn${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)} title={n.label}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.badge && <span className="badge" />}
            </button>
          ))}
          <div className="sidebar-bottom">
            <button className="nav-btn" title="Settings">⚙</button>
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <div>
              <div className="topbar-title">ResQFlow</div>
              <div className="topbar-sub">AI DISASTER RESPONSE SYSTEM · INDIA OPS</div>
            </div>
            <div className="topbar-right">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="status-dot" style={{ background: (HAS_GEMINI_API_KEY && !apiAuthFailed) ? "#00e5a0" : "#ffcc00" }} />
                <span className="status-text" style={{ color: (HAS_GEMINI_API_KEY && !apiAuthFailed) ? "#00e5a0" : "#ffcc00" }}>
                  {(HAS_GEMINI_API_KEY && !apiAuthFailed) ? "LIVE MODE (Gemini API)" : "DEMO MODE"}
                </span>
              </div>
              <div className={`alert-level ${alertList.some(a => a.type === "critical") ? "high" : "med"}`}>
                ALERT LVL: {alertList.some(a => a.type === "critical") ? "HIGH" : alertList.some(a => a.type === "warning") ? "MED" : "LOW"}
              </div>
              <div className="alert-level med">{Math.max(1, alertList.length)} ACTIVE ZONES</div>
              <div className="time-display">{fmt(time)} IST</div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleImageSelect}
            style={{ display: "none" }}
          />
          {/* CONTENT */}
          <div className="content">
            {/* DASHBOARD */}
            {tab === "dashboard" && (
              <>
                <div className="grid-3">
                  {[
                    { label: "ACTIVE INCIDENTS", val: "17", delta: "↑3 in last hour", cls: "up", bars: [30, 45, 50, 60, 55, 70, 72, 80, 78, 85, 90, 87], color: "#ff4d1c" },
                    { label: "PEOPLE EVACUATED", val: "24,810", delta: "↑1,200 today", cls: "ok", bars: [10, 20, 30, 45, 55, 65, 75, 80, 90, 95, 98, 100], color: "#00e5a0" },
                    { label: "RESPONDERS DEPLOYED", val: "1,342", delta: "↑84 dispatched", cls: "ok", bars: [40, 42, 55, 60, 65, 60, 70, 75, 78, 82, 85, 88], color: "#00aaff" },
                  ].map((s, i) => (
                    <div className="card" key={i}>
                      <div className="card-header">
                        <span className="card-title">{s.label}</span>
                        <span className="card-badge live">LIVE</span>
                      </div>
                      <div className="stat-big">{s.val}</div>
                      <div className={`stat-delta ${s.cls}`}>{s.delta}</div>
                      <div style={{ marginTop: 12 }}>
                        <MiniChart bars={s.bars} color={s.color} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid-2-1">
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Live Threat Map — India</span>
                      <span className="card-badge live">SATELLITE FEED</span>
                    </div>
                    <div className="map-area">
                      <div className="map-grid" />
                      <div className="map-scanline" />
                      {/* India-like shape hint */}
                      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .08 }} viewBox="0 0 400 280">
                        <ellipse cx="200" cy="130" rx="110" ry="110" fill="#00aaff" />
                        <polygon points="200,80 120,100 100,160 140,220 200,260 260,210 300,160 280,100" fill="#0a1e32" />
                      </svg>
                      {mapPinsState.map((p, i) => (
                        <div key={i} className="map-pin" style={{ left: p.left, top: p.top }}>
                          <div className="map-pin-ring" style={{ background: p.ring, top: -6, left: -6 }} />
                          <div className="map-pin-dot" style={{ background: p.color }} />
                          <div className="map-pin-label">{p.label}</div>
                        </div>
                      ))}
                      <div style={{ position: "absolute", bottom: 8, left: 10, fontFamily: "var(--mono)", fontSize: 9, color: "rgba(255,255,255,.25)" }}>
                        ResQFlow Satellite Grid v2.4 · Coverage: India + SAARC
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)", marginTop: 8 }}>
                      {weatherSummary ? weatherSummary.description : "Loading live weather conditions..."}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">AI Risk Prediction</span>
                      <span className="card-badge warn">72H FORECAST</span>
                    </div>
                    {predictionStats.map((p, i) => (
                      <div className="pred-bar-wrap" key={i}>
                        <span className="pred-label">{p.label}</span>
                        <div className="pred-bar">
                          <div className="pred-fill" style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}88, ${p.color})` }}>
                            {p.pct}%
                          </div>
                        </div>
                        <span className="pred-severity" style={{ color: p.pct > 60 ? "#ff4d1c" : "#ffcc00" }}>{p.severity}</span>
                      </div>
                    ))}
                    <hr className="section-divider" />
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)", lineHeight: 1.6 }}>
                      Model: LSTM + XGBoost ensemble<br />
                      Data: IMD · India seismic monitor · Delhi weather feed<br />
                      Updated: {fmt(lastLiveUpdate || time)}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Seismic Activity Monitor</span>
                    <span className="card-badge alert">LIVE FEED</span>
                  </div>
                  <SeismicChart />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)" }}>
                    <span>Station: DEL-001 · Lat 28.6°N</span>
                    <span style={{ color: "#ff8c00" }}>Last event: M4.1 · 14m ago</span>
                    <span>Threshold alert: M5.0+</span>
                  </div>
                </div>
              </>
            )}

            {/* ALERTS TAB */}
            {tab === "alerts" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontFamily: "var(--head)", fontWeight: 700, fontSize: 16, color: "#fff" }}>Active Incident Alerts</span>
                  <span className="card-badge alert">{Math.max(1, alertList.length)} ALERTS · {alertList.filter(a => a.type === "critical").length} CRITICAL</span>
                </div>
                {alertList.map((a, i) => (
                  <div key={i} className={`alert-item ${a.type}`}>
                    <span className="alert-icon">{a.icon}</span>
                    <div className="alert-content">
                      <div className="alert-title">{a.title}</div>
                      <div className="alert-desc">{a.desc}</div>
                    </div>
                    <span className="alert-time">{a.time}</span>
                  </div>
                ))}
                <button className="sos-btn" onClick={broadcastEmergencyAlert}>🆘 BROADCAST EMERGENCY ALERT TO ALL ZONES</button>
                {broadcastStatus && (
                  <div style={{ marginTop: 12, fontFamily: "var(--mono)", fontSize: 11, color: "#00e5a0" }}>
                    {broadcastStatus}
                  </div>
                )}
              </>
            )}

            {/* CHATBOT TAB */}
            {tab === "chat" && (
              <div className="card" style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", padding: 0 }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "var(--head)", fontWeight: 700, fontSize: 15, color: "#fff" }}>ResQFlow Multilingual Assistant</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)" }}>
                      {HAS_GEMINI_API_KEY ? "✅ Live Gemini API Connected" : "⚠️ DEMO MODE - Configure Gemini API below"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {!HAS_GEMINI_API_KEY && (
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 10, color: "#ffcc00", textDecoration: "underline", cursor: "pointer", padding: "4px 8px" }}>
                        🔑 Get Gemini Key
                      </a>
                    )}
                    {["EN", "HI", "TA", "BN", "TE"].map(l => (
                      <span key={l} className={`lang-pill${lang === l ? " sel" : ""}`} onClick={() => setLang(l)}>{l}</span>
                    ))}
                  </div>
                </div>
                <div className="chat-messages" style={{ flex: 1, padding: 16 }}>
                  {messages.map((m, i) => (
                    <div key={i} className={`msg ${m.role}`}>
                      <div className="msg-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                      <div className="msg-meta">{m.role === "bot" ? "🤖 ResQFlow AI" : "👤 You"} · {m.time}</div>
                    </div>
                  ))}
                  {loading && (
                    <div className="msg bot">
                      <div className="msg-bubble">
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="chat-input-area">
                  <div className="chat-modes">
                    {[["text", "💬 Text"], ["audio", "🎙 Audio"], ["image", "📷 Image/Video"]].map(([k, label]) => (
                      <button key={k} className={`mode-btn${inputMode === k ? " active" : ""}`} onClick={() => setInputMode(k)}>{label}</button>
                    ))}
                  </div>
                  {inputMode === "text" && (
                    <div className="chat-row">
                      <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        placeholder="Ask about floods, evacuation, first aid, shelters... (EN / HI / TA)" />
                      <button className="chat-send" onClick={sendMessage}>➤</button>
                    </div>
                  )}
                  {inputMode === "audio" && (
                    <div style={{ textAlign: "center", padding: "12px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--dim)", background: "var(--bg3)", borderRadius: 8 }}>
                      {!recording ? (
                        <>
                          <button
                            onClick={startRecording}
                            style={{
                              background: "linear-gradient(135deg, #00e5a0, #00aa88)",
                              border: "none",
                              color: "#fff",
                              padding: "10px 20px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "bold",
                              marginBottom: "8px"
                            }}
                          >
                            🎙 Start Recording
                          </button>
                          <div style={{ fontSize: 10, color: "var(--info)" }}>
                            Tap to record your question · Supports regional accents
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 16, fontWeight: "bold", color: "#ff4d1c", marginBottom: "8px" }}>
                            ⏺ Recording... {recordingTime}s
                          </div>
                          <button
                            onClick={stopRecording}
                            style={{
                              background: "#ff4d1c",
                              border: "none",
                              color: "#fff",
                              padding: "10px 20px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: "bold"
                            }}
                          >
                            ⏹ Stop & Send
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {inputMode === "image" && (
                    <div style={{ padding: "12px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--dim)" }}>
                      <div style={{ background: "var(--bg3)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            width: "100%",
                            background: "rgba(0, 170, 255, 0.2)",
                            border: "2px dashed rgba(0, 170, 255, 0.4)",
                            color: "var(--info)",
                            padding: "16px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}
                        >
                          {selectedImage ? `✅ Selected: ${selectedImage.name}` : "📷 Click to Select Image/Video"}
                        </button>
                      </div>
                      {imagePreview && (
                        <div style={{ marginBottom: 8 }}>
                          <img
                            src={imagePreview}
                            style={{ width: "100%", maxHeight: "120px", borderRadius: 8, objectFit: "cover" }}
                            alt="preview"
                          />
                        </div>
                      )}
                      {selectedImage && (
                        <button
                          onClick={() => sendImageMessage(selectedImage)}
                          disabled={loading}
                          style={{
                            width: "100%",
                            background: loading ? "#666" : "#00aaff",
                            border: "none",
                            color: "#fff",
                            padding: "10px",
                            borderRadius: "8px",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}
                        >
                          {loading ? "🔍 Analyzing..." : "🚀 Analyze with Gemini Vision"}
                        </button>
                      )}
                      <div style={{ fontSize: 10, color: "var(--info)", marginTop: 8 }}>
                        Detects: flood depth · fire spread · structural damage · crowd density
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DETECTION TAB */}
            {tab === "detection" && (
              <div className="grid-2">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">AI Vision Detection</span>
                    <span className="card-badge live">VISION</span>
                  </div>
                  <div className="detect-area" onClick={triggerDetection}>
                    {loading ? (
                      <>
                        <div className="detect-icon">⏳</div>
                        <div className="detect-text">Analyzing uploaded image/video... Please wait.</div>
                      </>
                    ) : (
                      <>
                        <div className="detect-icon">📷</div>
                        <div className="detect-text">Tap to upload a real image/video for disaster assessment.<br />Supports: CCTV · Drone · Satellite · Mobile</div>
                      </>
                    )}
                  </div>
                  {imagePreview && (
                    <div style={{ marginTop: 12 }}>
                      <img src={imagePreview} alt="preview" style={{ width: "100%", borderRadius: 10, maxHeight: 180, objectFit: "cover" }} />
                    </div>
                  )}
                  {detectionResult && (
                    <div className="detection-result">
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)", marginBottom: 6 }}>
                        Detection summary · Model: {detectionResult.model}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#fff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {detectionResult.summary}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)", marginTop: 8 }}>
                        Confidence: <span style={{ color: "#00e5a0" }}>{detectionResult.confidence}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Incident Feed</span>
                    <span className="card-badge warn">LIVE FEED</span>
                  </div>
                  {(earthquakeEvents.length ? earthquakeEvents : [
                    { label: "Fire — Uttarakhand forest zone", conf: "97.1%", color: "#ff4d1c", time: "31m ago" },
                    { label: "Flood waters — Yamuna bank", conf: "92.4%", color: "#00aaff", time: "1h ago" },
                    { label: "Crowd panic — Connaught Place", conf: "88.0%", color: "#ff8c00", time: "3h ago" },
                    { label: "Structural damage — Joshimath", conf: "95.6%", color: "#a78bfa", time: "5h ago" }
                  ]).map((event, i) => {
                    const log = earthquakeEvents.length ? {
                      label: `M${event.mag?.toFixed(1)} quake — ${event.place}`,
                      conf: `${Math.min(99, Math.round((event.severity || 50) * 0.8))}%`,
                      color: event.mag >= 5 ? "#ff4d1c" : event.mag >= 3 ? "#ff8c00" : "#00aaff",
                      time: `${Math.max(1, Math.round((Date.now() - event.time) / 60000))}m ago`
                    } : event;
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)" }}>{log.label}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: log.color }}>{log.conf}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)" }}>{log.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESOURCES TAB */}
            {tab === "resources" && (
              <div className="grid-2">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Resource Utilization</span>
                    <span className="card-badge live">REAL-TIME</span>
                  </div>
                  {resourceStats.map((r, i) => (
                    <div className="resource-row" key={i}>
                      <span className="resource-name">{r.name}</span>
                      <div className="resource-bar">
                        <div className="resource-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                      </div>
                      <span className="resource-pct">{r.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Deployed Teams — Zone Status</span>
                    <span className="card-badge alert">6 ACTIVE</span>
                  </div>
                  {[
                    { zone: "Delhi NCR", team: "NDRF Team Alpha", status: "🟢 Active", task: "Flood rescue" },
                    { zone: "Uttarakhand", team: "Fire Brigade Echo", status: "🔴 Critical", task: "Wildfire containment" },
                    { zone: "Mumbai", team: "Coast Guard Delta", status: "🟡 Standby", task: "Cyclone prep" },
                    { zone: "Chennai", team: "Medical Unit Bravo", status: "🟢 Active", task: "Evacuation" },
                    { zone: "Kolkata", team: "Army Corp Charlie", status: "🟢 Active", task: "Flood barriers" },
                  ].map((z, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontFamily: "var(--head)", fontWeight: 600, fontSize: 13, color: "#fff" }}>{z.zone} · {z.team}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)" }}>{z.task}</div>
                      </div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{z.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<ResQFlow />);
}
