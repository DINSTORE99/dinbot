import { useEffect, useState } from "react";
import "./style.css";
import Docs from "./doc/Docs";
import CaseDocs from "./case/case";
const API = "";

const TELEGRAM_BOT = "8206994792:AAGo26LadC8a86sF9VRiL_Q_S39FCbRMlZQ";
const TELEGRAM_CHAT = "6452266025";

function sendOpenNotif() {
  const info = getBrowserInfo();
  const message = `
🌐 WEBSITE dinbot
📱 Device: ${info.device}
🌍 Browser: ${info.browser}
⏰ Waktu: ${new Date().toLocaleString()}
🔗 URL: ${window.location.href}
  `;
  
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: message })
    }).catch(err => console.log("Telegram ERROR:", err));
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : "Safari";
  let device = ua.includes("Android") ? "Android" : ua.includes("iPhone") ? "iPhone" : "PC";
  return { browser, device };
}

window.addEventListener("load", () => {
  sendOpenNotif();
});

function App() {
  if (window.location.pathname === "/doc") {
    return <Docs />;
  }

  const [page, setPage] = useState("dashboard");
  const [serverOnline, setServerOnline] = useState(true);
  const [botConnected, setBotConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState("-");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [pairingLoading, setPairingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // LOGOUT STATE
  const [logoutTarget, setLogoutTarget] = useState(null);
  const [logoutNumber, setLogoutNumber] = useState("");
  const [logoutLoading, setLogoutLoading] = useState(false);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const normalizeNumber = (number) => {
    let value = String(number || "").replace(/\D/g, "");
    if (value.startsWith("0")) value = "62" + value.substring(1);
    if (value.startsWith("8")) value = "62" + value;
    return value;
  };

  // MASKING NOMOR SESI
  const maskNumber = (number) => {
    if (!number) return "-";
    const value = String(number);
    if (value.length <= 4) return value;
    return (
      value.substring(0, 5) +
      "*".repeat(Math.max(2, value.length - 7)) +
      value.substring(value.length - 2)
    );
  };

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/status`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      setServerOnline(data.success === true || data.server === "online");
      setBotConnected(data.botConnected === true);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      setLastUpdate(new Date().toLocaleTimeString("id-ID"));
    } catch (error) {
      console.error("STATUS ERROR:", error);
      setServerOnline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const startPairing = async () => {
    if (!phoneNumber.trim()) {
      showMessage("Masukkan nomor WhatsApp terlebih dahulu.");
      return;
    }

    const number = normalizeNumber(phoneNumber);
    if (!number || number.length < 10) {
      showMessage("Nomor WhatsApp tidak valid.");
      return;
    }

    try {
      setPairingLoading(true);
      setPairingCode("");
      showMessage("Menghubungkan ke server API...");

      const response = await fetch(`${API}/api/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });

      const data = await response.json();
      if (!data.success) {
        showMessage(data.message || "Gagal memulai pairing.");
        return;
      }

      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        showMessage("Kode pairing berhasil dibuat!");
      } else {
        showMessage("Sesi pairing dibuat, silakan cek terminal bot.");
      }
      loadStatus();
    } catch (error) {
      console.error("PAIR ERROR:", error);
      showMessage("Tidak dapat menghubungi server API.");
    } finally {
      setPairingLoading(false);
    }
  };

  const copyPairingCode = async () => {
    if (!pairingCode) return;
    await navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    showMessage("Kode pairing berhasil disalin.");
    setTimeout(() => setCopied(false), 2500);
  };

  const confirmLogout = async () => {
    if (!logoutTarget) return;

    const input = normalizeNumber(logoutNumber);
    const target = normalizeNumber(logoutTarget.number || logoutTarget.sessionId);

    if (!input) {
      showMessage("Masukkan nomor WhatsApp lengkap.");
      return;
    }

    if (input !== target) {
      showMessage("Nomor tidak cocok dengan sesi.");
      return;
    }

    try {
      setLogoutLoading(true);
      const response = await fetch(`${API}/api/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: logoutTarget.sessionId || logoutTarget }),
      });

      const data = await response.json();
      if (data.success) {
        setLogoutTarget(null);
        setLogoutNumber("");
        showMessage("Sesi berhasil dihapus.");
        loadStatus();
      } else {
        showMessage(data.message || "Gagal logout sesi.");
      }
    } catch (error) {
      showMessage("Gagal menghubungi server API.");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="tech-grid-bg"></div>

      {message && <div className="toast-notification">{message}</div>}

      <main className="main-content-mobile">
        
        {/* HEADER ATAS DENGAN LOGO BARU */}
        <div className="app-top-header">
          <div className="bot-profile">
            <img src="/logo.png" alt="Bot Din Logo" className="bot-logo-img" />
            <div>
              <h3>BOT DIN</h3>
              <span>WHATSAPP ASISTEN</span>
            </div>
          </div>
          <div className="status-badge-top">
            <span className={serverOnline ? "dot-green" : "dot-red"}></span> 
            {serverOnline ? "Online" : "Offline"}
          </div>
        </div>

        {page === "dashboard" && (
          <div className="page-content">
            <div className="header-title-box">
              <span className="subtitle-tag">PANEL BOT / DASHBOARD</span>
              <h1>WhatsApp Bot</h1>
              <p>Kelola koneksi WhatsApp dan perangkat bot kamu.</p>
            </div>

            <button className="refresh-btn" onClick={loadStatus} disabled={loading}>
              {loading ? "Memuat..." : "↻ Refresh Status"}
            </button>

            {/* STATS CARDS */}
            <div className="stats-stack">
              <div className="card-box">
                <div className="icon-box purple-bg">⚡</div>
                <div className="card-info">
                  <span>API SERVER</span>
                  <h3>{serverOnline ? "Online" : "Offline"}</h3>
                  <small className={serverOnline ? "text-green" : "text-red"}>
                    ● {serverOnline ? "SERVER AKTIF" : "SERVER OFFLINE"}
                  </small>
                </div>
              </div>

              <div className="card-box">
                <div className="icon-box green-bg">W</div>
                <div className="card-info">
                  <span>WHATSAPP</span>
                  <h3>{botConnected ? "Terhubung" : "Menunggu"}</h3>
                  <small className={botConnected ? "text-green" : "text-yellow"}>
                    ● {botConnected ? "TERHUBUNG" : "SIAP PAIRING"}
                  </small>
                </div>
              </div>

              <div className="card-box" onClick={() => setPage("sessions")} style={{ cursor: "pointer" }}>
                <div className="icon-box blue-bg">#</div>
                <div className="card-info">
                  <span>SESSIONS</span>
                  <h3>{sessions.length}</h3>
                  <small>KLIK UNTUK LIHAT</small>
                </div>
              </div>
            </div>

            {/* HERO BANNER */}
            <div className="hero-gradient-card">
              <span className="hero-ver">BOT DIN V2.0.0</span>
              <h2>Kelola Bot WhatsApp dengan mudah.</h2>
              <p>Hubungkan perangkat WhatsApp, lihat kode pairing, dan kelola semua session dari satu tempat.</p>
              <button className="hero-action-btn" onClick={() => setPage("pairing")}>
                Hubungkan WhatsApp →
              </button>
            </div>

            {/* INFORMASI SISTEM */}
            <div className="card-box system-info-card">
              <div className="sys-header">
                <div>
                  <span className="subtitle-tag">SYSTEM</span>
                  <h3>Informasi Sistem</h3>
                </div>
                <span className="active-pill">● ACTIVE</span>
              </div>
              <div className="sys-grid">
                <div className="sys-item">
                  <span>Website</span>
                  <strong>BOT DIN</strong>
                </div>
                <div className="sys-item">
                  <span>Version</span>
                  <strong>V2.0.0</strong>
                </div>
                <div className="sys-item">
                  <span>Platform</span>
                  <strong>WhatsApp Baileys</strong>
                </div>
                <div className="sys-item">
                  <span>Last Update</span>
                  <strong>{lastUpdate}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {page === "pairing" && (
          <div className="page-content">
            <div className="header-title-box">
              <span className="subtitle-tag">BOT DIN / PAIRING</span>
              <h1>Hubungkan WhatsApp</h1>
              <p>Masukkan nomor WhatsApp untuk mendapatkan kode pairing.</p>
            </div>

            <div className="card-box pairing-card-box">
              <div className="step-row">
                <div className="step-num">01</div>
                <div>
                  <span className="subtitle-tag">CONNECT DEVICE</span>
                  <h3>Nomor WhatsApp</h3>
                  <p>Gunakan nomor WhatsApp yang aktif untuk dihubungkan.</p>
                </div>
              </div>

              <div className="phone-input-wrap">
                <label>Nomor WhatsApp</label>
                <div className="phone-box">
                  <span className="prefix">+62</span>
                  <input
                    type="tel"
                    placeholder="81234567890"
                    value={phoneNumber.replace(/^62/, "")}
                    onChange={(e) => setPhoneNumber("62" + e.target.value.replace(/\D/g, ""))}
                    disabled={pairingLoading}
                  />
                </div>
                <button className="hero-action-btn w-full" onClick={startPairing} disabled={pairingLoading}>
                  {pairingLoading ? "Memproses..." : "Hubungkan WhatsApp →"}
                </button>

                {pairingCode && (
                  <div className="pairing-result-box">
                    <span>Kode Pairing Anda:</span>
                    <div className="code-row">
                      <code>{pairingCode}</code>
                      <button onClick={copyPairingCode} className="copy-btn">
                        {copied ? "Disalin!" : "Salin"}
                      </button>
                    </div>

                    {/* INSTRUKSI CARA MASUKKAN KODE */}
                    <div className="pairing-instruction" style={{ marginTop: "14px", borderTop: "1px dashed rgba(139,92,246,0.3)", paddingTop: "12px", textAlign: "left" }}>
                      <span style={{ fontSize: "11px", color: "#c084fc", fontWeight: "700", display: "block", marginBottom: "6px" }}>📋 CARA MENGGUNAKAN KODE:</span>
                      <ol style={{ fontSize: "11.5px", color: "#cbd5e1", paddingLeft: "16px", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <li>Buka aplikasi <b>WhatsApp</b> di HP kamu.</li>
                        <li>Ketuk Titik Tiga (Android) atau Pengaturan (iPhone) → <b>Perangkat Tertaut</b>.</li>
                        <li>Ketuk <b>Tautkan Perangkat</b> lalu pilih <b>Tautkan dengan nomor telepon saja</b>.</li>
                        <li>Masukkan kode di atas untuk menghubungkan bot.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {page === "sessions" && (
          <div className="page-content">
            <div className="header-title-box">
              <span className="subtitle-tag">BOT DIN / SESSIONS</span>
              <h1>Sesi Aktif</h1>
              <p>Daftar perangkat sesi WhatsApp yang terhubung.</p>
            </div>

            <div className="sessions-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sessions.length === 0 ? (
                <div className="card-box text-center" style={{ justifyContent: "center", padding: "30px" }}>
                  <p className="text-muted" style={{ fontSize: "13px" }}>Belum ada sesi aktif. Lakukan pairing terlebih dahulu.</p>
                </div>
              ) : (
                sessions.map((sess, idx) => {
                  const rawSession = sess.sessionId || sess;
                  return (
                    <div className="card-box" key={idx} style={{ justifyContent: "space-between" }}>
                      <div>
                        <span className="subtitle-tag">SESSION ID</span>
                        <h3 style={{ fontSize: "15px", letterSpacing: "1px" }}>{maskNumber(rawSession)}</h3>
                        <small className="text-green">● TERHUBUNG</small>
                      </div>
                      <button 
                        onClick={() => setLogoutTarget(sess)}
                        style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                      >
                        Hapus
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* MODAL KONFIRMASI NOMOR SAAT HAPUS SESI */}
            {logoutTarget && (
              <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: "20px" }}>
                <div className="card-box" style={{ flexDirection: "column", width: "100%", maxWidth: "400px", background: "#0f172a", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "4px", color: "#ef4444" }}>Konfirmasi Hapus Sesi</h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Masukkan nomor WhatsApp lengkap yang terdaftar pada sesi ini untuk konfirmasi.</p>
                  
                  <div className="phone-box" style={{ width: "100%" }}>
                    <span className="prefix">+62</span>
                    <input
                      type="tel"
                      placeholder="81234567890"
                      value={logoutNumber.replace(/^62/, "")}
                      onChange={(e) => setLogoutNumber("62" + e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                    <button 
                      onClick={() => setLogoutTarget(null)}
                      style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "10px", borderRadius: "10px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Batal
                    </button>
                    <button 
                      onClick={confirmLogout}
                      disabled={logoutLoading}
                      style={{ flex: 1, background: "#ef4444", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: "600", cursor: "pointer" }}
                    >
                      {logoutLoading ? "Memproses..." : "Ya, Hapus"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <footer className="app-footer">
          <p>© 2026 <b>BOT PUBLIC</b>. All Rights Reserved.</p>
          <small>Developer<a href="https://t.me/DINN_STORE" target="_blank" rel="noreferrer">Contact</a></small>
        </footer>

      </main>

      {/* NAVIGATION BAR BAWAH */}
      <nav className="bottom-dock">
        <button 
          className={page === "dashboard" ? "dock-item active" : "dock-item"} 
          onClick={() => setPage("dashboard")}
        >
          <span className="dock-icon">🏠</span>
          <span>Dashboard</span>
        </button>

        <button 
          className={page === "pairing" ? "dock-item active" : "dock-item"} 
          onClick={() => setPage("pairing")}
        >
          <span className="dock-icon">+</span>
          <span>Pairing</span>
        </button>

        <button 
          className={page === "sessions" ? "dock-item active" : "dock-item"} 
          onClick={() => setPage("sessions")}
        >
          <span className="dock-icon">⚙️</span>
          <span>Sessions</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
