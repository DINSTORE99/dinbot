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

    const response = await fetch(
      `${backendUrl}/api/logout`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(
          req.body || {}
        )
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {

    console.error(
      "LOGOUT API ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Backend tidak dapat dihubungi",
      error: error.message
    });

  }

}
