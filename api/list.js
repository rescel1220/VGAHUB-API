export default async function handler(req, res) {

    // =====================================================
    // CORS
    // =====================================================

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan"
        });
    }

    // =====================================================
    // ENV
    // =====================================================

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || "main";

    if (!token || !owner || !repo) {
        return res.status(500).json({
            success: false,
            message: "Environment variable GitHub belum lengkap"
        });
    }

    // =====================================================
    // PARAMETER
    // =====================================================

    let { folder, subfolder } = req.query;

    if (!folder) {
        return res.status(400).json({
            success: false,
            message: "Parameter folder wajib diisi"
        });
    }

    // =====================================================
    // NORMALISASI FOLDER UTAMA
    // =====================================================

    folder = folder.toLowerCase().trim();

    const allowedFolders = [
        "converter",
        "mcu",
        "hmi"
    ];

    if (!allowedFolders.includes(folder)) {
        return res.status(400).json({
            success: false,
            message: "Folder tidak diizinkan"
        });
    }

    // =====================================================
    // SANITASI SUBFOLDER
    // =====================================================

    if (subfolder) {

        subfolder = subfolder
            .trim()
            .replace(/[<>:"/\\|?*]/g, "_");

        if (!subfolder) {
            return res.status(400).json({
                success: false,
                message: "Nama subfolder tidak valid"
            });
        }
    }

    // =====================================================
    // BUAT PATH GITHUB
    // =====================================================

    let githubPath = folder;

    if (subfolder) {
        githubPath += "/" + subfolder;
    }

    const encodedPath = githubPath
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");

    const githubUrl =
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;

    // =====================================================
    // REQUEST KE GITHUB
    // =====================================================

    try {

        const response = await fetch(githubUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "VGAHUB"
            }
        });

        const data = await response.json();

        if (!response.ok) {

            return res.status(response.status).json({
                success: false,
                message: data.message || "Gagal membaca GitHub"
            });
        }

        // =================================================
        // JIKA MEMBACA SUBFOLDER
        // =================================================

        if (subfolder) {

            const files = data
                .filter(item => item.type === "file")
                .map(item => ({
                    name: item.name,
                    path: item.path,
                    size: item.size,
                    download_url: item.download_url,
                    html_url: item.html_url
                }));

            return res.status(200).json({
                success: true,
                type: "files",
                folder: folder,
                subfolder: subfolder,
                count: files.length,
                files: files
            });
        }

        // =================================================
        // JIKA MEMBACA FOLDER UTAMA
        // =================================================

        const folders = data
            .filter(item => item.type === "dir")
            .map(item => ({
                name: item.name,
                path: item.path
            }));

        return res.status(200).json({
            success: true,
            type: "folders",
            folder: folder,
            count: folders.length,
            folders: folders
        });

    } catch (error) {

        console.error("LIST ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
