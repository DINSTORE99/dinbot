export default async function handler(req, res) {
  try {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return res.status(500).json({
        success: false,
        message: "BACKEND_URL belum diatur di Vercel"
      });
    }

    const response = await fetch(
      `${backendUrl}/api/status`
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {

    console.error("STATUS API ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Backend Pterodactyl tidak dapat dihubungi",
      error: error.message
    });

  }
}
