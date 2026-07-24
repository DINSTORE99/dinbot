export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak diizinkan"
    });
  }

  try {

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return res.status(500).json({
        success: false,
        message: "BACKEND_URL belum diatur"
      });
    }

    const body = req.body || {};

    const response = await fetch(
      `${backendUrl}/api/pair`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {

    console.error("PAIR API ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal menghubungi backend",
      error: error.message
    });

  }

}
