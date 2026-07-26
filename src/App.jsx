import { useEffect, useState } from "react";
import "./style.css";

const API = "";

function App() {
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
  // Contoh:
  // 6281234567804
  // 62*******04
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
  // AUTO REFRESH
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
        "PAIR API:",
        data
      );

      if (!data.success) {
        setMessage(
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

      if (data.pairingCode) {
        setPairingCode(
          data.pairingCode
        );

        setMessage(
          "Kode pairing berhasil dibuat. Salin kode di bawah."
        );

        return;
      }

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

            if (result.code) {
              setPairingCode(
                result.code
              );

              setMessage(
                "Kode pairing berhasil dibuat. Salin kode di bawah."
              );

              clearInterval(timer);
            }

            if (
              result.connected === true
            ) {
              setBotConnected(true);

              setMessage(
                "WhatsApp berhasil terhubung."
              );

              clearInterval(timer);

              loadStatus();
            }

            if (attempts >= 30) {
              clearInterval(timer);

              if (!result.code) {
                setMessage(
                  "Waktu menunggu pairing habis. Silakan coba lagi."
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

      setMessage(
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

      setMessage(
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

      setMessage(
        "Gagal menyalin kode pairing."
      );
    }
  };

  // =====================================================
  // OPEN LOGOUT
  // =====================================================

  const openLogoutModal = (session) => {
    setLogoutTarget(session);
    setLogoutNumber("");
    setLogoutMessage("");
  };

  // =====================================================
  // CLOSE LOGOUT
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
        "Nomor tidak cocok dengan session."
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
          "Gagal logout session."
        );
        return;
      }

      setLogoutTarget(null);
      setLogoutNumber("");

      setMessage(
        "Session berhasil dihapus."
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
      <>
        <header className="topbar">
          <div>
            <span className="eyebrow">
              DINSTORE / DASHBOARD
            </span>

            <h1>
              WhatsApp Bot
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
            <span>
              ↻
            </span>

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
                    ? "online-text"
                    : "offline-text"
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
                    ? "online-text"
                    : "waiting-text"
                }
              >
                ●{" "}
                {botConnected
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
              <span>
                SESSIONS
              </span>

              <h3>
                {sessions.length}
              </h3>

              <small>
                SESSION TERDAFTAR
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
                CONNECT DEVICE
              </span>

              <h2>
                Hubungkan WhatsApp
              </h2>

              <p>
                Masukkan nomor WhatsApp
                untuk mendapatkan pairing code.
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
                  <span>
                    →
                  </span>
                </>
              )}
            </button>

          </div>

          {!serverOnline && (
            <div className="warning-box">
              <span>!</span>
              Server API sedang offline.
              Pastikan backend bot berjalan.
            </div>
          )}

          {message && (
            <div className="message-box">
              <span>
                ●
              </span>

              {message}
            </div>
          )}

          {/* PAIRING CODE */}

          {pairingCode && (
            <div className="pairing-result">

              <div className="result-header">

                <div>
                  <span className="success-label">
                    PAIRING CODE SIAP
                  </span>

                  <h3>
                    Hubungkan perangkat
                    WhatsApp kamu
                  </h3>

                  <p>
                    Buka WhatsApp →
                    Perangkat tertaut →
                    Tautkan dengan nomor telepon.
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
                      : "⧉ Copy"}
                  </button>

                </div>

              </div>

              <div className="code-info">
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
          )}

        </section>

        <div className="dashboard-footer">
          <span>
            DINSTORE © 2026
          </span>

          <span>
            Update terakhir:{" "}
            {lastUpdate}
          </span>
        </div>
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
              DINSTORE / SESSIONS
            </span>

            <h1>
              Sessions WhatsApp
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
            <span>
              ↻
            </span>

            {loading
              ? "Memuat..."
              : "Refresh"}
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
                Nomor WhatsApp ditampilkan
                secara tersamarkan untuk keamanan.
              </p>
            </div>

            <div className="session-counter">
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
                Belum ada session
              </h3>

              <p>
                Belum ada perangkat WhatsApp
                yang terdaftar.
              </p>

              <button
                className="empty-button"
                onClick={() => {
                  setPage(
                    "dashboard"
                  );
                }}
              >
                Hubungkan WhatsApp →
              </button>

            </div>

          ) : (

            <div className="session-list">

              {sessions.map(
                (session) => (

                  <div
                    className="session-item"
                    key={
                      session.sessionId
                    }
                  >

                    <div className="session-left">

                      <div className="session-avatar">
                        W
                      </div>

                      <div className="session-info">

                        <h3>
                          {session.name ||
                            "WhatsApp Bot"}
                        </h3>

                        <p>
                          {maskNumber(
                            session.number ||
                            session.sessionId
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="session-actions">

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
                            session
                          )
                        }
                      >
                        Keluar
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        <div className="dashboard-footer">
          <span>
            DINSTORE © 2026
          </span>

          <span>
            Update terakhir:{" "}
            {lastUpdate}
          </span>
        </div>
      </>
    );
  };

  // =====================================================
  // APP
  // =====================================================

  return (
  <div className="app">
    {/* SIDEBAR */}
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
    D
</div>
        <div className="brand-info">
          <h2>DIN-STORE</h2>
          <span>WhatsApp Bot v 1.02.</span>
        </div>
      </div>

        <nav className="sidebar-menu">

          <button
            className={
              page === "dashboard"
                ? "menu-item active"
                : "menu-item"
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            <span>
              ⌂
            </span>

            Dashboard
          </button>

          <button
            className={
              page === "sessions"
                ? "menu-item active"
                : "menu-item"
            }
            onClick={() =>
              setPage("sessions")
            }
          >
            <span>
              ◉
            </span>

            Sessions

            {sessions.length > 0 && (
              <b className="menu-count">
                {sessions.length}
              </b>
            )}
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="system-status">

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
                  ? "Online"
                  : "Offline"}
              </small>
            </div>

          </div>

          <div className="copyright">
            PANEL-BOT © 2026
          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {page === "dashboard"
          ? renderDashboard()
          : renderSessions()}

      </main>

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

            <span className="eyebrow">
              SECURITY CHECK
            </span>

            <h2>
              Keluar dari WhatsApp?
            </h2>

            <p>
              Untuk keamanan, masukkan
              nomor lengkap session yang
              ingin kamu keluarkan.
            </p>

            <div className="target-session">

              <span>
                SESSION
              </span>

              <strong>
                {maskNumber(
                  logoutTarget.number ||
                  logoutTarget.sessionId
                )}
              </strong>

            </div>

            <input
              className="logout-input"
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
