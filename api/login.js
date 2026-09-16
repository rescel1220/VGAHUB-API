export default async function handler(req, res) {
    // =====================================================
    // CORS
    // =====================================================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }
    // =====================================================
    // AMBIL DATA LOGIN
    // =====================================================
    const {
        username,
        password
    } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username dan password harus diisi."
        });

    }
    // =====================================================
    // AMBIL USERNAME & PASSWORD DARI VERCEL
    // =====================================================
    const validUsername =process.env.LOGIN_USERNAME;
    const validPassword = process.env.LOGIN_PASSWORD;
    if (!validUsername || !validPassword) {
        console.error( "LOGIN_USERNAME atau LOGIN_PASSWORD belum diatur.");
        return res.status(500).json({
            success: false,
            message: "Konfigurasi login server belum lengkap."
        });
    }
    // =====================================================
    // CEK LOGIN
    // =====================================================
    if ( username !== validUsername || password !== validPassword) {
        return res.status(401).json({
            success: false,
            message: "Username atau password salah."
        });

    }
    // =====================================================
    // LOGIN BERHASIL
    // =====================================================
    return res.status(200).json({
        success: true,
        message: "Login berhasil."
    });
}