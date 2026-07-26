import { useEffect, useState } from "react";
import "./style.css";

function App() {
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

  // ==========================================
  // FORMAT NOMOR
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
  // SAMARKAN NOMOR
  // Contoh:
  // 6281234567804
  // menjadi:
  // 62*******04
  // ==========================================

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

  // ==========================================
  // LOAD STATUS
  // ==========================================

  const loadStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/status", {
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
        "/api/pair",
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

      setPairingSession(
        data.sessionId || number
      );

      setMessage(
        "Permintaan pairing berhasil. Menunggu kode..."
      );

      let attempts = 0;

      const timer = setInterval(
        async () => {
          attempts++;

          try {
            const sessionId =
              data.sessionId ||
              number;

            const response =
              await fetch(
                `/api/pairing/${encodeURIComponent(
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
                "Pairing code berhasil dibuat. Salin kode di bawah."
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

      setMessage(
        "Pairing code berhasil disalin."
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
        "Gagal menyalin pairing code."
      );
    }
  };

  // ==========================================
  // BUKA MODAL LOGOUT
  // ==========================================

  const openLogoutModal = (session) => {
    setLogoutTarget(session);
    setLogoutNumber("");
    setMessage("");
  };

  // ==========================================
  // TUTUP MODAL
  // ==========================================

  const closeLogoutModal = () => {
    if (logoutLoading) {
      return;
    }

    setLogoutTarget(null);
    setLogoutNumber("");
  };

  // ==========================================
  // KONFIRMASI LOGOUT
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
      setMessage(
        "Masukkan nomor WhatsApp lengkap."
      );
      return;
    }

    if (input !== target) {
      setMessage(
        "Nomor tidak cocok dengan session."
      );
      return;
    }

    try {
      setLogoutLoading(true);
      setMessage("");

      const response =
        await fetch(
          "/api/logout",
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
        setMessage(
          data.message ||
          "Gagal logout session."
        );
        return;
      }

      setLogoutTarget(null);
      setLogoutNumber("");

      setMessage(
        "Session berhasil dikeluarkan."
      );

      await loadStatus();

    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      setMessage(
        "Gagal menghubungi server API."
      );

    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="app">

      {/* ================================= */}
      {/* SIDEBAR */}
      {/* ================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            D
          </div>

          <div>
            <h2>DIN BOT</h2>
            <span>
              WhatsApp Management
            </span>
          </div>

        </div>

        <nav className="sidebar-menu">

          <div className="menu-item active">
            <span>⌂</span>
            Dashboard
          </div>

          <div className="menu-item">
            <span>◉</span>
            WhatsApp
          </div>

          <div className="menu-item">
            <span>⚙</span>
            Settings
          </div>

        </nav>

        <div className="sidebar-bottom">

          <div className="system-status">

            <span
              className={
                serverOnline
                  ? "dot online"
                  : "dot offline"
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
            DIN STORE © 2026
          </div>

        </div>

      </aside>

      {/* ================================= */}
      {/* MAIN */}
      {/* ================================= */}

      <main className="main">

        {/* HEADER */}

        <header className="topbar">

          <div>

            <div className="breadcrumb">
              Dashboard
            </div>

            <h1>
              WhatsApp Bot
            </h1>

            <p>
              Kelola koneksi WhatsApp
              dan session bot kamu.
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={loadStatus}
            disabled={loading}
          >
            <span>↻</span>

            {loading
              ? "Memuat"
              : "Refresh"}
          </button>

        </header>

        {/* ================================= */}
        {/* STATUS */}
        {/* ================================= */}

        <section className="status-grid">

          {/* SERVER */}

          <div className="status-card">

            <div className="status-card-header">

              <div>
                <span className="label">
                  SERVER API
                </span>

                <h3>
                  {serverOnline
                    ? "Online"
                    : "Offline"}
                </h3>
              </div>

              <div
                className={
                  serverOnline
                    ? "status-icon green"
                    : "status-icon red"
                }
              >
                ●
              </div>

            </div>

            <div
              className={
                serverOnline
                  ? "connection online"
                  : "connection offline"
              }
            >
              <span />

              {serverOnline
                ? "SERVER ONLINE"
                : "SERVER OFFLINE"}
            </div>

          </div>

          {/* WHATSAPP */}

          <div className="status-card">

            <div className="status-card-header">

              <div>
                <span className="label">
                  WHATSAPP
                </span>

                <h3>
                  {botConnected
                    ? "Terhubung"
                    : "Belum Terhubung"}
                </h3>
              </div>

              <div
                className={
                  botConnected
                    ? "status-icon green"
                    : "status-icon orange"
                }
              >
                ☎
              </div>

            </div>

            <div
              className={
                botConnected
                  ? "connection online"
                  : "connection waiting"
              }
            >
              <span />

              {botConnected
                ? "WHATSAPP CONNECTED"
                : "MENUNGGU PAIRING"}
            </div>

          </div>

          {/* SESSION */}

          <div className="status-card">

            <div className="status-card-header">

              <div>
                <span className="label">
                  SESSION
                </span>

                <h3>
                  {sessions.length}
                </h3>
              </div>

              <div className="status-icon blue">
                ◉
              </div>

            </div>

            <div className="connection neutral">
              <span />

              SESSION TERDAFTAR
            </div>

          </div>

        </section>

        {/* ================================= */}
        {/* PAIRING */}
        {/* ================================= */}

        <section className="content-card">

          <div className="section-heading">

            <div>

              <span className="section-number">
                01
              </span>

              <div>
                <h2>
                  Hubungkan WhatsApp
                </h2>

                <p>
                  Masukkan nomor WhatsApp
                  untuk mendapatkan pairing code.
                </p>
              </div>

            </div>

          </div>

          <div className="pairing-form">

            <div className="input-wrapper">

              <span>
                +62
              </span>

              <input
                type="tel"
                placeholder="81234567890"
                value={
                  phoneNumber
                    .replace(/^62/, "")
                    .replace(/^0/, "")
                }
                onChange={(e) => {
                  const value =
                    e.target.value
                      .replace(/\D/g, "");

                  setPhoneNumber(
                    "62" + value
                  );
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

          {message && (
            <div className="message-box">
              <span>●</span>
              {message}
            </div>
          )}

          {/* PAIRING CODE */}

          {pairingCode && (
            <div className="pairing-result">

              <div className="pairing-result-top">

                <div>

                  <span className="success-label">
                    PAIRING CODE READY
                  </span>

                  <h3>
                    Masukkan kode ini
                    di WhatsApp kamu
                  </h3>

                </div>

                <div className="success-check">
                  ✓
                </div>

              </div>

             <div
  className="pairing-code"
  onClick={copyPairingCode}
  title="Klik untuk menyalin"
>
  DINSTORE-{pairingCode}
</div>

              const copyPairingCode = async () => {
  if (!pairingCode) return;

  try {
    await navigator.clipboard.writeText(`DINSTORE-${pairingCode}`);

    setCopied(true);
    setMessage("DINSTORE Pairing Code berhasil disalin.");

    setTimeout(() => {
      setCopied(false);
    }, 2500);

  } catch (err) {
    setMessage("Gagal menyalin pairing code.");
  }
};

              <p>
                WhatsApp → Perangkat
                Tertaut → Tautkan dengan
                nomor telepon
              </p>

            </div>
          )}

        </section>

        {/* ================================= */}
        {/* SESSION */}
        {/* ================================= */}

        <section className="content-card">

          <div className="section-heading session-heading">

            <div>

              <span className="section-number">
                02
              </span>

              <div>
                <h2>
                  Session WhatsApp
                </h2>

                <p>
                  Daftar perangkat WhatsApp
                  yang sudah terhubung.
                </p>
              </div>

            </div>

            <div className="session-total">
              {sessions.length}
              <span>
                Session
              </span>
            </div>

          </div>

          {sessions.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ◉
              </div>

              <h3>
                Belum ada session
              </h3>

              <p>
                Hubungkan WhatsApp kamu
                untuk membuat session pertama.
              </p>

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

                      <div>

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
                          ? "Connected"
                          : "Disconnected"}
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

        {/* FOOTER */}

        <footer className="footer">

          <span>
            DIN BOT Dashboard
          </span>

          <span>
            Last update:{" "}
            {lastUpdate}
          </span>

        </footer>

      </main>

      {/* ================================= */}
      {/* LOGOUT MODAL */}
      {/* ================================= */}

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
              className="close-modal"
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
            />

            {message && (
              <div className="modal-message">
                {message}
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
