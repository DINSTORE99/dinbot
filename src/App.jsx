import { useEffect, useState } from "react";
import "./style.css";

const API = "";

const TELEGRAM_BOT = "ISI_BOT_TOKEN";
const TELEGRAM_CHAT = "ISI_CHAT_ID";

function getBrowserInfo() {
  const ua = navigator.userAgent;

  let browser = "Unknown";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  let device = "Unknown";
  if (ua.includes("Android")) device = "Android";
  else if (ua.includes("iPhone")) device = "iPhone";
  else if (ua.includes("Windows")) device = "Windows";
  else if (ua.includes("Linux")) device = "Linux";

  return {
    browser,
    device,
  };
}

function sendOpenNotif() {
  if (
    TELEGRAM_BOT === "ISI_BOT_TOKEN" ||
    TELEGRAM_CHAT === "ISI_CHAT_ID"
  ) {
    return;
  }

  const info = getBrowserInfo();

  const message = `
🌐 WEBSITE DIN BOT DIBUKA

📱 Device : ${info.device}
🌍 Browser : ${info.browser}
⏰ Waktu : ${new Date().toLocaleString("id-ID")}
🔗 URL : ${window.location.href}
`;

  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT,
      text: message,
    }),
  }).catch(() => {});
}

export default function App() {

  const [page, setPage] = useState("dashboard");

  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);

  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [ping, setPing] = useState(0);

  const [lastUpdate, setLastUpdate] = useState("-");

  const [uptime, setUptime] = useState({
    hari: 0,
    jam: 0,
    menit: 0,
    detik: 0,
  });

  const [phoneNumber, setPhoneNumber] = useState("62");

  const [pairingCode, setPairingCode] = useState("");

  const [pairingSession, setPairingSession] = useState("");

  const [pairingLoading, setPairingLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const [logoutTarget, setLogoutTarget] = useState(null);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const [logoutNumber, setLogoutNumber] = useState("");

  const [logoutMessage, setLogoutMessage] = useState("");

  const normalizeNumber = (number = "") => {

    number = String(number).replace(/\D/g, "");

    if (number.startsWith("0")) {
      number = "62" + number.slice(1);
    }

    if (number.startsWith("8")) {
      number = "62" + number;
    }

    return number;

  };

  const showMessage = (text) => {

    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3000);

  };
  /* =========================================
   LOAD STATUS
========================================= */

const loadStatus = async () => {

  try {

    setLoading(true);

    const start = performance.now();

    const response = await fetch(`${API}/api/status`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Server Error");
    }

    const data = await response.json();

    const end = performance.now();

    setPing(Math.round(end - start));

    setServerOnline(data.server === "online");

    setBotConnected(data.botConnected === true);

    setSessions(Array.isArray(data.sessions) ? data.sessions : []);

    setUptime(
      data.uptime || {
        hari: 0,
        jam: 0,
        menit: 0,
        detik: 0,
      }
    );

    setLastUpdate(
      new Date().toLocaleTimeString("id-ID")
    );

  } catch (err) {

    console.error(err);

    setServerOnline(false);
    setBotConnected(false);
    setSessions([]);

    setPing(0);

    setUptime({
      hari: 0,
      jam: 0,
      menit: 0,
      detik: 0,
    });

  } finally {

    setLoading(false);

  }

};

/* =========================================
   AUTO REFRESH
========================================= */

useEffect(() => {

  sendOpenNotif();

  loadStatus();

  const interval = setInterval(() => {

    loadStatus();

  }, 5000);

  return () => clearInterval(interval);

}, []);

/* =========================================
   START PAIRING
========================================= */

