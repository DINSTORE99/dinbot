import { useEffect, useState } from "react";
import "./style.css";

const API = "";

function App() {
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

  // =====================================================
  // AUTO UPDATE
  // =====================================================

  useEffect(() => {
    loadStatus();

    const timer = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => {
      clearInterval(timer);
    };
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
// MEDIA DOWNLOADER
// =====================================================

const [downloadUrl, setDownloadUrl] = useState("");
const [downloadLoading, setDownloadLoading] = useState(false);
const [downloadResult, setDownloadResult] = useState(null);
const [downloadError, setDownloadError] = useState("");
  // =====================================================
// DETEKSI PLATFORM
// =====================================================

const detectPlatform = (url) => {
  const value = url.toLowerCase();

  if (
    value.includes("tiktok.com") ||
    value.includes("vt.tiktok.com")
  ) {
    return "tiktok";
  }

  if (
    value.includes("facebook.com") ||
    value.includes("fb.watch")
  ) {
    return "facebook";
  }

  if (value.includes("capcut.com")) {
    return "capcut";
  }

  return null;
};
  // =====================================================
// MEDIA DOWNLOAD PAGE
// =====================================================

const renderMediaDownload = () => {
  return (
    <div className="page-content">

      <header className="topbar">
        <div>
          <span className="eyebrow">
            DIN BOT / MEDIA DOWNLOAD
          </span>

          <h1>
            Media Download
          </h1>

          <p>
            Download video dari TikTok,
            Facebook, dan CapCut.
          </p>
        </div>
      </header>


      <section className="content-card downloader-card">

        <div className="downloader-header">
          <div className="downloader-icon">
            ↓
          </div>

          <div>
            <span className="eyebrow">
              MEDIA DOWNLOADER
            </span>

            <h2>
              Download Video
            </h2>

            <p>
              Tempel link video yang ingin
              kamu download.
            </p>
          </div>
        </div>


        <form
          className="download-form"
          onSubmit={startDownload}
        >

          <input
            type="url"
            placeholder="https://www.tiktok.com/..."
            value={downloadUrl}
            onChange={(e) => {
              setDownloadUrl(e.target.value);
              setDownloadError("");
            }}
            disabled={downloadLoading}
          />

          <button
            type="submit"
            disabled={downloadLoading}
          >
            {downloadLoading ? (
              <>
                <span className="spinner" />
                Memproses...
              </>
            ) : (
              <>
                Download
                <span>↓</span>
              </>
            )}
          </button>

        </form>


        {downloadError && (
          <div className="download-error">
            <span>!</span>
            {downloadError}
          </div>
        )}


        {downloadResult && (
          <div className="download-result">

            <div className="download-result-header">
              <span className="eyebrow">
                HASIL DOWNLOAD
              </span>

              <span className="download-platform">
                {downloadResult.platform.toUpperCase()}
              </span>
            </div>


            {downloadResult.data.cover_link && (
              <img
                src={
                  downloadResult.data.cover_link
                }
                alt="Preview"
                className="download-preview"
              />
            )}


            {downloadResult.data.origin_cover && (
              !downloadResult.data.cover_link && (
                <img
                  src={
                    downloadResult.data.origin_cover
                  }
                  alt="Preview"
                  className="download-preview"
                />
              )
            )}


            <h3>
              {downloadResult.data.title ||
               downloadResult.data.text ||
               "Media berhasil ditemukan"}
            </h3>


            {downloadResult.data.author_nickname && (
              <p className="download-author">
                @{downloadResult.data.author_nickname}
              </p>
            )}


            <div className="download-buttons">

              {(downloadResult.data.no_watermark_link_hd ||
                downloadResult.data.no_watermark_link) && (

                <a
                  href={
                    downloadResult.data.no_watermark_link_hd ||
                    downloadResult.data.no_watermark_link
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-button primary"
                >
                  Download No Watermark ↓
                </a>

              )}


              {downloadResult.data.video &&
                (
                  <a
                    href={
                      downloadResult.data.video
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-button"
                  >
                    Download Video ↓
                  </a>
                )
              }


              {downloadResult.data.audio && (
                <a
                  href={
                    downloadResult.data.audio
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-button"
                >
                  Download Audio ↓
                </a>
              )}

            </div>

          </div>
        )}

      </section>


      <section className="download-platforms">

        <div className="platform-card">
          <strong>
            TikTok
          </strong>

          <span>
            Video tanpa watermark
          </span>
        </div>

        <div className="platform-card">
          <strong>
            Facebook
          </strong>

          <span>
            Download video Facebook
          </span>
        </div>

        <div className="platform-card">
          <strong>
            CapCut
          </strong>

          <span>
            Download video CapCut
          </span>
        </div>

      </section>

    </div>
  );
};
  // =====================================================
  // DASHBOARD
  // =====================================================

  <button
  className={
    page === "media"
      ? "nav-item active"
      : "nav-item"
  }
  onClick={() => {
    setPage("media");
    setSidebarOpen(false);
  }}
>
  <span className="nav-icon">
    ↓
  </span>

  <span>
    Media Download
  </span>
</button>

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
            {loading
              ? "Memuat..."
              : "â†» Refresh"}
          </button>

        </header>

        {/* STATS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon purple">
              âš¡
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
                â—{" "}
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
                â—{" "}
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
              <span>â†’</span>
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
                    <span>â†’</span>
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
                  âœ“
                </div>

                <h2>
                  Kode Siap!
                </h2>

                <p>
                  Buka WhatsApp â†’
                  Perangkat tertaut â†’
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
                    ? "âœ“ Kode Tersalin"
                    : "â§‰ Copy Code"}

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
              : "â†» Refresh"}
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
                Hubungkan WhatsApp â†’
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
                            â— Connected
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
            D
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
          <span>âŒ‚</span>
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
          <span>ï¼‹</span>
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
          <span>â—‰</span>
          <small>
            Sessions
          </small>
        </button>

      </nav>


      {/* TOAST */}

      {message && (

        <div className="toast">

          <span>
            âœ“
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

    </div>

  );
}
{page === "dashboard" && renderDashboard()}

{page === "pairing" && renderPairing()}

{page === "sessions" && renderSessions()}

{page === "media" && renderMediaDownload()}
export default App;
