import { useState } from "react";

export default function Downloader() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const detectPlatform = (url) => {
    if (
      url.includes("facebook.com") ||
      url.includes("fb.watch")
    ) {
      return "facebook";
    }

    if (
      url.includes("tiktok.com") ||
      url.includes("vt.tiktok.com")
    ) {
      return "tiktok";
    }

    if (url.includes("capcut.com")) {
      return "capcut";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = videoUrl.trim();

    if (!url) {
      setError("Masukkan tautan video terlebih dahulu.");
      return;
    }

    const platform = detectPlatform(url);

    if (!platform) {
      setError(
        "Tautan tidak didukung. Gunakan Facebook, TikTok, atau CapCut."
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      let apiUrl = "";

      if (platform === "facebook") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`;
      }

      if (platform === "tiktok") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(url)}`;
      }

      if (platform === "capcut") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(url)}`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(
          `Server mengembalikan status ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.status || !data.data) {
        throw new Error(
          "Data video tidak ditemukan. Pastikan link publik dan benar."
        );
      }

      setResult({
        platform,
        data: data.data,
      });
    } catch (err) {
      console.error("Downloader API Error:", err);

      setError(
        err.message ||
          "Terjadi kesalahan saat menghubungi server."
      );
    } finally {
      setLoading(false);
    }
  };

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
          background:
            radial-gradient(
              circle at top,
              rgba(59, 130, 246, 0.12),
              transparent 35%
            ),
            #080b12;
          color: #fff;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          padding-bottom: 40px;
        }

        .downloader-header {
          position: sticky;
          top: 0;
          z-index: 20;
          padding: 18px 20px;
          text-align: center;
          border-bottom: 1px solid #1b2330;
          background: rgba(8, 11, 18, 0.86);
          backdrop-filter: blur(18px);
        }

        .downloader-header h1 {
          margin: 0;
          font-size: 25px;
          font-weight: 900;
          letter-spacing: -0.8px;
          background: linear-gradient(
            90deg,
            #60a5fa,
            #8b5cf6
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .downloader-header p {
          margin: 6px 0 0;
          color: #7f8a9c;
          font-size: 11px;
        }

        .downloader-container {
          width: min(100% - 30px, 680px);
          margin: auto;
          padding-top: 35px;
        }

        .platform-list {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 22px;
        }

        .platform {
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          border: 1px solid;
        }

        .facebook {
          color: #60a5fa;
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.25);
        }

        .tiktok {
          color: #f9a8d4;
          background: rgba(236, 72, 153, 0.1);
          border-color: rgba(236, 72, 153, 0.25);
        }

        .capcut {
          color: #d1d5db;
          background: rgba(156, 163, 175, 0.1);
          border-color: rgba(156, 163, 175, 0.25);
        }

        .downloader-card {
          background: #111722;
          border: 1px solid #202a39;
          border-radius: 18px;
          padding: 22px;
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.25);
        }

        .input-label {
          display: block;
          color: #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 9px;
        }

        .url-input {
          width: 100%;
          height: 48px;
          border: 1px solid #344052;
          border-radius: 11px;
          outline: none;
          background: #080c13;
          color: #fff;
          padding: 0 14px;
          font-size: 12px;
          transition: 0.2s;
        }

        .url-input::placeholder {
          color: #596579;
        }

        .url-input:focus {
          border-color: #4f8df7;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-button {
          width: 100%;
          height: 48px;
          margin-top: 14px;
          border: 0;
          border-radius: 11px;
          cursor: pointer;
          color: white;
          font-size: 12px;
          font-weight: 900;
          background:
            linear-gradient(
              135deg,
              #2563eb,
              #7c3aed
            );
          transition: 0.2s;
        }

        .search-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .search-button:disabled {
          opacity: 0.55;
          cursor: wait;
          transform: none;
        }

        .error-box {
          margin-top: 14px;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(248, 113, 113, 0.25);
          background: rgba(248, 113, 113, 0.07);
          color: #fca5a5;
          font-size: 11px;
          line-height: 1.5;
        }

        .loading-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: #8792a5;
        }

        .loader {
          width: 42px;
          height: 42px;
          border: 4px solid #263142;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spinner 0.8s linear infinite;
          margin-bottom: 14px;
        }

        @keyframes spinner {
          to {
            transform: rotate(360deg);
          }
        }

        .loading-box span {
          font-size: 11px;
          animation: pulse 1.3s infinite;
        }

        @keyframes pulse {
          50% {
            opacity: 0.45;
          }
        }

        .result-card {
          margin-top: 22px;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid #202a39;
          background: #111722;
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .thumbnail-container {
          position: relative;
          width: 100%;
          height: 310px;
          background: #070a0f;
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
          background:
            linear-gradient(
              to top,
              rgba(0, 0, 0, 0.8),
              transparent 60%
            );
        }

        .platform-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 6px 10px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: white;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
        }

        .duration {
          position: absolute;
          bottom: 14px;
          left: 14px;
          padding: 5px 8px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.7);
          color: #e5e7eb;
          font-family: monospace;
          font-size: 10px;
        }

        .result-content {
          padding: 22px;
        }

        .result-title {
          margin: 0 0 8px;
          color: #f1f5f9;
          font-size: 18px;
          line-height: 1.4;
          font-weight: 800;
        }

        .author {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 18px;
          color: #8994a6;
          font-size: 11px;
        }

        .stats {
          margin-bottom: 20px;
          color: #aeb8c8;
          font-size: 10px;
        }

        .download-title {
          color: #667286;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .download-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .download-button {
          width: 100%;
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 0 15px;
          border-radius: 10px;
          color: white;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          transition: 0.2s;
        }

        .download-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .download-facebook {
          background: #2563eb;
        }

        .download-tiktok {
          background: #db2777;
        }

        .download-capcut {
          background: #f1f5f9;
          color: #111827;
        }

        .download-audio {
          background: #293241;
          border: 1px solid #3a4658;
        }

        .download-icon {
          font-size: 15px;
        }

        .empty-download {
          padding: 15px;
          border-radius: 9px;
          background: #0a0e15;
          border: 1px solid #1e2735;
          color: #697589;
          font-size: 10px;
          text-align: center;
        }

        .result-actions {
          display: flex;
          gap: 9px;
          margin-top: 15px;
        }

        .clear-button {
          flex: 1;
          height: 40px;
          border: 1px solid #303b4c;
          background: #171e2a;
          color: #9ba6b7;
          border-radius: 9px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
        }

        .clear-button:hover {
          color: white;
          background: #1d2634;
        }

        .downloader-footer {
          text-align: center;
          margin-top: 35px;
          color: #4e5a6c;
          font-size: 9px;
        }

        @media (max-width: 600px) {
          .downloader-container {
            width: min(100% - 20px, 680px);
            padding-top: 25px;
          }

          .downloader-header {
            padding: 16px;
          }

          .downloader-header h1 {
            font-size: 22px;
          }

          .downloader-card {
            padding: 16px;
          }

          .thumbnail-container {
            height: 230px;
          }

          .result-content {
            padding: 17px;
          }

          .result-title {
            font-size: 16px;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="downloader-header">
        <h1>Media Downloader</h1>
        <p>
          Download Video dari Facebook, TikTok & CapCut
        </p>
      </header>

      <main className="downloader-container">

        {/* PLATFORM */}
        <div className="platform-list">
          <span className="platform facebook">
            Facebook
          </span>

          <span className="platform tiktok">
            TikTok
          </span>

          <span className="platform capcut">
            CapCut
          </span>
        </div>

        {/* INPUT */}
        <section className="downloader-card">
          <form onSubmit={handleSubmit}>

            <label className="input-label">
              Tautan Video
            </label>

            <input
              className="url-input"
              type="url"
              value={videoUrl}
              onChange={(e) =>
                setVideoUrl(e.target.value)
              }
              placeholder="Tempelkan link FB / TikTok / CapCut di sini..."
              disabled={loading}
            />

            <button
              type="submit"
              className="search-button"
              disabled={loading}
            >
              {loading
                ? "Memproses..."
                : "🔍  Cari Video"}
            </button>

          </form>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}
        </section>

        {/* LOADING */}
        {loading && (
          <div className="loading-box">
            <div className="loader" />

            <span>
              Sedang memproses tautan...
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

        {/* FOOTER */}
        <footer className="downloader-footer">
          © 2026 Media Downloader
        </footer>

      </main>
    </div>
  );
}


/* =====================================================
   RESULT COMPONENT
===================================================== */

function Result({ result, onClear }) {
  const { platform, data } = result;

  let thumbnail = "";
  let title = "";
  let author = "";
  let duration = "";
  let stats = "";
  let downloads = [];

  if (platform === "facebook") {
    thumbnail =
      data.thumbnail ||
      "https://via.placeholder.com/600x400?text=No+Thumbnail";

    title =
      data.title ||
      "Video Facebook";

    duration = data.duration || "";

    if (
      Array.isArray(data.downloads)
    ) {
      downloads = data.downloads.map(
        (item) => ({
          url: item.url,
          text:
            `Download Video - ${
              item.quality || "Video"
            }`,
          type: "facebook",
        })
      );
    }
  }

  if (platform === "tiktok") {
    thumbnail =
      data.cover_link ||
      data.origin_cover ||
      "https://via.placeholder.com/600x400?text=No+Cover";

    title =
      data.text ||
      "Video TikTok";

    author =
      data.author_nickname ||
      "";

    let statText = "";

    if (data.play_count) {
      statText +=
        `👁️ ${data.play_count}`;
    }

    if (data.like_count) {
      statText +=
        `   ❤️ ${data.like_count}`;
    }

    stats = statText;

    if (data.no_watermark_link_hd) {
      downloads.push({
        url: data.no_watermark_link_hd,
        text: "Download Video (HD - No Watermark)",
        type: "tiktok",
      });
    } else if (
      data.no_watermark_link
    ) {
      downloads.push({
        url: data.no_watermark_link,
        text: "Download Video (No Watermark)",
        type: "tiktok",
      });
    }

    if (data.music_link) {
      downloads.push({
        url: data.music_link,
        text: "Download Audio (MP3)",
        type: "audio",
      });
    }
  }

  if (platform === "capcut") {
    thumbnail =
      data.coverUrl ||
      "https://via.placeholder.com/600x400?text=No+Cover";

    title =
      data.title ||
      "Template CapCut";

    author =
      data.authorName ||
      "";

    if (data.originalVideoUrl) {
      downloads.push({
        url: data.originalVideoUrl,
        text: "Download Video Template",
        type: "capcut",
      });
    }
  }

  return (
    <section className="result-card">

      {/* THUMBNAIL */}
      <div className="thumbnail-container">

        <img
          className="thumbnail"
          src={thumbnail}
          alt="Thumbnail Video"
          onError={(e) => {
            e.currentTarget.style.display =
              "none";
          }}
        />

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
            downloads.map(
              (item, index) => (
                <a
                  key={`${item.url}-${index}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`download-button ${
                    item.type === "facebook"
                      ? "download-facebook"
                      : item.type === "tiktok"
                      ? "download-tiktok"
                      : item.type === "capcut"
                      ? "download-capcut"
                      : "download-audio"
                  }`}
                >
                  <span>
                    {item.text}
                  </span>

                  <span className="download-icon">
                    ↓
                  </span>
                </a>
              )
            )
          ) : (
            <div className="empty-download">
              Link download tidak tersedia.
            </div>
          )}

        </div>

        <div className="result-actions">

          <button
            className="clear-button"
            onClick={onClear}
          >
            ← Cari Video Lain
          </button>

        </div>

      </div>
    </section>
  );
}
