import { useEffect, useState } from "react";
import "./style.css";

// =====================================================
// KONFIGURASI API DIN BOT
// =====================================================
// Kosongkan jika frontend dan backend satu domain.
// Jika backend berbeda:
// const API = "https://backend-kamu.vercel.app";
// =====================================================

const API = "";

// =====================================================
// APP
// =====================================================

function App() {
  // ===================================================
  // MUSIK BACKGROUND
  // ===================================================

  useEffect(() => {
    const audio = new Audio("/musik.mp3");

    audio.loop = true;
    audio.volume = 0.5;

    const playMusic = () => {
      audio.play().catch(() => {});
    };

    // Coba autoplay
    playMusic();

    // Browser biasanya membutuhkan interaksi user
    document.addEventListener("click", playMusic, {
      once: true,
    });

    document.addEventListener("touchstart", playMusic, {
      once: true,
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;

      document.removeEventListener("click", playMusic);
      document.removeEventListener(
        "touchstart",
        playMusic
      );
    };
  }, []);

  // ===================================================
  // NAVIGASI
  // ===================================================

  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ===================================================
  // STATUS SERVER
  // ===================================================

  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState("-");

  // ===================================================
  // PAIRING
  // ===================================================

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingSession, setPairingSession] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // ===================================================
  // LOGOUT
  // ===================================================

  const [logoutTarget, setLogoutTarget] = useState(null);
  const [logoutNumber, setLogoutNumber] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");

  // ===================================================
  // DOWNLOADER
  // ===================================================

  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [downloadError, setDownloadError] = useState("");

  // ===================================================
  // NORMALIZE NOMOR
  // ===================================================

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

  // ===================================================
  // MASK NOMOR
  // ===================================================

  const maskNumber = (number) => {
    if (!number) {
      return "-";
    }

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

  // ===================================================
  // TOAST
  // ===================================================

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // ===================================================
  // LOAD STATUS DIN BOT
  // ===================================================

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

      console.log("STATUS API:", data);

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
      console.error("STATUS ERROR:", error);

      setServerOnline(false);
      setBotConnected(false);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // AUTO REFRESH STATUS
  // ===================================================

  useEffect(() => {
    loadStatus();

    const timer = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ===================================================
  // START PAIRING
  // ===================================================

  const startPairing = async () => {
    if (!phoneNumber.trim()) {
      showMessage(
        "Masukkan nomor WhatsApp terlebih dahulu."
      );
      return;
    }

    const number = normalizeNumber(phoneNumber);

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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number,
          }),
        }
      );

      const data = await response.json();

      console.log("PAIRING API:", data);

      if (!data.success) {
        showMessage(
          data.message ||
          "Gagal memulai pairing."
        );
        return;
      }

      const sessionId =
        data.sessionId || number;

      setPairingSession(sessionId);

      // Jika API langsung memberikan kode
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);

        showMessage(
          "Kode pairing berhasil dibuat."
        );

        return;
      }

      showMessage(
        "Menunggu kode pairing..."
      );

      let attempts = 0;

      const timer = setInterval(async () => {
        attempts++;

        try {
          const response = await fetch(
            `${API}/api/pairing/${encodeURIComponent(
              sessionId
            )}`,
            {
              cache: "no-store",
            }
          );

          const result = await response.json();

          console.log(
            "PAIRING STATUS:",
            result
          );

          if (
            result.code ||
            result.pairingCode
          ) {
            setPairingCode(
              result.code ||
              result.pairingCode
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

            showMessage(
              "Waktu menunggu pairing habis."
            );
          }
        } catch (error) {
          console.error(
            "PAIRING CHECK ERROR:",
            error
          );
        }
      }, 2000);
    } catch (error) {
      console.error(
        "PAIRING ERROR:",
        error
      );

      showMessage(
        "Tidak dapat menghubungi server API."
      );
    } finally {
      setPairingLoading(false);
    }
  };

  // ===================================================
  // COPY PAIRING CODE
  // ===================================================

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

  // ===================================================
  // LOGOUT MODAL
  // ===================================================

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

  // ===================================================
  // CONFIRM LOGOUT
  // ===================================================

  const confirmLogout = async () => {
    if (!logoutTarget) {
      return;
    }

    const input = normalizeNumber(
      logoutNumber
    );

    const target = normalizeNumber(
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

      const response = await fetch(
        `${API}/api/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId:
              logoutTarget.sessionId ||
              logoutTarget.number,
          }),
        }
      );

      const data = await response.json();

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

  // ===================================================
  // DETEKSI PLATFORM DOWNLOADER
  // ===================================================

  const detectPlatform = (url) => {
    const value = url.toLowerCase();

    if (
      value.includes("facebook.com") ||
      value.includes("fb.watch")
    ) {
      return "facebook";
    }

    if (
      value.includes("tiktok.com") ||
      value.includes("vt.tiktok.com")
    ) {
      return "tiktok";
    }

    if (
      value.includes("capcut.com")
    ) {
      return "capcut";
    }

    return null;
  };

  // ===================================================
  // MEDIA DOWNLOADER
  // ===================================================

  const startDownload = async (event) => {
    event.preventDefault();

    const url = downloadUrl.trim();

    if (!url) {
      setDownloadError(
        "Masukkan link video terlebih dahulu."
      );
      return;
    }

    const platform = detectPlatform(url);

    if (!platform) {
      setDownloadError(
        "Link tidak didukung. Gunakan Facebook, TikTok, atau CapCut."
      );
      return;
    }

    try {
      setDownloadLoading(true);
      setDownloadError("");
      setDownloadResult(null);

      let apiUrl = "";

      // API DOWNLOADER TERPISAH
      if (platform === "facebook") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(
            url
          )}`;
      }

      if (platform === "tiktok") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(
            url
          )}`;
      }

      if (platform === "capcut") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(
            url
          )}`;
      }

      const response =
        await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      if (
        !data.status ||
        !data.data
      ) {
        throw new Error(
          "Data tidak ditemukan"
        );
      }

      setDownloadResult({
        platform,
        data: data.data,
      });
    } catch (error) {
      console.error(
        "DOWNLOADER ERROR:",
        error
      );

      setDownloadError(
        "Gagal mengambil video. Pastikan link benar dan dapat diakses publik."
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  // ===================================================
  // DOWNLOAD BUTTON
  // ===================================================

  const DownloadButton = ({
    url,
    children,
    className = "",
  }) => {
    if (!url) {
      return null;
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`download-button ${className}`}
      >
        <span>{children}</span>
        <span>↓</span>
      </a>
    );
  };

  // ===================================================
  // RENDER DOWNLOAD RESULT
  // ===================================================

  const renderDownloadResult = () => {
    if (!downloadResult) {
      return null;
    }

    const {
      platform,
      data,
    } = downloadResult;

    // =================================================
    // FACEBOOK
    // =================================================

    if (platform === "facebook") {
      return (
        <div className="downloader-result">

          <div className="result-media">

            <img
              src={
                data.thumbnail ||
                "https://via.placeholder.com/600x400?text=Facebook"
              }
              alt="Facebook"
            />

            <span className="result-badge facebook">
              Facebook
            </span>

          </div>

          <div className="result-info">

            <h3>
              {data.title ||
                "Video Facebook"}
            </h3>

            {data.duration && (
              <p>
                Durasi: {data.duration}
              </p>
            )}

            <div className="download-options">

              {Array.isArray(
                data.downloads
              ) &&
                data.downloads.map(
                  (item, index) => (
                    <DownloadButton
                      key={index}
                      url={item.url}
                      className="facebook-download"
                    >
                      Download Video{" "}
                      {item.quality || ""}
                    </DownloadButton>
                  )
                )}

            </div>

          </div>

        </div>
      );
    }

    // =================================================
    // TIKTOK
    // =================================================

    if (platform === "tiktok") {
      return (
        <div className="downloader-result">

          <div className="result-media">

            <img
              src={
                data.cover_link ||
                data.origin_cover ||
                "https://via.placeholder.com/600x400?text=TikTok"
              }
              alt="TikTok"
            />

            <span className="result-badge tiktok">
              TikTok
            </span>

          </div>

          <div className="result-info">

            <h3>
              {data.text ||
                "Video TikTok"}
            </h3>

            {data.author_nickname && (
              <p>
                @{data.author_nickname}
              </p>
            )}

            <div className="download-options">

              <DownloadButton
                url={
                  data.no_watermark_link_hd ||
                  data.no_watermark_link
                }
                className="tiktok-download"
              >
                Download Video No Watermark
              </DownloadButton>

              <DownloadButton
                url={data.music_link}
                className="audio-download"
              >
                Download Audio MP3
              </DownloadButton>

            </div>

          </div>

        </div>
      );
    }

    // =================================================
    // CAPCUT
    // =================================================

    if (platform === "capcut") {
      return (
        <div className="downloader-result">

          <div className="result-media">

            <img
              src={
                data.coverUrl ||
                "https://via.placeholder.com/600x400?text=CapCut"
              }
              alt="CapCut"
            />

            <span className="result-badge capcut">
              CapCut
            </span>

          </div>

          <div className="result-info">

            <h3>
              {data.title ||
                "Template CapCut"}
            </h3>

            {data.authorName && (
              <p>
                @{data.authorName}
              </p>
            )}

            <div className="download-options">

              <DownloadButton
                url={
                  data.originalVideoUrl
                }
                className="capcut-download"
              >
                Download Video Template
              </DownloadButton>

            </div>

          </div>

        </div>
      );
    }

    return null;
  };

  // ===================================================
  // DASHBOARD
  // ===================================================

  const renderDashboard = () => {
    return (
      <div className="page-content">

        <header className="topbar">

          <div>
            <span className="eyebrow">
              PANEL BOT / DASHBOARD
            </span>

            <h1>
              Bot WhatsApp
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
              : "↻ Segarkan"}
          </button>

        </header>

        {/* STATISTIK */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon purple">
              ◉
            </div>

            <div>
              <span>
                SERVER API
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
                WhatsApp
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
                SESI
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
              Hubungkan perangkat WhatsApp,
              lihat kode pairing,
              dan kelola semua sesi
              dari satu tempat.
            </p>

            <button
              className="hero-button"
              onClick={() => {
                setPage("pairing");
                setSidebarOpen(false);
              }}
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

        {/* INFO SISTEM */}

        <section className="content-card">

          <div className="section-title">

            <div>
              <span className="eyebrow">
                SISTEM
              </span>

              <h2>
                Informasi Sistem
              </h2>
            </div>

            <div className="status-pill">
              <span />
              {serverOnline
                ? "AKTIF"
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
                Versi
              </span>

              <strong>
                Versi 1.0.0
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
                Pembaruan Terakhir
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

  // ===================================================
  // PAIRING
  // ===================================================

  const renderPairing = () => {
    return (
      <div className="page-content">

        <header className="topbar">

          <div>
            <span className="eyebrow">
              DIN BOT / PAIRING
            </span>

            <h1>
              WhatsApp
            </h1>

            <p>
              Masukkan nomor WhatsApp
              untuk mendapatkan kode pairing.
            </p>
          </div>

          <div
            className={
              serverOnline
                ? "server-status online"
                : "server-status offline"
            }
          >
            <span />
            {serverOnline
              ? "API Online"
              : "API Offline"}
          </div>

        </header>

        <section className="pairing-layout">

          {/* FORM NOMOR */}

          <div className="content-card pairing-main">

            <div className="step-header">

              <div className="step-number">
                01
              </div>

              <div>
                <span className="eyebrow">
                  HUBUNGKAN PERANGKAT
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
                  disabled={pairingLoading}
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

                {pairingLoading ? (
                  <>
                    <span className="spinner" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Dapatkan Kode Pairing
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
                    Server API Offline
                  </strong>

                  <p>
                    Pastikan backend DIN BOT
                    sedang berjalan.
                  </p>
                </div>

              </div>
            )}

          </div>

          {/* KODE PAIRING */}

          <div className="content-card code-card">

            <div className="code-card-header">

              <span className="eyebrow">
                KODE PAIRING
              </span>

              <div className="code-status">
                {pairingCode
                  ? "SIAP"
                  : "MENUNGGU"}
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
                  className="copy-button"
                  onClick={
                    copyPairingCode
                  }
                >
                  {copied
                    ? "✓ Berhasil Disalin"
                    : "Salin Kode"}
                </button>

                {pairingSession && (
                  <small>
                    Session:{" "}
                    {maskNumber(
                      pairingSession
                    )}
                  </small>
                )}

              </div>

            ) : (

              <div className="empty-code">

                <div className="empty-icon">
                  ◌
                </div>

                <h3>
                  Belum Ada Kode
                </h3>

                <p>
                  Masukkan nomor WhatsApp
                  untuk membuat kode pairing.
                </p>

              </div>

            )}

          </div>

        </section>

      </div>
    );
  };

  // ===================================================
  // DOWNLOADER PAGE
  // ===================================================

  const renderDownloader = () => {
    return (
      <div className="page-content">

        <header className="topbar">

          <div>
            <span className="eyebrow">
              DIN BOT / TOOLS
            </span>

            <h1>
              Media Downloader
            </h1>

            <p>
              Download video dari Facebook,
              TikTok, dan CapCut.
            </p>
          </div>

          <div className="downloader-platforms">
            <span>Facebook</span>
            <span>TikTok</span>
            <span>CapCut</span>
          </div>

        </header>

        <section className="content-card downloader-card">

          <div className="section-title">

            <div>
              <span className="eyebrow">
                MEDIA DOWNLOADER
              </span>

              <h2>
                Download Video
              </h2>
            </div>

          </div>

          <form
            className="downloader-form"
            onSubmit={startDownload}
          >

            <label>
              Link Video
            </label>

            <input
              type="url"
              placeholder="Tempel link Facebook / TikTok / CapCut..."
              value={downloadUrl}
              onChange={(e) => {
                setDownloadUrl(
                  e.target.value
                );
                setDownloadError("");
              }}
            />

            <button
              type="submit"
              className="download-search-button"
              disabled={downloadLoading}
            >

              {downloadLoading ? (
                <>
                  <span className="spinner" />
                  Memproses...
                </>
              ) : (
                <>
                  Cari Video
                  <span>→</span>
                </>
              )}

            </button>

          </form>

          {downloadError && (
            <div className="warning-box downloader-error">

              <span>!</span>

              <div>
                <strong>
                  Gagal Memproses
                </strong>

                <p>
                  {downloadError}
                </p>
              </div>

            </div>
          )}

        </section>

        {downloadLoading && (
          <section className="content-card downloader-loading">

            <div className="spinner large" />

            <h3>
              Sedang mengambil video...
            </h3>

            <p>
              Mohon tunggu sebentar.
            </p>

          </section>
        )}

        {renderDownloadResult()}

      </div>
    );
  };

  // ===================================================
  // SESSIONS PAGE
  // ===================================================

  const renderSessions = () => {
    return (
      <div className="page-content">

        <header className="topbar">

          <div>
            <span className="eyebrow">
              DIN BOT / SESSIONS
            </span>

            <h1>
              Sesi Bot
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
            ↻ Refresh
          </button>

        </header>

        <section className="content-card">

          <div className="section-title">

            <div>
              <span className="eyebrow">
                PERANGKAT
              </span>

              <h2>
                Sesi Terdaftar
              </h2>
            </div>

            <span className="session-count">
              {sessions.length} Sesi
            </span>

          </div>

          {sessions.length === 0 ? (

            <div className="empty-sessions">

              <div className="empty-icon">
                ◌
              </div>

              <h3>
                Belum Ada Sesi
              </h3>

              <p>
                Belum ada perangkat WhatsApp
                yang terhubung.
              </p>

              <button
                className="hero-button"
                onClick={() => {
                  setPage("pairing");
                  setSidebarOpen(false);
                }}
              >
                Hubungkan WhatsApp →
              </button>

            </div>

          ) : (

            <div className="sessions-list">

              {sessions.map(
                (session, index) => {

                  const number =
                    session.number ||
                    session.sessionId ||
                    "-";

                  const connected =
                    session.connected === true ||
                    session.status === "connected";

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

                      <div className="session-info">

                        <strong>
                          {maskNumber(number)}
                        </strong>

                        <span
                          className={
                            connected
                              ? "online"
                              : "waiting"
                          }
                        >
                          ●{" "}
                          {connected
                            ? "Terhubung"
                            : "Menunggu"}
                        </span>

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

  // ===================================================
  // SIDEBAR
  // ===================================================

  const navigate = (target) => {
    setPage(target);
    setSidebarOpen(false);
  };

  // ===================================================
  // APP RENDER
  // ===================================================

  return (
    <div className="app">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={
          sidebarOpen
            ? "sidebar open"
            : "sidebar"
        }
      >

        <div className="brand">

          <div className="brand-logo">
            W
          </div>

          <div>
            <strong>
              DIN BOT
            </strong>

            <span>
              WhatsApp Panel
            </span>
          </div>

        </div>

        <nav className="sidebar-nav">

          <span className="nav-label">
            MENU UTAMA
          </span>

          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              page === "pairing"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("pairing")
            }
          >
            <span>◈</span>
            Pairing WhatsApp
          </button>

          <button
            className={
              page === "sessions"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("sessions")
            }
          >
            <span>◉</span>
            Sesi Bot
          </button>

          <span className="nav-label">
            TOOLS
          </span>

          <button
            className={
              page === "downloader"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigate("downloader")
            }
          >
            <span>↓</span>
            Media Downloader
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="bot-status-mini">

            <span
              className={
                serverOnline
                  ? "status-dot online"
                  : "status-dot offline"
              }
            />

            <div>
              <strong>
                {serverOnline
                  ? "Server Online"
                  : "Server Offline"}
              </strong>

              <small>
                {botConnected
                  ? "Bot terhubung"
                  : "Bot belum terhubung"}
              </small>
            </div>

          </div>

          <small className="copyright">
            DIN BOT © 2026
          </small>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* MOBILE HEADER */}

        <div className="mobile-header">

          <button
            className="menu-button"
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
          >
            ☰
          </button>

          <strong>
            DIN BOT
          </strong>

        </div>

        {/* TOAST */}

        {message && (
          <div className="toast">
            <span>✓</span>
            {message}
          </div>
        )}

        {/* PAGE */}

        {page === "dashboard" &&
          renderDashboard()}

        {page === "pairing" &&
          renderPairing()}

        {page === "sessions" &&
          renderSessions()}

        {page === "downloader" &&
          renderDownloader()}

      </main>

      {/* LOGOUT MODAL */}

      {logoutTarget && (
        <div className="modal-overlay">

          <div className="modal">

            <button
              className="modal-close"
              onClick={
                closeLogoutModal
              }
            >
              ×
            </button>

            <div className="modal-icon">
              !
            </div>

            <h2>
              Logout Sesi
            </h2>

            <p>
              Untuk menghapus sesi ini,
              masukkan nomor WhatsApp
              lengkap.
            </p>

            <div className="modal-target">
              Sesi:{" "}
              <strong>
                {maskNumber(
                  logoutTarget.number ||
                  logoutTarget.sessionId
                )}
              </strong>
            </div>

            <input
              type="tel"
              placeholder="Contoh: 628123456789"
              value={logoutNumber}
              onChange={(e) =>
                setLogoutNumber(
                  e.target.value
                )
              }
              disabled={logoutLoading}
            />

            {logoutMessage && (
              <div className="modal-error">
                {logoutMessage}
              </div>
            )}

            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={
                  closeLogoutModal
                }
                disabled={logoutLoading}
              >
                Batal
              </button>

              <button
                className="confirm-logout-button"
                onClick={
                  confirmLogout
                }
                disabled={logoutLoading}
              >
                {logoutLoading
                  ? "Memproses..."
                  : "Logout Sesi"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;