const startPairing = async () => {

  if (!phoneNumber.trim()) {
    return showMessage("Masukkan nomor WhatsApp.");
  }

  try {

    setPairingLoading(true);

    setPairingCode("");

    setCopied(false);

    const response = await fetch(`${API}/api/pair`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        number: normalizeNumber(phoneNumber),
      }),

    });

    const data = await response.json();

    if (!data.success) {

      showMessage(data.message || "Pairing gagal.");

      return;

    }

    setPairingSession(data.sessionId);

    if (data.pairingCode) {

      setPairingCode(data.pairingCode);

      showMessage("Pairing Code berhasil dibuat.");

      return;

    }

    let retry = 0;

    const timer = setInterval(async () => {

      retry++;

      try {

        const res = await fetch(
          `${API}/api/pairing/${encodeURIComponent(data.sessionId)}`,
          {
            cache: "no-store",
          }
        );

        const result = await res.json();

        if (result.code) {

          clearInterval(timer);

          setPairingCode(result.code);

          showMessage("Pairing Code berhasil dibuat.");

        }

        if (result.connected) {

          clearInterval(timer);

          showMessage("WhatsApp berhasil terhubung.");

          loadStatus();

        }

        if (retry >= 30) {

          clearInterval(timer);

          if (!result.code) {

            showMessage("Waktu pairing habis.");

          }

        }

      } catch (err) {

        console.error(err);

      }

    }, 2000);

  } catch (err) {

    console.error(err);

    showMessage("Tidak dapat menghubungi server.");

  } finally {

    setPairingLoading(false);

  }

};

/* =========================================
   COPY PAIRING
========================================= */

const copyPairingCode = async () => {

  if (!pairingCode) return;

  try {

    await navigator.clipboard.writeText(pairingCode);

    setCopied(true);

    showMessage("Pairing Code berhasil disalin.");

    setTimeout(() => {

      setCopied(false);

    }, 2000);

  } catch {

    showMessage("Gagal menyalin Pairing Code.");

  }

};
  /* =========================================
   LOGOUT
========================================= */

const openLogoutModal = (session) => {

  setLogoutTarget(session);

  setLogoutNumber("");

  setLogoutMessage("");

};

const closeLogoutModal = () => {

  if (logoutLoading) return;

  setLogoutTarget(null);

  setLogoutNumber("");

  setLogoutMessage("");

};

const confirmLogout = async () => {

  if (!logoutTarget) return;

  const input = normalizeNumber(logoutNumber);

  const target = normalizeNumber(
    logoutTarget.number || logoutTarget.sessionId
  );

  if (input !== target) {

    setLogoutMessage("Nomor tidak cocok.");

    return;

  }

  try {

    setLogoutLoading(true);

    const response = await fetch(`${API}/api/logout`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        sessionId: logoutTarget.sessionId,
      }),

    });

    const data = await response.json();

    if (!data.success) {

      setLogoutMessage(
        data.message || "Logout gagal."
      );

      return;

    }

    closeLogoutModal();

    showMessage("Session berhasil logout.");

    loadStatus();

  } catch {

    setLogoutMessage("Server Error.");

  } finally {

    setLogoutLoading(false);

  }

};

/* =========================================
   DASHBOARD
========================================= */

