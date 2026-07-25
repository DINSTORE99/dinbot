import { useEffect, useState } from "react";
import "./style.css";

function App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingSession, setPairingSession] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ==============================
  // LOAD STATUS API
  // ==============================
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

      // Backend:
      // success: true
      // server: "online"
      // botConnected: false
      // sessions: []

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
        "Gagal mengambil status:",
        error
      );

      setServerOnline(false);
      setBotConnected(false);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // AUTO REFRESH
  // ==============================
  useEffect(() => {
    loadStatus();

    const interval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ==============================
  // REQUEST PAIRING
  // ==============================
  const startPairing = async () => {
    if (!phoneNumber.trim()) {
      setMessage(
        "Masukkan nomor WhatsApp terlebih dahulu."
      );
      return;
    }

    try {
      setPairingLoading(true);
      setMessage("");
      setPairingCode("");

      let number = phoneNumber
        .replace(/\D/g, "");

      if (number.startsWith("0")) {
        number =
          "62" +
          number.substring(1);
      }

      if (number.startsWith("8")) {
        number =
          "62" +
          number;
      }

      setPairingSession(number);

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
        "PAIR RESPONSE:",
        data
      );

      if (!data.success) {
        setMessage(
          data.message ||
          "Gagal memulai pairing."
        );
        return;
      }

      setMessage(
        "Session berhasil dibuat. Menunggu pairing code..."
      );

      // Cek pairing code setiap 2 detik
      let attempts = 0;

      const checkPairing =
        setInterval(async () => {
          attempts++;

          try {
            const result =
              await fetch(
                `/api/pairing/${number}`,
                {
                  cache: "no-store",
                }
              );

            const pairing =
              await result.json();

            console.log(
              "PAIRING STATUS:",
              pairing
            );

            if (pairing.code) {
              setPairingCode(
                pairing.code
              );

              setMessage(
                "Masukkan kode pairing ini ke WhatsApp."
              );

              clearInterval(
                checkPairing
              );
            }

            if (
              pairing.connected === true
            ) {
              setBotConnected(true);

              setMessage(
                "WhatsApp berhasil terhubung!"
              );

              clearInterval(
                checkPairing
              );

              loadStatus();
            }

            // Maksimal 60 detik
            if (attempts >= 30) {
              clearInterval(
                checkPairing
              );

              setMessage(
                "Waktu menunggu pairing habis. Silakan coba lagi."
              );
            }

          } catch (error) {
            console.error(
              "Pairing polling error:",
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
        "Tidak dapat menghubungi API pairing."
      );

    } finally {
      setPairingLoading(false);
    }
  };

  // ==============================
  // LOGOUT
  // ==============================
  const logoutSession = async (
    sessionId
  ) => {
    if (
      !confirm(
        "Yakin ingin logout session ini?"
      )
    ) {
      return;
    }

    try {
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
              sessionId,
            }),
          }
        );

      const data =
        await response.json();

      if (!data.success) {
        alert(
          data.message ||
          "Gagal logout."
        );
        return;
      }

      alert(
        "Session berhasil logout."
      );

      loadStatus();

    } catch (error) {
      console.error(error);

      alert(
        "Gagal menghubungi API."
      );
    }
  };

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            D
          </div>

          <div>
            <h2>DIN BOT</h2>
            <span>WhatsApp Panel</span>
          </div>
        </div>

        <nav>
          <a className="active">
            Dashboard
          </a>

          <a>
            Sessions
          </a>

          <a>
            Settings
          </a>
        </nav>

        <div className="sidebar-footer">
          DIN STORE
          <br />
          <span>Bot Management</span>
        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        <header className="header">

          <div>
            <h1>Dashboard</h1>

            <p>
              Kelola WhatsApp Bot kamu
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={loadStatus}
            disabled={loading}
          >
            {loading
              ? "Memuat..."
              : "↻ Refresh"}
          </button>

        </header>

        {/* STATUS CARDS */}
        <section className="cards">

          {/* SERVER */}
          <div className="card">

            <div className="card-top">
              <span>
                Server API
              </span>

              <div
                className={
                  serverOnline
                    ? "icon online"
                    : "icon offline"
                }
              >
                ◉
              </div>
            </div>

            <h2>
              {serverOnline
                ? "Online"
                : "Offline"}
            </h2>

            <div
              className={
                serverOnline
                  ? "status online-text"
                  : "status offline-text"
              }
            >
              <span></span>

              {serverOnline
                ? "ONLINE"
                : "OFFLINE"}
            </div>

          </div>

          {/* WHATSAPP */}
          <div className="card">

            <div className="card-top">

              <span>
                WhatsApp
              </span>

              <div
                className={
                  botConnected
                    ? "icon online"
                    : "icon offline"
                }
              >
                ☎
              </div>

            </div>

            <h2>
              {botConnected
                ? "Connected"
                : "Disconnected"}
            </h2>

            <div
              className={
                botConnected
                  ? "status online-text"
                  : "status offline-text"
              }
            >
              <span></span>

              {botConnected
                ? "TERHUBUNG"
                : "BELUM TERHUBUNG"}
            </div>

          </div>

          {/* SESSIONS */}
          <div className="card">

            <div className="card-top">

              <span>
                Total Session
              </span>

              <div className="icon">
                ◉
              </div>

            </div>

            <h2>
              {sessions.length}
            </h2>

            <div className="status">
              Session terdaftar
            </div>

          </div>

        </section>

        {/* PAIRING */}
        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Pair WhatsApp
              </h2>

              <p>
                Hubungkan WhatsApp menggunakan pairing code
              </p>
            </div>

          </div>

          <div className="pair-form">

            <input
              type="text"
              placeholder="628xxxxxxxxxx"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(
                  e.target.value
                )
              }
            />

            <button
              onClick={startPairing}
              disabled={pairingLoading}
            >
              {pairingLoading
                ? "Memproses..."
                : "Mulai Pairing"}
            </button>

          </div>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          {pairingCode && (
            <div className="pairing-box">

              <span>
                PAIRING CODE
              </span>

              <strong>
                {pairingCode}
              </strong>

              <p>
                Buka WhatsApp →
                Perangkat Tertaut →
                Tautkan dengan nomor telepon
              </p>

            </div>
          )}

        </section>

        {/* SESSIONS */}
        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Daftar Session
              </h2>

              <p>
                Session WhatsApp yang terhubung
              </p>
            </div>

            <span className="session-count">
              {sessions.length} Session
            </span>

          </div>

          {sessions.length === 0 ? (

            <div className="empty">

              <div className="empty-icon">
                ◉
              </div>

              <h3>
                Belum ada session
              </h3>

              <p>
                Hubungkan WhatsApp untuk mulai menggunakan bot.
              </p>

            </div>

          ) : (

            <div className="session-list">

              {sessions.map(
                (session) => (

                  <div
                    className="session"
                    key={
                      session.sessionId
                    }
                  >

                    <div className="session-info">

                      <div className="avatar">
                        {session.name
                          ? session.name
                              .charAt(0)
                              .toUpperCase()
                          : "W"}
                      </div>

                      <div>

                        <h3>
                          {session.name ||
                            "WhatsApp Bot"}
                        </h3>

                        <p>
                          {session.number ||
                            session.sessionId}
                        </p>

                      </div>

                    </div>

                    <div className="session-actions">

                      <span
                        className={
                          session.connected
                            ? "badge connected"
                            : "badge disconnected"
                        }
                      >
                        {session.connected
                          ? "Connected"
                          : "Disconnected"}
                      </span>

                      <button
                        className="logout-btn"
                        onClick={() =>
                          logoutSession(
                            session.sessionId
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
        <footer>

          <span>
            DIN BOT Dashboard
          </span>

          <span>
            Update:{" "}
            {lastUpdate || "-"}
          </span>

        </footer>

      </main>

    </div>
  );
}

export default App;
