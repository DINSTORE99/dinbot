import { useState } from "react";
import "./MediaDownloader.css";

export default function MediaDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function detectPlatform(link) {
    if (
      link.includes("facebook.com") ||
      link.includes("fb.watch")
    ) {
      return "facebook";
    }

    if (
      link.includes("tiktok.com") ||
      link.includes("vt.tiktok.com")
    ) {
      return "tiktok";
    }

    if (link.includes("capcut.com")) {
      return "capcut";
    }

    return null;
  }

  async function handleDownload(e) {
    e.preventDefault();

    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setError("Masukkan link video terlebih dahulu.");
      return;
    }

    const platform = detectPlatform(cleanUrl);

    if (!platform) {
      setError(
        "Link tidak didukung. Gunakan Facebook, TikTok, atau CapCut."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      let apiUrl = "";

      if (platform === "facebook") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(cleanUrl)}`;
      }

      if (platform === "tiktok") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(cleanUrl)}`;
      }

      if (platform === "capcut") {
        apiUrl =
          `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(cleanUrl)}`;
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("API Error");
      }

      const data = await response.json();

      if (!data.status || !data.data) {
        throw new Error(
          "Data video tidak ditemukan."
        );
      }

      setResult({
        platform,
        data: data.data
      });

    } catch (err) {
      console.error(err);

      setError(
        "Gagal mengambil video. Pastikan link benar dan dapat diakses publik."
      );

    } finally {
      setLoading(false);
    }
  }

  function DownloadButton({ href, children, type = "" }) {
    if (!href) return null;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`download-button ${type}`}
      >
        <span>{children}</span>
        <span>⬇️</span>
      </a>
    );
  }

  function renderResult() {
    if (!result) return null;

    const { platform, data } = result;

    if (platform === "facebook") {
      return (
        <>
          <div className="result-badge facebook-badge">
            Facebook
          </div>

          <img
            className="result-thumbnail"
            src={
              data.thumbnail ||
              "https://via.placeholder.com/600x400"
            }
            alt="Facebook Video"
          />

          <div className="result-info">
            <h3>
              {data.title || "Video Facebook"}
            </h3>

            {data.duration && (
              <p>
                Durasi: {data.duration}
              </p>
            )}

            <div className="download-buttons">
              {data.downloads?.map(
                (item, index) => (
                  <DownloadButton
                    key={index}
                    href={item.url}
                    type="facebook-download"
                  >
                    Download Video{" "}
                    {item.quality || ""}
                  </DownloadButton>
                )
              )}
            </div>
          </div>
        </>
      );
    }

    if (platform === "tiktok") {
      return (
        <>
          <div className="result-badge tiktok-badge">
            TikTok
          </div>

          <img
            className="result-thumbnail"
            src={
              data.cover_link ||
              data.origin_cover ||
              "https://via.placeholder.com/600x400"
            }
            alt="TikTok Video"
          />

          <div className="result-info">
            <h3>
              {data.text || "Video TikTok"}
            </h3>

            {data.author_nickname && (
              <p>
                @{data.author_nickname}
              </p>
            )}

            <div className="download-buttons">

              <DownloadButton
                href={
                  data.no_watermark_link_hd ||
                  data.no_watermark_link
                }
                type="tiktok-download"
              >
                Download Video
                {!data.no_watermark_link_hd &&
                  " No Watermark"}
              </DownloadButton>

              <DownloadButton
                href={data.music_link}
                type="audio-download"
              >
                🎵 Download Audio MP3
              </DownloadButton>

            </div>
          </div>
        </>
      );
    }

    if (platform === "capcut") {
      return (
        <>
          <div className="result-badge capcut-badge">
            CapCut
          </div>

          <img
            className="result-thumbnail"
            src={
              data.coverUrl ||
              "https://via.placeholder.com/600x400"
            }
            alt="CapCut Template"
          />

          <div className="result-info">
            <h3>
              {data.title ||
                "Template CapCut"}
            </h3>

            {data.authorName && (
              <p>
                @{data.authorName}
              </p>
            )}

            <div className="download-buttons">

              <DownloadButton
                href={data.originalVideoUrl}
                type="capcut-download"
              >
                Download Video Template
              </DownloadButton>

            </div>
          </div>
        </>
      );
    }

    return null;
  }

  return (
    <section className="media-downloader">

      <div className="downloader-heading">
        <div className="downloader-logo">
          📥
        </div>

        <h2>
          Media Downloader
        </h2>

        <p>
          Download video Facebook,
          TikTok, dan CapCut
        </p>
      </div>

      <div className="platform-list">
        <span className="platform-item facebook">
          Facebook
        </span>

        <span className="platform-item tiktok">
          TikTok
        </span>

        <span className="platform-item capcut">
          CapCut
        </span>
      </div>

      <form
        className="downloader-form"
        onSubmit={handleDownload}
      >

        <label>
          Tautan Video
        </label>

        <input
          type="url"
          value={url}
          onChange={(e) =>
            setUrl(e.target.value)
          }
          placeholder="Tempel link Facebook / TikTok / CapCut..."
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Memproses..."
            : "🔍 Cari Video"}
        </button>

      </form>

      {error && (
        <div className="downloader-error">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="downloader-loading">
          <div className="downloader-spinner"></div>

          <p>
            Sedang mengambil informasi video...
          </p>
        </div>
      )}

      {result && (
        <div className="downloader-result">
          {renderResult()}
        </div>
      )}

    </section>
  );
}
