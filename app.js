const API_URL = "http://bot.ndz.web.id";

const socket = io(API_URL, {
  transports: ["websocket", "polling"]
});

const serverStatus = document.getElementById("serverStatus");
const sessions = document.getElementById("sessions");
const logs = document.getElementById("logs");
const connectBtn = document.getElementById("connectBtn");
const numberInput = document.getElementById("number");

function log(text) {
  const div = document.createElement("div");
  div.className = "log";
  div.innerHTML = `[${new Date().toLocaleTimeString()}] ${text}`;
  logs.prepend(div);
}

socket.on("connect", () => {
  serverStatus.className = "online";
  serverStatus.innerHTML = "🟢 SERVER ONLINE";
  log("Terhubung ke API");
  loadSessions();
});

socket.on("disconnect", () => {
  serverStatus.className = "offline";
  serverStatus.innerHTML = "🔴 SERVER OFFLINE";
  log("Koneksi API terputus");
});

socket.on("pairing", (data) => {
  log(`Pairing ${data.number}: ${data.code}`);
  loadSessions();
});

socket.on("status", () => {
  loadSessions();
});

connectBtn.addEventListener("click", async () => {
  
  const number = numberInput.value.trim();
  
  if (!number) {
    return alert("Masukkan nomor WhatsApp");
  }
  
  connectBtn.disabled = true;
  connectBtn.innerText = "Menghubungkan...";
  
  try {
    
    const req = await fetch(`${API_URL}/api/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number
      })
    });
    
    const res = await req.json();
    
    if (!res.success) {
      alert(res.message || "Gagal");
    }
    
    log("Membuat session " + number);
    
  } catch (e) {
    
    alert(e.message);
    
  }
  
  connectBtn.disabled = false;
  connectBtn.innerText = "Hubungkan";
  
});

async function loadSessions() {
  
  const req = await fetch(`${API_URL}/api/sessions`);
  const data = await req.json();
  
  sessions.innerHTML = "";
  
  if (!data.length) {
    sessions.innerHTML = "<p>Belum ada bot.</p>";
    return;
  }
  
  data.forEach(bot => {
    
    const div = document.createElement("div");
    
    div.className = "bot-card";
    
    div.innerHTML = `
        <h3>${bot.number}</h3>

        <p>${bot.connected ? "🟢 Connected" : "🟡 Waiting Pairing"}</p>

        <div class="code">
            ${bot.pairingCode || "Menunggu Pairing Code"}
        </div>

        <button onclick="restartBot('${bot.sessionId}')">
        Restart
        </button>

        <button onclick="logoutBot('${bot.sessionId}')">
        Logout
        </button>
        `;
    
    sessions.appendChild(div);
    
  });
  
}

async function restartBot(id) {
  
  await fetch(`${API_URL}/api/restart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId: id
    })
  });
  
  log("Restart " + id);
  
}

async function logoutBot(id) {
  
  await fetch(`${API_URL}/api/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId: id
    })
  });
  
  log("Logout " + id);
  
}

loadSessions();
