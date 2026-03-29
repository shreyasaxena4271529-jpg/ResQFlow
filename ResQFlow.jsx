const { useState, useEffect, useRef } = React;

// ============ GOOGLE GEMINI API CONFIG ============
// Get free API key from: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = "AIzaSyDWoYv-7dlX2vaeJ2sbW2aX5i0C4bzvw3A";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const HAS_GEMINI_API_KEY = GEMINI_API_KEY && !GEMINI_API_KEY.includes("Demo");

const SYSTEM_PROMPT = `You are ResQFlow, an expert multilingual disaster response & emergency management AI assistant. You are deployed in India to help citizens during natural disasters and emergencies.

CORE RESPONSIBILITIES:
• Provide immediate emergency guidance for floods, earthquakes, fires, cyclones, landslides
• Give evacuation routes and nearest shelter locations
• Emergency contacts: Police 100, Fire 101, Ambulance 102, NDRF 011-24363260, Disaster Helpline 1078
• Offer first aid advice and medical guidance
• Support multiple languages: English, Hindi, Tamil, Telugu, Bengali
• Provide real-time risk assessments and safety protocols

BEHAVIOR:
• Be urgent but calm in emergencies
• Always prioritize human safety
• Provide actionable steps
• Include relevant emergency numbers
• Be empathetic to people in distress
• If unsure about specifics, suggest contacting local authorities

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

async function callGeminiAPI(userMessage, conversationHistory) {
  try {
    if (!HAS_GEMINI_API_KEY) {
      return "⚠️ API Key not configured\n\nTo enable live AI responses:\n1. Get free API key: https://aistudio.google.com/app/apikey\n2. Replace GEMINI_API_KEY in the code\n3. Refresh the page\n\nFor now, using demo responses. Emergency contacts: NDRF 011-24363260 | Emergency 112";
    }

    console.log("🔄 Sending to Gemini API...");
    console.log("User message:", userMessage);
    console.log("Conversation history:", conversationHistory);

    // Build conversation context - filter out non-user/bot messages
    const messages = conversationHistory
      .filter(m => m.role === "user" || m.role === "bot")
      .map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

    console.log("📤 Formatted messages for API:", messages);

    const requestBody = {
      contents: messages,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    };

    console.log("📡 API Request URL:", `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 20)}...`);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    console.log("📥 API Response Status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Gemini API Error:", error);
      
      if (response.status === 429) {
        return "⏱️ API rate limit reached. Please wait a moment before sending another message.";
      } else if (response.status === 400) {
        return "❌ API Configuration Error. Please check your API key and try again.";
      } else if (response.status === 401 || response.status === 403) {
        return "🔑 Invalid API Key. Please verify your key is correct and has access to Gemini API.";
      } else {
        return `❌ API Error (${response.status}): ${error.error?.message || "Unknown error occurred"}`;
      }
    }

    const data = await response.json();
    console.log("✅ API Response:", data);

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      console.warn("⚠️ No text in response:", data);
      return "❓ No response received. Please try again.";
    }

    console.log("🤖 AI Response:", aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("🔴 API Call Error:", error);
    return `🔴 Connection Error: ${error.message}\n\nMake sure:\n• API key is valid\n• Internet connection is active\n• Check browser console for details`;
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
  const [messages, setMessages] = useState([
    { role: "bot", text: "🤖 ResQFlow AI Assistant Ready\n\n📌 SETUP REQUIRED:\n1. Visit: https://aistudio.google.com/app/apikey\n2. Get your free Google Gemini API key\n3. Open this file and replace GEMINI_API_KEY at line 5\n4. Refresh this page\n\n⚡ Features (once API key added):\n• Real-time disaster guidance\n• Multilingual support (EN, HI, TA, BN, TE)\n• Emergency contact information\n• Evacuation routes & shelters\n• First aid advice\n\nFor demo, try asking about: floods, earthquakes, fires, evacuation, shelters", time: "now" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const [lang, setLang] = useState("EN");
  const [detectionResult, setDetectionResult] = useState(null);
  const chatEndRef = useRef(null);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input, time: "just now" };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Pass entire conversation history to API for context
      const botResponseText = await callGeminiAPI(userMsg.text, updatedMessages);
      setMessages(m => [...m, { role: "bot", text: botResponseText, time: "just now" }]);
    } catch (error) {
      console.error("Message sending error:", error);
      setMessages(m => [...m, { 
        role: "bot", 
        text: "🔴 Failed to send message. Check console and API key configuration.", 
        time: "just now" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const triggerDetection = () => {
    setDetected(true);
    setTimeout(() => {
      setDetectionResult({ tags: ["fire", "flood", "crowd"], confidence: "94.2%", model: "YOLOv8 + ResNet-50" });
    }, 1500);
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
                <div className="status-dot" style={{ background: HAS_GEMINI_API_KEY ? "#00e5a0" : "#ffcc00" }} />
                <span className="status-text" style={{ color: HAS_GEMINI_API_KEY ? "#00e5a0" : "#ffcc00" }}>
                  {HAS_GEMINI_API_KEY ? "LIVE MODE (Gemini API)" : "DEMO MODE (No API)"}
                </span>
              </div>
              <div className="alert-level high">ALERT LVL: HIGH</div>
              <div className="alert-level med">3 ACTIVE ZONES</div>
              <div className="time-display">{fmt(time)} IST</div>
            </div>
          </div>
          {/* CONTENT */}
          <div className="content">
            {/* DASHBOARD */}
            {tab === "dashboard" && (
              <>
                <div className="grid-3">
                  {[
                    { label: "ACTIVE INCIDENTS", val: "17", delta: "↑3 in last hour", cls: "up", bars: [30,45,50,60,55,70,72,80,78,85,90,87], color: "#ff4d1c" },
                    { label: "PEOPLE EVACUATED", val: "24,810", delta: "↑1,200 today", cls: "ok", bars: [10,20,30,45,55,65,75,80,90,95,98,100], color: "#00e5a0" },
                    { label: "RESPONDERS DEPLOYED", val: "1,342", delta: "↑84 dispatched", cls: "ok", bars: [40,42,55,60,65,60,70,75,78,82,85,88], color: "#00aaff" },
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
                      {MAP_PINS.map((p, i) => (
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
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">AI Risk Prediction</span>
                      <span className="card-badge warn">72H FORECAST</span>
                    </div>
                    {PREDICTIONS.map((p, i) => (
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
                      Data: IMD · USGS · MODIS satellite<br />
                      Updated: {fmt(time)}
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
                  <span className="card-badge alert">5 ALERTS · 2 CRITICAL</span>
                </div>
                {ALERTS.map((a, i) => (
                  <div key={i} className={`alert-item ${a.type}`}>
                    <span className="alert-icon">{a.icon}</span>
                    <div className="alert-content">
                      <div className="alert-title">{a.title}</div>
                      <div className="alert-desc">{a.desc}</div>
                    </div>
                    <span className="alert-time">{a.time}</span>
                  </div>
                ))}
                <button className="sos-btn">🆘 BROADCAST EMERGENCY ALERT TO ALL ZONES</button>
              </>
            )}

            {/* CHATBOT TAB */}
            {tab === "chat" && (
              <div className="card" style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", padding: 0 }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "var(--head)", fontWeight: 700, fontSize: 15, color: "#fff" }}>ResQFlow Multilingual Assistant</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)" }}>
                      {HAS_GEMINI_API_KEY ? "✅ Live Gemini API Connected" : "⚠️ DEMO MODE - Configure API below"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {!HAS_GEMINI_API_KEY && (
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                        style={{ fontSize: 10, color: "#ffcc00", textDecoration: "underline", cursor: "pointer", padding: "4px 8px" }}>
                        🔑 Get API Key
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
                    {[["text","💬 Text"], ["audio","🎙 Audio"], ["image","📷 Image/Video"]].map(([k, label]) => (
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
                    <div style={{ textAlign: "center", padding: "12px 0", fontFamily: "var(--mono)", fontSize: 12, color: "var(--dim)" }}>
                      🎙 Tap to record voice input · Supports regional accents<br />
                      <span style={{ color: "var(--info)", fontSize: 10 }}>Transcription via Whisper · Responds in selected language</span>
                    </div>
                  )}
                  {inputMode === "image" && (
                    <div style={{ textAlign: "center", padding: "12px 0", fontFamily: "var(--mono)", fontSize: 12, color: "var(--dim)" }}>
                      📷 Upload photo or video for AI damage assessment<br />
                      <span style={{ color: "var(--info)", fontSize: 10 }}>Gemini Vision · Detects: flood depth, fire spread, structural damage</span>
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
                    <span className="card-badge live">YOLOv8</span>
                  </div>
                  <div className="detect-area" onClick={triggerDetection}>
                    {!detected ? (
                      <>
                        <div className="detect-icon">📹</div>
                        <div className="detect-text">Click to simulate image/video upload<br />Supports: CCTV · Drone · Satellite · Mobile</div>
                      </>
                    ) : (
                      <>
                        <div className="detect-icon">⏳</div>
                        <div className="detect-text">Analyzing with YOLOv8 + ResNet-50...</div>
                      </>
                    )}
                  </div>
                  {detectionResult && (
                    <div className="detection-result">
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)", marginBottom: 6 }}>
                        Detection complete · Confidence: <span style={{ color: "#00e5a0" }}>{detectionResult.confidence}</span>
                      </div>
                      <span className="detection-tag fire">🔥 Fire Detected</span>
                      <span className="detection-tag flood">🌊 Flood Waters</span>
                      <span className="detection-tag crowd">👥 Crowd Density: HIGH</span>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)", marginTop: 8 }}>
                        Model: {detectionResult.model} · Auto-alert sent to NDRF
                      </div>
                    </div>
                  )}
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Detection Feed Log</span>
                    <span className="card-badge warn">LAST 24H</span>
                  </div>
                  {[
                    { label: "Fire — Uttarakhand forest zone", conf: "97.1%", color: "#ff4d1c", time: "31m ago" },
                    { label: "Flood waters — Yamuna bank", conf: "92.4%", color: "#00aaff", time: "1h ago" },
                    { label: "Crowd panic — Connaught Place", conf: "88.0%", color: "#ff8c00", time: "3h ago" },
                    { label: "Structural damage — Joshimath", conf: "95.6%", color: "#a78bfa", time: "5h ago" },
                  ].map((d, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)" }}>{d.label}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: d.color }}>{d.conf}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--dim)" }}>{d.time}</span>
                      </div>
                    </div>
                  ))}
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
                  {RESOURCES.map((r, i) => (
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
