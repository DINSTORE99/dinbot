import { useEffect, useState } from "react";
import "./style.css";

function App() {
    const [activePage, setActivePage] = useState(
        localStorage.getItem("activePage") || "dashboard"
    );

    const [serverOnline, setServerOnline] = useState(false);
    const [botConnected, setBotConnected] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState("-");

    const [phoneNumber, setPhoneNumber] = useState("");
    const [pairingCode, setPairingCode] = useState("");
    const [pairingSession, setPairingSession] = useState("");
    const [pairingLoading, setPairingLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState("");

    const [logoutTarget, setLogoutTarget] = useState(null);
    const [logoutNumber, setLogoutNumber] = useState("");
    const [logoutLoading, setLogoutLoading] = useState(false);

    // ==========================================
    // PARTICLES
    // ==========================================

    const particles = Array.from({ length: 35 });

    // ==========================================
    // NORMALIZE NUMBER
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
    // MASK NUMBER
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
    // NAVIGATION
    // ==========================================

    const changePage = (page) => {
        setActivePage(page);
        localStorage.setItem("activePage", page);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
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

    // ==========================================
    // AUTO UPDATE
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

        const number = normalizeNumber(phoneNumber);

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

                        if (result.code) {
                            setPairingCode(
                                result.code
                            );

                            setMessage(
                                "Kode pairing berhasil dibuat."
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
                                    "Waktu menunggu pairing habis."
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

    // ==========================================
    // COPY PAIRING
    // ==========================================

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

    // ==========================================
    // LOGOUT MODAL
    // ==========================================

    const openLogoutModal = (session) => {
        setLogoutTarget(session);
        setLogoutNumber("");
        setMessage("");
    };

    const closeLogoutModal = () => {
        if (logoutLoading) return;

        setLogoutTarget(null);
        setLogoutNumber("");
        setMessage("");
    };

    // ==========================================
    // CONFIRM LOGOUT
    // ==========================================

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
            setMessage(
                "Masukkan nomor WhatsApp lengkap."
            );
            return;
        }

        if (input !== target) {
            setMessage(
                "Nomor tidak cocok dengan sesi."
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

            setMessage(
                "Gagal menghubungi server API."
            );

        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div className="app">

            {/* PARTICLES */}

            <div className="particles">
                {particles.map((_, index) => (
                    <span
                        key={index}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration:
                                `${4 + Math.random() * 5}s`,
                        }}
                    />
                ))}
            </div>

            {/* GLOW BACKGROUND */}

            <div className="glow glow-one" />
            <div className="glow glow-two" />

            {/* HEADER */}

            <header className="top-header">

                <div className="brand">

                    <div className="brand-mark">
                        D
                    </div>

                    <div>
                        <h1>DIN BOT</h1>

                        <p>
                            WhatsApp Bot Management
                        </p>
                    </div>

                </div>

                <div className="connection">

                    <span
                        className={
                            serverOnline
                                ? "status-dot online"
                                : "status-dot offline"
                        }
                    />

                    <span>
                        {serverOnline
                            ? "Server Online"
                            : "Server Offline"}
                    </span>

                </div>

            </header>


            {/* MAIN */}

            <main className="container">

                {/* DASHBOARD */}

                {activePage === "dashboard" && (

                    <section className="page active">

                        <div className="hero-card">

                            <div>

                                <span className="eyebrow">
                                    DIN STORE • 2026
                                </span>

                                <h2>
                                    WhatsApp
                                    <br />
                                    <span>Bot Panel</span>
                                </h2>

                                <p>
                                    Kelola bot WhatsApp,
                                    pairing, dan session
                                    dengan mudah.
                                </p>

                            </div>

                            <div className="hero-orb">
                                <div className="orb-inner">
                                    D
                                </div>
                            </div>

                        </div>


                        {/* STATS */}

                        <div className="stats-grid">

                            <div className="stat-card">

                                <div className="stat-icon">
                                    ⚡
                                </div>

                                <div>
                                    <span>
                                        STATUS SERVER
                                    </span>

                                    <strong>
                                        {serverOnline
                                            ? "ONLINE"
                                            : "OFFLINE"}
                                    </strong>
                                </div>

                            </div>


                            <div className="stat-card">

                                <div className="stat-icon">
                                    🤖
                                </div>

                                <div>
                                    <span>
                                        WHATSAPP
                                    </span>

                                    <strong>
                                        {botConnected
                                            ? "CONNECTED"
                                            : "WAITING"}
                                    </strong>
                                </div>

                            </div>


                            <div className="stat-card">

                                <div className="stat-icon">
                                    🔗
                                </div>

                                <div>
                                    <span>
                                        SESSION
                                    </span>

                                    <strong>
                                        {sessions.length}
                                    </strong>
                                </div>

                            </div>

                        </div>


                        {/* SYSTEM CARD */}

                        <div className="glass-card">

                            <div className="card-title">

                                <div>
                                    <span className="eyebrow">
                                        SYSTEM
                                    </span>

                                    <h3>
                                        Bot Information
                                    </h3>
                                </div>

                                <span className="active-badge">
                                    ACTIVE
                                </span>

                            </div>


                            <div className="info-list">

                                <div className="info-row">
                                    <span>
                                        Bot Name
                                    </span>

                                    <strong>
                                        DIN BOT
                                    </strong>
                                </div>

                                <div className="info-row">
                                    <span>
                                        Version
                                    </span>

                                    <strong>
                                        V1.0.0
                                    </strong>
                                </div>

                                <div className="info-row">
                                    <span>
                                        Platform
                                    </span>

                                    <strong>
                                        WhatsApp
                                    </strong>
                                </div>

                                <div className="info-row">
                                    <span>
                                        Last Update
                                    </span>

                                    <strong>
                                        {lastUpdate}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </section>

                )}


                {/* SERVER */}

                {activePage === "server" && (

                    <section className="page active">

                        <div className="page-heading">

                            <span className="eyebrow">
                                01 • SERVER
                            </span>

                            <h2>
                                Server Management
                            </h2>

                            <p>
                                Monitor status server
                                dan koneksi bot.
                            </p>

                        </div>


                        <div className="server-grid">

                            <div className="server-card">

                                <div className="server-top">

                                    <div className="server-logo">
                                        API
                                    </div>

                                    <span
                                        className={
                                            serverOnline
                                                ? "active-badge"
                                                : "offline-badge"
                                        }
                                    >
                                        {serverOnline
                                            ? "ONLINE"
                                            : "OFFLINE"}
                                    </span>

                                </div>

                                <h3>
                                    API Server
                                </h3>

                                <p className="server-address">
                                    Backend DIN BOT
                                </p>

                                <div className="server-info">
                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        {serverOnline
                                            ? "Running"
                                            : "Offline"}
                                    </strong>
                                </div>

                                <div className="server-info">
                                    <span>
                                        WhatsApp
                                    </span>

                                    <strong>
                                        {botConnected
                                            ? "Connected"
                                            : "Waiting"}
                                    </strong>
                                </div>

                                <button
                                    className="btn primary"
                                    onClick={loadStatus}
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Checking..."
                                        : "Refresh Status"}
                                </button>

                            </div>


                            <div className="server-card">

                                <div className="server-top">

                                    <div className="server-logo">
                                        BOT
                                    </div>

                                    <span
                                        className={
                                            botConnected
                                                ? "active-badge"
                                                : "offline-badge"
                                        }
                                    >
                                        {botConnected
                                            ? "CONNECTED"
                                            : "WAITING"}
                                    </span>

                                </div>

                                <h3>
                                    WhatsApp Bot
                                </h3>

                                <p className="server-address">
                                    Baileys Multi Session
                                </p>

                                <div className="server-info">
                                    <span>
                                        Session
                                    </span>

                                    <strong>
                                        {sessions.length}
                                    </strong>
                                </div>

                                <div className="server-info">
                                    <span>
                                        Platform
                                    </span>

                                    <strong>
                                        WhatsApp
                                    </strong>
                                </div>

                                <button
                                    className="btn"
                                    onClick={() =>
                                        changePage(
                                            "sessions"
                                        )
                                    }
                                >
                                    Manage Sessions
                                </button>

                            </div>

                        </div>

                    </section>

                )}


                {/* SESSIONS */}

                {activePage === "sessions" && (

                    <section className="page active">

                        <div className="page-heading">

                            <span className="eyebrow">
                                02 • SESSIONS
                            </span>

                            <h2>
                                WhatsApp Sessions
                            </h2>

                            <p>
                                Kelola semua perangkat
                                WhatsApp yang terhubung.
                            </p>

                        </div>


                        {/* PAIRING */}

                        <div className="glass-card pairing-card">

                            <div className="card-title">

                                <div>
                                    <span className="eyebrow">
                                        NEW CONNECTION
                                    </span>

                                    <h3>
                                        Pair WhatsApp
                                    </h3>
                                </div>

                                <span className="pairing-icon">
                                    +
                                </span>

                            </div>


                            <div className="pairing-form">

                                <div className="input-box">

                                    <span>
                                        +62
                                    </span>

                                    <input
                                        type="tel"
                                        placeholder="81234567890"
                                        value={
                                            phoneNumber
                                                .replace(
                                                    /^62/,
                                                    ""
                                                )
                                                .replace(
                                                    /^0/,
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
                                    className="btn primary pair-btn"
                                    onClick={
                                        startPairing
                                    }
                                    disabled={
                                        pairingLoading ||
                                        !serverOnline
                                    }
                                >
                                    {pairingLoading
                                        ? "Processing..."
                                        : "Generate Pairing Code"}
                                </button>

                            </div>


                            {message && (

                                <div className="message-box">
                                    {message}
                                </div>

                            )}


                            {pairingCode && (

                                <div className="pairing-result">

                                    <div>
                                        <span className="eyebrow">
                                            PAIRING CODE READY
                                        </span>

                                        <p>
                                            Session:{" "}
                                            {pairingSession}
                                        </p>
                                    </div>


                                    <button
                                        className="pairing-code"
                                        onClick={
                                            copyPairingCode
                                        }
                                    >
                                        {pairingCode}

                                        <small>
                                            {copied
                                                ? "COPIED"
                                                : "CLICK TO COPY"}
                                        </small>
                                    </button>

                                </div>

                            )}

                        </div>


                        {/* SESSION LIST */}

                        <div className="glass-card sessions-card">

                            <div className="card-title">

                                <div>
                                    <span className="eyebrow">
                                        CONNECTED DEVICES
                                    </span>

                                    <h3>
                                        Active Sessions
                                    </h3>
                                </div>

                                <span className="session-count">
                                    {sessions.length}
                                </span>

                            </div>


                            {sessions.length === 0 ? (

                                <div className="empty-state">

                                    <div className="empty-icon">
                                        ◌
                                    </div>

                                    <h3>
                                        Belum ada session
                                    </h3>

                                    <p>
                                        Hubungkan nomor WhatsApp
                                        untuk membuat session.
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
                                                        className="logout-btn"
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

                        </div>

                    </section>

                )}

            </main>


            {/* BOTTOM NAV */}

            <nav className="bottom-nav">

                <button
                    className={
                        activePage === "dashboard"
                            ? "nav-item active"
                            : "nav-item"
                    }
                    onClick={() =>
                        changePage("dashboard")
                    }
                >
                    <span>⌂</span>
                    Dashboard
                </button>


                <button
                    className={
                        activePage === "server"
                            ? "nav-item active"
                            : "nav-item"
                    }
                    onClick={() =>
                        changePage("server")
                    }
                >
                    <span>◈</span>
                    Server
                </button>


                <button
                    className={
                        activePage === "sessions"
                            ? "nav-item active"
                            : "nav-item"
                    }
                    onClick={() =>
                        changePage("sessions")
                    }
                >
                    <span>◎</span>
                    Sessions
                </button>

            </nav>


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


                        <span className="eyebrow">
                            SECURITY CHECK
                        </span>

                        <h2>
                            Logout Session
                        </h2>

                        <p>
                            Masukkan nomor lengkap
                            session untuk menghapus
                            koneksi WhatsApp.
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
                            value={logoutNumber}
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
                                className="btn"
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
                                className="btn danger"
                                onClick={
                                    confirmLogout
                                }
                                disabled={
                                    logoutLoading
                                }
                            >
                                {logoutLoading
                                    ? "Processing..."
                                    : "Confirm Logout"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default App;
