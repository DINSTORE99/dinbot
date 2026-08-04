export default function handler(req, res) {
  const uptime = Math.floor(process.uptime());

  const hari = Math.floor(uptime / 86400);
  const jam = Math.floor((uptime % 86400) / 3600);
  const menit = Math.floor((uptime % 3600) / 60);
  const detik = uptime % 60;

  res.status(200).json({
    success: true,
    server: "online",
    service: "DIN BOT API",
    timestamp: Date.now(),
    uptime: {
      hari,
      jam,
      menit,
      detik
    }
  });
}