const renderDashboard = () => (

<div className="page-content">

<header className="topbar">

<div>

<span className="eyebrow">
DIN BOT PANEL
</span>

<h1>Dashboard</h1>

<p>
Kelola WhatsApp Bot dengan mudah.
</p>

</div>

<div className="dashboard-buttons">

<button
className="refresh-button"
onClick={loadStatus}
disabled={loading}
>

{loading ? "Loading..." : "↻ Refresh"}

</button>

<button
className="monitor-button"
onClick={() => setPage("monitor")}
>

📊 Monitoring

</button>

</div>

</header>

<section className="stats-grid">

<div className="stat-card">

<div className="stat-icon purple">
⚡
</div>

<div>

<span>API SERVER</span>

<h3>

{serverOnline ? "Online" : "Offline"}

</h3>

<small
className={
serverOnline ? "online" : "offline"
}
>

● {serverOnline ? `${ping} ms` : "OFFLINE"}

</small>

</div>

</div>

<div className="stat-card">

<div className="stat-icon green">
🤖
</div>

<div>

<span>BOT</span>

<h3>

{botConnected ? "Connected" : "Offline"}

</h3>

<small
className={
botConnected ? "online" : "waiting"
}
>

● {botConnected ? "CONNECTED" : "WAITING"}

</small>

</div>

</div>

<div
className="stat-card"
onClick={() => setPage("sessions")}
style={{
cursor: "pointer"
}}
>

<div className="stat-icon blue">

📱

</div>

<div>

<span>SESSIONS</span>

<h3>{sessions.length}</h3>

<small>

LIHAT SEMUA

</small>

</div>

</div>

</section>

<section className="hero-card">

<div className="hero-content">

<span className="hero-label">

DIN BOT V1.0.0

</span>

<h2>

WhatsApp Bot Panel

</h2>

<p>

Hubungkan WhatsApp,
lihat Pairing Code,
dan kelola semua Session.

</p>

<button
className="hero-button"
onClick={() => setPage("pairing")}
>

Hubungkan WhatsApp →

</button>

</div>

<div className="hero-orb">

<div className="orb-inner">

🤖

</div>

</div>

</section>

<section className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">

SYSTEM

</span>

<h2>

Informasi Sistem

</h2>

</div>

<div className="status-pill">

<span />

{serverOnline ? "ACTIVE" : "OFFLINE"}

</div>

</div>

<div className="info-grid">

<div className="info-item">

<span>Website</span>

<strong>DIN BOT</strong>

</div>

<div className="info-item">

<span>Version</span>

<strong>V1.0.0</strong>

</div>

<div className="info-item">

<span>Platform</span>

<strong>WhatsApp</strong>

</div>

<div className="info-item">

<span>Last Update</span>

<strong>{lastUpdate}</strong>

</div>

</div>

</section>

</div>

);

/* =========================================
   MONITORING SERVER
========================================= */

const renderMonitor = () => (

<div className="page-content">

<header className="topbar">

<div>

<span className="eyebrow">
DIN BOT / MONITOR
</span>

<h1>Monitoring Server</h1>

<p>
Monitoring status server secara realtime.
</p>

</div>

<div className="dashboard-buttons">

<button
className="refresh-button"
onClick={loadStatus}
>

↻ Refresh

</button>

<button
className="monitor-button"
onClick={() => setPage("dashboard")}
>

← Dashboard

</button>

</div>

</header>

<section className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">

SERVER STATUS

</span>

<h2>

Realtime Monitoring

</h2>

</div>

<div
className={
serverOnline
? "status-pill"
: "status-pill offline"
}
>

<span />

{serverOnline
? "ONLINE"
: "OFFLINE"}

</div>

</div>

<div className="monitor-grid">

<div className="monitor-card">

<div className="monitor-icon">

⚡

</div>

<span>Ping</span>

<h2>

{ping} ms

</h2>

</div>

<div className="monitor-card">

<div className="monitor-icon">

🌐

</div>

<span>API</span>

<h2>

{serverOnline
? "Online"
: "Offline"}

</h2>

</div>

<div className="monitor-card">

<div className="monitor-icon">

🤖

</div>

<span>Bot</span>

<h2>

{botConnected
? "Connected"
: "Offline"}

</h2>

</div>

<div className="monitor-card">

<div className="monitor-icon">

📱

</div>

<span>Sessions</span>

<h2>

{sessions.length}

</h2>

</div>

</div>

</section>

<section className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">

UPTIME

</span>

<h2>

Server Uptime

</h2>

</div>

</div>

<div className="stats-grid">

<div className="stat-card">

<div className="stat-icon purple">

📅

</div>

<div>

<span>Hari</span>

<h3>{uptime.hari}</h3>

</div>

</div>

<div className="stat-card">

<div className="stat-icon blue">

🕒

</div>

<div>

<span>Jam</span>

<h3>{uptime.jam}</h3>

</div>

</div>

<div className="stat-card">

<div className="stat-icon green">

⏱️

</div>

<div>

<span>Menit</span>

<h3>{uptime.menit}</h3>

</div>

</div>

<div className="stat-card">

<div className="stat-icon purple">

⏲️

</div>

<div>

<span>Detik</span>

<h3>{uptime.detik}</h3>

</div>

</div>

</div>

</section>

<section className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">

DETAIL SERVER

</span>

<h2>

Informasi

</h2>

</div>

</div>

<div className="info-grid">

<div className="info-item">

<span>Status API</span>

<strong>

{serverOnline
? "ONLINE"
: "OFFLINE"}

</strong>

</div>

<div className="info-item">

<span>Status Bot</span>

<strong>

{botConnected
? "CONNECTED"
: "DISCONNECTED"}

</strong>

</div>

<div className="info-item">

<span>Ping</span>

<strong>

{ping} ms

</strong>

</div>

<div className="info-item">

<span>Last Update</span>

<strong>

{lastUpdate}

</strong>

</div>

</div>

</section>

</div>

);
  /* =========================================
   PAIRING
========================================= */

