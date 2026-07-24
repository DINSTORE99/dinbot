import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  Copy,
  LogOut,
  Menu,
  MessageCircle,
  RefreshCw,
  Server,
  Smartphone,
  X,
  Zap
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| KONFIGURASI API
|--------------------------------------------------------------------------
|
| Ganti URL ini dengan URL backend Pterodactyl / server.js kamu.
|
| Contoh:
| https://api-domain-kamu.com
|
*/

const API_URL = "https://api-domain-kamu.com";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [serverOnline, setServerOnline] = useState(false);

  const [botConnected, setBotConnected] = useState(false);

  const [sessions, setSessions] = useState([]);

  const [number, setNumber] = useState("");

  const [pairingCode, setPairingCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | LOAD STATUS
  |--------------------------------------------------------------------------
  */

  async function loadStatus() {
    try {
      const response = await fetch(
        `${API_URL}/api/status`
      );

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      setServerOnline(data.server === "online");

      setBotConnected(
        data.botConnected === true
      );

      setSessions(
        Array.isArray(data.sessions)
          ? data.sessions
          : []
      );

    } catch (error) {

      console.error(
        "STATUS ERROR:",
        error
      );

      setServerOnline(false);

      setBotConnected(false);

    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD AWAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    loadStatus();

    const interval = setInterval(
      loadStatus,
      5000
    );

    return () => {
      clearInterval(interval);
    };

  }, []);

  /*
  |--------------------------------------------------------------------------
  | PAIR WHATSAPP
  |--------------------------------------------------------------------------
  */

  async function handlePair() {

    const cleanNumber =
      number.replace(/\D/g, "");

    if (!cleanNumber) {

      setMessage(
        "Masukkan nomor WhatsApp terlebih dahulu."
      );

      return;
    }

    setLoading(true);

    setMessage("");

    setPairingCode("");

    try {

      const response = await fetch(
        `${API_URL}/api/pair`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            number: cleanNumber
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Gagal melakukan pairing"
        );

      }

      setMessage(
        "Pairing berhasil dimulai. Menunggu kode..."
      );

      /*
      |--------------------------------------------------------------------------
      | POLLING PAIRING CODE
      |--------------------------------------------------------------------------
      */

      let attempts = 0;

      const checkPairing =
        setInterval(async () => {

          attempts++;

          try {

            const result =
              await fetch(
                `${API_URL}/api/pairing/${data.sessionId}`
              );

            const pairing =
              await result.json();

            if (pairing.code) {

              setPairingCode(
                pairing.code
              );

              clearInterval(
                checkPairing
              );

              setMessage(
                "Pairing code berhasil didapatkan."
              );

              setLoading(false);

              return;
            }

            if (pairing.connected) {

              clearInterval(
                checkPairing
              );

              setPairingCode("");

              setMessage(
                "WhatsApp berhasil terhubung."
              );

              setLoading(false);

              loadStatus();

              return;
            }

            /*
            | Stop polling setelah 60 detik
            */

            if (attempts >= 30) {

              clearInterval(
                checkPairing
              );

              setLoading(false);

              setMessage(
                "Waktu menunggu pairing habis. Silakan coba lagi."
              );

            }

          } catch (error) {

            console.error(
              "PAIRING ERROR:",
              error
            );

          }

        }, 2000);

    } catch (error) {

      console.error(
        "PAIR ERROR:",
        error
      );

      setMessage(
        error.message ||
        "Gagal melakukan pairing."
      );

      setLoading(false);

    }

  }

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  async function handleLogout(
    sessionId
  ) {

    const confirmLogout =
      window.confirm(
        "Yakin ingin logout session ini?"
      );

    if (!confirmLogout) {
      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/api/logout`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              sessionId
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
          "Gagal logout"
        );

      }

      setMessage(
        "Session berhasil logout."
      );

      loadStatus();

    } catch (error) {

      console.error(
        "LOGOUT ERROR:",
        error
      );

      setMessage(
        error.message ||
        "Gagal logout session."
      );

    }

  }

  /*
  |--------------------------------------------------------------------------
  | COPY PAIRING CODE
  |--------------------------------------------------------------------------
  */

  async function copyPairingCode() {

    if (!pairingCode) {
      return;
    }

    try {

      await navigator.clipboard.writeText(
        pairingCode
      );

      setMessage(
        "Pairing code berhasil disalin."
      );

    } catch (error) {

      console.error(
        error
      );

    }

  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="app">

      {/* SIDEBAR MOBILE OVERLAY */}

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
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        <div className="sidebar-header">

          <div className="brand-icon">
            <Bot size={24} />
          </div>

          <div>
            <h2>DIN BOT</h2>

            <span>
              WhatsApp Manager
            </span>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        <nav className="sidebar-nav">

          <div className="nav-title">
            MENU UTAMA
          </div>

          <a
            href="#dashboard"
            className="nav-item active"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <Activity size={19} />
            Dashboard
          </a>

          <a
            href="#sessions"
            className="nav-item"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <Smartphone size={19} />
            Sessions
          </a>

          <a
            href="#pairing"
            className="nav-item"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <MessageCircle size={19} />
            Pair WhatsApp
          </a>

        </nav>

        <div className="sidebar-footer">

          <div className="connection-dot">
            <span
              className={
                serverOnline
                  ? "dot online"
                  : "dot"
              }
            />

            <span>
              {serverOnline
                ? "API Online"
                : "API Offline"}
            </span>
          </div>

          <small>
            DIN BOT PANEL v1.0
          </small>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <button
            className="menu-button"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            <Menu size={22} />
          </button>

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Kelola WhatsApp Bot kamu
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={loadStatus}
          >
            <RefreshCw size={18} />
            <span>
              Refresh
            </span>
          </button>

        </header>

        {/* CONTENT */}

        <div className="content">

          {/* STATUS CARDS */}

          <section
            className="stats-grid"
            id="dashboard"
          >

            <div className="stat-card">

              <div className="stat-icon purple">
                <Server size={23} />
              </div>

              <div>

                <span>
                  Server API
                </span>

                <strong>
                  {serverOnline
                    ? "Online"
                    : "Offline"}
                </strong>

              </div>

              <div
                className={
                  serverOnline
                    ? "status-badge online"
                    : "status-badge offline"
                }
              >
                {serverOnline
                  ? "AKTIF"
                  : "OFFLINE"}
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon green">
                <MessageCircle size={23} />
              </div>

              <div>

                <span>
                  WhatsApp
                </span>

                <strong>
                  {botConnected
                    ? "Connected"
                    : "Disconnected"}
                </strong>

              </div>

              <div
                className={
                  botConnected
                    ? "status-badge online"
                    : "status-badge offline"
                }
              >
                {botConnected
                  ? "TERHUBUNG"
                  : "BELUM TERHUBUNG"}
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon blue">
                <Smartphone size={23} />
              </div>

              <div>

                <span>
                  Total Session
                </span>

                <strong>
                  {sessions.length}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon orange">
                <Zap size={23} />
              </div>

              <div>

                <span>
                  Session Aktif
                </span>

                <strong>
                  {
                    sessions.filter(
                      (item) =>
                        item.connected
                    ).length
                  }
                </strong>

              </div>

            </div>

          </section>

          {/* MESSAGE */}

          {message && (

            <div className="alert">

              <CheckCircle2
                size={18}
              />

              <span>
                {message}
              </span>

            </div>

          )}

          {/* PAIRING */}

          <section
            className="panel"
            id="pairing"
          >

            <div className="panel-header">

              <div>

                <h2>
                  Pair WhatsApp
                </h2>

                <p>
                  Hubungkan nomor WhatsApp
                  menggunakan pairing code.
                </p>

              </div>

              <div className="panel-header-icon">
                <MessageCircle
                  size={22}
                />
              </div>

            </div>

            <div className="pair-form">

              <div className="input-group">

                <label>
                  Nomor WhatsApp
                </label>

                <input
                  type="text"
                  placeholder="628xxxxxxxxxx"
                  value={number}
                  onChange={(event) =>
                    setNumber(
                      event.target.value
                    )
                  }
                />

                <small>
                  Gunakan format internasional.
                  Contoh: 628123456789
                </small>

              </div>

              <button
                className="primary-button"
                onClick={handlePair}
                disabled={loading}
              >

                {loading ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="spin"
                    />

                    Memproses...
                  </>
                ) : (
                  <>
                    <MessageCircle
                      size={18}
                    />

                    Mulai Pairing
                  </>
                )}

              </button>

            </div>

            {/* PAIRING CODE */}

            {pairingCode && (

              <div className="pairing-result">

                <div className="pairing-title">
                  Pairing Code
                </div>

                <div className="pairing-code">

                  <span>
                    {pairingCode}
                  </span>

                  <button
                    onClick={
                      copyPairingCode
                    }
                    title="Copy code"
                  >
                    <Copy size={18} />
                  </button>

                </div>

                <p>
                  Buka WhatsApp → Perangkat
                  Tertaut → Tautkan Perangkat
                  → Tautkan dengan nomor telepon.
                </p>

              </div>

            )}

          </section>

          {/* SESSIONS */}

          <section
            className="panel"
            id="sessions"
          >

            <div className="panel-header">

              <div>

                <h2>
                  Daftar Session
                </h2>

                <p>
                  Semua perangkat WhatsApp
                  yang terhubung ke sistem.
                </p>

              </div>

              <button
                className="icon-button"
                onClick={loadStatus}
              >
                <RefreshCw
                  size={18}
                />
              </button>

            </div>

            {sessions.length === 0 ? (

              <div className="empty-state">

                <Smartphone
                  size={40}
                />

                <h3>
                  Belum ada session
                </h3>

                <p>
                  Hubungkan WhatsApp pertama
                  kamu melalui menu pairing.
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

                      <div className="session-info">

                        <div className="session-avatar">

                          <Smartphone
                            size={21}
                          />

                        </div>

                        <div>

                          <strong>
                            {session.name ||
                              "WhatsApp Bot"}
                          </strong>

                          <span>
                            {session.number ||
                              session.sessionId}
                          </span>

                          <small>
                            ID:{" "}
                            {
                              session.sessionId
                            }
                          </small>

                        </div>

                      </div>

                      <div className="session-actions">

                        <span
                          className={
                            session.connected
                              ? "status-badge online"
                              : "status-badge offline"
                          }
                        >

                          {session.connected
                            ? "Connected"
                            : "Disconnected"}

                        </span>

                        <button
                          className="logout-button"
                          onClick={() =>
                            handleLogout(
                              session.sessionId
                            )
                          }
                        >

                          <LogOut
                            size={17}
                          />

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
              © 2026 DIN BOT PANEL
            </span>

            <span>
              WhatsApp Bot Management System
            </span>

          </footer>

        </div>

      </main>

    </div>
  );
}

export default App;
