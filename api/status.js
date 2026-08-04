export default async function handler(req, res) {
  try {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return res.status(500).json({
        success: false,
        message: "BACKEND_URL belum diatur di Vercel"
      });
    }

    // Mulai hitung ping
    const start = Date.now();

    const response = await fetch(
      `${backendUrl}/api/status`,
      {
        cache: "no-store"
      }
    );

    const data = await response.json();

    // Ping dalam ms
    const ping = Date.now() - start;

    return res.status(response.status).json({
      ...data,
      ping
    });

  } catch (error) {

    console.error("STATUS API ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Backend Pterodactyl tidak dapat dihubungi",
      error: error.message
    });

  }
}