const renderPairing = () => (

<div className="page-content">

<header className="topbar">

<div>

<span className="eyebrow">
DIN BOT / PAIRING
</span>

<h1>Hubungkan WhatsApp</h1>

<p>
Masukkan nomor WhatsApp untuk mendapatkan Pairing Code.
</p>

</div>

<div className="dashboard-buttons">

<button
className="refresh-button"
onClick={loadStatus}
>

↻ Refresh

</button>

<button
className="monitor-button"
onClick={() => setPage("dashboard")}
>

← Dashboard

</button>

</div>

</header>

<div className="pairing-layout">

{/* INPUT */}

<div className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">
LANGKAH 1
</span>

<h2>Nomor WhatsApp</h2>

</div>

</div>

<div className="phone-form">

<label>Nomor WhatsApp</label>

<div className="phone-input">

<div className="country-code">
+62
</div>

<input
type="tel"
placeholder="81234567890"
value={phoneNumber.replace(/^62/, "")}
onChange={(e)=>{

const value=e.target.value.replace(/\D/g,"");

setPhoneNumber("62"+value);

}}
/>

</div>

<button
className="pair-button"
onClick={startPairing}
disabled={
pairingLoading ||
!serverOnline
}
>

{
pairingLoading
? "Memproses..."
: "Hubungkan WhatsApp"
}

</button>

</div>

</div>

{/* HASIL */}

<div className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">
LANGKAH 2
</span>

<h2>Pairing Code</h2>

</div>

</div>

{
!pairingCode ?

(

<div className="empty-code">

<div className="empty-icon">

📱

</div>

<h3>

Belum Ada Pairing Code

</h3>

<p>

Masukkan nomor WhatsApp kemudian tekan tombol Hubungkan.

</p>

</div>

)

:

(

<div className="pairing-result">

<div className="pairing-box">

{pairingCode}

</div>

<button
className="copy-button"
onClick={copyPairingCode}
>

{
copied
? "✓ Berhasil Disalin"
: "📋 Salin Pairing Code"
}

</button>

</div>

)

}

</div>

</div>

<section className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">
PETUNJUK
</span>

<h2>Cara Pairing</h2>

</div>

</div>

<div className="steps">

<div className="step">

<div className="step-number">
1
</div>

<div>

<strong>Masukkan Nomor</strong>

<p>
Gunakan format 08xxxxxxxxxx.
</p>

</div>

</div>

<div className="step">

<div className="step-number">
2
</div>

<div>

<strong>Dapatkan Pairing Code</strong>

<p>
Tekan tombol Hubungkan WhatsApp.
</p>

</div>

</div>

<div className="step">

<div className="step-number">
3
</div>

<div>

<strong>Masukkan ke WhatsApp</strong>

<p>
Buka WhatsApp → Perangkat Tertaut → Tautkan dengan nomor.
</p>

</div>

</div>

</div>

</section>

</div>

);/* =========================================
   SESSIONS
========================================= */

