impor { useEffect, useState } dari "react";
impor "./style.css";

fungsi App() {
  const [serverOnline, setServerOnline] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pesan, setMessage] = useState("");
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
  // NOMOR FORMAT
  // ==========================================

  const normalizeNumber = (number) => {
    let value = String(number || "").replace(/\D/g, "");

    jika (nilai dimulai dengan "0") {
      nilai = "62" + nilai.substring(1);
    }

    jika (nilai dimulai dengan "8") {
      nilai = "62" + nilai;
    }

    nilai kembalian;
  };

  // ==========================================
  // NOMOR SAMARKAN
  // Contoh:
  // 6281234567804
  // menjadi:
  // 62*******04
  // ==========================================

  const maskNumber = (number) => {
    jika (!angka) {
      kembali "-";
    }

    konstanta nilai = String(angka);

    jika (nilai.panjang <= 4) {
      nilai kembalian;
    }

    kembali (
      nilai.substring(0, 2) +
      "*".repeat(Math.max(1, value.length - 4)) +
      nilai.substring(nilai.panjang - 2)
    );
  };

  // ==========================================
  // STATUS PEMUATAN
  // ==========================================

  const loadStatus = async () => {
    mencoba {
      setLoading(true);

      const response = await fetch("/api/status", {
        metode: "GET",
        cache: "tidak menyimpan",
      });

      jika (!respons.ok) {
        lemparkan Error baru (`HTTP ${response.status}`);
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

    } tangkap (kesalahan) {
      konsol.kesalahan(
        "KESALAHAN STATUS:",
        kesalahan
      );

      setServerOnline(false);
      setBotConnected(false);
      setSessions([]);

    } Akhirnya {
      setLoading(false);
    }
  };

  // ==========================================
  // PEMBARUAN OTOMATIS
  // ==========================================

  useEffect(() => {
    loadStatus();

    const timer = setInterval(() => {
      loadStatus();
    }, 5000);

    kembalikan () => {
      clearInterval(timer);
    };
  }, []);

  // ==========================================
  // MULAI PEMASANGAN
  // ==========================================

  const startPairing = async () => {
    jika (!nomor telepon.trim()) {
      setMessage(
        "Masukkan nomor WhatsApp terlebih dahulu."
      );
      kembali;
    }

    konstanta angka =
      normalizeNumber(phoneNumber);

    jika (!number || number.length < 10) {
      setMessage(
        "Nomor WhatsApp tidak valid."
      );
      kembali;
    }

    mencoba {
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
          metode: "POST",
          judul: {
            "Jenis Konten":
              "aplikasi/json",
          },
          isi: JSON.stringify({
            nomor,
          }),
        }
      );

      konstanta data =
        tunggu respons.json();

      konsol.log(
        "API PASANG:",
        data
      );

      jika (!data.berhasil) {
        setMessage(
          data.pesan ||
          "Gagal memulai pairing."
        );
        kembali;
      }

      setPairingSession(
        data.sessionId || nomor
      );

      setMessage(
        "Permintaan pairing berhasil. Menunggu kode..."
      );

      misalkan percobaan = 0;

      const timer = setInterval(
        asinkron () => {
          percobaan++;

          mencoba {
            const sessionId =
              data.sessionId ||
              nomor;

            konstanta respons =
              tunggu pengambilan (
                `/api/pairing/${encodeURIComponent(
                  ID sesi
                )}`,
                {
                  cache:
                    "tidak ada toko",
                }
              );

            konstanta hasil =
              tunggu respons.json();

            konsol.log(
              "STATUS PEMASANGAN:",
              hasil
            );

            jika (result.code) {
              setPairingCode(
                hasil.kode
              );

              setMessage(
                "Kode penyandingan berhasil dibuat. Salin kode di bawah."
              );

              clearInterval(timer);
            }

            jika (
              hasil.terhubung === benar
            ) {
              setBotConnected(true);

              setMessage(
                "WhatsApp berhasil terhubung."
              );

              clearInterval(timer);

              loadStatus();
            }

            jika (percobaan >= 30) {
              clearInterval(timer);

              jika (!result.code) {
                setMessage(
                  "Waktu menunggu pairing habis. Silakan coba lagi."
                );
              }
            }

          } tangkap (kesalahan) {
            konsol.kesalahan(
              "KESALAHAN PEMERIKSAAN PASANGAN:",
              kesalahan
            );
          }

        },
        Tahun 2000
      );

    } tangkap (kesalahan) {
      konsol.kesalahan(
        "KESALAHAN PASANGAN:",
        kesalahan
      );

      setMessage(
        "Tidak dapat menghubungi server API."
      );

    } Akhirnya {
      setPairingLoading(false);
    }
  };

  // ==========================================
  // SALIN KODE PEMASANGAN
  // ==========================================

  const copyPairingCode = async () => {
    jika (!pairingCode) {
      kembali;
    }

    mencoba {
      tunggu navigator.clipboard.tulisTeks(
        kode pasangan
      );

      setCopied(true);

      setMessage(
        "Kode penyandingan berhasil dihentikan."
      );

      setTimeout(() => {
        setCopied(false);
      }, 2500);

    } tangkap (kesalahan) {
      konsol.kesalahan(
        "KESALAHAN PENYALINAN:",
        kesalahan
      );

      setMessage(
        "Gagal menyalin kode pairing."
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
  // MODAL TUTUP
  // ==========================================

  const closeLogoutModal = () => {
    jika (logoutLoading) {
      kembali;
    }

    setLogoutTarget(null);
    setLogoutNumber("");
  };

  // ==========================================
  // KONFIRMASI LOGOUT
  // ==========================================

  const confirmLogout = async () => {
    jika (!logoutTarget) {
      kembali;
    }

    konstanta input =
      normalizeNumber(logoutNumber);

    konstanta target =
      normalizeNumber(
        logoutTarget.number ||
        logoutTarget.sessionId
      );

    jika (!input) {
      setMessage(
        "Masukkan nomor WhatsApp lengkap."
      );
      kembali;
    }

    jika (input !== target) {
      setMessage(
        "Nomor tidak cocok dengan sesi."
      );
      kembali;
    }

    mencoba {
      setLogoutLoading(true);
      setMessage("");

      konstanta respons =
        tunggu pengambilan (
          "/api/logout",
          {
            metode: "POST",
            judul: {
              "Jenis Konten":
                "aplikasi/json",
            },
            isi: JSON.stringify({
              ID sesi:
                logoutTarget.sessionId,
            }),
          }
        );

      konstanta data =
        tunggu respons.json();

      jika (!data.berhasil) {
        setMessage(
          data.pesan ||
          "Sesi logout Gagal."
        );
        kembali;
      }

      setLogoutTarget(null);
      setLogoutNumber("");

      setMessage(
        "Sesi berhasil dihapus."
      );

      tunggu status pemuatan();

    } tangkap (kesalahan) {
      konsol.kesalahan(
        "KESALAHAN LOGOUT:",
        kesalahan
      );

      setMessage(
        "Gagal menghubungi server API."
      );

    } Akhirnya {
      setLogoutLoading(false);
    }
  };

  kembali (
    <div className="app">

      {/* ================================= */}
      {/* SIDEBAR ***
      {/* ================================= */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            D
          </div>

          <div>
            <h2>DIN BOT</h2>
            <span>
              Manajemen WhatsApp
            </span>
          </div>

        </div>

        <nav className="sidebar-menu">

          <div className="menu-item aktif">
            ✔
            Dasbor
          </div>

          <div className="menu-item">
            <span>â—‰</span>
            WhatsApp
          </div>

          <div className="menu-item">
            âš™</span>
            Pengaturan
          </div>

        </nav>

        <div className="sidebar-bottom">

          <div className="status-sistem">

            <span
              Nama kelas={
                serverOnline
                  ? "titik online"
                  : "titik offline"
              }
            />

            <div>
              <strong>
                Server API
              </strong>

              <kecil>
                {serverOnline
                  ? "On line"
                  : "Offline"}
              </small>
            </div>

          </div>

          <div className="hak cipta">
            DIN STORE © 2026
          </div>

        </div>

      </sisi>

      {/* ================================= */}
      {/* UTAMA */}
      {/* ================================= */}

      <main className="main">

        {/* HEADER */}

        <header className="topbar">

          <div>

            <div className="breadcrumb">
              Dasbor
            </div>

            <h1>
              Bot WhatsApp
            </h1>

            <p>
              Kelola koneksi WhatsApp
              dan session bot kamu.
            </p>

          </div>

          <tombol>
            className="tombol-refresh"
            onClick={loadStatus}
            dinonaktifkan={memuat}
          >
            <span>→</span>

            {memuat
              ? "Memuat"
              : "Menyegarkan"}
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
                  API SERVER
                </span>

                <h3>
                  {serverOnline
                    ? "On line"
                    : "Offline"}
                </h3>
              </div>

              <div
                Nama kelas={
                  serverOnline
                    ? "ikon status hijau"
                    : "ikon status merah"
                }
              >
                A-
              </div>

            </div>

            <div
              Nama kelas={
                serverOnline
                  ? "koneksi online"
                  : "koneksi offline"
              }
            >
              <span />

              {serverOnline
                ? "SERVER ONLINE"
                : "SERVER OFFLINE"}
            </div>

          </div>

          {/* WHATSAPP ***

          <div className="status-card">

            <div className="status-card-header">

              <div>
                <span className="label">
                  WhatsApp
                </span>

                <h3>
                  {botTerhubung
                    ? "Terhubung"
                    : "Belum Terhubung"}
                </h3>
              </div>

              <div
                Nama kelas={
                  botConnected
                    ? "ikon status hijau"
                    : "ikon status oranye"
                }
              >
                â˜Ž
              </div>

            </div>

            <div
              Nama kelas={
                botConnected
                  ? "koneksi online"
                  : "koneksi sedang menunggu"
              }
            >
              <span />

              {botTerhubung
                ? "TERHUBUNG DENGAN WHATSAPP"
                : "PASANGAN MENUNGGU"}
            </div>

          </div>

          {/* SESI */}

          <div className="status-card">

            <div className="status-card-header">

              <div>
                <span className="label">
                  SIDANG
                </span>

                <h3>
                  {sesi.panjang}
                </h3>
              </div>

              <div className="status-icon blue">
                A-‰
              </div>

            </div>

            <div className="koneksi netral">
              <span />

              SESI TERDAFTAR
            </div>

          </div>

        </section>

        {/* ================================= */}
        {/* PASANGAN */}
        {/* ================================= */}

        <section className="content-card">

          <div className="section-heading">

            <div>

              <span className="nomor-bagian">
                01
              </span>

              <div>
                <h2>
                  WhatsApp
                </h2>

                <p>
                  Masukkan nomor WhatsApp
                  untuk mendapatkan kode penyandingan.
                </p>
              </div>

            </div>

          </div>

          <div className="pairing-form">

            <div className="input-wrapper">

              <span>
                +62
              </span>

              <masukan>
                tipe="tel"
                placeholder="81234567890"
                nilai={
                  Nomor telepon
                    .ganti(/^62/, "")
                    .ganti(/^0/, "")
                }
                onChange={(e) => {
                  konstanta nilai =
                    e.target.nilai
                      .replace(/\D/g, "");

                  setPhoneNumber(
                    "62" + nilai
                  );
                }}
              />

            </div>

            <tombol>
              className="pair-button"
              onClick={startPairing}
              dengan disabilitas={
                Memuat pasangan ||
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
                  WhatsApp
                  <span>â†'</span>
                </>
              )}

            </button>

          </div>

          {pesan && (
            <div className="message-box">
              <span>â— </span>
              {pesan}
            </div>
          )}

          {/* KODE PEMASANGAN */}

          {pairingCode && (
            <div className="pairing-result">

              <div className="pairing-result-top">

                <div>

                  <span className="success-label">
                    KODE PEMASANGAN SIAP
                  </span>

                  <h3>
                    Masukkan kode ini
                    di WhatsApp kamu
                  </h3>

                </div>

                <div className="pemeriksaan keberhasilan">
                  ✅
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
                Tertaut â†' Tautkan dengan
                nomor telepon
              </p>

            </div>
          )}

        </section>

        {/* ================================= */}
        {/* SESI */}
        {/* ================================= */}

        <section className="content-card">

          <div className="section-heading session-heading">

            <div>

              <span className="nomor-bagian">
                02
              </span>

              <div>
                <h2>
                  Sesi WhatsApp
                </h2>

                <p>
                  Daftar perangkat WhatsApp
                  yang sudah terhubung.
                </p>
              </div>

            </div>

            <div className="session-total">
              {sesi.panjang}
              <span>
                Sidang
              </span>
            </div>

          </div>

          {sessions.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                A-‰
              </div>

              <h3>
                Belum ada sesi
              </h3>

              <p>
                WhatsApp kamu
                untuk membuat sesi pertama.
              </p>

            </div>

          ) : (

            <div className="session-list">

              {sessions.map(
                (sesi) => (

                  <div
                    className="session-item"
                    kunci={
                      ID sesi.sesi
                    }
                  >

                    <div className="session-left">

                      <div className="session-avatar">
                        W
                      </div>

                      <div>

                        <h3>
                          {session.name ||
                            "Bot WhatsApp"}
                        </h3>

                        <p>
                          {nomormasker(
                            nomor sesi ||
                            ID sesi.sesi
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="session-right">

                      <span
                        Nama kelas={
                          sesi.terhubung
                            ? "lencana sesi terhubung"
                            : "lencana sesi terputus"
                        }
                      >
                        <span />
                        {session.connected
                          ? "Terhubung"
                          : "Terputus"}
                      </span>

                      <tombol>
                        className="tombol-keluar"
                        onClick={() =>
                          openLogoutModal(
                            sidang
                          )
                        }
                      >
                        Keluar
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
            Dasbor DIN BOT
          </span>

          <span>
            Pembaruan terakhir:{" "}
            {Pembaruan terakhir}
          </span>

        </footer>

      </main>

      {/* ================================= */}
      {/* MODAL KELUAR */}
      {/* ================================= */}

      {logoutTarget && (

        <div
          className="modal-overlay"
          onClick={(e) => {
            jika (
              e.target ===
              e.targetsaatini
            ) {
              closeLogoutModal();
            }
          }}
        >

          <div className="logout-modal">

            <tombol>
              className="tutup-modal"
              onClick={
                tutupLogoutModal
              }
            >
              A-
            </button>

            <div className="ikon peringatan">
              !
            </div>

            <h2>
              Keluar dari WhatsApp
            </h2>

            <p>
              Untuk keamanan, masukkan
              nomor lengkap sesi yang
              ingin kamu keluarkan.
            </p>

            <div className="target-session">

              <span>
                SIDANG
              </span>

              <strong>
                {nomormasker(
                  logoutTarget.number ||
                  logoutTarget.sessionId
                )}
              </strong>

            </div>

            <masukan>
              tipe="tel"
              placeholder="628xxxxxxxxxx"
              nilai={
                keluarNomor
              }
              onChange={(e) =>
                setLogoutNumber(
                  e.target.nilai
                )
              }
            />

            {pesan && (
              <div className="modal-message">
                {pesan}
              </div>
            )}

            <div className="modal-buttons">

              <tombol>
                className="tombol-batal"
                onClick={
                  tutupLogoutModal
                }
                dengan disabilitas={
                  logoutMemuat
                }
              >
                Batal
              </button>

              <tombol>
                className="tombol konfirmasi"
                onClick={
                  konfirmasiKeluar
                }
                dengan disabilitas={
                  logoutMemuat
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

ekspor default Aplikasi;
