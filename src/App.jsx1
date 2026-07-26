import { useEffect, useState } from "react";
import "./style.css";

function App() {
  // =====================================================
  // STATUS
  // =====================================================

  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [lastUpdate, setLastUpdate] = useState("-");

  // =====================================================
  // PAIRING
  // =====================================================

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingSession, setPairingSession] = useState("");

  const [pairingLoading, setPairingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // =====================================================
  // LOGOUT
  // =====================================================

  const [logoutTarget, setLogoutTarget] = useState(null);
  const [logoutNumber, setLogoutNumber] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  // =====================================================
  // NORMALIZE NUMBER
  // =====================================================

  const normalizeNumber = (number) => {
    let value = String(number || "")
      .replace(/\D/g, "");

    if (value.startsWith("0")) {
      value = "62" + value.substring(1);
    }

    if (value.startsWith("8")) {
      value = "62" + value;
    }

    return value;
  };

  // =====================================================
  // MASK NUMBER
  // 6281234567804
  // menjadi
  // 62********04
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
      "*".repeat(
        Math.max(
          1,
          value.length - 4
        )
      ) +
      value.substring(
        value.length - 2
      )
    );
  };

  // =====================================================
  // SHOW MESSAGE
  // =====================================================

  const showMessage = (
    text,
    type = "info"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  // =====================================================
  // LOAD STATUS
  // =====================================================

  const loadStatus = async (
    manual = false
  ) => {
    try {
      if (manual) {
        setRefreshing(true);
      }

      const response = await fetch(
        "/api/status",
        {
          method: "GET",
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      console.log(
        "STATUS API:",
        data
      );

      setServerOnline(
        data.success === true &&
        data.server === "online"
      );

      setBotConnected(
        data.botConnected === true
      );

      setSessions(
        Array.isArray(
          data.sessions
        )
          ? data.sessions
          : []
      );

      setLastUpdate(
        new Date().toLocaleTimeString(
          "id-ID"
        )
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

      if (manual) {
        setRefreshing(false);
      }
    }
  };

  // =====================================================
  // AUTO REFRESH
  // =====================================================

  useEffect(() => {
    loadStatus();

    const timer =
      setInterval(
        () => {
          loadStatus();
        },
        5000
      );

    return () => {
      clearInterval(timer);
    };
  }, []);

  // =====================================================
  // START PAIRING
  // =====================================================

  const startPairing =
    async () => {

      if (
        !phoneNumber.trim()
      ) {
        showMessage(
          "Masukkan nomor WhatsApp terlebih dahulu.",
          "error"
        );

        return;
      }

      const number =
        normalizeNumber(
          phoneNumber
        );

      if (
        !number ||
        number.length < 10
      ) {
        showMessage(
          "Nomor WhatsApp tidak valid.",
          "error"
        );

        return;
      }

      try {

        setPairingLoading(true);

        setPairingCode("");

        setPairingSession("");

        setCopied(false);

        showMessage(
          "Menghubungkan ke server...",
          "info"
        );

        const response =
          await fetch(
            "/api/pair",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  number
                })
            }
          );

        const data =
          await response.json();

        console.log(
          "PAIR API:",
          data
        );

        if (
          !data.success
        ) {

          showMessage(
            data.message ||
              "Gagal memulai pairing.",
            "error"
          );

          return;
        }

        const sessionId =
          data.sessionId ||
          number;

        setPairingSession(
          sessionId
        );

        // Jika API langsung mengembalikan code
        if (
          data.pairingCode
        ) {

          setPairingCode(
            data.pairingCode
          );

          showMessage(
            "Pairing code berhasil dibuat. Salin kode di bawah.",
            "success"
          );

          return;
        }

        showMessage(
          "Permintaan pairing berhasil. Menunggu kode...",
          "info"
        );

        let attempts = 0;

        const timer =
          setInterval(
            async () => {

              attempts++;

              try {

                const response =
                  await fetch(
                    `/api/pairing/${encodeURIComponent(
                      sessionId
                    )}`,
                    {
                      cache:
                        "no-store"
                    }
                  );

                const result =
                  await response.json();

                console.log(
                  "PAIRING STATUS:",
                  result
                );

                // ======================================
                // CODE DITEMUKAN
                // ======================================

                if (
                  result.code
                ) {

                  setPairingCode(
                    result.code
                  );

                  setPairingSession(
                    sessionId
                  );

                  showMessage(
                    "Pairing code berhasil dibuat. Salin kode di bawah dan masukkan ke WhatsApp.",
                    "success"
                  );

                  clearInterval(
                    timer
                  );

                  return;
                }

                // ======================================
                // CONNECTED
                // ======================================

                if (
                  result.connected ===
                  true
                ) {

                  setBotConnected(
                    true
                  );

                  showMessage(
                    "WhatsApp berhasil terhubung.",
                    "success"
                  );

                  clearInterval(
                    timer
                  );

                  loadStatus();

                  return;
                }

                // ======================================
                // TIMEOUT
                // ======================================

                if (
                  attempts >= 30
                ) {

                  clearInterval(
                    timer
                  );

                  showMessage(
                    "Waktu menunggu pairing habis. Silakan coba lagi.",
                    "error"
                  );

                }

              } catch (
                error
              ) {

                console.error(
                  "PAIRING CHECK ERROR:",
                  error
                );

              }

            },
            2000
          );

      } catch (
        error
      ) {

        console.error(
          "PAIR ERROR:",
          error
        );

        showMessage(
          "Tidak dapat menghubungi server API.",
          "error"
        );

      } finally {

        setPairingLoading(
          false
        );

      }

    };

  // =====================================================
  // COPY PAIRING CODE
  // =====================================================

  const copyPairingCode =
    async () => {

      if (
        !pairingCode
      ) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          pairingCode
        );

        setCopied(true);

        showMessage(
          "Pairing code berhasil disalin.",
          "success"
        );

        setTimeout(
          () => {
            setCopied(false);
          },
          2500
        );

      } catch (
        error
      ) {

        console.error(
          "COPY ERROR:",
          error
        );

        showMessage(
          "Gagal menyalin pairing code.",
          "error"
        );

      }

    };

  // =====================================================
  // OPEN LOGOUT MODAL
  // =====================================================

  const openLogoutModal =
    (session) => {

      setLogoutTarget(
        session
      );

      setLogoutNumber("");

      setMessage("");

    };

  // =====================================================
  // CLOSE LOGOUT MODAL
  // =====================================================

  const closeLogoutModal =
    () => {

      if (
        logoutLoading
      ) {
        return;
      }

      setLogoutTarget(
        null
      );

      setLogoutNumber("");

    };

  // =====================================================
  // CONFIRM LOGOUT
  // =====================================================

  const confirmLogout =
    async () => {

      if (
        !logoutTarget
      ) {
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

      if (
        !input
      ) {

        showMessage(
          "Masukkan nomor WhatsApp lengkap.",
          "error"
        );

        return;
      }

      if (
        input !== target
      ) {

        showMessage(
          "Nomor tidak cocok dengan session.",
          "error"
        );

        return;
      }

      try {

        setLogoutLoading(
          true
        );

        const response =
          await fetch(
            "/api/logout",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  sessionId:
                    logoutTarget.sessionId
                })
            }
          );

        const data =
          await response.json();

        if (
          !data.success
        ) {

          showMessage(
            data.message ||
              "Gagal logout session.",
            "error"
          );

          return;
        }

        setLogoutTarget(
          null
        );

        setLogoutNumber(
          ""
        );

        showMessage(
          "Session berhasil dihapus.",
          "success"
        );

        await loadStatus();

      } catch (
        error
      ) {

        console.error(
          "LOGOUT ERROR:",
          error
        );

        showMessage(
          "Gagal menghubungi server API.",
          "error"
        );

      } finally {

        setLogoutLoading(
          false
        );

      }

    };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="app">

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            D
          </div>

          <div className="brand-text">

            <h2>
              DIN BOT
            </h2>

            <span>
              WhatsApp Manager
            </span>

          </div>

        </div>

        <nav className="sidebar-menu">

          <div className="menu-item active">
            <span>
              ▦
            </span>

            Dashboard
          </div>

          <div className="menu-item">
            <span>
              ◉
            </span>

            WhatsApp
          </div>

          <div className="menu-item">
            <span>
              ⚙
            </span>

            Settings
          </div>

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
            DIN STORE © 2026
          </div>

        </div>

      </aside>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="main">

        {/* TOPBAR */}

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
            onClick={() =>
              loadStatus(true)
            }
            disabled={
              refreshing
            }
          >

            <span
              className={
                refreshing
                  ? "rotate"
                  : ""
              }
            >
              ↻
            </span>

            {refreshing
              ? "Memuat..."
              : "Refresh"}

          </button>

        </header>

        {/* ================================================= */}
        {/* GLOBAL MESSAGE */}
        {/* ================================================= */}

        {message && (

          <div
            className={`global-message ${messageType}`}
          >

            <span>

              {messageType ===
              "success"
                ? "✓"
                : messageType ===
                  "error"
                ? "!"
                : "i"}

            </span>

            {message}

          </div>

        )}

        {/* ================================================= */}
        {/* STATUS GRID */}
        {/* ================================================= */}

        <section className="status-grid">

          {/* SERVER */}

          <div className="status-card">

            <div className="status-card-top">

              <div>

                <span className="card-label">
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
                    ? "card-icon green"
                    : "card-icon red"
                }
              >
                ◉
              </div>

            </div>

            <div
              className={
                serverOnline
                  ? "connection-status online"
                  : "connection-status offline"
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

            <div className="status-card-top">

              <div>

                <span className="card-label">
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
                    ? "card-icon green"
                    : "card-icon yellow"
                }
              >
                ◉
              </div>

            </div>

            <div
              className={
                botConnected
                  ? "connection-status online"
                  : "connection-status waiting"
              }
            >

              <span />

              {botConnected
                ? "TERHUBUNG"
                : "MENUNGGU PAIRING"}

            </div>

          </div>

          {/* SESSION */}

          <div className="status-card">

            <div className="status-card-top">

              <div>

                <span className="card-label">
                  SESSION
                </span>

                <h3>
                  {sessions.length}
                </h3>

              </div>

              <div className="card-icon blue">
                #
              </div>

            </div>

            <div className="connection-status neutral">

              <span />

              SESSION TERDAFTAR

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* PAIRING */}
        {/* ================================================= */}

        <section className="content-card">

          <div className="section-heading">

            <div className="section-number">
              01
            </div>

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

          <div className="pairing-form">

            <div className="phone-input">

              <span>
                +62
              </span>

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
                    e.target.value
                      .replace(
                        /\D/g,
                        ""
                      );

                  setPhoneNumber(
                    "62" + value
                  );

                }}
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

                  <span>
                    →
                  </span>
                </>

              )}

            </button>

          </div>

          {/* PAIRING RESULT */}

          {pairingCode && (

            <div className="pairing-result">

              <div className="pairing-result-header">

                <div>

                  <span className="success-label">
                    PAIRING CODE SIAP
                  </span>

                  <h3>
                    Masukkan kode ini
                    ke WhatsApp kamu
                  </h3>

                </div>

                <div className="success-icon">
                  ✓
                </div>

              </div>

              <button
                className="pairing-code"
                onClick={
                  copyPairingCode
                }
                title="Klik untuk menyalin"
              >
                {pairingCode}
              </button>

              <button
                className="copy-button"
                onClick={
                  copyPairingCode
                }
              >

                {copied
                  ? "✓ Tersalin"
                  : "⧉ Salin Pairing Code"}

              </button>

              <div className="pairing-instruction">

                <span>
                  1
                </span>

                Buka WhatsApp

                <span>
                  2
                </span>

                Pilih Perangkat Tertaut

                <span>
                  3
                </span>

                Pilih Tautkan dengan
                nomor telepon

              </div>

              {pairingSession && (

                <small className="pairing-session">
                  Session: {pairingSession}
                </small>

              )}

            </div>

          )}

        </section>

        {/* ================================================= */}
        {/* SESSIONS */}
        {/* ================================================= */}

        <section className="content-card">

          <div className="section-heading session-heading">

            <div className="section-heading-left">

              <div className="section-number">
                02
              </div>

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

              <strong>
                {sessions.length}
              </strong>

              <span>
                Session
              </span>

            </div>

          </div>

          {loading ? (

            <div className="empty-state">

              <span className="spinner dark" />

              <p>
                Memuat session...
              </p>

            </div>

          ) : sessions.length === 0 ? (

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

                )
              )}

            </div>

          )}

        </section>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <footer className="footer">

          <span>
            DIN BOT Dashboard
          </span>

          <span>
            Update terakhir:
            {" "}
            {lastUpdate}
          </span>

        </footer>

      </main>

      {/* ================================================= */}
      {/* LOGOUT MODAL */}
      {/* ================================================= */}

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
            />

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
