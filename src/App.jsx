import React, { useEffect, useState } from "react";
import "./style.css";

const API = "";

export default function App() {
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

  // ================================
  // NORMALIZE NOMOR
  // ================================

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

  // ================================
  // MASK NOMOR
  // ================================

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

  // ================================
  // LOAD STATUS
  // ================================

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
      console.error("STATUS ERROR:", error);

      setServerOnline(false);
      setBotConnected(false);
      setSessions([]);

    } finally {
      setLoading(false);
    }
  };

  // ================================
  // AUTO UPDATE
  // ================================

  useEffect(() => {
    loadStatus();

    const timer = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // ================================
  // START PAIRING
  // ================================

  const startPairing = async () => {
    const number = normalizeNumber(phoneNumber);

    if (!number) {
      setMessage(
        "Masukkan nomor WhatsApp terlebih dahulu."
      );
      return;
    }

    if (number.length < 10) {
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
      setMessage("Menghubungkan ke server...");

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

      console.log("PAIR API:", data);

      if (!data.success) {
        setMessage(
          data.message ||
          "Gagal memulai pairing."
        );
        return;
      }

      const sessionId =
        data.sessionId || number;

      setPairingSession(sessionId);

      // Jika backend langsung mengirim code
      if (data.pairingCode) {
        setPairingCode(
          String(data.pairingCode)
        );

        setMessage(
          "Kode pairing berhasil dibuat. Salin kode di bawah lalu masukkan ke WhatsApp."
        );

        return;
      }

      setMessage(
        "Berhasil terhubung ke server. Menunggu kode pairing..."
      );

      let attempts = 0;

      const timer = setInterval(
        async () => {
          attempts++;

          try {
            const statusResponse =
              await fetch(
                `${API}/api/pairing/${encodeURIComponent(
                  sessionId
                )}`,
                {
                  cache: "no-store",
                }
              );

            const result =
              await statusResponse.json();

            console.log(
              "PAIRING STATUS:",
              result
            );

            // Support code / pairingCode
            const code =
              result.code ||
              result.pairingCode;

            if (code) {
              setPairingCode(
                String(code)
              );

              setMessage(
                "Kode pairing berhasil dibuat. Salin kode di bawah."
              );

              clearInterval(timer);
              return;
            }

            if (
              result.connected === true
            ) {
              setBotConnected(true);

              setMessage(
                "WhatsApp berhasil terhubung."
              );

              clearInterval(timer);

              await loadStatus();
              return;
            }

            if (attempts >= 30) {
              clearInterval(timer);

              setMessage(
                "Waktu menunggu pairing habis. Silakan coba lagi."
              );
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
        "PAIRING ERROR:",
        error
      );

      setMessage(
        "Tidak dapat menghubungi server API."
      );

    } finally {
      setPairingLoading(false);
    }
  };

  // ================================
  // COPY PAIRING CODE
  // ================================

  const copyPairingCode = async () => {
    if (!pairingCode) return;

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

  // ================================
  // LOGOUT MODAL
  // ================================

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

  // ================================
  // CONFIRM LOGOUT
  // ================================

  const confirmLogout = async () => {
    if (!logoutTarget) return;

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

      setMessage(
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

  // ================================
  // DASHBOARD
  // ================================

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
            ↻
            {loading
              ? " Memuat..."
              : " Refresh"}
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
                  Hubungkan WhatsApp
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

          {message && (
            <div className="message-box">
              <span>●</span>
              {message}
            </div>
          )}

          {/* KODE PAIRING */}

          {pairingCode && (
            <div className="pairing-result">

              <div className="result-header">

                <div>
                  <span className="success-label">
                    ✓ KODE PAIRING SIAP
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
                      : "Salin"}
                  </button>

                </div>

              </div>

              <div className="code-info">
                <span>
                  SESSION
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

        <footer className="footer">
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

  // ================================
  // SESSIONS
  // ================================

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
              WhatsApp yang terhubung.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadStatus}
            disabled={loading}
          >
            ↻
            {loading
              ? " Memuat..."
              : " Refresh"}
          </button>
        </header>

        <section className="content-card sessions-card">

          <div className="sessions-header">

            <div>
              <span className="eyebrow">
                MANAJEMEN PERANGKAT
              </span>

              <h2>
                Daftar Sessions
              </h2>

              <p>
                Semua perangkat WhatsApp
                yang sudah terhubung.
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
                Hubungkan WhatsApp kamu
                melalui halaman Dashboard.
              </p>

              <button
                className="empty-button"
                onClick={() =>
                  setPage("dashboard")
                }
              >
                ← Ke Dashboard
              </button>

            </div>

          ) : (

            <div className="session-list">

              {sessions.map(
                (session, index) => {

                  const sessionNumber =
                    session.number ||
                    session.phoneNumber ||
                    session.sessionId;

                  return (
                    <div
                      className="session-item"
                      key={
                        session.sessionId ||
                        sessionNumber ||
                        index
                      }
                    >

                      <div className="session-left">

                        <div className="session-avatar">
                          W
                        </div>

                        <div>
                          <h3>
                            {session.name ||
                              "DIN BOT"}
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
                              ? "session-badge online"
                              : "session-badge offline"
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

        <footer className="footer">
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

  // ================================
  // APP
  // ================================

  return (
    <div className="app">

      <div className="particles">
        {Array.from({
          length: 35,
        }).map((_, index) => (
          <span
            key={index}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay:
                `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

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

        <nav>

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
            <span>W</span>
            Sessions
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
                  ? "Online"
                  : "Offline"}
              </small>
            </div>
          </div>

          <p>
            DIN BOT © 2026
          </p>

        </div>

      </aside>

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
              e.target === e.currentTarget
            ) {
              closeLogoutModal();
            }
          }}
        >

          <div className="logout-modal">

            <button
              className="modal-close"
              onClick={closeLogoutModal}
            >
              ×
            </button>

            <div className="warning-icon">
              !
            </div>

            <h2>
              Logout Session
            </h2>

            <p>
              Masukkan nomor WhatsApp
              lengkap untuk menghapus
              session ini.
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
              value={logoutNumber}
              onChange={(e) =>
                setLogoutNumber(
                  e.target.value
                )
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
                onClick={closeLogoutModal}
                disabled={logoutLoading}
              >
                Batal
              </button>

              <button
                className="confirm-button"
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
