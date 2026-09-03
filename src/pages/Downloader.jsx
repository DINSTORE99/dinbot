import { useState } from "react";

export default function Downloader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // =====================================================
  // EXTRACT URL
  // Bisa menerima:
  //
  // https://www.capcut.com/tv2/ZSqeF94xa/
  //
  // atau:
  // Saya menemukan template mengagumkan ini di CapCut...
  // https://www.capcut.com/tv2/ZSqeF94xa/
  // =====================================================

  const extractUrl = (text) => {
    if (!text) return "";

    const match = text.match(
      /https?:\/\/[^\s]+/i
    );

    if (!match) {
      return text.trim();
    }

    return match[0]
      .replace(/[.,!?;:)\]}]+$/g, "")
      .trim();
  };

  // =====================================================
  // DETECT PLATFORM
  // =====================================================

  const detectPlatform = (text) => {
    const url = extractUrl(text).toLowerCase();

    if (!url) return null;

    // Instagram
    if (
      url.includes("instagram.com") ||
      url.includes("instagr.am")
    ) {
      return "instagram";
    }

    // Facebook
    if (
      url.includes("facebook.com") ||
      url.includes("fb.watch")
    ) {
      return "facebook";
    }

    // TikTok
    if (
      url.includes("tiktok.com") ||
      url.includes("vt.tiktok.com")
    ) {
      return "tiktok";
    }

    // CapCut
    if (
      url.includes("capcut.com") ||
      url.includes("capcut.net") ||
      url.includes("capcut.cn")
    ) {
      return "capcut";
    }

    // Spotify
    if (
      url.includes("spotify.com") ||
      url.includes("open.spotify.com")
    ) {
      return "spotify";
    }

    // YouTube
    if (
      url.includes("youtube.com") ||
      url.includes("youtu.be")
    ) {
      return "youtube";
    }

    return null;
  };

  const detectedPlatform =
    detectPlatform(videoUrl);

  // =====================================================
  // PLATFORM NAME
  // =====================================================

  const getPlatformName = (platform) => {
    const names = {
      instagram: "Instagram",
      facebook: "Facebook",
      tiktok: "TikTok",
      capcut: "CapCut",
      spotify: "Spotify",
      youtube: "YouTube",
    };

    return names[platform] || "";
  };

  // =====================================================
  // PLATFORM LOGO
  // =====================================================

  const PlatformLogo = ({ platform }) => {
    if (platform === "instagram") {
      return (
        <svg
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="currentColor"
        >
          <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.2-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
        </svg>
      );
    }

    if (platform === "facebook") {
      return (
        <svg
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="currentColor"
        >
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.093 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.032 1.792-4.706 4.533-4.706 1.312 0 2.686.236 2.686.236v2.973h-1.514c-1.491 0-1.956.929-1.956 1.882v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.099 24 12.073z" />
        </svg>
      );
    }

    if (platform === "tiktok") {
      return (
        <svg
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="currentColor"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-3.888V2h-3.234v13.614a2.72 2.72 0 1 1-2.72-2.72c.28 0 .55.043.805.123v-3.3a6.03 6.03 0 1 0 5.15 5.963V8.788a8.024 8.024 0 0 0 4.69 1.51V7.065a4.8 4.8 0 0 1-.921-.379z" />
        </svg>
      );
    }

    if (platform === "capcut") {
      return (
        <svg
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="currentColor"
        >
          <path d="M17.7 4.3c-1.3-1.3-3.4-1.3-4.7 0l-1.8 1.8-1.8-1.8c-1.3-1.3-3.4-1.3-4.7 0s-1.3 3.4 0 4.7l1.8 1.8-1.8 1.8c-1.3 1.3-1.3 3.4 0 4.7s3.4 1.3 4.7 0l1.8-1.8 1.8 1.8c1.3 1.3 3.4 1.3 4.7 0s1.3-3.4 0-4.7l-1.8-1.8 1.8-1.8c1.3-1.3 1.3-3.4 0-4.7z" />
        </svg>
      );
    }

    if (platform === "spotify") {
      return (
        <svg
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="currentColor"
        >
          <path d="M12 1.8A10.2 10.2 0 1 0 12 22.2 10.2 10.2 0 0 0 12 1.8zm4.68 14.72a.84.84 0 0 1-1.16.28c-3.18-1.95-7.19-2.39-11.92-1.31a.84.84 0 1 1-.37-1.64c5.17-1.18 9.6-.68 13.18 1.51.39.24.51.75.27 1.16zm1.55-3.44a1.05 1.05 0 0 1-1.45.34c-3.64-2.24-9.18-2.89-13.47-1.58a1.05 1.05 0 1 1-.61-2.01c4.91-1.49 11.02-.77 15.19 1.79.49.3.64.95.34 1.46zm.13-3.58C14 6.88 7.17 6.66 3.13 7.89a1.26 1.26 0 1 1-.73-2.41c4.64-1.41 12.38-1.13 16.98 1.6a1.26 1.26 0 0 1-1.02 2.42z" />
        </svg>
      );
    }

    if (platform === "youtube") {
      return (
        <svg
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="currentColor"
        >
          <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.58 9.38.58 9.38.58s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.5v-7l6.2 3.5-6.2 3.5z" />
        </svg>
      );
    }

    return null;
  };

  // =====================================================
  // INPUT
  // =====================================================

  const handleUrlChange = (e) => {
    setVideoUrl(e.target.value);
    setError("");

    if (result) {
      setResult(null);
    }
  };

  // =====================================================
  // FETCH JSON
  // =====================================================

  const fetchJSON = async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Server error ${response.status}`
      );
    }

    return await response.json();
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = extractUrl(videoUrl);

    if (!url) {
      setError("Masukkan link terlebih dahulu.");
      return;
    }

    const platform = detectPlatform(url);

    if (!platform) {
      setError(
        "Link tidak didukung. Gunakan Instagram, Facebook, TikTok, CapCut, Spotify, atau YouTube."
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      let apiUrl = "";

      // =================================================
      // FACEBOOK
      // =================================================

      if (platform === "facebook") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`;
      }

      // =================================================
      // TIKTOK
      // =================================================

      else if (platform === "tiktok") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(url)}`;
      }

      // =================================================
      // CAPCUT
      // =================================================

      else if (platform === "capcut") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(url)}`;
      }

      // =================================================
      // INSTAGRAM
      // =================================================

      else if (platform === "instagram") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/sssinstagram?url=${encodeURIComponent(url)}`;
      }

      // =================================================
      // SPOTIFY
      // =================================================

      else if (platform === "spotify") {
        apiUrl =
          `https://api.azbry.com/api/download/spotify?url=${encodeURIComponent(url)}`;
      }

      // =================================================
      // YOUTUBE
      // =================================================

      else if (platform === "youtube") {
        apiUrl =
          `https://api.azbry.com/api/download/allinonev2?url=${encodeURIComponent(url)}`;
      }

      const data = await fetchJSON(apiUrl);

      if (!data) {
        throw new Error(
          "API tidak mengembalikan data."
        );
      }

      setResult({
        platform,
        data
      });

    } catch (err) {
      console.error(
        "DOWNLOADER ERROR:",
        err
      );

      setError(
        err?.message ||
        "Gagal mengambil data dari server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CLEAR
  // =====================================================

  const clearResult = () => {
    setVideoUrl("");
    setResult(null);
    setError("");
  };

  return (
    <div className="downloader-page">

      <style>{`

        * {
          box-sizing: border-box;
        }

        .downloader-page {
          min-height: 100vh;
          padding: 30px 14px;
          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(99,102,241,.16),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(20,184,166,.10),
              transparent 30%
            ),
            #080a0f;
          color: #f5f7fa;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .downloader-container {
          width: 100%;
          max-width: 760px;
          margin: auto;
        }

        .downloader-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .downloader-header h1 {
          margin: 0;
          font-size: 34px;
          font-weight: 850;
          letter-spacing: -.9px;
        }

        .downloader-header p {
          margin: 9px 0 0;
          color: #8e97a8;
          font-size: 13px;
        }

        /* ================================
           PLATFORMS
        ================================= */

        .platform-list {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 16px;
        }

        .platform {
          padding: 7px 11px;
          border: 1px solid #262c37;
          border-radius: 999px;
          background: #11141a;
          color: #adb5c3;
          font-size: 11px;
          font-weight: 700;
        }

        /* ================================
           CARD
        ================================= */

        .downloader-card {
          padding: 20px;
          border: 1px solid #252b36;
          border-radius: 19px;
          background: rgba(15,18,24,.95);
          box-shadow:
            0 20px 60px rgba(0,0,0,.25);
        }

        .input-label {
          display: block;
          margin-bottom: 9px;
          color: #dfe4ec;
          font-size: 13px;
          font-weight: 750;
        }

        /* ================================
           INPUT
        ================================= */

        .url-input-wrapper {
          position: relative;
        }

        .url-input {
          width: 100%;
          height: 55px;
          padding: 0 16px;
          border: 1px solid #2b313d;
          border-radius: 13px;
          outline: none;
          background: #0b0e13;
          color: #fff;
          font-size: 13px;
          transition: .2s ease;
        }

        .url-input::placeholder {
          color: #626b79;
        }

        .url-input:focus {
          border-color: #6366f1;
          box-shadow:
            0 0 0 3px rgba(99,102,241,.12);
        }

        .url-input.detected {
          padding-left: 53px;
          padding-right: 92px;
        }

        /* ================================
           DETECTED LOGO
        ================================= */

        .detected-logo {
          position: absolute;
          left: 16px;
          top: 50%;
          z-index: 3;

          width: 23px;
          height: 23px;

          display: flex;
          align-items: center;
          justify-content: center;

          transform:
            translateY(-50%)
            scale(1);

          color: #fff;

          pointer-events: none;

          animation:
            detectedLogo .22s ease;
        }

        @keyframes detectedLogo {
          from {
            opacity: 0;
            transform:
              translateY(-50%)
              scale(.6);
          }

          to {
            opacity: 1;
            transform:
              translateY(-50%)
              scale(1);
          }
        }

        .detected-text {
          position: absolute;
          right: 11px;
          top: 50%;

          transform: translateY(-50%);

          padding: 6px 9px;

          border: 1px solid #292f3a;
          border-radius: 8px;

          background: #151820;
          color: #c2c8d3;

          font-size: 10px;
          font-weight: 800;

          pointer-events: none;

          animation:
            detectedText .2s ease;
        }

        @keyframes detectedText {
          from {
            opacity: 0;
            transform:
              translateY(-50%)
              translateX(5px);
          }

          to {
            opacity: 1;
            transform:
              translateY(-50%)
              translateX(0);
          }
        }

        /* ================================
           BUTTON
        ================================= */

        .search-button {
          width: 100%;
          height: 51px;
          margin-top: 13px;

          border: 0;
          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #7c3aed
            );

          color: #fff;

          font-size: 13px;
          font-weight: 800;

          cursor: pointer;

          transition: .2s ease;
        }

        .search-button:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .search-button:active {
          transform: translateY(0);
        }

        .search-button:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        /* ================================
           ERROR
        ================================= */

        .error-box {
          margin-top: 13px;
          padding: 12px 14px;

          border:
            1px solid
            rgba(255,80,80,.25);

          border-radius: 11px;

          background:
            rgba(255,60,60,.08);

          color: #ff9999;

          font-size: 12px;
          line-height: 1.5;
        }

        /* ================================
           LOADING
        ================================= */

        .loading-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          margin-top: 17px;
          padding: 19px;

          border: 1px solid #252b36;
          border-radius: 16px;

          background: #0f1218;

          color: #aeb6c4;

          font-size: 12px;
        }

        .loader {
          width: 18px;
          height: 18px;

          border:
            2px solid
            #303641;

          border-top-color:
            #818cf8;

          border-radius: 50%;

          animation:
            spin .7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ================================
           RESULT
        ================================= */

        .result-card {
          margin-top: 18px;

          overflow: hidden;

          border: 1px solid #252b36;
          border-radius: 19px;

          background: #0f1218;

          box-shadow:
            0 20px 60px rgba(0,0,0,.24);
        }

        .thumbnail-container {
          position: relative;

          width: 100%;
          aspect-ratio: 16 / 9;

          overflow: hidden;

          background: #0a0c10;
        }

        .thumbnail {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }

        .thumbnail-overlay {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              to top,
              rgba(0,0,0,.58),
              transparent 55%
            );
        }

        .platform-badge {
          position: absolute;
          left: 13px;
          top: 13px;

          padding: 6px 9px;

          border-radius: 7px;

          background:
            rgba(0,0,0,.65);

          backdrop-filter:
            blur(8px);

          color: #fff;

          font-size: 10px;
          font-weight: 800;

          text-transform: uppercase;
        }

        .duration {
          position: absolute;
          right: 13px;
          bottom: 13px;

          padding: 5px 8px;

          border-radius: 6px;

          background:
            rgba(0,0,0,.72);

          color: #fff;

          font-size: 10px;
        }

        .result-content {
          padding: 19px;
        }

        .result-title {
          margin: 0;

          color: #f5f6f8;

          font-size: 18px;
          line-height: 1.45;

          word-break: break-word;
        }

        .author {
          display: flex;
          align-items: center;
          gap: 7px;

          margin-top: 9px;

          color: #9ba4b3;

          font-size: 12px;
        }

        .stats {
          margin-top: 8px;

          color: #8992a2;

          font-size: 11px;
        }

        .download-title {
          margin-top: 21px;
          margin-bottom: 10px;

          color: #dfe4ec;

          font-size: 12px;
          font-weight: 800;
        }

        .download-list {
          display: grid;
          gap: 8px;
        }

        .download-button {
          min-height: 47px;

          padding: 11px 13px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          border: 1px solid #292f3a;
          border-radius: 11px;

          background: #12151c;

          color: #fff;

          text-decoration: none;

          font-size: 12px;
          font-weight: 750;

          transition: .2s ease;
        }

        .download-button:hover {
          background: #181c24;
          border-color: #454c59;
          transform: translateY(-1px);
        }

        .download-icon {
          font-size: 18px;
          line-height: 1;
        }

        .download-facebook {
          border-left: 3px solid #1877f2;
        }

        .download-tiktok {
          border-left: 3px solid #fff;
        }

        .download-capcut {
          border-left: 3px solid #fff;
        }

        .download-instagram {
          border-left: 3px solid #e1306c;
        }

        .download-spotify {
          border-left: 3px solid #1db954;
        }

        .download-youtube {
          border-left: 3px solid #ff0000;
        }

        .download-audio {
          border-left: 3px solid #22c55e;
        }

        .empty-download {
          padding: 14px;

          border-radius: 10px;

          background: #10131a;

          color: #747e8d;

          text-align: center;

          font-size: 12px;
        }

        /* ================================
           ACTION
        ================================= */

        .result-actions {
          margin-top: 13px;
        }

        .clear-button {
          width: 100%;
          height: 44px;

          border: 1px solid #2a303b;
          border-radius: 10px;

          background: transparent;

          color: #aeb6c4;

          cursor: pointer;

          font-size: 12px;
          font-weight: 750;

          transition: .2s ease;
        }

        .clear-button:hover {
          background: #161920;
          color: #fff;
        }

        /* ================================
           FOOTER
        ================================= */

        .downloader-footer {
          margin-top: 27px;

          text-align: center;

          color: #555e6c;

          font-size: 10px;
        }

        /* ================================
           MOBILE
        ================================= */

        @media (max-width: 600px) {

          .downloader-page {
            padding: 20px 11px;
          }

          .downloader-header h1 {
            font-size: 28px;
          }

          .downloader-header p {
            font-size: 12px;
          }

          .downloader-card {
            padding: 15px;
          }

          .url-input {
            height: 52px;
          }

          .result-content {
            padding: 15px;
          }

        }

        @media (max-width: 400px) {

          .platform {
            padding: 6px 8px;
            font-size: 10px;
          }

          .detected-text {
            display: none;
          }

          .url-input.detected {
            padding-right: 15px;
          }

          .result-title {
            font-size: 16px;
          }

        }

        @media (prefers-reduced-motion: reduce) {

          *,
          *::before,
          *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }

        }

      `}</style>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="downloader-header">

        <h1>
          Media Downloader
        </h1>

        <p>
          Download video, foto & audio dari berbagai platform
        </p>

      </header>

      <main className="downloader-container">

        {/* =================================================
            PLATFORM
        ================================================= */}

        <div className="platform-list">

          <span className="platform">
            Instagram
          </span>

          <span className="platform">
            Facebook
          </span>

          <span className="platform">
            TikTok
          </span>

          <span className="platform">
            CapCut
          </span>

          <span className="platform">
            Spotify
          </span>

          <span className="platform">
            YouTube
          </span>

        </div>

        {/* =================================================
            INPUT CARD
        ================================================= */}

        <section className="downloader-card">

          <form onSubmit={handleSubmit}>

            <label className="input-label">
              Tautan Video / Musik
            </label>

            <div className="url-input-wrapper">

              {detectedPlatform && (
                <div className="detected-logo">

                  <PlatformLogo
                    platform={detectedPlatform}
                  />

                </div>
              )}

              <input
                className={`url-input ${
                  detectedPlatform
                    ? "detected"
                    : ""
                }`}
                type="text"
                value={videoUrl}
                onChange={handleUrlChange}
                placeholder="Tempel link FB / TikTok / IG / CapCut / Spotify / YouTube..."
                disabled={loading}
                autoComplete="off"
                spellCheck="false"
              />

              {detectedPlatform && (
                <div className="detected-text">
                  {getPlatformName(
                    detectedPlatform
                  )}
                </div>
              )}

            </div>

            <button
              type="submit"
              className="search-button"
              disabled={loading}
            >

              {loading
                ? "⏳ Memproses..."
                : "🔍 Cari & Download"}

            </button>

          </form>

          {error && (
            <div className="error-box">
              ❌ {error}
            </div>
          )}

        </section>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="loading-box">

            <div className="loader" />

            <span>
              Sedang mengambil data...
            </span>

          </div>
        )}

        {/* =================================================
            RESULT
        ================================================= */}

        {result && !loading && (
          <Result
            result={result}
            onClear={clearResult}
          />
        )}

        <footer className="downloader-footer">
          © 2026 DIN STORE • Media Downloader
        </footer>

      </main>

    </div>
  );
}


