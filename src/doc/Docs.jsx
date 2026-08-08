import { useMemo, useState } from "react";

const ENDPOINTS = [
  {
    id: "health",
    method: "GET",
    path: "/api/health",
    name: "Health Check",
    description: "Mengecek apakah API sedang aktif.",
  },
  {
    id: "status",
    method: "GET",
    path: "/api/status",
    name: "Server Status",
    description: "Mengambil status server dan koneksi bot.",
  },
  {
    id: "sessions",
    method: "GET",
    path: "/api/sessions",
    name: "Sessions",
    description: "Mengambil daftar session WhatsApp.",
  },
  {
    id: "pair",
    method: "POST",
    path: "/api/pair",
    name: "Pair WhatsApp",
    description: "Memulai proses pairing WhatsApp.",
    body: {
      number: "6281234567890",
    },
  },
  {
    id: "logout",
    method: "POST",
    path: "/api/logout",
    name: "Logout Session",
    description: "Logout atau menghapus session WhatsApp.",
    body: {
      sessionId: "6281234567890",
    },
  },
];

function Docs() {
  const [selectedId, setSelectedId] = useState("health");
  const [search, setSearch] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selected = ENDPOINTS.find(
    (item) => item.id === selectedId
  );

  const filteredEndpoints = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return ENDPOINTS;

    return ENDPOINTS.filter((item) =>
      `${item.name} ${item.path} ${item.method}`
        .toLowerCase()
        .includes(value)
    );
  }, [search]);

  const selectEndpoint = (endpoint) => {
    setSelectedId(endpoint.id);
    setResponseData(null);
    setResponseStatus(null);
    setResponseTime(null);
    setErrorMessage("");

    if (endpoint.body) {
      setRequestBody(
        JSON.stringify(endpoint.body, null, 2)
      );
    } else {
      setRequestBody("");
    }
  };

  const sendRequest = async () => {
    if (!selected) return;

    setLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    setResponseTime(null);
    setErrorMessage("");

    const start = performance.now();

    try {
      const options = {
        method: selected.method,
        headers: {
          Accept: "application/json",
        },
      };

      if (selected.method === "POST") {
        let body;

        try {
          body = requestBody
            ? JSON.parse(requestBody)
            : {};
        } catch {
          throw new Error(
            "JSON request body tidak valid."
          );
        }

        options.headers["Content-Type"] =
          "application/json";

        options.body = JSON.stringify(body);
      }

      const response = await fetch(
        selected.path,
        options
      );

      const end = performance.now();

      setResponseStatus(response.status);
      setResponseTime(
        Math.round(end - start)
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      setResponseData(data);

    } catch (error) {
      const end = performance.now();

      setResponseTime(
        Math.round(end - start)
      );

      setErrorMessage(
        error.message ||
          "Request gagal."
      );

      setResponseData({
        success: false,
        error:
          error.message ||
          "Request gagal.",
      });

    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (responseData === null) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          responseData,
          null,
          2
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const copyEndpoint = async () => {
    if (!selected) return;

    try {
      await navigator.clipboard.writeText(
        selected.path
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <style>{`

        * {
          box-sizing: border-box;
        }

        .docs-page {
          min-height: 100vh;
          background: #08090d;
          color: #f5f7fb;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .docs-header {
          height: 72px;
          border-bottom: 1px solid #1c1f29;
          background: rgba(8, 9, 13, .92);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 30px;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            #7c3aed,
            #4f46e5
          );
          font-weight: 900;
          font-size: 18px;
        }

        .brand div:last-child {
          display: flex;
          flex-direction: column;
        }

        .brand strong {
          font-size: 14px;
          letter-spacing: 1px;
        }

        .brand span {
          color: #717887;
          font-size: 9px;
          letter-spacing: 1.5px;
          margin-top: 2px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .api-live {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #8ee6ae;
          font-size: 11px;
          font-weight: 700;
        }

        .api-live span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #36d778;
          box-shadow: 0 0 12px #36d778;
        }

        .header-right code {
          color: #7d8494;
          font-size: 11px;
        }

        .docs-layout {
          display: grid;
          grid-template-columns:
            290px minmax(0, 1fr);
          min-height:
            calc(100vh - 72px);
        }

        .docs-sidebar {
          border-right: 1px solid #1c1f29;
          background: #0b0d12;
          padding: 28px 18px;
          position: sticky;
          top: 72px;
          height:
            calc(100vh - 72px);
          display: flex;
          flex-direction: column;
        }

        .sidebar-title {
          padding: 0 10px 18px;
        }

        .sidebar-title span,
        .eyebrow {
          color: #737b8d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.7px;
        }

        .sidebar-title strong {
          display: block;
          font-size: 18px;
          margin-top: 5px;
        }

        .search-box {
          height: 42px;
          display: flex;
          align-items: center;
          gap: 9px;
          border: 1px solid #20232e;
          background: #101219;
          border-radius: 10px;
          padding: 0 12px;
          margin-bottom: 18px;
        }

        .search-box span {
          color: #737b8d;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: white;
          font-size: 12px;
        }

        .endpoint-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
          overflow-y: auto;
        }

        .endpoint-item {
          width: 100%;
          border: 1px solid transparent;
          background: transparent;
          color: #aeb4c1;
          padding: 10px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 9px;
          text-align: left;
          cursor: pointer;
        }

        .endpoint-item:hover {
          background: #12151c;
          color: white;
        }

        .endpoint-item.active {
          background: #151823;
          border-color: #292d3a;
          color: white;
        }

        .endpoint-item > div:last-child {
          min-width: 0;
        }

        .endpoint-item strong {
          display: block;
          font-size: 11px;
        }

        .endpoint-item span:last-child {
          display: block;
          margin-top: 3px;
          color: #646b7b;
          font-family: monospace;
          font-size: 9px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .method-badge {
          min-width: 45px;
          height: 22px;
          padding: 0 7px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .5px;
          flex-shrink: 0;
        }

        .method-badge.get {
          color: #69a9ff;
          background: rgba(
            59,
            130,
            246,
            .12
          );
        }

        .method-badge.post {
          color: #64e49b;
          background: rgba(
            34,
            197,
            94,
            .12
          );
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 18px 10px 0;
          border-top: 1px solid #1c1f29;
          display: flex;
          justify-content: space-between;
          color: #777e8d;
          font-size: 10px;
        }

        .sidebar-footer small {
          color: #4f5562;
        }

        .docs-main {
          width: 100%;
          max-width: 1050px;
          padding: 55px 55px 30px;
        }

        .docs-intro {
          margin-bottom: 48px;
        }

        .docs-intro h1 {
          font-size:
            clamp(32px, 5vw, 50px);
          line-height: 1;
          letter-spacing: -2px;
          margin: 12px 0;
        }

        .docs-intro p {
          color: #8d94a3;
          max-width: 620px;
          line-height: 1.7;
          font-size: 13px;
        }

        .endpoint-header {
          margin-bottom: 28px;
        }

        .endpoint-heading {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .endpoint-heading h2 {
          font-size: 24px;
          margin: 0;
        }

        .endpoint-header p {
          color: #858c9c;
          font-size: 12px;
          line-height: 1.6;
          margin: 10px 0 16px;
        }

        .url-bar {
          min-height: 48px;
          border: 1px solid #242834;
          background: #0d1016;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 14px;
        }

        .url-bar > span {
          color: #62dd99;
          font-size: 9px;
          font-weight: 900;
        }

        .url-bar code {
          color: #d5dae3;
          font-size: 12px;
          overflow-x: auto;
        }

        .url-bar button {
          margin-left: auto;
          flex-shrink: 0;
        }

        .tester-card,
        .response-card,
        .example-card {
          border: 1px solid #20232d;
          background: #0d1016;
          border-radius: 14px;
          padding: 22px;
          margin-bottom: 20px;
        }

        .card-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .card-heading h3 {
          margin: 5px 0 0;
          font-size: 17px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          color: #7e8696;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
          margin-bottom: 8px;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dark-input,
        .code-input {
          width: 100%;
          outline: none;
          border: 1px solid #242834;
          background: #080a0f;
          color: #e7eaf0;
          border-radius: 9px;
          padding: 12px;
          font-family: monospace;
          font-size: 12px;
        }

        .code-input {
          min-height: 150px;
          resize: vertical;
          line-height: 1.6;
        }

        .code-input:focus {
          border-color: #5b4acb;
        }

        .small-button,
        .copy-button {
          border: 1px solid #292d39;
          background: #141720;
          color: #aab0bd;
          border-radius: 7px;
          padding: 7px 10px;
          font-size: 9px;
          cursor: pointer;
        }

        .small-button:hover,
        .copy-button:hover {
          color: white;
          background: #1a1d27;
        }

        .send-button {
          width: 100%;
          height: 46px;
          border: 0;
          border-radius: 9px;
          background: linear-gradient(
            135deg,
            #6949e8,
            #4f46c8
          );
          color: white;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 8px 25px
            rgba(79, 70, 229, .2);
        }

        .send-button:disabled {
          opacity: .55;
          cursor: wait;
        }

        .send-arrow {
          margin-left: 8px;
          font-size: 14px;
        }

        .loader {
          width: 13px;
          height: 13px;
          display: inline-block;
          border: 2px solid
            rgba(255,255,255,.3);
          border-top-color: white;
          border-radius: 50%;
          animation:
            spin .7s linear infinite;
          margin-right: 7px;
          vertical-align: -2px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .get-info {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 15px;
          margin-bottom: 18px;
          border: 1px solid #20232d;
          background: #080a0f;
          border-radius: 9px;
        }

        .get-info .terminal-icon {
          margin: 0;
          width: 45px;
          height: 38px;
        }

        .get-info strong {
          display: block;
          color: #cfd4de;
          font-size: 11px;
        }

        .get-info span {
          display: block;
          margin-top: 4px;
          color: #626978;
          font-size: 10px;
        }

        .response-meta {
          display: flex;
          gap: 30px;
          border-bottom: 1px solid #20232d;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }

        .response-meta div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .response-meta span {
          color: #686f7e;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .response-meta strong {
          font-size: 11px;
        }

        .status-success {
          color: #64e49b;
        }

        .status-error {
          color: #ff6b7a;
        }

        .response-window {
          min-height: 250px;
          max-height: 500px;
          overflow: auto;
          background: #07090d;
          border: 1px solid #191c24;
          border-radius: 9px;
        }

        .response-window pre,
        .example-card pre {
          margin: 0;
          padding: 18px;
          color: #c9ced8;
          font-family:
            "JetBrains Mono",
            monospace;
          font-size: 11px;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .empty-response {
          min-height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 7px;
          color: #5e6574;
        }

        .empty-response strong {
          color: #858c9b;
          font-size: 12px;
        }

        .empty-response span {
          font-size: 10px;
        }

        .terminal-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #11141c;
          color: #6d5ce7;
          font-family: monospace;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .error-message {
          margin-top: 12px;
          padding: 12px;
          border: 1px solid
            rgba(255, 70, 90, .2);
          background:
            rgba(255, 70, 90, .06);
          border-radius: 8px;
          color: #ff7885;
          font-family: monospace;
          font-size: 10px;
          word-break: break-word;
        }

        .docs-footer {
          border-top: 1px solid #1c1f29;
          margin-top: 45px;
          padding: 22px 0;
          display: flex;
          justify-content: space-between;
          color: #555c6b;
          font-size: 9px;
        }

        @media (max-width: 800px) {

          .docs-header {
            padding: 0 16px;
          }

          .header-right code {
            display: none;
          }

          .docs-layout {
            display: block;
          }

          .docs-sidebar {
            position: relative;
            top: 0;
            height: auto;
            border-right: 0;
            border-bottom: 1px solid #1c1f29;
            padding: 18px;
          }

          .sidebar-footer {
            display: none;
          }

          .docs-main {
            padding: 35px 16px;
          }

          .docs-intro {
            margin-bottom: 35px;
          }

          .docs-intro h1 {
            letter-spacing: -1px;
          }

          .endpoint-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .response-meta {
            gap: 18px;
            flex-wrap: wrap;
          }

          .docs-footer {
            flex-direction: column;
            gap: 8px;
          }

          .url-bar {
            flex-wrap: wrap;
            padding: 10px 12px;
          }

          .url-bar code {
            width: 100%;
          }

          .url-bar button {
            margin-left: 0;
          }

          .get-info {
            align-items: flex-start;
          }
        }

      `}</style>

      <div className="docs-page">

        {/* HEADER */}

        <header className="docs-header">

          <div className="brand">

            <div className="brand-logo">
              D
            </div>

            <div>
              <strong>
                DIN BOT API
              </strong>

              <span>
                API DOCUMENTATION
              </span>
            </div>

          </div>

          <div className="header-right">

            <div className="api-live">
              <span />
              API ONLINE
            </div>

            <code>
              v1.0.0
            </code>

          </div>

        </header>


        <div className="docs-layout">

          {/* SIDEBAR */}

          <aside className="docs-sidebar">

            <div className="sidebar-title">

              <span>
                DOCUMENTATION
              </span>

              <strong>
                Endpoints
              </strong>

            </div>


            <div className="search-box">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search endpoint..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>


            <div className="endpoint-list">

              {filteredEndpoints.map(
                (endpoint) => (

                  <button
                    key={endpoint.id}
                    className={
                      `endpoint-item ${
                        selectedId === endpoint.id
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={() =>
                      selectEndpoint(endpoint)
                    }
                  >

                    <span
                      className={
                        `method-badge ${
                          endpoint.method.toLowerCase()
                        }`
                      }
                    >
                      {endpoint.method}
                    </span>

                    <div>

                      <strong>
                        {endpoint.name}
                      </strong>

                      <span>
                        {endpoint.path}
                      </span>

                    </div>

                  </button>

                )
              )}

            </div>


            <div className="sidebar-footer">

              <span>
                DIN BOT API
              </span>

              <small>
                5 endpoints
              </small>

            </div>

          </aside>


          {/* MAIN */}

          <main className="docs-main">

            <section className="docs-intro">

              <span className="eyebrow">
                DIN BOT / API
              </span>

              <h1>
                API Documentation
              </h1>

              <p>
                Dokumentasi dan endpoint tester
                untuk DIN BOT API. Semua endpoint
                dapat dicoba langsung dari halaman
                ini.
              </p>

            </section>


            {selected && (

              <section>

                <div className="endpoint-header">

                  <div className="endpoint-heading">

                    <span
                      className={
                        `method-badge ${
                          selected.method.toLowerCase()
                        }`
                      }
                    >
                      {selected.method}
                    </span>

                    <h2>
                      {selected.name}
                    </h2>

                  </div>

                  <p>
                    {selected.description}
                  </p>


                  <div className="url-bar">

                    <span>
                      {selected.method}
                    </span>

                    <code>
                      {selected.path}
                    </code>

                    <button
                      className="small-button"
                      onClick={copyEndpoint}
                    >
                      Copy
                    </button>

                  </div>

                </div>


                {/* TESTER */}

                <div className="tester-card">

                  <div className="card-heading">

                    <div>
                      <span className="eyebrow">
                        REQUEST
                      </span>

                      <h3>
                        Endpoint Tester
                      </h3>
                    </div>

                    <span className="request-method">
                      {selected.method}
                    </span>

                  </div>


                  {selected.method === "POST" ? (

                    <div className="form-group">

                      <div className="label-row">

                        <label>
                          JSON BODY
                        </label>

                        <button
                          className="small-button"
                          onClick={() =>
                            setRequestBody(
                              JSON.stringify(
                                selected.body,
                                null,
                                2
                              )
                            )
                          }
                        >
                          Reset
                        </button>

                      </div>

                      <textarea
                        className="code-input"
                        value={requestBody}
                        onChange={(e) =>
                          setRequestBody(
                            e.target.value
                          )
                        }
                        spellCheck="false"
                      />

                    </div>

                  ) : (

                    <div className="get-info">

                      <div className="terminal-icon">
                        GET
                      </div>

                      <div>
                        <strong>
                          No request body required
                        </strong>

                        <span>
                          Endpoint ini dapat
                          langsung dijalankan.
                        </span>
                      </div>

                    </div>

                  )}


                  <button
                    className="send-button"
                    onClick={sendRequest}
                    disabled={loading}
                  >

                    {loading ? (
                      <>
                        <span className="loader" />
                        Sending request...
                      </>
                    ) : (
                      <>
                        Send Request
                        <span className="send-arrow">
                          →
                        </span>
                      </>
                    )}

                  </button>

                </div>


                {/* RESPONSE */}

                <div className="response-card">

                  <div className="card-heading">

                    <div>

                      <span className="eyebrow">
                        RESPONSE
                      </span>

                      <h3>
                        Server Response
                      </h3>

                    </div>

                    {responseData !== null && (
                      <button
                        className="copy-button"
                        onClick={copyResponse}
                      >
                        Copy JSON
                      </button>
                    )}

                  </div>


                  {responseData !== null && (

                    <div className="response-meta">

                      <div>
                        <span>
                          STATUS
                        </span>

                        <strong
                          className={
                            responseStatus >= 200 &&
                            responseStatus < 300
                              ? "status-success"
                              : "status-error"
                          }
                        >
                          {responseStatus || "ERROR"}
                        </strong>
                      </div>


                      <div>
                        <span>
                          TIME
                        </span>

                        <strong>
                          {responseTime ?? "-"} ms
                        </strong>
                      </div>


                      <div>
                        <span>
                          RESULT
                        </span>

                        <strong
                          className={
                            responseStatus >= 200 &&
                            responseStatus < 300
                              ? "status-success"
                              : "status-error"
                          }
                        >
                          {responseStatus >= 200 &&
                          responseStatus < 300
                            ? "SUCCESS"
                            : "ERROR"}
                        </strong>
                      </div>

                    </div>

                  )}


                  <div className="response-window">

                    {responseData !== null ? (

                      <pre>
                        {JSON.stringify(
                          responseData,
                          null,
                          2
                        )}
                      </pre>

                    ) : (

                      <div className="empty-response">

                        <div className="terminal-icon">
                          &gt;_
                        </div>

                        <strong>
                          No response yet
                        </strong>

                        <span>
                          Klik "Send Request"
                          untuk mencoba endpoint.
                        </span>

                      </div>

                    )}

                  </div>


                  {errorMessage && (

                    <div className="error-message">
                      {errorMessage}
                    </div>

                  )}

                </div>


                {/* EXAMPLE */}

                <div className="example-card">

                  <div className="card-heading">

                    <div>

                      <span className="eyebrow">
                        EXAMPLE
                      </span>

                      <h3>
                        Request
                      </h3>

                    </div>

                  </div>

                  <pre>
{selected.method} {selected.path}
{
  selected.method === "POST"
    ? `\n\n${JSON.stringify(
        selected.body,
        null,
        2
      )}`
    : ""
}
                  </pre>

                </div>

              </section>

            )}


            <footer className="docs-footer">

              <span>
                DIN BOT API • Documentation
              </span>

              <span>
                Built for WhatsApp Bot
              </span>

            </footer>

          </main>

        </div>

      </div>
    </>
  );
}

export default Docs;
