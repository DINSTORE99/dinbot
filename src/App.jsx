import { useEffect, useState } from "react";
import "./style.css";

const API = "";

const TELEGRAM_BOT = "ISI_BOT_TOKEN";
const TELEGRAM_CHAT = "ISI_CHAT_ID";

/* =========================================
   DEVICE INFO
========================================= */

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

/* =========================================
   TELEGRAM OPEN NOTIF
========================================= */

function sendOpenNotif() {
  const info = getBrowserInfo();

  const message = `
🌐 WEBSITE DIN BOT DIBUKA

📱 Device : ${info.device}
🌍 Browser : ${info.browser}
⏰ Waktu : ${new Date().toLocaleString()}
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

/* =========================================
   APP
========================================= */

export default function App() {

  /* PAGE */

  const [page, setPage] = useState("dashboard");

  /* STATUS */

  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [ping, setPing] = useState(0);

  const [loading, setLoading] = useState(false);

  const [lastUpdate, setLastUpdate] = useState("-");

  const [message, setMessage] = useState("");

  /* UPTIME */

  const [uptime, setUptime] = useState({
    hari: 0,
    jam: 0,
    menit: 0,
    detik: 0,
  });

  /* PAIRING */

  const [phoneNumber, setPhoneNumber] = useState("");

  const [pairingCode, setPairingCode] = useState("");

  const [pairingSession, setPairingSession] = useState("");

  const [pairingLoading, setPairingLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  /* LOGOUT */

  const [logoutTarget, setLogoutTarget] = useState(null);

  const [logoutNumber, setLogoutNumber] = useState("");

  const [logoutLoading, setLogoutLoading] = useState(false);

  const [logoutMessage, setLogoutMessage] = useState("");

  /* =========================================
     FIRST LOAD
  ========================================= */

  useEffect(() => {
    sendOpenNotif();
  }, []);

  useEffect(() => {
    const audio = new Audio("/musik.mp3");

    audio.loop = true;
    audio.volume = 0.5;

    audio.play().catch(() => {});

    const play = () => {
      audio.play().catch(() => {});
    };

    document.addEventListener("click", play, {
      once: true,
    });

    document.addEventListener("touchstart", play, {
      once: true,
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

/* =========================================
   NORMALIZE NOMOR
========================================= */

const normalizeNumber = (number) => {
  let value = String(number || "").replace(/\D/g, "");

  if (value.startsWith("0")) {
    value = "62" + value.substring(1);
  }

  if (value.startsWith("8")) {
    value = "62" + value;
  }

  return value;
};

/* =========================================
   MASK NOMOR
========================================= */

const maskNumber = (number) => {
  if (!number) return "-";

  const value = String(number);

  if (value.length <= 4) {
    return value;
  }

  return (
    value.substring(0, 2) +
    "*".repeat(value.length - 4) +
    value.substring(value.length - 2)
  );
};

/* =========================================
   TOAST
========================================= */

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
      cache: "no-store"
    });

    const end = performance.now();

    const data = await response.json();

    setPing(Math.round(end - start));

    setServerOnline(data.server === "online");

    setBotConnected(data.botConnected === true);

    setSessions(
      Array.isArray(data.sessions)
        ? data.sessions
        : []
    );

    setUptime(
      data.uptime || {
        hari: 0,
        jam: 0,
        menit: 0,
        detik: 0
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
      detik: 0
    });

  } finally {

    setLoading(false);

  }
};

/* =========================================
   LOAD PERTAMA
========================================= */

useEffect(() => {
  loadStatus();
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
      return showMessage(
        data.message || "Pairing gagal."
      );
    }

    setPairingSession(data.sessionId);

    if (data.pairingCode) {
      setPairingCode(data.pairingCode);
    }

    showMessage("Menunggu kode pairing...");

  } catch (err) {

    console.error(err);

    showMessage("Tidak dapat menghubungi server.");

  } finally {

    setPairingLoading(false);

  }

};


// =====================================================
// DASHBOARD
// =====================================================

const renderDashboard = () => {
  return (
    <div className="page-content">

      {/* ================= HEADER ================= */}

      <header className="topbar">

        <div>

          <span className="eyebrow">
            PANEL BOT / DASHBOARD
          </span>

          <h1>WhatsApp Bot</h1>

          <p>
            Kelola koneksi WhatsApp dan perangkat bot
            dengan mudah.
          </p>

        </div>

        <div className="dashboard-buttons">

          <button
            className="refresh-button"
            onClick={loadStatus}
            disabled={loading}
          >
            {loading ? "Memuat..." : "↻ Refresh"}
          </button>

          <button
            className="monitor-button"
            onClick={() => setPage("monitor")}
          >
            📊 Monitoring
          </button>

        </div>

      </header>

      {/* ================= STATUS ================= */}

      <section className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon purple">
            ⚡
          </div>

          <div>

            <span>API SERVER</span>

            <h3>
              {serverOnline
                ? "Online"
                : "Offline"}
            </h3>

            <small
              className={
                serverOnline
                  ? "online"
                  : "offline"
              }
            >
              ● {serverOnline
                ? `ONLINE | ${ping} ms`
                : "SERVER OFFLINE"}
            </small>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon green">
            💬
          </div>

          <div>

            <span>WHATSAPP</span>

            <h3>
              {botConnected
                ? "Terhubung"
                : "Belum"}
            </h3>

            <small
              className={
                botConnected
                  ? "online"
                  : "waiting"
              }
            >
              ● {botConnected
                ? "CONNECTED"
                : "WAITING"}
            </small>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon blue">
            #
          </div>

          <div>

            <span>SESSIONS</span>

            <h3>{sessions.length}</h3>

            <small>
              SESSION AKTIF
            </small>

          </div>

        </div>

      </section>

      {/* ================= HERO ================= */}

      <section className="hero-card">

        <div className="hero-content">

          <span className="hero-label">
            DIN BOT V1.0.0
          </span>

          <h2>
            Kelola Bot WhatsApp dengan mudah.
          </h2>

          <p>
            Hubungkan perangkat WhatsApp,
            lihat pairing code,
            dan kelola session
            dari satu dashboard.
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

      {/* ================= SYSTEM ================= */}

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

            {serverOnline
              ? "ACTIVE"
              : "OFFLINE"}

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
};

// =====================================================
// MONITORING SERVER
// =====================================================

const renderMonitor = () => {
  return (
    <div className="page-content">

      <header className="topbar">

        <div>

          <span className="eyebrow">
            DIN BOT / MONITORING
          </span>

          <h1>Monitoring Server</h1>

          <p>
            Status server secara realtime.
          </p>

        </div>

        <button
          className="refresh-button"
          onClick={() => setPage("dashboard")}
        >
          ← Kembali
        </button>

      </header>

      {/* STATUS */}

      <section className="monitor-grid">

        <div className="monitor-card">

          <div className="monitor-icon">
            📡
          </div>

          <h3>Ping</h3>

          <h1>
            {serverOnline ? `${ping} ms` : "--"}
          </h1>

        </div>

        <div className="monitor-card">

          <div className="monitor-icon">
            📅
          </div>

          <h3>Hari</h3>

          <h1>{uptime.hari}</h1>

        </div>

        <div className="monitor-card">

          <div className="monitor-icon">
            🕒
          </div>

          <h3>Jam</h3>

          <h1>{uptime.jam}</h1>

        </div>

        <div className="monitor-card">

          <div className="monitor-icon">
            ⏱️
          </div>

          <h3>Menit</h3>

          <h1>{uptime.menit}</h1>

        </div>

        <div className="monitor-card">

          <div className="monitor-icon">
            ⏲️
          </div>

          <h3>Detik</h3>

          <h1>{uptime.detik}</h1>

        </div>

      </section>

      <section className="content-card">

        <div className="section-title">

          <div>

            <span className="eyebrow">
              SERVER STATUS
            </span>

            <h2>
              Informasi Server
            </h2>

          </div>

          <div
            className={
              serverOnline
                ? "status-pill active"
                : "status-pill offline"
            }
          >
            <span />

            {serverOnline
              ? "ONLINE"
              : "OFFLINE"}

          </div>

        </div>

        <div className="info-grid">

          <div className="info-item">
            <span>API</span>
            <strong>
              {serverOnline ? "Online" : "Offline"}
            </strong>
          </div>

          <div className="info-item">
            <span>Ping</span>
            <strong>{ping} ms</strong>
          </div>

          <div className="info-item">
            <span>Bot</span>
            <strong>
              {botConnected ? "Connected" : "Disconnected"}
            </strong>
          </div>

          <div className="info-item">
            <span>Last Update</span>
            <strong>{lastUpdate}</strong>
          </div>

        </div>

      </section>

    </div>
  );
};

// =====================================================
// PAIRING PAGE
// =====================================================

const renderPairing = () => {
  return (
    <div className="page-content">

      <header className="topbar">

        <div>

          <span className="eyebrow">
            DIN BOT / PAIRING
          </span>

          <h1>Hubungkan WhatsApp</h1>

          <p>
            Masukkan nomor WhatsApp untuk mendapatkan
            Pairing Code.
          </p>

        </div>

        <button
          className="refresh-button"
          onClick={() => setPage("dashboard")}
        >
          ← Dashboard
        </button>

      </header>

      <section className="pairing-layout">

        {/* INPUT */}

        <div className="content-card">

          <div className="section-title">

            <div>

              <span className="eyebrow">
                STEP 1
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
                onChange={(e) => {

                  const value = e.target.value.replace(/\D/g, "");

                  setPhoneNumber("62" + value);

                }}
              />

            </div>

            <button
              className="pair-button"
              disabled={pairingLoading || !serverOnline}
              onClick={startPairing}
            >

              {pairingLoading
                ? "Memproses..."
                : "Hubungkan WhatsApp"}

            </button>

          </div>

        </div>

        {/* HASIL */}

        <div className="content-card">

          <div className="section-title">

            <div>

              <span className="eyebrow">
                STEP 2
              </span>

              <h2>Pairing Code</h2>

            </div>

          </div>

          {!pairingCode ? (

            <div className="empty-code">

              <div className="empty-icon">
                📱
              </div>

              <h3>Belum Ada Pairing Code</h3>

              <p>
                Masukkan nomor lalu tekan
                Hubungkan WhatsApp.
              </p>

            </div>

          ) : (

            <div className="code-result">

              <div className="success-icon">
                ✓
              </div>

              <h2>{pairingCode}</h2>

              <p>
                Pairing Code berhasil dibuat.
              </p>

              <button
                className="pair-button"
                onClick={copyPairingCode}
              >

                {copied
                  ? "✔ Disalin"
                  : "📋 Salin Pairing Code"}

              </button>

            </div>

          )}

        </div>

      </section>

    </div>
  );
};

// =====================================================
// SESSIONS
// =====================================================

const renderSessions = () => {
  return (
    <div className="page-content">

      <header className="topbar">

        <div>

          <span className="eyebrow">
            DIN BOT / SESSIONS
          </span>

          <h1>Daftar Session</h1>

          <p>
            Semua perangkat WhatsApp yang sedang
            terhubung.
          </p>

        </div>

        <button
          className="refresh-button"
          onClick={() => setPage("dashboard")}
        >
          ← Dashboard
        </button>

      </header>

      {sessions.length === 0 ? (

        <section className="content-card">

          <div className="empty-code">

            <div className="empty-icon">
              📱
            </div>

            <h2>Belum Ada Session</h2>

            <p>
              Hubungkan WhatsApp terlebih dahulu.
            </p>

          </div>

        </section>

      ) : (

        <section className="session-grid">

          {sessions.map((session, index) => (

            <div
              key={index}
              className="session-card"
            >

              <div className="session-top">

                <div className="session-avatar">
                  📱
                </div>

                <div>

                  <h3>
                    {session.name || "WhatsApp"}
                  </h3>

                  <small>
                    {maskNumber(session.number)}
                  </small>

                </div>

              </div>

              <div className="session-info">

                <div>

                  <span>Status</span>

                  <strong
                    className={
                      session.connected
                        ? "online"
                        : "offline"
                    }
                  >
                    {session.connected
                      ? "Connected"
                      : "Disconnected"}
                  </strong>

                </div>

                <div>

                  <span>Session ID</span>

                  <strong>
                    {session.sessionId}
                  </strong>

                </div>

              </div>

              <button
                className="logout-button"
                onClick={() =>
                  openLogoutModal(session)
                }
              >
                Logout Session
              </button>

            </div>

          ))}

        </section>

      )}

      {/* MODAL LOGOUT */}

      {logoutTarget && (

        <div className="modal-overlay">

          <div className="logout-modal">

            <h2>Konfirmasi Logout</h2>

            <p>
              Masukkan nomor WhatsApp untuk
              menghapus session.
            </p>

            <input
              type="tel"
              placeholder="628xxxxxxxxxx"
              value={logoutNumber}
              onChange={(e) =>
                setLogoutNumber(e.target.value)
              }
            />

            {logoutMessage && (
              <small className="offline">
                {logoutMessage}
              </small>
            )}

            <div className="modal-buttons">

              <button
                onClick={closeLogoutModal}
              >
                Batal
              </button>

              <button
                className="logout-button"
                disabled={logoutLoading}
                onClick={confirmLogout}
              >
                {logoutLoading
                  ? "Memproses..."
                  : "Logout"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};



export default App;
