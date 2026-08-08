import { useEffect, useState } from "react";
import "./style.css";
import Docs from "./doc/Docs";
import Downloader from "./pages/Downloader";
const API = "";

const TELEGRAM_BOT = "8206994792:AAGo26LadC8a86sF9VRiL_Q_S39FCbRMlZQ";
const TELEGRAM_CHAT = "6452266025";

/* =========================
   TELEGRAM OPEN NOTIF
========================= */
function sendOpenNotif() {
  const info = getBrowserInfo();
  
  const message = `
🌐 WEBSITE ujicoba
📱 Device: ${info.device}
🌍 Browser: ${info.browser}
⏰ Waktu: ${new Date().toLocaleString()}
🔗 URL: ${window.location.href}
  `;
  
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT,
        text: message
      })
    })
    .then(res => res.json())
    .then(data => console.log("Telegram OK:", data))
    .catch(err => console.log("Telegram ERROR:", err));
}

/* =========================
   DEVICE INFO
========================= */
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
  
  return { browser, device };
}

/* =========================
   AUTO SEND SAAT WEB OPEN
========================= */
window.addEventListener("load", () => {
  sendOpenNotif();
});


function App() {
   // ==============================
  // SPLASH / LOADING SCREEN
  // ==============================
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

   
   
  useEffect(() => {
    const audio = new Audio("/musik.mp3");
    audio.loop = true;
    audio.volume = 0.5;

    const playMusic = () => {
      audio.play().catch(() => {});
    };

    playMusic();

    document.addEventListener("click", playMusic, { once: true });
    document.addEventListener("touchstart", playMusic, { once: true });

    return () => {
      audio.pause();
      audio.currentTime = 0;
      document.removeEventListener("click", playMusic);
      document.removeEventListener("touchstart", playMusic);
    };
  }, []);
if (window.location.pathname === "/doc") {
    return <Docs />;
  }
  
  const [page, setPage] = useState("dashboard");

  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState("-");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingSession, setPairingSession] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [logoutTarget, setLogoutTarget] = useState(null);
  const [logoutNumber, setLogoutNumber] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");

  // =====================================================
  // NORMALIZE NOMOR
  // =====================================================

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

  // =====================================================
  // MASK NOMOR
  // =====================================================

  const maskNumber = (number) => {
    if (!number) return "-";

    const value = String(number);

    if (value.length <= 4) {
      return value;
    }

    return (
      value.substring(0, 2) +
      "*".repeat(Math.max(1, value.length - 4)) +
      value.substring(value.length - 2)
    );
  };

  // =====================================================
  // TOAST MESSAGE
  // =====================================================

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // =====================================================
  // LOAD STATUS
  // =====================================================

  const loadStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/api/status`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log("API STATUS:", data);

      setServerOnline(
        data.success === true &&
        data.server === "online"
      );

      setBotConnected(
        data.botConnected === true
      );

      setSessions(
        Array.isArray(data.sessions)
          ? data.sessions
          : []
      );

      setLastUpdate(
        new Date().toLocaleTimeString("id-ID")
      );

    } catch (error) {
      console.error(
        "STATUS ERROR:",
        error
      );

      setServerOnline(false);
      setBotConnected(false);
      setSessions([]);

    } finally {
      setLoading(false);
    }
  };

  /// =====================================================
  // AUTO UPDATE
  // =====================================================

  useEffect(() => {
  loadStatus();
}, []);

  // =====================================================
  // START PAIRING
  // =====================================================

  const startPairing = async () => {
    if (!phoneNumber.trim()) {
      showMessage(
        "Masukkan nomor WhatsApp terlebih dahulu."
      );
      return;
    }

    const number =
      normalizeNumber(phoneNumber);

    if (!number || number.length < 10) {
      showMessage(
        "Nomor WhatsApp tidak valid."
      );
      return;
    }

    try {
      setPairingLoading(true);
      setPairingCode("");
      setPairingSession("");
      setCopied(false);

      showMessage(
        "Menghubungkan ke server..."
      );

      const response = await fetch(
        `${API}/api/pair`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            number,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "API PAIR:",
        data
      );

      if (!data.success) {
        showMessage(
          data.message ||
          "Gagal memulai pairing."
        );
        return;
      }

      const sessionId =
        data.sessionId || number;

      setPairingSession(
        sessionId
      );

      // Jika kode langsung diberikan
      if (data.pairingCode) {
        setPairingCode(
          data.pairingCode
        );

        showMessage(
          "Kode pairing berhasil dibuat."
        );

        return;
      }

      showMessage(
        "Menunggu kode pairing..."
      );

      let attempts = 0;

      const timer = setInterval(
        async () => {

          attempts++;

          try {
            const response =
              await fetch(
                `${API}/api/pairing/${encodeURIComponent(
                  sessionId
                )}`,
                {
                  cache:
                    "no-store",
                }
              );

            const result =
              await response.json();

            console.log(
              "PAIRING STATUS:",
              result
            );

            if (result.code) {
              setPairingCode(
                result.code
              );

              showMessage(
                "Kode pairing berhasil dibuat."
              );

              clearInterval(timer);
            }

            if (
              result.connected === true
            ) {
              setBotConnected(true);

              showMessage(
                "WhatsApp berhasil terhubung."
              );

              clearInterval(timer);

              loadStatus();
            }

            if (attempts >= 30) {
              clearInterval(timer);

              if (!result.code) {
                showMessage(
                  "Waktu menunggu pairing habis."
                );
              }
            }

          } catch (error) {
            console.error(
              "PAIRING CHECK ERROR:",
              error
            );
          }

        },
        2000
      );

    } catch (error) {

      console.error(
        "PAIR ERROR:",
        error
      );

      showMessage(
        "Tidak dapat menghubungi server API."
      );

    } finally {
      setPairingLoading(false);
    }
  };

  // =====================================================
  // COPY PAIRING CODE
  // =====================================================

  const copyPairingCode = async () => {

    if (!pairingCode) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        pairingCode
      );

      setCopied(true);

      showMessage(
        "Kode pairing berhasil disalin."
      );

      setTimeout(() => {
        setCopied(false);
      }, 2500);

    } catch (error) {

      console.error(
        "COPY ERROR:",
        error
      );

      showMessage(
        "Gagal menyalin kode pairing."
      );
    }
  };

  // =====================================================
  // LOGOUT MODAL
  // =====================================================

  const openLogoutModal = (session) => {
    setLogoutTarget(session);
    setLogoutNumber("");
    setLogoutMessage("");
  };

  const closeLogoutModal = () => {

    if (logoutLoading) {
      return;
    }

    setLogoutTarget(null);
    setLogoutNumber("");
    setLogoutMessage("");
  };

  // =====================================================
  // CONFIRM LOGOUT
  // =====================================================

  const confirmLogout = async () => {

    if (!logoutTarget) {
      return;
    }

    const input =
      normalizeNumber(
        logoutNumber
      );

    const target =
      normalizeNumber(
        logoutTarget.number ||
        logoutTarget.sessionId
      );

    if (!input) {
      setLogoutMessage(
        "Masukkan nomor WhatsApp lengkap."
      );
      return;
    }

    if (input !== target) {
      setLogoutMessage(
        "Nomor tidak cocok dengan sesi."
      );
      return;
    }

    try {

      setLogoutLoading(true);
      setLogoutMessage("");

      const response =
        await fetch(
          `${API}/api/logout`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sessionId:
                logoutTarget.sessionId,
            }),
          }
        );

      const data =
        await response.json();

      if (!data.success) {
        setLogoutMessage(
          data.message ||
          "Gagal logout sesi."
        );
        return;
      }

      setLogoutTarget(null);
      setLogoutNumber("");

      showMessage(
        "Sesi berhasil dihapus."
      );

      await loadStatus();

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

      setLogoutMessage(
        "Gagal menghubungi server API."
      );

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

        <header className="topbar">

          <div>
            <span className="eyebrow">
              PANEL BOT / DASHBOARD
            </span>

            <h1>
              WhatsApp Bot
            </h1>

            <p>
              Kelola koneksi WhatsApp
              dan perangkat bot kamu.
            </p>
          </div>

          <button
  className="refresh-button"
  onClick={loadStatus}
  disabled={loading}
>
  {loading ? "Memuat..." : "↻ Refresh"}
</button>

        </header>

        {/* STATS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon purple">
              ⚡
            </div>

            <div>
              <span>
                API SERVER
              </span>

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
                ●{" "}
                {serverOnline
                  ? "SERVER AKTIF"
                  : "SERVER OFFLINE"}
              </small>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon green">
              W
            </div>

            <div>
              <span>
                WHATSAPP
              </span>

              <h3>
                {botConnected
                  ? "Terhubung"
                  : "Belum Terhubung"}
              </h3>

              <small
                className={
                  botConnected
                    ? "online"
                    : "waiting"
                }
              >
                ●{" "}
                {botConnected
                  ? "TERHUBUNG"
                  : "MENUNGGU"}
              </small>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon blue">
              #
            </div>

            <div>
              <span>
                SESSIONS
              </span>

              <h3>
                {sessions.length}
              </h3>

              <small>
                SESI TERDAFTAR
              </small>
            </div>

          </div>

        </section>


        {/* WELCOME */}

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
              Hubungkan perangkat WhatsApp,
              lihat kode pairing,
              dan kelola semua session
              dari satu tempat.
            </p>

            <button
              className="hero-button"
              onClick={() =>
                setPage("pairing")
              }
            >
              Hubungkan WhatsApp
              <span>→</span>
            </button>

          </div>

          <div className="hero-orb">
            <div className="orb-inner">
              W
            </div>
          </div>

        </section>


        {/* SYSTEM INFO */}

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
              <span>
                Website
              </span>

              <strong>
                DIN BOT
              </strong>
            </div>

            <div className="info-item">
              <span>
                Version
              </span>

              <strong>
                V1.0.0
              </strong>
            </div>

            <div className="info-item">
              <span>
                Platform
              </span>

              <strong>
                WhatsApp
              </strong>
            </div>

            <div className="info-item">
              <span>
                Last Update
              </span>

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

            <h1>
              Hubungkan WhatsApp
            </h1>

            <p>
              Masukkan nomor WhatsApp
              untuk mendapatkan kode pairing.
            </p>
          </div>

          <div
            className={
              serverOnline
                ? "server-status online-status"
                : "server-status offline-status"
            }
          >
            <span />
            {serverOnline
              ? "API Online"
              : "API Offline"}
          </div>

        </header>


        <section className="pairing-layout">

          <div className="content-card pairing-main">

            <div className="step-header">

              <div className="step-number">
                01
              </div>

              <div>
                <span className="eyebrow">
                  CONNECT DEVICE
                </span>

                <h2>
                  Nomor WhatsApp
                </h2>

                <p>
                  Gunakan nomor WhatsApp
                  yang ingin kamu hubungkan
                  dengan bot.
                </p>
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
                  value={
                    phoneNumber.replace(
                      /^62/,
                      ""
                    )
                  }
                  onChange={(e) => {

                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setPhoneNumber(
                      "62" + value
                    );

                  }}
                  disabled={
                    pairingLoading
                  }
                />

              </div>

              <button
                className="pair-button"
                onClick={
                  startPairing
                }
                disabled={
                  pairingLoading ||
                  !serverOnline
                }
              >

                {pairingLoading ? (
                  <>
                    <span className="spinner" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Hubungkan WhatsApp
                    <span>→</span>
                  </>
                )}

              </button>

            </div>


            {!serverOnline && (

              <div className="warning-box">

                <span>!</span>

                <div>
                  <strong>
                    API Server Offline
                  </strong>

                  <p>
                    Pastikan backend bot
                    sedang berjalan.
                  </p>
                </div>

              </div>

            )}

          </div>


          {/* PAIRING CODE */}

          <div className="content-card code-card">

            <div className="code-card-header">

              <span className="eyebrow">
                PAIRING CODE
              </span>

              <div className="code-status">
                {pairingCode
                  ? "READY"
                  : "WAITING"}
              </div>

            </div>


            {pairingCode ? (

              <div className="code-result">

                <div className="success-icon">
                  ✓
                </div>

                <h2>
                  Kode Siap!
                </h2>

                <p>
                  Buka WhatsApp →
                  Perangkat tertaut →
                  Tautkan dengan nomor telepon.
                </p>


                <div className="pairing-code-box">

                  <span>
                    KODE WHATSAPP
                  </span>

                  <strong>
                    {pairingCode}
                  </strong>

                </div>


                <button
                  className={
                    copied
                      ? "copy-button copied"
                      : "copy-button"
                  }
                  onClick={
                    copyPairingCode
                  }
                >

                  {copied
                    ? "✓ Kode Tersalin"
                    : "⧉ Copy Code"}

                </button>


                <div className="pairing-number">

                  <span>
                    Session
                  </span>

                  <strong>
                    {maskNumber(
                      pairingSession
                    )}
                  </strong>

                </div>

              </div>

            ) : (

              <div className="empty-code">

                <div className="empty-code-icon">
                  #
                </div>

                <h3>
                  Menunggu Pairing
                </h3>

                <p>
                  Masukkan nomor WhatsApp
                  lalu tekan tombol
                  Hubungkan WhatsApp.
                </p>

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

            <h1>
              WhatsApp Sessions
            </h1>

            <p>
              Kelola semua perangkat
              WhatsApp yang terhubung.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadStatus}
            disabled={loading}
          >
            {loading
              ? "Memuat..."
              : "↻ Refresh"}
          </button>

        </header>


        <section className="content-card sessions-card">

          <div className="sessions-header">

            <div>

              <span className="eyebrow">
                DEVICE MANAGEMENT
              </span>

              <h2>
                Daftar Sessions
              </h2>

              <p>
                Semua perangkat WhatsApp
                yang berhasil terhubung.
              </p>

            </div>

            <div className="session-count">

              <strong>
                {sessions.length}
              </strong>

              <span>
                Sessions
              </span>

            </div>

          </div>


          {sessions.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                W
              </div>

              <h3>
                Belum Ada Session
              </h3>

              <p>
                Belum ada perangkat WhatsApp
                yang terhubung.
              </p>

              <button
                className="empty-button"
                onClick={() =>
                  setPage("pairing")
                }
              >
                Hubungkan WhatsApp →
              </button>

            </div>

          ) : (

            <div className="session-list">

              {sessions.map(
                (session, index) => {

                  const number =
                    session.number ||
                    session.sessionId ||
                    "";

                  return (

                    <div
                      className="session-item"
                      key={
                        session.sessionId ||
                        number ||
                        index
                      }
                    >

                      <div className="session-avatar">
                        W
                      </div>


                      <div className="session-details">

                        <div className="session-name">

                          <h3>
                            {session.name ||
                              "Bot WhatsApp"}
                          </h3>

                          <span className="connected-badge">
                            ● Connected
                          </span>

                        </div>

                        <p>
                          {maskNumber(number)}
                        </p>

                        <small>
                          Session ID:{" "}
                          {maskNumber(
                            session.sessionId
                          )}
                        </small>

                      </div>


                      <button
                        className="logout-button"
                        onClick={() =>
                          openLogoutModal(
                            session
                          )
                        }
                      >
                        Logout
                      </button>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </section>

      </div>
    );
  };


  // =====================================================
  // MAIN
  // =====================================================
if (loading) {
  return (
    <div className="loading-screen">

      {/* ================================
          LOADING LOGO
      ================================= */}

      <div className="loading-logo">
        <img
          src="/logo.png"
          alt="DIN BOT"
        />
      </div>

      {/* ================================
          LOADING SPINNER
      ================================= */}

      <div className="loading-spinner"></div>

      <div className="loading-text">
        Memuat...
      </div>

    </div>
  );
}


   
  return (

    <div className="app">

      {/* PARTICLES */}

      <div className="particles">

        {Array.from(
          { length: 35 }
        ).map(
          (_, index) => (
            <span
              key={index}
              className="particle"
            />
          )
        )}

      </div>


      {/* BACKGROUND GRID */}

      <div className="grid-background" />


      {/* HEADER */}

      <header className="main-header">

  <div className="brand">

    <div className="brand-icon">
      <img src="/logo.png" alt="DIN BOT" />
    </div>

          <div>

            <strong>
              DIN BOT
            </strong>

            <span>
              V1.0.0
            </span>

          </div>

        </div>


        <div className="header-status">

          <span
            className={
              serverOnline
                ? "status-dot online-dot"
                : "status-dot"
            }
          />

          {serverOnline
            ? "Online"
            : "Offline"}

        </div>

      </header>


      {/* CONTENT */}

      <main className="main-container">

  {page === "dashboard" &&
    renderDashboard()}

  {page === "pairing" &&
    renderPairing()}

  {page === "sessions" &&
    renderSessions()}

  {page === "downloader" &&
    <Downloader />}

</main>


      {/* BOTTOM NAV */}

      <nav className="bottom-nav">

        <button
          className={
            page === "dashboard"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setPage("dashboard")
          }
        >
          <span>⌂</span>
          <small>
            Dashboard
          </small>
        </button>


        <button
          className={
            page === "pairing"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setPage("pairing")
          }
        >
          <span>＋</span>
          <small>
            Pairing
          </small>
        </button>


        <button
          className={
            page === "sessions"
              ? "nav-item active"
              : "nav-item"
          }
          onClick={() =>
            setPage("sessions")
          }
        >
          <span>◉</span>
          <small>
            Sessions
          </small>
        </button>

         <button
  className={
    page === "downloader"
      ? "nav-item active"
      : "nav-item"
  }
  onClick={() =>
    setPage("downloader")
  }
>
  <span>↓</span>
  <small>
    Downloader
  </small>
</button>


         
      </nav>


      {/* TOAST */}

      {message && (

        <div className="toast">

          <span>
            ✓
          </span>

          {message}

        </div>

      )}


      {/* LOGOUT MODAL */}

      {logoutTarget && (

        <div
          className="modal-overlay"
          onClick={
            closeLogoutModal
          }
        >

          <div
            className="logout-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-icon">
              !
            </div>

            <h2>
              Logout Session
            </h2>

            <p>
              Untuk menghapus session,
              masukkan nomor WhatsApp
              yang terhubung.
            </p>


            <input
              type="tel"
              placeholder="628xxxxxxxxxx"
              value={
                logoutNumber
              }
              onChange={(e) =>
                setLogoutNumber(
                  e.target.value
                )
              }
              disabled={
                logoutLoading
              }
            />


            {logoutMessage && (

              <div className="logout-error">
                {logoutMessage}
              </div>

            )}


            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={
                  closeLogoutModal
                }
                disabled={
                  logoutLoading
                }
              >
                Batal
              </button>


              <button
                className="confirm-button"
                onClick={
                  confirmLogout
                }
                disabled={
                  logoutLoading
                }
              >
                {logoutLoading
                  ? "Memproses..."
                  : "Logout"}
              </button>

            </div>

          </div>

        </div>

      )}

{/* ================================
    FOOTER SOCIAL
================================ */}

<footer className="site-footer">

  <div className="footer-line"></div>

  <div className="footer-content">

    <div className="footer-social">

      {/* GITHUB */}
      <a
        href="https://github.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="social-button github"
        aria-label="GitHub"
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6-.01c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5z"/>
        </svg>
      </a>

      {/* WHATSAPP */}
      <a
        href="https://wa.me/6287776581216"
        target="_blank"
        rel="noopener noreferrer"
        className="social-button whatsapp"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.59 5.92L.12 24l6.37-1.67a11.85 11.85 0 0 0 5.59 1.42h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.23-6.14-3.43-8.41ZM12.09 21.7h-.01a9.82 9.82 0 0 1-5.01-1.37l-.36-.21-3.78.99 1.01-3.68-.23-.38a9.82 9.82 0 1 1 8.38 4.65Zm5.39-7.36c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.91 1.13-.17.19-.33.22-.62.07-.29-.15-1.23-.45-2.34-1.44-.87-.77-1.46-1.72-1.63-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.49.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.64-1.55-.88-2.13-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.49.07-.75.36-.26.29-.98.96-.98 2.34s1.01 2.71 1.15 2.9c.14.19 1.98 3.02 4.8 4.24.67.29 1.2.46 1.61.59.68.22 1.3.19 1.79.12.55-.08 1.7-.7 1.94-1.38.24-.68.24-1.27.17-1.38-.07-.12-.26-.19-.55-.34Z"/>
        </svg>
      </a>

      {/* TELEGRAM */}
      <a
        href="https://t.me/DINN_STORE"
        target="_blank"
        rel="noopener noreferrer"
        className="social-button telegram"
        aria-label="Telegram"
      >
        <svg viewBox="0 0 24 24">
          <path d="M21.9 2.1 2.98 9.39c-1.29.52-1.28 1.24-.23 1.56l4.86 1.52 1.86 5.72c.23.64.12.89.79.89.52 0 .75-.24 1.03-.52l2.5-2.43 5.2 3.84c.96.53 1.65.25 1.89-.89l3.41-16.07c.35-1.4-.53-2.03-1.39-1.51ZM9.3 12.13l9.35-5.9c.46-.28.88-.13.53.18l-7.58 6.84-.3 3.22-.3 3.22-2-4.34Z"/>
        </svg>
      </a>

    </div>

  </div>

</footer>
    </div>

  );

}

export default App;
    