const renderSessions = () => (

<div className="page-content">

<header className="topbar">

<div>

<span className="eyebrow">
DIN BOT / SESSIONS
</span>

<h1>Daftar Session</h1>

<p>
Semua perangkat WhatsApp yang terhubung.
</p>

</div>

<div className="dashboard-buttons">

<button
className="refresh-button"
onClick={loadStatus}
>

↻ Refresh

</button>

<button
className="monitor-button"
onClick={() => setPage("dashboard")}
>

← Dashboard

</button>

</div>

</header>

<section className="content-card">

<div className="section-title">

<div>

<span className="eyebrow">
TOTAL
</span>

<h2>

{sessions.length} Session

</h2>

</div>

</div>

{
sessions.length === 0 ?

(

<div className="empty-code">

<div className="empty-icon">

📱

</div>

<h3>

Belum Ada Session

</h3>

<p>

Silakan hubungkan WhatsApp terlebih dahulu.

</p>

</div>

)

:

(

<div className="session-list">

{

sessions.map((item,index)=>(

<div
className="session-card"
key={index}
>

<div className="session-info">

<h3>

{item.name || "WhatsApp"}

</h3>

<p>

{item.number}

</p>

<small>

Session :
{item.sessionId}

</small>

</div>

<div className="session-status">

<span
className={
item.connected
? "online"
: "offline"
}
>

●

{
item.connected
? "ONLINE"
: "OFFLINE"
}

</span>

<button
className="logout-button"
onClick={()=>openLogoutModal(item)}
>

Logout

</button>

</div>

</div>

))

}

</div>

)

}

</section>

{

logoutTarget && (

<div className="modal-overlay">

<div className="modal">

<h2>

Konfirmasi Logout

</h2>

<p>

Masukkan nomor WhatsApp untuk melanjutkan logout.

</p>

<input
type="text"
placeholder="628xxxxxxxxxx"
value={logoutNumber}
onChange={(e)=>setLogoutNumber(e.target.value)}
/>

{

logoutMessage && (

<p className="error-text">

{logoutMessage}

</p>

)

}

<div className="modal-buttons">

<button
onClick={closeLogoutModal}
>

Batal

</button>

<button
onClick={confirmLogout}
disabled={logoutLoading}
>

{

logoutLoading
? "Memproses..."
: "Logout"

}

</button>

</div>

</div>

</div>

)

}

</div>

);
/* =========================================
   MAIN RENDER
========================================= */

return (

<div className="app">

{/* PAGE */}

{page === "dashboard" && renderDashboard()}

{page === "monitor" && renderMonitor()}

{page === "pairing" && renderPairing()}

{page === "sessions" && renderSessions()}

{/* TOAST */}

{message && (

<div className="toast">

{message}

</div>

)}

{/* BOTTOM NAV */}

<nav className="bottom-nav">

<button
className={page==="dashboard"?"active":""}
onClick={()=>setPage("dashboard")}
>

<span>🏠</span>

<small>Home</small>

</button>

<button
className={page==="monitor"?"active":""}
onClick={()=>{

loadStatus();

setPage("monitor");

}}
>

<span>📊</span>

<small>Monitor</small>

</button>

<button
className={page==="pairing"?"active":""}
onClick={()=>setPage("pairing")}
>

<span>🔗</span>

<small>Pairing</small>

</button>

<button
className={page==="sessions"?"active":""}
onClick={()=>{

loadStatus();

setPage("sessions");

}}
>

<span>📱</span>

<small>Sessions</small>

</button>

</nav>

</div>

);

}
