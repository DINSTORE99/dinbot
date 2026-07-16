const socket = io();

const serverStatus = document.getElementById("serverStatus");
const connectBtn = document.getElementById("connectBtn");
const number = document.getElementById("number");
const sessions = document.getElementById("sessions");
const logs = document.getElementById("logs");

function addLog(text) {
  const div = document.createElement("div");
  div.textContent = "[" + new Date().toLocaleTimeString() + "] " + text;
  logs.prepend(div);
}

socket.on("connect", () => {
  serverStatus.className = "online";
  serverStatus.innerHTML = "🟢 SERVER ONLINE";
  addLog("Terhubung ke server.");
  loadSessions();
});

socket.on("disconnect", () => {
  serverStatus.className = "offline";
  serverStatus.innerHTML = "🔴 SERVER OFFLINE";
  addLog("Koneksi ke server terputus.");
});

socket.on("status", () => {
  loadSessions();
});

socket.on("logout", () => {
  loadSessions();
});

socket.on("pairing", () => {
  loadSessions();
});

connectBtn.onclick = async () => {
  
  const phone = number.value.trim();
  
  if (!phone) {
    return alert("Masukkan nomor WhatsApp.");
  }
  
  connectBtn.disabled = true;
  connectBtn.innerText = "Menghubungkan...";
  
  try {
    
    const res = await fetch("/api/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number: phone
      })
    });
    
    const json = await res.json();
    
    addLog("Membuat session " + phone);
    
    loadSessions();
    
  } catch (e) {
    
    alert(e.message);
    
  }
  
  connectBtn.disabled = false;
  connectBtn.innerText = "Hubungkan";
  
};

async function loadSessions() {
  
  const res = await fetch("/api/sessions");
  const data = await res.json();
  
  sessions.innerHTML = "";
  
  if (data.length === 0) {
    sessions.innerHTML = "Belum ada bot.";
    return;
  }
  
  data.forEach(bot => {
    
    const card = document.createElement("div");
    card.className = "bot-card";
    
    card.innerHTML = `
        <div class="bot-title">${bot.number}</div>

        <div class="status">
        ${bot.connected ? "🟢 Connected" : "🟡 Waiting Pair"}
        </div>

        <div class="code">
        ${bot.pairingCode || "Menunggu Pairing"}
        </div>

        <button class="restart"
        onclick="restartBot('${bot.sessionId}')">
        Restart
        </button>

        <button class="logout"
        onclick="logoutBot('${bot.sessionId}')">
        Logout
        </button>
        `;
    
    sessions.appendChild(card);
    
  });
  
}

async function restartBot(id) {
  
  await fetch("/api/restart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId: id
    })
  });
  
  addLog("Restart " + id);
  
  loadSessions();
  
}

async function logoutBot(id) {
  
  await fetch("/api/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId: id
    })
  });
  
  addLog("Logout " + id);
  
  loadSessions();
  
}

loadSessions();
