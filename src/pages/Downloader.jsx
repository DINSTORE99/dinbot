import { useState } from "react";

export default function Downloader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // ==========================================
  // DETECT PLATFORM
  // ==========================================

  const detectPlatform = (url) => {
    const value = url.trim().toLowerCase();

    // Instagram
    if (
      value.includes("instagram.com") ||
      value.includes("instagr.am")
    ) {
      return "instagram";
    }

    // TikTok
    if (
      value.includes("tiktok.com") ||
      value.includes("vt.tiktok.com")
    ) {
      return "tiktok";
    }

    // Facebook
    if (
      value.includes("facebook.com") ||
      value.includes("fb.watch")
    ) {
      return "facebook";
    }

    // CapCut
    if (value.includes("capcut.com")) {
      return "capcut";
    }

    // Spotify
    if (
      value.includes("spotify.com") ||
      value.includes("open.spotify.com")
    ) {
      return "spotify";
    }

    // YouTube
    if (
      value.includes("youtube.com") ||
      value.includes("youtu.be")
    ) {
      return "youtube";
    }

    return null;
  };

  const detectedPlatform = detectPlatform(videoUrl);

  // ==========================================
  // PLATFORM NAME
  // ==========================================

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

  // ==========================================
  // PLATFORM LOGO
  // ==========================================

  const PlatformLogo = ({ platform }) => {
    if (platform === "instagram") {
      return (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
          <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.2-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
        </svg>
      );
    }

    if (platform === "facebook") {
      return (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.099 4.388 23.093 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.032 1.792-4.706 4.533-4.706 1.312 0 2.686.236 2.686.236v2.973h-1.514c-1.491 0-1.956.929-1.956 1.882v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.099 24 12.073z" />
        </svg>
      );
    }

    if (platform === "tiktok") {
      return (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-3.888V2h-3.234v13.614a2.72 2.72 0 1 1-2.72-2.72c.28 0 .55.043.805.123v-3.3a6.03 6.03 0 1 0 5.15 5.963V8.788a8.024 8.024 0 0 0 4.69 1.51V7.065a4.8 4.8 0 0 1-.921-.379z" />
        </svg>
      );
    }

    if (platform === "capcut") {
      return (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
          <path d="M17.7 4.3c-1.3-1.3-3.4-1.3-4.7 0l-1.8 1.8-1.8-1.8c-1.3-1.3-3.4-1.3-4.7 0s-1.3 3.4 0 4.7l1.8 1.8-1.8 1.8c-1.3 1.3-1.3 3.4 0 4.7s3.4 1.3 4.7 0l1.8-1.8 1.8 1.8c1.3 1.3 3.4 1.3 4.7 0s1.3-3.4 0-4.7l-1.8-1.8 1.8-1.8c1.3-1.3 1.3-3.4 0-4.7z" />
        </svg>
      );
    }

    if (platform === "spotify") {
      return (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
          <path d="M12 1.8A10.2 10.2 0 1 0 12 22.2 10.2 10.2 0 0 0 12 1.8zm4.68 14.72a.84.84 0 0 1-1.16.28c-3.18-1.95-7.19-2.39-11.92-1.31a.84.84 0 1 1-.37-1.64c5.17-1.18 9.6-.68 13.18 1.51.39.24.51.75.27 1.16zm1.55-3.44a1.05 1.05 0 0 1-1.45.34c-3.64-2.24-9.18-2.89-13.47-1.58a1.05 1.05 0 1 1-.61-2.01c4.91-1.49 11.02-.77 15.19 1.79.49.3.64.95.34 1.46zm.13-3.58C14 6.88 7.17 6.66 3.13 7.89a1.26 1.26 0 1 1-.73-2.41c4.64-1.41 12.38-1.13 16.98 1.6a1.26 1.26 0 0 1-1.02 2.42z" />
        </svg>
      );
    }

    if (platform === "youtube") {
      return (
        <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
          <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.58A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.12 2.12c1.88.58 9.38.58 9.38.58s7.5 0 9.38-.58a3 3 0 0 0 2.12-2.12A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8zM9.6 15.5v-7l6.2 3.5-6.2 3.5z" />
        </svg>
      );
    }

    return null;
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleUrlChange = (e) => {
    const value = e.target.value;

    setVideoUrl(value);
    setError("");

    if (result) {
      setResult(null);
    }
  };

  // ==========================================
  // API HELPER
  // ==========================================

  const fetchJSON = async (url, options = {}) => {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Server mengembalikan status ${response.status}`);
    }

    const data = await response.json();

    return data;
  };

  // ==========================================
  // GET VALUE HELPER
  // ==========================================

  const findValue = (obj, keys = []) => {
    if (!obj || typeof obj !== "object") return "";

    for (const key of keys) {
      if (
        obj[key] !== undefined &&
        obj[key] !== null &&
        obj[key] !== ""
      ) {
        return obj[key];
      }
    }

    return "";
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = videoUrl.trim();

    if (!url) {
      setError("Masukkan tautan terlebih dahulu.");
      return;
    }

    const platform = detectPlatform(url);

    if (!platform) {
      setError(
        "Tautan tidak didukung. Gunakan Instagram, Facebook, TikTok, CapCut, Spotify, atau YouTube."
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      let data;

      // ========================================
      // FACEBOOK
      // ========================================

      if (platform === "facebook") {
        const apiUrl =
          `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`;

        data = await fetchJSON(apiUrl);

        if (!data.status || !data.data) {
          throw new Error("Video Facebook tidak ditemukan.");
        }

        setResult({
          platform,
          data: data.data,
        });
      }

      // ========================================
      // TIKTOK
      // ========================================

      else if (platform === "tiktok") {
        const apiUrl =
          `https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(url)}`;

        data = await fetchJSON(apiUrl);

        if (!data.status || !data.data) {
          throw new Error("Video TikTok tidak ditemukan.");
        }

        setResult({
          platform,
          data: data.data,
        });
      }

      // ========================================
      // CAPCUT
      // ========================================

      else if (platform === "capcut") {
        const apiUrl =
          `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(url)}`;

        data = await fetchJSON(apiUrl);

        if (!data.status || !data.data) {
          throw new Error("Template CapCut tidak ditemukan.");
        }

        setResult({
          platform,
          data: data.data,
        });
      }

      // ========================================
      // INSTAGRAM
      // ========================================

      else if (platform === "instagram") {
        const apiUrl =
          `https://api.siputzx.my.id/api/d/sssinstagram?url=${encodeURIComponent(url)}`;

        data = await fetchJSON(apiUrl);

        if (!data) {
          throw new Error("Data Instagram tidak ditemukan.");
        }

        setResult({
          platform,
          data,
        });
      }

      // ========================================
      // SPOTIFY
      // ========================================

      else if (platform === "spotify") {
        const apiUrl =
          `https://api.azbry.com/api/download/spotify?url=${encodeURIComponent(url)}`;

        data = await fetchJSON(apiUrl);

        if (!data) {
          throw new Error("Data Spotify tidak ditemukan.");
        }

        setResult({
          platform,
          data,
        });
      }

      // ========================================
      // YOUTUBE
      // ========================================

      else if (platform === "youtube") {
        const apiUrl =
          `https://api.azbry.com/api/download/allinonev2?url=${encodeURIComponent(url)}`;

        data = await fetchJSON(apiUrl);

        if (!data) {
          throw new Error("Data YouTube tidak ditemukan.");
        }

        setResult({
          platform,
          data,
        });
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Gagal mengambil data. Pastikan link benar dan publik."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CLEAR
  // ==========================================

  const clearResult = () => {
    setResult(null);
    setError("");
    setVideoUrl("");
  };

  return (
    <div className="downloader-page">

      <style>{`

        * {
          box-sizing: border-box;
        }

        .downloader-page {
          min-height: 100vh;
          padding: 30px 15px;
          color: #f5f5f5;
          background:
            radial-gradient(circle at top left, rgba(110, 80, 255, .14), transparent 30%),
            radial-gradient(circle at bottom right, rgba(0, 220, 180, .10), transparent 30%),
            #08090c;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .downloader-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .downloader-header h1 {
          margin: 0;
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -.8px;
        }

        .downloader-header p {
          margin: 9px 0 0;
          color: #8d95a5;
          font-size: 14px;
        }

        .downloader-container {
          width: 100%;
          max-width: 760px;
          margin: auto;
        }

        .platform-list {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }

        .platform {
          padding: 7px 12px;
          border: 1px solid #262b35;
          border-radius: 999px;
          background: #11141a;
          color: #b9c0cc;
          font-size: 12px;
          font-weight: 600;
        }

        .downloader-card,
        .result-card,
        .loading-box {
          border: 1px solid #242934;
          background: rgba(15, 17, 22, .94);
          border-radius: 20px;
          box-shadow: 0 18px 50px rgba(0,0,0,.28);
        }

        .downloader-card {
          padding: 22px;
        }

        .input-label {
          display: block;
          margin-bottom: 9px;
          color: #dce1ea;
          font-size: 13px;
          font-weight: 700;
        }

        .url-input-wrapper {
          position: relative;
          width: 100%;
        }

        .url-input {
          width: 100%;
          height: 56px;
          padding: 0 18px;
          border: 1px solid #2a303b;
          border-radius: 14px;
          outline: none;
          background: #0b0d11;
          color: #fff;
          font-size: 14px;
          transition: .2s;
        }

        .url-input::placeholder {
          color: #626a78;
        }

        .url-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }

        .url-input.detected {
          padding-left: 54px;
          padding-right: 100px;
        }

        .detected-logo {
          position: absolute;
          z-index: 2;
          left: 17px;
          top: 50%;
          transform: translateY(-50%);
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          animation: logoAppear .25s ease;
          pointer-events: none;
        }

        .detected-text {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          padding: 6px 9px;
          border-radius: 8px;
          background: #171a21;
          color: #bfc6d3;
          font-size: 11px;
          font-weight: 700;
          animation: detectedAppear .25s ease;
          pointer-events: none;
        }

        @keyframes logoAppear {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(.7);
          }

          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }

        @keyframes detectedAppear {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(5px);
          }

          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        .search-button {
          width: 100%;
          height: 52px;
          margin-top: 14px;
          border: 0;
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            #6366f1,
            #7c3aed
          );
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .search-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .search-button:disabled {
          opacity: .55;
          cursor: not-allowed;
          transform: none;
        }

        .error-box {
          margin-top: 14px;
          padding: 13px 15px;
          border: 1px solid rgba(255, 80, 80, .25);
          border-radius: 12px;
          background: rgba(255, 60, 60, .08);
          color: #ff8d8d;
          font-size: 13px;
          line-height: 1.5;
        }

        .loading-box {
          margin-top: 18px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          color: #aeb6c5;
          font-size: 13px;
        }

        .loader {
          width: 19px;
          height: 19px;
          border: 2px solid #303642;
          border-top-color: #7c83ff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .result-card {
          overflow: hidden;
          margin-top: 20px;
        }

        .thumbnail-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #0b0d11;
          overflow: hidden;
        }

        .thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .thumbnail-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,.55),
            transparent 50%
          );
        }

        .platform-badge {
          position: absolute;
          left: 14px;
          top: 14px;
          padding: 7px 10px;
          border-radius: 8px;
          background: rgba(0,0,0,.65);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .duration {
          position: absolute;
          right: 14px;
          bottom: 14px;
          padding: 5px 8px;
          border-radius: 6px;
          background: rgba(0,0,0,.72);
          color: #fff;
          font-size: 11px;
        }

        .result-content {
          padding: 20px;
        }

        .result-title {
          margin: 0;
          font-size: 19px;
          line-height: 1.4;
          word-break: break-word;
        }

        .author {
          display: flex;
          gap: 7px;
          align-items: center;
          margin-top: 10px;
          color: #9ea7b6;
          font-size: 13px;
        }

        .stats {
          margin-top: 9px;
          color: #8e97a8;
          font-size: 12px;
        }

        .download-title {
          margin-top: 22px;
          margin-bottom: 10px;
          color: #dce1e9;
          font-size: 13px;
          font-weight: 800;
        }

        .download-list {
          display: grid;
          gap: 9px;
        }

        .download-button {
          min-height: 48px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid #2a303b;
          border-radius: 12px;
          background: #11141a;
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          transition: .2s;
        }

        .download-button:hover {
          transform: translateY(-1px);
          border-color: #464d5c;
          background: #171a21;
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
          padding: 15px;
          border-radius: 11px;
          background: #101218;
          color: #747d8c;
          font-size: 13px;
          text-align: center;
        }

        .result-actions {
          margin-top: 15px;
        }

        .clear-button {
          width: 100%;
          height: 45px;
          border: 1px solid #2a303b;
          border-radius: 11px;
          background: transparent;
          color: #aeb6c4;
          cursor: pointer;
          font-weight: 700;
        }

        .clear-button:hover {
          background: #15181f;
          color: #fff;
        }

        .downloader-footer {
          margin-top: 28px;
          text-align: center;
          color: #596170;
          font-size: 11px;
        }

        @media (max-width: 600px) {

          .downloader-page {
            padding: 20px 12px;
          }

          .downloader-header h1 {
            font-size: 28px;
          }

          .downloader-card {
            padding: 16px;
          }

          .result-content {
            padding: 16px;
          }

          .url-input {
            height: 52px;
          }

          .url-input.detected {
            padding-left: 50px;
            padding-right: 90px;
          }

          .detected-text {
            font-size: 10px;
            padding: 5px 7px;
          }
        }

        @media (max-width: 380px) {

          .detected-text {
            display: none;
          }

          .url-input.detected {
            padding-right: 15px;
          }

          .platform {
            font-size: 10px;
            padding: 6px 9px;
          }

          .result-title {
            font-size: 17px;
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

      {/* ==========================================
          HEADER
      ========================================== */}

      <header className="downloader-header">
        <h1>Media Downloader</h1>

        <p>
          Download Video, Foto & Audio dari berbagai platform
        </p>
      </header>

      <main className="downloader-container">

        {/* PLATFORM */}

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

        {/* INPUT */}

        <section className="downloader-card">

          <form onSubmit={handleSubmit}>

            <label className="input-label">
              Tautan Video / Musik
            </label>

            <div className="url-input-wrapper">

              {detectedPlatform && (
                <div
                  className={`detected-logo ${detectedPlatform}`}
                >
                  <PlatformLogo
                    platform={detectedPlatform}
                  />
                </div>
              )}

              <input
                className={`url-input ${
                  detectedPlatform ? "detected" : ""
                }`}
                type="url"
                value={videoUrl}
                onChange={handleUrlChange}
                placeholder="Tempel link di sini..."
                disabled={loading}
              />

              {detectedPlatform && (
                <div className="detected-text">
                  {getPlatformName(detectedPlatform)}
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

        {/* LOADING */}

        {loading && (
          <div className="loading-box">
            <div className="loader" />

            <span>
              Sedang mengambil data...
            </span>
          </div>
        )}

        {/* RESULT */}

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


// ======================================================
// RESULT COMPONENT
// ======================================================

function Result({ result, onClear }) {

  const {
    platform,
    data
  } = result;

  let thumbnail = "";
  let title = "";
  let author = "";
  let duration = "";
  let stats = "";
  let downloads = [];

  // ====================================================
  // FACEBOOK
  // ====================================================

  if (platform === "facebook") {

    thumbnail =
      data.thumbnail ||
      data.thumb ||
      "";

    title =
      data.title ||
      "Facebook Video";

    duration =
      data.duration ||
      "";

    if (Array.isArray(data.downloads)) {

      downloads = data.downloads
        .filter(item => item?.url)
        .map(item => ({
          url: item.url,
          text:
            `Download Video - ${
              item.quality || "Video"
            }`,
          type: "facebook"
        }));
    }
  }

  // ====================================================
  // TIKTOK
  // ====================================================

  if (platform === "tiktok") {

    thumbnail =
      data.cover_link ||
      data.origin_cover ||
      data.cover ||
      "";

    title =
      data.text ||
      data.title ||
      "TikTok Video";

    author =
      data.author_nickname ||
      data.author?.nickname ||
      "";

    const statParts = [];

    if (data.play_count) {
      statParts.push(
        `👁️ ${data.play_count}`
      );
    }

    if (data.like_count) {
      statParts.push(
        `❤️ ${data.like_count}`
      );
    }

    stats = statParts.join("   ");

    if (data.no_watermark_link_hd) {

      downloads.push({
        url: data.no_watermark_link_hd,
        text: "Download Video HD • No Watermark",
        type: "tiktok"
      });

    } else if (data.no_watermark_link) {

      downloads.push({
        url: data.no_watermark_link,
        text: "Download Video • No Watermark",
        type: "tiktok"
      });
    }

    if (data.music_link) {

      downloads.push({
        url: data.music_link,
        text: "Download Audio MP3",
        type: "audio"
      });
    }
  }

  // ====================================================
  // CAPCUT
  // ====================================================

  if (platform === "capcut") {

    thumbnail =
      data.coverUrl ||
      data.cover ||
      data.thumbnail ||
      "";

    title =
      data.title ||
      "CapCut Template";

    author =
      data.authorName ||
      data.author ||
      "";

    if (data.originalVideoUrl) {

      downloads.push({
        url: data.originalVideoUrl,
        text: "Download Video",
        type: "capcut"
      });
    }

    if (data.downloadUrl) {

      downloads.push({
        url: data.downloadUrl,
        text: "Download Template",
        type: "capcut"
      });
    }
  }

  // ====================================================
  // INSTAGRAM
  // ====================================================

  if (platform === "instagram") {

    const root =
      data?.data ||
      data?.result ||
      data;

    thumbnail =
      root?.thumbnail ||
      root?.thumb ||
      root?.cover ||
      root?.image ||
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

    const possibleLinks = [
      root?.download,
      root?.download_url,
      root?.video,
      root?.video_url,
      root?.url,
      root?.media_url
    ];

    possibleLinks
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

    if (Array.isArray(root?.result)) {

      root.result
        .filter(item => typeof item === "string")
        .forEach(url => {

          downloads.push({
            url,
            text: "Download Instagram",
            type: "instagram"
          });

        });
    }
  }

  // ====================================================
  // SPOTIFY
  // ====================================================

  if (platform === "spotify") {

    const root =
      data?.data ||
      data?.result ||
      data;

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

    const audioUrl =
      root?.download_url ||
      root?.download ||
      root?.url ||
      root?.audio ||
      root?.audio_url;

    if (audioUrl) {

      downloads.push({
        url: audioUrl,
        text: "Download Audio MP3",
        type: "spotify"
      });
    }
  }

  // ====================================================
  // YOUTUBE
  // ====================================================

  if (platform === "youtube") {

    const root =
      data?.data ||
      data?.result ||
      data;

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

    const mp4 =
      root?.video_url ||
      root?.videoUrl ||
      root?.download_url ||
      root?.download ||
      root?.mp4 ||
      root?.url;

    if (mp4) {

      downloads.push({
        url: mp4,
        text: "Download Video MP4",
        type: "youtube"
      });
    }

    const mp3 =
      root?.audio_url ||
      root?.audioUrl ||
      root?.mp3;

    if (mp3) {

      downloads.push({
        url: mp3,
        text: "Download Audio MP3",
        type: "audio"
      });
    }

    // Jika API memberikan array download
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

  // ====================================================
  // REMOVE DUPLICATE URL
  // ====================================================

  downloads = downloads.filter(
    (item, index, array) =>
      item.url &&
      array.findIndex(
        x => x.url === item.url
      ) === index
  );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="result-card">

      {/* THUMBNAIL */}

      <div className="thumbnail-container">

        {thumbnail ? (
          <img
            className="thumbnail"
            src={thumbnail}
            alt="Thumbnail"
            onError={(e) => {
              e.currentTarget.style.display = "none";
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
              color: "#596170",
              fontSize: "13px"
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

          {downloads.length > 0 ? (

            downloads.map((item, index) => {

              const className =
                item.type === "facebook"
                  ? "download-facebook"
                  : item.type === "tiktok"
                  ? "download-tiktok"
                  : item.type === "capcut"
                  ? "download-capcut"
                  : item.type === "instagram"
                  ? "download-instagram"
                  : item.type === "spotify"
                  ? "download-spotify"
                  : item.type === "youtube"
                  ? "download-youtube"
                  : "download-audio";

              return (
                <a
                  key={`${item.url}-${index}`}
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
            })

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
