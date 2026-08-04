export default function handler(req, res) {
  res.status(200).json({
    success: true,
    server: "online",
    service: "DIN BOT API",
    timestamp: Date.now()
  });
}
