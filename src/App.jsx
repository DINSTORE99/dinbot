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

  // ==========================================
  // NORMALIZE NOMOR
  // ==========================================

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

  // ==========================================
  // MASK NOMOR
  // ==========================================

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

  // ==========================================
  // TOAST
  // ==========================================

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // ==========================================
  // LOAD STATUS
  // ==========================================

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

  // ==========================================
  // AUTO REFRESH
  // ==========================================

  useEffect(() => {
    loadStatus();

    const timer = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ==========================================
  // START PAIRING
  // ==========================================

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

      setPairingSession(sessionId);

      // Jika kode langsung diberikan backend
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
                  cache: "no-store",
                }
              );

            const result =
              await response.json();

            console.log(
              "STATUS PAIRING:",
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

      showMessage(
        "Tidak dapat menghubungi server API."
      );

    } finally {
      setPairingLoading(false);
    }
  };

  // ==========================================
  // COPY PAIRING CODE
  // ==========================================

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
        "KESALAHAN COPY:",
        error
      );

      showMessage(
        "Gagal menyalin kode pairing."
      );
    }
  };

  // ==========================================
  // LOGOUT MODAL
  // ==========================================

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

  // ==========================================
  // CONFIRM LOGOUT
  // ==========================================

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

  // ==========================================
  // DASHBOARD
  // ==========================================

  const renderDashboard = () => {
    return (
      <>
        <header className="topbar">
          <div>
            <span className="eyebrow">
              DIN STORE / DASHBOARD
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

        {/* STATUS CARDS */}

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">
              ◉
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
              <span>
                SESSION
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
                value={phoneNumber.replace(
                  /^62/,
                  ""
                )}
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
              Pastikan backend bot berjalan.
            </div>
          )}

          {/* KODE PAIRING */}

          {pairingCode && (
            <div className="pairing-result">

              <div className="result-header">

                <div>
                  <span className="success-label">
                    ● KODE PAIRING SIAP
                  </span>

                  <h3>
                    Hubungkan WhatsApp kamu
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
                      : "Copy"}
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
            DIN STORE © 2026
          </span>

          <span>
            Update terakhir:{" "}
            {lastUpdate}
          </span>

        </div>
      </>
    );
  };

  // ==========================================
  // SESSIONS
  // ==========================================

  const renderSessions = () => {
    return (
      <>
        <header className="topbar">

          <div>
            <span className="eyebrow">
              DIN STORE / SESSIONS
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
                Nomor WhatsApp ditampilkan
                secara tersamarkan.
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
                onClick={() =>
                  setPage("dashboard")
                }
              >
                Hubungkan WhatsApp →
              </button>

            </div>

          ) : (

            <div className="session-list">

              {sessions.map(
                (session, index) => (

                  <div
                    className="session-item"
                    key={
                      session.sessionId ||
                      session.number ||
                      index
                    }
                  >

                    <div className="session-left">

                      <div className="session-avatar">
                        W
                      </div>

                      <div className="session-info">

                        <h3>
                          {session.name ||
                            "Bot WhatsApp"}
                        </h3>

                        <p>
                          {maskNumber(
                            session.number ||
                            session.sessionId
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="session-right">

                      <span
                        className={
                          session.connected === false
                            ? "session-status offline"
                            : "session-status"
                        }
                      >
                        ●{" "}
                        {session.connected === false
                          ? "Offline"
                          : "Online"}
                      </span>

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

                  </div>

                )
              )}

            </div>

          )}

        </section>
      </>
    );
  };

  // ==========================================
  // APP
  // ==========================================

  return (
    <div className="app">

      <div className="background-effects">
        <div className="particle p1" />
        <div className="particle p2" />
        <div className="particle p3" />
        <div className="particle p4" />
        <div className="particle p5" />
      </div>

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
              WhatsApp Manager
            </span>
          </div>
        </div>

        <div className="connection-status">

          <span
            className={
              serverOnline
                ? "status-dot online"
                : "status-dot"
            }
          />

          {serverOnline
            ? "Online"
            : "Offline"}

        </div>

      </header>

      <main className="main-container">

        {page === "dashboard"
          ? renderDashboard()
          : renderSessions()}

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
          <span className="nav-icon">
            ⌂
          </span>

          <span>
            Dashboard
          </span>
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
          <span className="nav-icon">
            ◉
          </span>

          <span>
            Sessions
          </span>

          {sessions.length > 0 && (
            <b className="nav-badge">
              {sessions.length}
            </b>
          )}

        </button>

      </nav>

      {/* TOAST */}

      {message && (
        <div className="toast show">
          <span>✓</span>
          {message}
        </div>
      )}

      {/* LOGOUT MODAL */}

      {logoutTarget && (
        <div
          className="modal-overlay"
          onClick={closeLogoutModal}
        >

          <div
            className="logout-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={closeLogoutModal}
            >
              ×
            </button>

            <div className="modal-icon">
              !
            </div>

            <h2>
              Logout Session
            </h2>

            <p>
              Masukkan nomor WhatsApp
              untuk menghapus session ini.
            </p>

            <div className="target-number">
              Session:{" "}
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
              placeholder="Masukkan nomor WhatsApp"
              value={logoutNumber}
              onChange={(e) =>
                setLogoutNumber(
                  e.target.value
                )
              }
              disabled={logoutLoading}
            />

            {logoutMessage && (
              <div className="logout-error">
                {logoutMessage}
              </div>
            )}

            <div className="modal-actions">

              <button
                className="cancel-button"
                onClick={closeLogoutModal}
                disabled={logoutLoading}
              >
                Batal
              </button>

              <button
                className="confirm-logout"
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
}

export default App;
