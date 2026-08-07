import { useEffect, useState } from "react";
import "./style.css";

const API = "";

export default function App() {

  /* ===========================
     PAGE
  =========================== */

  const [page, setPage] = useState("dashboard");

  /* ===========================
     SERVER STATUS
  =========================== */

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

  const [lastUpdate, setLastUpdate] = useState("-");

  const [loading, setLoading] = useState(false);

  /* ===========================
     PAIRING
  =========================== */

  const [phoneNumber, setPhoneNumber] = useState("");

  const [pairingLoading, setPairingLoading] = useState(false);

  const [pairingCode, setPairingCode] = useState("");

  const [pairingSession, setPairingSession] = useState("");

  const [copied, setCopied] = useState(false);

  /* ===========================
     LOGOUT
  =========================== */

  const [logoutTarget, setLogoutTarget] = useState(null);

  const [logoutNumber, setLogoutNumber] = useState("");

  const [logoutLoading, setLogoutLoading] = useState(false);

  const [logoutMessage, setLogoutMessage] = useState("");

  /* ===========================
     TOAST
  =========================== */

  const [message, setMessage] = useState("");

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  /* ===========================
     NORMALIZE NUMBER
  =========================== */

  const normalizeNumber = (value = "") => {
    let number = value.replace(/\D/g, "");

    if (number.startsWith("0")) {
      number = "62" + number.slice(1);
    }

    if (number.startsWith("8")) {
      number = "62" + number;
    }

    return number;
  };
    /* ===========================
     LOAD STATUS
  =========================== */

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

  /* ===========================
     AUTO REFRESH
  =========================== */

  useEffect(() => {

    loadStatus();

    const interval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(interval);

  }, []);

  /* ===========================
     START PAIRING
  =========================== */

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

  /* ===========================
     COPY PAIRING
  =========================== */

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
    /* ===========================
     LOGOUT
  =========================== */

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

  /* ===========================
     DASHBOARD
  =========================== */

  const renderDashboard = () => {

    return (

      <div className="page-content">

        <header className="topbar">

          <div>

            <span className="eyebrow">
              PANEL BOT
            </span>

            <h1>DIN BOT</h1>

            <p>
              Dashboard WhatsApp Bot
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
                  ? `${ping} ms`
                  : "SERVER OFFLINE"}
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
                {botConnected
                  ? "Connected"
                  : "Offline"}
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
                LIHAT SESSION
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
              Kelola WhatsApp Bot
            </h2>

            <p>

              Hubungkan WhatsApp,
              lihat Pairing Code,
              monitoring server,
              dan kelola Session.

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

  /* ===========================
     MONITORING
  =========================== */

  const renderMonitor = () => {

    return (

      <div className="page-content">

        <header className="topbar">

          <div>

            <span className="eyebrow">
              SERVER MONITOR
            </span>

            <h1>
              Monitoring Server
            </h1>

            <p>
              Informasi server secara realtime.
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

        <section className="monitor-grid">

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

      </div>

    );

  };
    /* ===========================
     PAIRING
  =========================== */

  const renderPairing = () => {

    return (

      <div className="page-content">

        <header className="topbar">

          <div>

            <span className="eyebrow">
              PAIRING WHATSAPP
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

                <h2>
                  Pairing Code
                </h2>

              </div>

            </div>

            {
              !pairingCode ? (

                <div className="empty-code">

                  <div className="empty-icon">
                    📱
                  </div>

                  <h3>
                    Belum Ada Pairing Code
                  </h3>

                  <p>
                    Masukkan nomor WhatsApp kemudian tekan tombol
                    <strong> Hubungkan WhatsApp</strong>.
                  </p>

                </div>

              ) : (

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
                        ? "✔ Berhasil Disalin"
                        : "📋 Salin Pairing Code"
                    }
                  </button>

                  <small>

                    Session ID :

                    <br />

                    {pairingSession}

                  </small>

                </div>

              )
            }

          </div>

        </section>

      </div>

    );

  };
    /* ===========================
     SESSIONS
  =========================== */

  const renderSessions = () => {

    return (

      <div className="page-content">

        <header className="topbar">

          <div>

            <span className="eyebrow">
              WHATSAPP SESSIONS
            </span>

            <h1>
              Session Aktif
            </h1>

            <p>
              Daftar seluruh perangkat yang sedang login.
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

        <div className="sessions-list">

          {sessions.length === 0 ? (

            <div className="empty-code">

              <div className="empty-icon">
                📱
              </div>

              <h3>
                Belum Ada Session
              </h3>

              <p>
                Tidak ada perangkat WhatsApp yang sedang terhubung.
              </p>

            </div>

          ) : (

            sessions.map((session, index) => (

              <div
                className="session-card"
                key={index}
              >

                <div>

                  <h3>
                    {session.name || "WhatsApp"}
                  </h3>

                  <p>
                    {session.number || session.sessionId}
                  </p>

                </div>

                <button
                  className="logout-button"
                  onClick={() => openLogoutModal(session)}
                >
                  Logout
                </button>

              </div>

            ))

          )}

        </div>

      </div>

    );

  };

  /* ===========================
     MAIN RENDER
  =========================== */

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

              Masukkan nomor berikut untuk konfirmasi.

            </p>

            <strong>

              {logoutTarget.number || logoutTarget.sessionId}

            </strong>

            <input
              type="text"
              placeholder="628xxxxxxxxxx"
              value={logoutNumber}
              onChange={(e) =>
                setLogoutNumber(e.target.value)
              }
            />

            {logoutMessage && (

              <small
                style={{
                  color: "#ff5b5b",
                }}
              >
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
                onClick={confirmLogout}
                disabled={logoutLoading}
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
          className={
            page === "dashboard"
              ? "active"
              : ""
          }
          onClick={() => setPage("dashboard")}
        >
          <span>🏠</span>
          <small>Home</small>
        </button>

        <button
          className={
            page === "monitor"
              ? "active"
              : ""
          }
          onClick={() => {
            loadStatus();
            setPage("monitor");
          }}
        >
          <span>📊</span>
          <small>Monitor</small>
        </button>

        <button
          className={
            page === "pairing"
              ? "active"
              : ""
          }
          onClick={() => setPage("pairing")}
        >
          <span>🔗</span>
          <small>Pairing</small>
        </button>

        <button
          className={
            page === "sessions"
              ? "active"
              : ""
          }
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
