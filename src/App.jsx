import { useEffect, useState } from "react";
import "./style.css";

const API_URL = "https://bot.ndz.web.id";

export default function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [number, setNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sidebar, setSidebar] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/status`);
      const data = await res.json();

      setServerOnline(data.server === "online");
      setSessions(data.sessions || []);
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    loadStatus();

    const interval = setInterval(loadStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const connectBot = async () => {
    if (!number.trim()) {
      setMessage("Masukkan nomor WhatsApp terlebih dahulu.");
      return;
    }

    setLoading(true);
    setPairingCode("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/pair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage(data.message || "Gagal menghubungkan bot.");
        return;
      }

      setMessage(
        "Bot berhasil dijalankan. Menunggu kode pairing..."
      );

      checkPairing(data.sessionId);
    } catch (error) {
      setMessage("Tidak dapat terhubung ke server bot.");
    } finally {
      setLoading(false);
    }
  };

  const checkPairing = (sessionId) => {
    let count = 0;

    const interval = setInterval(async () => {
      count++;

      try {
        const res = await fetch(
          `${API_URL}/api/pairing/${sessionId}`
        );

        const data = await res.json();

        if (data.code) {
          setPairingCode(data.code);
          clearInterval(interval);
        }

        if (data.connected) {
          setPairingCode("");
          setMessage("WhatsApp berhasil terhubung.");
          clearInterval(interval);
          loadStatus();
        }

        if (count >= 30) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  };

  const logoutBot = async (sessionId) => {
    if (!confirm("Yakin ingin logout session ini?")) {
      return;
    }

    try {
      await fetch(`${API_URL}/api/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      loadStatus();
    } catch {
      setMessage("Gagal logout session.");
    }
  };

  const restartBot = async (sessionId, session) => {
    try {
      setMessage("Memulai ulang bot...");

      await fetch(`${API_URL}/api/pair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: session.number,
        }),
      });

      setMessage("Bot sedang dimulai ulang.");
      loadStatus();
    } catch {
      setMessage("Gagal restart bot.");
    }
  };

  const connectedCount = sessions.filter(
    (item) => item.connected
  ).length;

  return (
    <div className="dashboard">

      {/* SIDEBAR OVERLAY */}

      <div
        className={`sidebar-overlay ${
          sidebar ? "show" : ""
        }`}
        onClick={() => setSidebar(false)}
      />

      {/* SIDEBAR */}

      <aside className={`sidebar ${sidebar ? "open" : ""}`}>

        <div className="logo">
          <div className="logo-icon">
            DB
          </div>

          <div>
            <h2>DIN BOT</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav>

          <a className="nav-item active">
            <span>▣</span>
            Dashboard
          </a>

          <a className="nav-item">
            <span>◉</span>
            WhatsApp Bot
          </a>

          <a className="nav-item">
            <span>☁</span>
            Server
          </a>

          <a className="nav-item">
            <span>⚙</span>
            Pengaturan
          </a>

        </nav>

        <div className="sidebar-footer">
          <span className="online-dot" />
          System Online
        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* HEADER */}

        <header className="header">

          <button
            className="menu-button"
            onClick={() => setSidebar(true)}
          >
            ☰
          </button>

          <div>
            <h1>Dashboard</h1>
            <p>
              Kelola WhatsApp Bot kamu dari satu tempat.
            </p>
          </div>

          <div className="header-user">
            <div className="avatar">
              D
            </div>

            <div>
              <strong>Administrator</strong>
              <small>Admin</small>
            </div>
          </div>

        </header>

        {/* CONTENT */}

        <section className="content">

          {/* STAT CARDS */}

          <div className="stats-grid">

            <div className="stat-card">

              <div className="stat-icon blue">
                ◉
              </div>

              <div>
                <span>Server Status</span>

                <strong>
                  {serverOnline
                    ? "Online"
                    : "Offline"}
                </strong>

                <small>
                  API Bot Server
                </small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>WhatsApp Aktif</span>

                <strong>
                  {connectedCount}
                </strong>

                <small>
                  Bot terhubung
                </small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon purple">
                ◫
              </div>

              <div>
                <span>Total Session</span>

                <strong>
                  {sessions.length}
                </strong>

                <small>
                  Semua session
                </small>
              </div>

            </div>

          </div>

          {/* PAIRING */}

          <div className="section-title">
            <div>
              <h2>Hubungkan WhatsApp</h2>
              <p>
                Gunakan nomor WhatsApp untuk mendapatkan
                pairing code.
              </p>
            </div>
          </div>

          <div className="pair-card">

            <div className="pair-form">

              <label>
                Nomor WhatsApp
              </label>

              <input
                type="text"
                placeholder="628123456789"
                value={number}
                onChange={(e) =>
                  setNumber(e.target.value)
                }
              />

              <button
                className="primary-button"
                onClick={connectBot}
                disabled={loading}
              >
                {loading
                  ? "Memproses..."
                  : "Dapatkan Pairing Code"}
              </button>

            </div>

            {pairingCode && (

              <div className="pair-result">

                <span>
                  Pairing Code
                </span>

                <strong>
                  {pairingCode}
                </strong>

                <p>
                  Buka WhatsApp → Perangkat Tertaut →
                  Tautkan dengan nomor telepon.
                </p>

              </div>

            )}

          </div>

          {message && (

            <div className="notification">
              {message}
            </div>

          )}

          {/* SESSION */}

          <div className="section-title session-title">

            <div>
              <h2>WhatsApp Sessions</h2>

              <p>
                Daftar bot WhatsApp yang terhubung.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadStatus}
            >
              ↻ Refresh
            </button>

          </div>

          <div className="sessions">

            {sessions.length === 0 ? (

              <div className="empty">

                <div className="empty-icon">
                  ◫
                </div>

                <h3>
                  Belum ada session
                </h3>

                <p>
                  Hubungkan WhatsApp untuk membuat
                  session baru.
                </p>

              </div>

            ) : (

              sessions.map((session) => (

                <div
                  className="session-card"
                  key={session.sessionId}
                >

                  <div className="session-info">

                    <div className="whatsapp-icon">
                      WA
                    </div>

                    <div>

                      <h3>
                        {session.name ||
                          "WhatsApp Bot"}
                      </h3>

                      <p>
                        +{session.number}
                      </p>

                      <small>
                        Session ID:{" "}
                        {session.sessionId}
                      </small>

                    </div>

                  </div>

                  <div className="session-right">

                    <span
                      className={
                        session.connected
                          ? "badge connected"
                          : "badge disconnected"
                      }
                    >
                      <span />
                      {session.connected
                        ? "Connected"
                        : "Disconnected"}
                    </span>

                    <div className="actions">

                      <button
                        className="restart"
                        onClick={() =>
                          restartBot(
                            session.sessionId,
                            session
                          )
                        }
                      >
                        ↻
                        <span>
                          Restart
                        </span>
                      </button>

                      <button
                        className="logout"
                        onClick={() =>
                          logoutBot(
                            session.sessionId
                          )
                        }
                      >
                        Logout
                      </button>

                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

      </main>

    </div>
  );
}
