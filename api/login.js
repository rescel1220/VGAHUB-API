// =====================================================
// API LOGIN VGA HUB CENTER
// =====================================================
export default async function handler(req, res) {
    // =================================================
    // CORS
    // =================================================
    res.setHeader( "Access-Control-Allow-Origin", "*");
    res.setHeader( "Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader( "Access-Control-Allow-Headers", "Content-Type" );
    // =================================================
    // PREFLIGHT
    // =================================================
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    // =================================================
    // HANYA POST
    // =================================================
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan"
        });
    }
    try {
        // =================================================
        // AMBIL USERNAME DAN PASSWORD
        // =================================================
        const {
            username,
            password
        } = req.body || {};
        // =================================================
        // CEK INPUT
        // =================================================
        if (!username ||!password ) {
            return res.status(400).json({
                success: false,
                message: "Username dan password harus diisi"
            });
        }
        // =================================================
        // USERNAME / PASSWORD DARI VERCEL
        // =================================================
        const userUsername = process.env.USER_USERNAME;
        const userPassword = process.env.USER_PASSWORD;
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        // =================================================
        // LOGIN ADMIN
        // =================================================
        if ( username === adminUsername && password === adminPassword) {
            return res.status(200).json({
                success: true,
                role: "admin",
                message:"Login Admin berhasil"
            });
        }
        // =================================================
        // LOGIN USER
        // =================================================
        if (username === userUsername && password === userPassword ) {
            return res.status(200).json({
                success: true,
                role: "user",
                message: "Login User berhasil"
            });
        }
        // =================================================
        // LOGIN GAGAL
        // =================================================
        return res.status(401).json({
            success: false,
            message: "Username atau password salah"
        });
    }
    catch (error) {
        console.error("LOGIN ERROR:", error );
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server"
        });
    }
}
