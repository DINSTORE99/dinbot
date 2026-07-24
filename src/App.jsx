import { useEffect, useState } from "react";

const API_URL = "https://bot.ndz.web.id";

function App() {
  const [number, setNumber] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ==============================
  // CONNECT WHATSAPP
  // ==============================

  const connectWhatsApp = async () => {
    if (!number) {
      setMessage("Masukkan nomor WhatsApp terlebih dahulu.");
      return;
    }

    setLoading(true);
    setMessage("");
    setPairingCode("");
    setConnected(false);

    try {
      const response = await fetch(`${API_URL}/api/pair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Gagal menghubungkan WhatsApp"
        );
      }

      setSessionId(data.sessionId);
      setMessage(
        "Bot sedang diproses. Menunggu kode pairing..."
      );

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // CEK PAIRING CODE
  // ==============================

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/pairing/${sessionId}`
        );

        const data = await response.json();

        if (data.code) {
          setPairingCode(data.code);
        }

        if (data.connected) {
          setConnected(true);
          setMessage(
            "WhatsApp berhasil terhubung!"
          );

          clearInterval(interval);
        }

      } catch (error) {
        console.log(
          "Gagal mengecek pairing:",
          error
        );
      }
    }, 2000);

    return () => clearInterval(interval);

  }, [sessionId]);

  // ==============================
  // LOGOUT
  // ==============================

  const logoutWhatsApp = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setConnected(false);
        setPairingCode("");
        setSessionId("");
        setMessage(
          "WhatsApp berhasil logout."
        );
      } else {
        setMessage(
          data.message ||
          "Gagal logout."
        );
      }

    } catch (error) {
      setMessage(
        "Gagal terhubung ke server."
      );
    }
  };

  return (
    <div className="app">

      <div className="container">

        <h1>
          DIN WhatsApp Bot
        </h1>

        <p className="subtitle">
          Hubungkan WhatsApp Bot melalui Pairing Code
        </p>

        {/* STATUS */}

        <div
          className={
            connected
              ? "status connected"
              : "status"
          }
        >
          <span className="status-dot"></span>

          {connected
            ? "WhatsApp Terhubung"
            : "WhatsApp Belum Terhubung"}
        </div>

        {/* FORM */}

        {!connected && (
          <div className="card">

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
              onClick={connectWhatsApp}
              disabled={loading}
            >
              {loading
                ? "Menghubungkan..."
                : "Hubungkan WhatsApp"}
            </button>

          </div>
        )}

        {/* PAIRING CODE */}

        {pairingCode && !connected && (
          <div className="pairing-card">

            <h2>
              Kode Pairing
            </h2>

            <div className="pairing-code">
              {pairingCode}
            </div>

            <p>
              Buka WhatsApp → Perangkat Tertaut
              → Tautkan Perangkat
              → Tautkan dengan Nomor Telepon
            </p>

          </div>
        )}

        {/* SESSION */}

        {sessionId && (
          <div className="session-card">

            <p>
              <b>Session ID:</b>
            </p>

            <code>
              {sessionId}
            </code>

          </div>
        )}

        {/* LOGOUT */}

        {connected && (
          <button
            className="logout"
            onClick={logoutWhatsApp}
          >
            Logout WhatsApp
          </button>
        )}

        {/* MESSAGE */}

        {message && (
          <div className="message">
            {message}
          </div>
        )}

      </div>

    </div>
  );
}

export default App;
