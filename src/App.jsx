import { useEffect, useState } from "react";
import "./style.css";

const API = ""; // kosongkan jika API satu domain
// contoh:
// const API = "https://backend.domain.com";

export default function App() {

  /* ==========================
     PAGE
  ========================== */

  const [page, setPage] = useState("dashboard");

  /* ==========================
     STATUS
  ========================== */

  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);

  const [sessions, setSessions] = useState([]);

  const [ping, setPing] = useState(0);

  const [uptime, setUptime] = useState({
    hari: 0,
    jam: 0,
    menit: 0,
    detik: 0,
  });

  const [loading, setLoading] = useState(false);

  const [lastUpdate, setLastUpdate] = useState("-");

  /* ==========================
     PAIRING
  ========================== */

  const [phoneNumber, setPhoneNumber] = useState("");

  const [pairingCode, setPairingCode] = useState("");

  const [pairingSession, setPairingSession] = useState("");

  const [pairingLoading, setPairingLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  /* ==========================
     LOGOUT
  ========================== */

  const [logoutTarget, setLogoutTarget] = useState(null);

  const [logoutNumber, setLogoutNumber] = useState("");

  const [logoutLoading, setLogoutLoading] = useState(false);

  const [logoutMessage, setLogoutMessage] = useState("");

  /* ==========================
     TOAST
  ========================== */

  const [message, setMessage] = useState("");

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  /* ==========================
     NORMALIZE NUMBER
  ========================== */

  const normalizeNumber = (number = "") => {

    let num = number.replace(/\D/g, "");

    if (num.startsWith("0")) {
      num = "62" + num.slice(1);
    }

    if (num.startsWith("8")) {
      num = "62" + num;
    }

    return num;

  };
    /* ==========================
     LOAD STATUS
  ========================== */

  const loadStatus = async () => {

    try {

      setLoading(true);

      const start = performance.now();

      const res = await fetch(`${API}/api/status`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Server Error");
      }

      const data = await res.json();

      const end = performance.now();

      setPing(Math.round(end - start));

      setServerOnline(data.server === "online");

      setBotConnected(
        data.botConnected === true
      );

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

  /* ==========================
     AUTO REFRESH
  ========================== */

  useEffect(() => {

    loadStatus();

    const interval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  /* ==========================
     START PAIRING
  ========================== */

  const startPairing = async () => {

    if (!phoneNumber.trim()) {
      return showMessage("Masukkan nomor WhatsApp.");
    }

    try {

      setPairingLoading(true);

      setPairingCode("");

      setCopied(false);

      const res = await fetch(`${API}/api/pair`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          number: normalizeNumber(phoneNumber),

        }),

      });

      const data = await res.json();

      if (!data.success) {

        return showMessage(
          data.message || "Pairing gagal."
        );

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

          const check = await fetch(
            `${API}/api/pairing/${encodeURIComponent(data.sessionId)}`,
            {
              cache: "no-store",
            }
          );

          const result = await check.json();

          if (result.code) {

            clearInterval(timer);

            setPairingCode(result.code);

            showMessage("Pairing Code berhasil dibuat.");

          }

          if (result.connected) {

            clearInterval(timer);

            loadStatus();

            showMessage("WhatsApp berhasil terhubung.");

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

      showMessage("Server tidak dapat dihubungi.");

    } finally {

      setPairingLoading(false);

    }

  };

  /* ==========================
     COPY CODE
  ========================== */

  const copyPairingCode = async () => {

    if (!pairingCode) return;

    try {

      await navigator.clipboard.writeText(
        pairingCode
      );

      setCopied(true);

      showMessage("Pairing Code disalin.");

      setTimeout(() => {

        setCopied(false);

      }, 2000);

    } catch {

      showMessage("Gagal menyalin.");

    }

  };
   /* ==========================
     LOGOUT
  ========================== */

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
      logoutTarget.number ||
      logoutTarget.sessionId
    );

    if (input !== target) {

      setLogoutMessage("Nomor tidak cocok.");

      return;

    }

    try {

      setLogoutLoading(true);

      const res = await fetch(`${API}/api/logout`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({

          sessionId: logoutTarget.sessionId,

        }),

      });

      const data = await res.json();

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

  /* ==========================
     DASHBOARD
  ========================== */

  const renderDashboard = () => (

    <div className="page-content">

      <header className="topbar">

        <div>

          <span className="eyebrow">
            PANEL BOT
          </span>

          <h1>
            WhatsApp Bot Dashboard
          </h1>

          <p>
            Kelola seluruh bot WhatsApp dari satu dashboard.
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

              {serverOnline
                ? "ONLINE"
                : "OFFLINE"}

            </h3>

            <small className={
              serverOnline
                ? "online"
                : "offline"
            }>

              ● {serverOnline
                ? `${ping} ms`
                : "Tidak Terhubung"}

            </small>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon green">
            🤖
          </div>

          <div>

            <span>WHATSAPP</span>

            <h3>

              {botConnected
                ? "CONNECTED"
                : "WAITING"}

            </h3>

            <small className={
              botConnected
                ? "online"
                : "waiting"
            }>

              ● {botConnected
                ? "BOT AKTIF"
                : "BELUM TERHUBUNG"}

            </small>

          </div>

        </div>

        <div
          className="stat-card"
          style={{ cursor: "pointer" }}
          onClick={() => setPage("sessions")}
        >

          <div className="stat-icon blue">
            📱
          </div>

          <div>

            <span>SESSIONS</span>

            <h3>

              {sessions.length}

            </h3>

            <small>

              Klik untuk melihat

            </small>

          </div>

        </div>

      </section>

      <section className="hero-card">

        <div className="hero-content">

          <span className="hero-label">
            DIN BOT V1
          </span>

          <h2>

            Hubungkan WhatsApp
            dengan Pairing Code

          </h2>

          <p>

            Kelola session,
            monitoring server,
            dan pairing WhatsApp
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

        </div>

        <div className="info-grid">

          <div className="info-item">
            <span>Website</span>
            <strong>DIN BOT</strong>
          </div>

          <div className="info-item">
            <span>Version</span>
            <strong>1.0.0</strong>
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
  /* ==========================
     MONITORING SERVER
  ========================== */

  const renderMonitor = () => (

    <div className="page-content">

      <header className="topbar">

        <div>

          <span className="eyebrow">
            MONITORING SERVER
          </span>

          <h1>
            Status Server
          </h1>

          <p>
            Monitoring server dan bot secara realtime.
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
              STATUS
            </span>

            <h2>

              Monitoring Realtime

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

            {
              serverOnline
                ? "ONLINE"
                : "OFFLINE"
            }

          </div>

        </div>

        <div className="monitor-grid">

          <div className="monitor-card">

            <div className="monitor-icon">
              ⚡
            </div>

            <span>
              Ping
            </span>

            <h2>
              {ping} ms
            </h2>

          </div>

          <div className="monitor-card">

            <div className="monitor-icon">
              🤖
            </div>

            <span>
              Bot
            </span>

            <h2>

              {
                botConnected
                  ? "Connected"
                  : "Offline"
              }

            </h2>

          </div>

          <div className="monitor-card">

            <div className="monitor-icon">
              📱
            </div>

            <span>
              Sessions
            </span>

            <h2>

              {sessions.length}

            </h2>

          </div>

          <div className="monitor-card">

            <div className="monitor-icon">
              🌐
            </div>

            <span>
              API
            </span>

            <h2>

              {
                serverOnline
                  ? "Online"
                  : "Offline"
              }

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

              Lama Server Aktif

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

            <div className="stat-icon orange">
              ⏺
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
              INFORMASI
            </span>

            <h2>

              Detail Server

            </h2>

          </div>

        </div>

        <div className="info-grid">

          <div className="info-item">
            <span>Server</span>
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
    /* ==========================
     PAIRING
  ========================== */

  const renderPairing = () => (

    <div className="page-content">

      <header className="topbar">

        <div>

          <span className="eyebrow">
            WHATSAPP PAIRING
          </span>

          <h1>
            Hubungkan WhatsApp
          </h1>

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

      <section className="pairing-layout">

        {/* INPUT */}

        <div className="content-card">

          <div className="section-title">

            <div>

              <span className="eyebrow">
                LANGKAH 1
              </span>

              <h2>
                Nomor WhatsApp
              </h2>

            </div>

          </div>

          <div className="phone-form">

            <label>
              Nomor WhatsApp
            </label>

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
              disabled={
                pairingLoading ||
                !serverOnline
              }
              onClick={startPairing}
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

              <h2>
                Pairing Code
              </h2>

            </div>

          </div>

          {!pairingCode ? (

            <div className="empty-code">

              <div className="empty-icon">
                📱
              </div>

              <h3>
                Belum Ada Pairing Code
              </h3>

              <p>
                Masukkan nomor WhatsApp lalu tekan tombol
                <b> Hubungkan WhatsApp</b>.
              </p>

            </div>

          ) : (

            <>

              <div className="pair-code">

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

              <div className="pair-info">

                <p>
                  Session :
                </p>

                <strong>

                  {pairingSession}

                </strong>

              </div>

            </>

          )}

        </div>

      </section>

    </div>

  );
    /* ==========================
     SESSIONS
  ========================== */

  const renderSessions = () => (

    <div className="page-content">

      <header className="topbar">

        <div>

          <span className="eyebrow">
            WHATSAPP SESSIONS
          </span>

          <h1>
            Daftar Session
          </h1>

          <p>
            Semua perangkat WhatsApp yang sedang terhubung.
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

      {sessions.length === 0 ? (

        <div className="content-card">

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

        </div>

      ) : (

        <div className="sessions-grid">

          {sessions.map((item, index) => (

            <div
              className="session-card"
              key={index}
            >

              <h3>
                {item.name || "WhatsApp"}
              </h3>

              <p>
                {item.number}
              </p>

              <small>
                {item.sessionId}
              </small>

              <button
                className="logout-button"
                onClick={() => openLogoutModal(item)}
              >
                Logout
              </button>

            </div>

          ))}

        </div>

      )}

    </div>

  );

  /* ==========================
     MAIN
  ========================== */

  return (

    <div className="app">

      {page === "dashboard" && renderDashboard()}

      {page === "monitor" && renderMonitor()}

      {page === "pairing" && renderPairing()}

      {page === "sessions" && renderSessions()}

      {message && (

        <div className="toast">

          {message}

        </div>

      )}

      {logoutTarget && (

        <div className="modal-overlay">

          <div className="modal">

            <h2>
              Logout Session
            </h2>

            <p>
              Masukkan nomor WhatsApp untuk konfirmasi logout.
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
                  ? "Loading..."
                  : "Logout"}

              </button>

            </div>

          </div>

        </div>

      )}

      <nav className="bottom-nav">

        <button
          className={page === "dashboard" ? "active" : ""}
          onClick={() => setPage("dashboard")}
        >
          <span>🏠</span>
          <small>Home</small>
        </button>

        <button
          className={page === "monitor" ? "active" : ""}
          onClick={() => {
            loadStatus();
            setPage("monitor");
          }}
        >
          <span>📊</span>
          <small>Monitor</small>
        </button>

        <button
          className={page === "pairing" ? "active" : ""}
          onClick={() => setPage("pairing")}
        >
          <span>🔗</span>
          <small>Pairing</small>
        </button>

        <button
          className={page === "sessions" ? "active" : ""}
          onClick={() => {
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
