import { useEffect, useState } from "react";
import "./style.css";

const API = "";

function App() {
  // =====================================================
  // STATE
  // =====================================================

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
        "KESALAHAN STATUS:",
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
  // AUTO UPDATE STATUS
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
      setMessage(
        "Masukkan nomor WhatsApp terlebih dahulu."
      );
      return;
    }

    const number =
      normalizeNumber(phoneNumber);

    if (!number || number.length < 10) {
      setMessage(
        "Nomor WhatsApp tidak valid."
      );
      return;
    }

    try {
      setPairingLoading(true);
      setPairingCode("");
      setPairingSession("");
      setCopied(false);

      setMessage(
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
            phoneNumber: number,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "API PAIR:",
        data
      );

      if (!data.success && !data.berhasil) {
        setMessage(
          data.message ||
          data.pesan ||
          "Gagal memulai pairing."
        );
        return;
      }

      const sessionId =
        data.sessionId || number;

      setPairingSession(
        sessionId
      );

      // =================================================
      // JIKA CODE LANGSUNG DIKIRIM API
      // =================================================

      const directCode =
        data.pairingCode ||
        data.code;

      if (directCode) {
        setPairingCode(
          String(directCode)
        );

        setMessage(
          "Kode pairing berhasil dibuat. Salin kode di bawah."
        );

        setPairingLoading(false);

        return;
      }

      // =================================================
      // POLLING MENUNGGU CODE
      // =================================================

      setMessage(
        "Permintaan pairing berhasil. Menunggu kode..."
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

            const code =
              result.pairingCode ||
              result.code;

            if (code) {
              setPairingCode(
                String(code)
              );

              setMessage(
                "Kode pairing berhasil dibuat. Salin kode di bawah."
              );

              clearInterval(timer);

              setPairingLoading(false);
            }

            const connected =
              result.connected === true ||
              result.terhubung === true;

            if (connected) {
              setBotConnected(true);

              setMessage(
                "WhatsApp berhasil terhubung."
              );

              clearInterval(timer);

              setPairingLoading(false);

              loadStatus();
            }

            if (attempts >= 30) {
              clearInterval(timer);

              setPairingLoading(false);

              if (!code) {
                setMessage(
                  "Waktu menunggu pairing habis. Silakan coba lagi."
                );
              }
            }

          } catch (error) {
            console.error(
              "KESALAHAN CEK PAIRING:",
              error
            );
          }
        },
        2000
      );

    } catch (error) {
      console.error(
        "KESALAHAN PAIRING:",
        error
      );

      setMessage(
        "Tidak dapat menghubungi server API."
      );

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

      setMessage(
        "Kode pairing berhasil disalin."
      );

      setTimeout(() => {
        setCopied(false);
      }, 2500);

    } catch (error) {
      console.error(
        "KESALAHAN COPY:",
        error
      );

      setMessage(
        "Gagal menyalin kode pairing."
      );
    }
  };

  // =====================================================
  // OPEN LOGOUT MODAL
  // =====================================================

  const openLogoutModal = (session) => {
    setLogoutTarget(session);
    setLogoutNumber("");
    setLogoutMessage("");
  };

  // =====================================================
  // CLOSE LOGOUT MODAL
  // =====================================================

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
      normalizeNumber(logoutNumber);

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

      if (
        !data.success &&
        !data.berhasil
      ) {
        setLogoutMessage(
          data.message ||
          data.pesan ||
          "Gagal logout sesi."
        );
        return;
      }

      setLogoutTarget(null);
      setLogoutNumber("");

      setMessage(
        "Sesi berhasil dihapus."
      );

      await loadStatus();

    } catch (error) {
      console.error(
        "KESALAHAN LOGOUT:",
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
      <>
        <header className="topbar">
          <div>
            <span className="eyebrow">
              DIN BOT / DASHBOARD
            </span>

            <h1>
              Bot WhatsApp
            </h1>

            <p>
              Kelola koneksi WhatsApp
              dan pairing bot kamu.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadStatus}
            disabled={loading}
          >
            <span>↻</span>

            {loading
              ? "Memuat..."
              : "Refresh"}
          </button>
        </header>

        {/* STATUS */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">
              ◉
            </div>

            <div>
              <span className="stat-label">
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
                    ? "text-online"
                    : "text-offline"
                }
              >
                ●{" "}
                {serverOnline
                  ? "SERVER ONLINE"
                  : "SERVER OFFLINE"}
              </small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon whatsapp">
              W
            </div>

            <div>
              <span className="stat-label">
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
                    ? "text-online"
                    : "text-waiting"
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
              <span className="stat-label">
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

        {/* PAIRING */}

        <section className="content-card pairing-card">

          <div className="section-header">

            <div className="section-number">
              01
            </div>

            <div>
              <span className="eyebrow">
                HUBUNGKAN PERANGKAT
              </span>

              <h2>
                WhatsApp
              </h2>

              <p>
                Masukkan nomor WhatsApp
                untuk mendapatkan kode pairing.
              </p>
            </div>

          </div>

          <div className="pairing-form">

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
                  Hubungkan
                  <span>→</span>
                </>
              )}
            </button>

          </div>

          {!serverOnline && (
            <div className="warning-box">
              <span>!</span>

              API server sedang offline.
              Pastikan bot backend berjalan.
            </div>
          )}

          {message && (
            <div className="message-box">
              <span>●</span>
              {message}
            </div>
          )}

          {/* PAIRING CODE */}

          {pairingCode && (
            <div className="pairing-result">

              <div className="result-header">

                <div>
                  <span className="success-label">
                    KODE PAIRING SIAP
                  </span>

                  <h3>
                    Hubungkan WhatsApp kamu
                  </h3>

                  <p>
                    Buka WhatsApp → Perangkat
                    tertaut → Tautkan dengan
                    nomor telepon.
                  </p>
                </div>

                <div className="success-icon">
                  ✓
                </div>

              </div>

              <div className="code-container">

                <div className="code-label">
                  KODE PAIRING
                </div>

                <div className="code-row">

                  <div className="pairing-code">
                    {pairingCode}
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
                      ? "✓ Tersalin"
                      : "Copy"}
                  </button>

                </div>

              </div>

              <div className="code-info">

                <span>
                  NOMOR SESI
                </span>

                <strong>
                  {maskNumber(
                    pairingSession
                  )}
                </strong>

              </div>

            </div>
          )}

        </section>

        <footer className="dashboard-footer">
          <span>
            DIN BOT © 2026
          </span>

          <span>
            Update terakhir:{" "}
            {lastUpdate}
          </span>
        </footer>
      </>
    );
  };

  // =====================================================
  // SESSIONS
  // =====================================================

  const renderSessions = () => {
    return (
      <>
        <header className="topbar">

          <div>
            <span className="eyebrow">
              DIN BOT / SESSIONS
            </span>

            <h1>
              Sesi WhatsApp
            </h1>

            <p>
              Kelola semua perangkat
              WhatsApp yang terdaftar.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadStatus}
            disabled={loading}
          >
            <span>↻</span>

            {loading
              ? "Memuat..."
              : "Refresh"}
          </button>

        </header>

        <section className="content-card sessions-card">

          <div className="sessions-header">

            <div>
              <span className="eyebrow">
                MANAJEMEN PERANGKAT
              </span>

              <h2>
                Daftar Sesi
              </h2>

              <p>
                Kelola perangkat WhatsApp
                yang sudah terhubung.
              </p>
            </div>

            <div className="session-counter">
              <strong>
                {sessions.length}
              </strong>

              <span>
                Sesi
              </span>
            </div>

          </div>

          {sessions.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                W
              </div>

              <h3>
                Belum ada sesi
              </h3>

              <p>
                Belum ada perangkat WhatsApp
                yang terdaftar.
              </p>

              <button
                className="empty-button"
                onClick={() => {
                  setPage("dashboard");
                }}
              >
                Hubungkan WhatsApp →
              </button>

            </div>

          ) : (

            <div className="session-list">

              {sessions.map(
                (session, index) => {

                  const sessionNumber =
                    session.number ||
                    session.phoneNumber ||
                    session.sessionId ||
                    "";

                  const sessionId =
                    session.sessionId ||
                    session.id ||
                    sessionNumber;

                  return (
                    <div
                      className="session-item"
                      key={
                        sessionId ||
                        index
                      }
                    >

                      <div className="session-left">

                        <div className="session-avatar">
                          W
                        </div>

                        <div className="session-details">

                          <h3>
                            {session.name ||
                              "Bot WhatsApp"}
                          </h3>

                          <p>
                            {maskNumber(
                              sessionNumber
                            )}
                          </p>

                        </div>

                      </div>

                      <div className="session-right">

                        <span
                          className={
                            session.connected
                              ? "session-badge connected"
                              : "session-badge disconnected"
                          }
                        >
                          <span />
                          {session.connected
                            ? "Terhubung"
                            : "Terputus"}
                        </span>

                        <button
                          className="logout-button"
                          onClick={() =>
                            openLogoutModal(
                              {
                                ...session,
                                sessionId,
                              }
                            )
                          }
                        >
                          Logout
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        <footer className="dashboard-footer">
          <span>
            DIN BOT © 2026
          </span>

          <span>
            Update terakhir:{" "}
            {lastUpdate}
          </span>
        </footer>
      </>
    );
  };

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="app">

      {/* BACKGROUND PARTICLE */}

      <div className="particles">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* HEADER MOBILE */}

      <header className="mobile-header">
        <div>
          <strong>
            DIN BOT
          </strong>

          <small>
            WhatsApp Manager
          </small>
        </div>

        <div
          className={
            serverOnline
              ? "online-indicator"
              : "offline-indicator"
          }
        >
          <span />
          {serverOnline
            ? "Online"
            : "Offline"}
        </div>
      </header>

      <div className="layout">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <div className="brand">

            <div className="brand-logo">
              D
            </div>

            <div>
              <h2>
                DIN BOT
              </h2>

              <span>
                WhatsApp Manager
              </span>
            </div>

          </div>

          <nav className="sidebar-nav">

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
              <span>
                ◉
              </span>

              Dashboard
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
              <span>
                #
              </span>

              Sessions

              {sessions.length > 0 && (
                <b>
                  {sessions.length}
                </b>
              )}
            </button>

          </nav>

          <div className="sidebar-bottom">

            <div className="server-status">

              <span
                className={
                  serverOnline
                    ? "status-dot online"
                    : "status-dot offline"
                }
              />

              <div>
                <strong>
                  API Server
                </strong>

                <small>
                  {serverOnline
                    ? "Server online"
                    : "Server offline"}
                </small>
              </div>

            </div>

            <div className="copyright">
              DIN BOT © 2026
            </div>

          </div>

        </aside>

        {/* CONTENT */}

        <main className="main-content">

          {page === "dashboard"
            ? renderDashboard()
            : renderSessions()}

        </main>

      </div>

      {/* MOBILE BOTTOM NAV */}

      <nav className="bottom-nav">

        <button
          className={
            page === "dashboard"
              ? "bottom-nav-item active"
              : "bottom-nav-item"
          }
          onClick={() =>
            setPage("dashboard")
          }
        >
          <span>
            ◉
          </span>

          Dashboard
        </button>

        <button
          className={
            page === "sessions"
              ? "bottom-nav-item active"
              : "bottom-nav-item"
          }
          onClick={() =>
            setPage("sessions")
          }
        >
          <span>
            #
          </span>

          Sessions
        </button>

      </nav>

      {/* LOGOUT MODAL */}

      {logoutTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeLogoutModal();
            }
          }}
        >

          <div className="logout-modal">

            <button
              className="modal-close"
              onClick={
                closeLogoutModal
              }
            >
              ×
            </button>

            <div className="warning-icon">
              !
            </div>

            <h2>
              Logout WhatsApp
            </h2>

            <p>
              Masukkan nomor lengkap
              sesi untuk menghapus
              perangkat ini.
            </p>

            <div className="target-session">

              <span>
                SESI
              </span>

              <strong>
                {maskNumber(
                  logoutTarget.number ||
                  logoutTarget.sessionId
                )}
              </strong>

            </div>

            <input
              type="tel"
              placeholder="628xxxxxxxxxx"
              value={logoutNumber}
              onChange={(e) =>
                setLogoutNumber(
                  e.target.value
                )
              }
              disabled={logoutLoading}
            />

            {logoutMessage && (
              <div className="modal-message">
                {logoutMessage}
              </div>
            )}

            <div className="modal-buttons">

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
                className="confirm-button"
                onClick={
                  confirmLogout
                }
                disabled={logoutLoading}
              >
                {logoutLoading
                  ? "Memproses..."
                  : "Konfirmasi Logout"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default App;
