import { useEffect, useState } from "react";
import "./style.css";

const API = "";
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

  /* UI */
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState("-");
  const [ping, setPing] = useState(0);

  const [uptime, setUptime] = useState({
    hari: 0,
    jam: 0,
    menit: 0,
    detik: 0,
  });

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

      
  /* =========================================
     AUTO REFRESH
  ========================================= */

  useEffect(() => {

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

          const res = await fetch(
            `${API}/api/pairing/${encodeURIComponent(data.sessionId)}`,
            {
              cache: "no-store",
            }
          );

          const result = await res.json();

          if (result.code) {

            setPairingCode(result.code);

            clearInterval(timer);

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
      logoutTarget.number ||
      logoutTarget.sessionId
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
   // =====================================================
// DASHBOARD
// =====================================================

const renderDashboard = () => {
  return (
    <div className="page-content">

      {/* HEADER */}

      <header className="topbar">

        <div>

          <span className="eyebrow">
            PANEL BOT / DASHBOARD
          </span>

          <h1>WhatsApp Bot</h1>

          <p>
            Kelola koneksi WhatsApp dan
            perangkat bot dengan mudah.
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
            📊 Monitoring Server
          </button>

        </div>

      </header>

      {/* STATS */}

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

        <div
          className="stat-card"
          onClick={() => setPage("sessions")}
          style={{ cursor: "pointer" }}
        >

          <div className="stat-icon blue">
            #
          </div>

          <div>

            <span>SESSIONS</span>

            <h3>{sessions.length}</h3>

            <small>
              LIHAT SEMUA SESSION
            </small>

          </div>

        </div>

      </section>

      {/* HERO */}

      <section className="hero-card">

        <div className="hero-content">

          <span className="hero-label">
            DIN BOT V1.0.0
          </span>

          <h2>
            Kelola Bot WhatsApp
            dengan mudah.
          </h2>

          <p>
            Hubungkan perangkat,
            lihat Pairing Code,
            dan kelola semua Session
            dari satu Dashboard.
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

      {/* SYSTEM */}

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

      {/* STATUS BESAR */}

      <section className="content-card">

        <div className="section-title">

          <div>

            <span className="eyebrow">
              API STATUS
            </span>

            <h2>
              Monitoring Server
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
              ? `ONLINE | ${ping} ms`
              : "OFFLINE"}

          </div>

        </div>

        <div className="monitor-grid">

          <div className="monitor-card">

            <div className="monitor-icon">
              ⚡
            </div>

            <span>Ping</span>

            <h2>{ping} ms</h2>

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

        </div>

      </section>

      {/* UPTIME */}

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

      {/* INFORMASI */}

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
              {serverOnline
                ? "Online"
                : "Offline"}
            </strong>

          </div>

          <div className="info-item">

            <span>Ping</span>

            <strong>
              {ping} ms
            </strong>

          </div>

          <div className="info-item">

            <span>Bot</span>

            <strong>
              {botConnected
                ? "Connected"
                : "Disconnected"}
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
};
   // =====================================================
// PAIRING
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
              onClick={startPairing}
              disabled={
                pairingLoading ||
                !serverOnline
              }
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
                LANGKAH 2
              </span>

              <h2>Pairing Code</h2>

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
                Masukkan nomor WhatsApp,
                kemudian tekan tombol
                Hubungkan WhatsApp.
              </p>

            </div>

          ) : (

            <div className="code-result">

              <div className="success-icon">
                ✅
              </div>

              <h1>{pairingCode}</h1>

              <p>
                Pairing Code berhasil dibuat.
              </p>

              <small>
                Session ID :
                <br />
                {pairingSession}
              </small>

              <button
                className="pair-button"
                onClick={copyPairingCode}
              >
                {copied
                  ? "✓ Berhasil Disalin"
                  : "📋 Salin Pairing Code"}
              </button>

            </div>

          )}

        </div>

      </section>

      {/* INFO */}

      <section className="content-card">

        <div className="section-title">

          <div>

            <span className="eyebrow">
              PANDUAN
            </span>

            <h2>Cara Pairing</h2>

          </div>

        </div>

        <div className="info-grid">

          <div className="info-item">

            <span>1</span>

            <strong>
              Masukkan Nomor WhatsApp
            </strong>

          </div>

          <div className="info-item">

            <span>2</span>

            <strong>
              Tekan Hubungkan WhatsApp
            </strong>

          </div>

          <div className="info-item">

            <span>3</span>

            <strong>
              Masukkan Pairing Code
            </strong>

          </div>

          <div className="info-item">

            <span>4</span>

            <strong>
              Tunggu hingga Connected
            </strong>

          </div>

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
            terhubung ke bot.
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

        <section className="content-card">

          <div className="empty-code">

            <div className="empty-icon">
              📱
            </div>

            <h2>
              Belum Ada Session
            </h2>

            <p>
              Hubungkan WhatsApp terlebih dahulu
              untuk membuat session baru.
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

      {/* ================= LOGOUT MODAL ================= */}

      {logoutTarget && (

        <div className="modal-overlay">

          <div className="logout-modal">

            <h2>
              Logout Session
            </h2>

            <p>

              Masukkan nomor WhatsApp berikut
              untuk konfirmasi logout.

            </p>

            <strong>

              {logoutTarget.number}

            </strong>

            <input
              type="tel"
              placeholder="628xxxxxxxxxx"
              value={logoutNumber}
              onChange={(e) =>
                setLogoutNumber(e.target.value)
              }
            />

            {logoutMessage && (

              <div className="warning-box">

                {logoutMessage}

              </div>

            )}

            <div className="modal-buttons">

              <button
                className="cancel-button"
                onClick={closeLogoutModal}
                disabled={logoutLoading}
              >
                Batal
              </button>

              <button
                className="logout-button"
                onClick={confirmLogout}
                disabled={logoutLoading}
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
   // =====================================================
// MAIN RENDER
// =====================================================

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