// ========================================================
// RESULT
// ========================================================

function Result({ result, onClear }) {

  const {
    platform,
    data
  } = result;

  let root = data;

  // ======================================================
  // NORMALIZE API RESPONSE
  // ======================================================

  if (data?.data) {
    root = data.data;
  }

  if (data?.result && typeof data.result === "object") {
    root = data.result;
  }

  if (root?.data) {
    root = root.data;
  }

  let thumbnail = "";
  let title = "";
  let author = "";
  let duration = "";
  let stats = "";

  const downloads = [];

  // ======================================================
  // FACEBOOK
  // ======================================================

  if (platform === "facebook") {

    thumbnail =
      root?.thumbnail ||
      root?.thumb ||
      root?.cover ||
      "";

    title =
      root?.title ||
      "Facebook Video";

    duration =
      root?.duration ||
      "";

    if (Array.isArray(root?.downloads)) {

      root.downloads
        .filter(item => item?.url)
        .forEach(item => {

          downloads.push({
            url: item.url,
            text:
              `Download Video - ${
                item.quality ||
                "Video"
              }`,
            type: "facebook"
          });

        });
    }
  }

  // ======================================================
  // TIKTOK
  // ======================================================

  if (platform === "tiktok") {

    thumbnail =
      root?.cover_link ||
      root?.origin_cover ||
      root?.cover ||
      "";

    title =
      root?.text ||
      root?.title ||
      "TikTok Video";

    author =
      root?.author_nickname ||
      root?.author?.nickname ||
      "";

    const stat = [];

    if (root?.play_count) {
      stat.push(
        `👁️ ${root.play_count}`
      );
    }

    if (root?.like_count) {
      stat.push(
        `❤️ ${root.like_count}`
      );
    }

    stats = stat.join("   ");

    if (root?.no_watermark_link_hd) {

      downloads.push({
        url:
          root.no_watermark_link_hd,
        text:
          "Download Video HD • No Watermark",
        type: "tiktok"
      });

    } else if (root?.no_watermark_link) {

      downloads.push({
        url:
          root.no_watermark_link,
        text:
          "Download Video • No Watermark",
        type: "tiktok"
      });

    }

    if (root?.music_link) {

      downloads.push({
        url: root.music_link,
        text:
          "Download Audio MP3",
        type: "audio"
      });

    }
  }

  // ======================================================
  // CAPCUT
  // ======================================================

  if (platform === "capcut") {

    thumbnail =
      root?.coverUrl ||
      root?.cover_url ||
      root?.cover ||
      root?.thumbnail ||
      "";

    title =
      root?.title ||
      root?.name ||
      "CapCut Template";

    author =
      root?.authorName ||
      root?.author ||
      root?.username ||
      "";

    if (root?.originalVideoUrl) {

      downloads.push({
        url:
          root.originalVideoUrl,
        text:
          "Download Video",
        type: "capcut"
      });

    }

    if (root?.downloadUrl) {

      downloads.push({
        url:
          root.downloadUrl,
        text:
          "Download Template",
        type: "capcut"
      });

    }

    if (root?.videoUrl) {

      downloads.push({
        url:
          root.videoUrl,
        text:
          "Download Video",
        type: "capcut"
      });

    }

    if (Array.isArray(root?.downloads)) {

      root.downloads
        .filter(item => item?.url)
        .forEach(item => {

          downloads.push({
            url: item.url,
            text:
              item.quality ||
              item.type ||
              "Download CapCut",
            type: "capcut"
          });

        });
    }
  }

  // ======================================================
  // INSTAGRAM
  // ======================================================

  if (platform === "instagram") {

    thumbnail =
      root?.thumbnail ||
      root?.thumb ||
      root?.cover ||
      root?.image ||
      root?.display_url ||
      "";

    title =
      root?.title ||
      root?.caption ||
      root?.text ||
      "Instagram Media";

    author =
      root?.username ||
      root?.author ||
      root?.owner?.username ||
      "";

    const instagramLinks = [
      root?.download_url,
      root?.download,
      root?.video_url,
      root?.video,
      root?.media_url,
      root?.url
    ];

    instagramLinks
      .filter(Boolean)
      .forEach((url, index) => {

        downloads.push({
          url,
          text:
            index === 0
              ? "Download Instagram"
              : `Download Media ${index + 1}`,
          type: "instagram"
        });

      });

    if (Array.isArray(root?.downloads)) {

      root.downloads
        .filter(item => item?.url)
        .forEach(item => {

          downloads.push({
            url: item.url,
            text:
              item.quality ||
              item.type ||
              "Download Instagram",
            type: "instagram"
          });

        });
    }
  }

  // ======================================================
  // SPOTIFY
  // ======================================================

  if (platform === "spotify") {

    thumbnail =
      root?.thumbnail ||
      root?.cover ||
      root?.cover_url ||
      root?.image ||
      root?.album?.image ||
      "";

    title =
      root?.title ||
      root?.name ||
      root?.track_name ||
      "Spotify Track";

    author =
      root?.artist ||
      root?.artist_name ||
      root?.artists?.[0]?.name ||
      "";

    const spotifyUrl =
      root?.download_url ||
      root?.download ||
      root?.audio_url ||
      root?.audio ||
      root?.url;

    if (spotifyUrl) {

      downloads.push({
        url: spotifyUrl,
        text:
          "Download Audio MP3",
        type: "spotify"
      });

    }
  }

  // ======================================================
  // YOUTUBE
  // ======================================================

  if (platform === "youtube") {

    thumbnail =
      root?.thumbnail ||
      root?.thumbnail_url ||
      root?.thumb ||
      "";

    title =
      root?.title ||
      root?.name ||
      "YouTube Video";

    author =
      root?.author ||
      root?.channel ||
      root?.uploader ||
      "";

    duration =
      root?.duration ||
      "";

    const videoUrl =
      root?.video_url ||
      root?.videoUrl ||
      root?.download_url ||
      root?.download ||
      root?.mp4 ||
      root?.url;

    if (videoUrl) {

      downloads.push({
        url: videoUrl,
        text:
          "Download Video MP4",
        type: "youtube"
      });

    }

    const audioUrl =
      root?.audio_url ||
      root?.audioUrl ||
      root?.mp3;

    if (audioUrl) {

      downloads.push({
        url: audioUrl,
        text:
          "Download Audio MP3",
        type: "audio"
      });

    }

    if (Array.isArray(root?.downloads)) {

      root.downloads
        .filter(item => item?.url)
        .forEach(item => {

          downloads.push({
            url: item.url,
            text:
              item.quality ||
              item.type ||
              "Download YouTube",
            type:
              item.type === "audio"
                ? "audio"
                : "youtube"
          });

        });
    }
  }

  // ======================================================
  // REMOVE DUPLICATE
  // ======================================================

  const uniqueDownloads =
    downloads.filter(
      (item, index, array) =>
        item.url &&
        array.findIndex(
          x => x.url === item.url
        ) === index
    );

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <section className="result-card">

      {/* THUMBNAIL */}

      <div className="thumbnail-container">

        {thumbnail ? (

          <img
            className="thumbnail"
            src={thumbnail}
            alt="Thumbnail"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display =
                "none";
            }}
          />

        ) : (

          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#5f6877",
              fontSize: "12px"
            }}
          >
            Preview tidak tersedia
          </div>

        )}

        <div className="thumbnail-overlay" />

        <span className="platform-badge">
          {platform}
        </span>

        {duration && (
          <span className="duration">
            {duration}
          </span>
        )}

      </div>

      {/* CONTENT */}

      <div className="result-content">

        <h2 className="result-title">
          {title}
        </h2>

        {author && (
          <div className="author">
            <span>👤</span>
            <span>{author}</span>
          </div>
        )}

        {stats && (
          <div className="stats">
            {stats}
          </div>
        )}

        <div className="download-title">
          Opsi Unduhan
        </div>

        <div className="download-list">

          {uniqueDownloads.length > 0 ? (

            uniqueDownloads.map(
              (item, index) => {

                let className =
                  "download-audio";

                if (
                  item.type ===
                  "facebook"
                ) {
                  className =
                    "download-facebook";
                }

                else if (
                  item.type ===
                  "tiktok"
                ) {
                  className =
                    "download-tiktok";
                }

                else if (
                  item.type ===
                  "capcut"
                ) {
                  className =
                    "download-capcut";
                }

                else if (
                  item.type ===
                  "instagram"
                ) {
                  className =
                    "download-instagram";
                }

                else if (
                  item.type ===
                  "spotify"
                ) {
                  className =
                    "download-spotify";
                }

                else if (
                  item.type ===
                  "youtube"
                ) {
                  className =
                    "download-youtube";
                }

                return (
                  <a
                    key={
                      `${item.url}-${index}`
                    }
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`download-button ${className}`}
                  >

                    <span>
                      {item.text}
                    </span>

                    <span className="download-icon">
                      ↓
                    </span>

                  </a>
                );
              }
            )

          ) : (

            <div className="empty-download">
              Link download tidak tersedia dari API.
            </div>

          )}

        </div>

        <div className="result-actions">

          <button
            className="clear-button"
            onClick={onClear}
          >
            ← Cari Link Lain
          </button>

        </div>

      </div>

    </section>
  );
}
