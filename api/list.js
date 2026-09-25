
export default async function handler(req, res) {
// =====================================================CORS=====================================================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
// =====================================================PREFLIGHT=====================================================
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    // =====================================================
    // HANYA GET
    // =====================================================
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message:"Method tidak diizinkan"
        });
    }
    try {
// =================================================AMBIL PARAMETER=================================================
        const folder =req.query.folder;
        const subfolder =req.query.subfolder;
        // =================================================
        // CEK FOLDER UTAMA
        // =================================================
        if (!folder) {
            return res.status(400).json({
                success: false,
                message:"Parameter folder belum diberikan"
            });
        }
        // =================================================
        // NORMALISASI FOLDER
        // =================================================
        const folderLower =
            folder
                .toString()
                .trim()
                .toLowerCase();
        // =================================================
        // FOLDER YANG DIIZINKAN
        // =================================================
        const allowedFolders = [
            "hmi",
            "converter",
            "mcu"
        ];
        if (!allowedFolders.includes(folderLower)) {
            return res.status(400).json({
                success: false,
                message:"Folder tidak diizinkan"
            });
        }
        // =================================================
        // ENVIRONMENT VARIABLES
        // =================================================
        const token =process.env.GITHUB_TOKEN;
        const owner =process.env.GITHUB_OWNER;
        const repo =process.env.GITHUB_REPO;
        const branch =process.env.GITHUB_BRANCH || "main";
        // =================================================
        // CEK ENVIRONMENT
        // =================================================
        if (!token || !owner || !repo) {
            return res.status(500).json({
                success: false,
                message:"Environment Variables belum lengkap"
            });
        }
        // =================================================
        // TENTUKAN PATH GITHUB
        // =================================================
        let githubPath =folderLower;
        // =================================================
        // JIKA ADA SUBFOLDER
        // =================================================
        if (subfolder) {
            let safeSubfolder =
                subfolder
                    .toString()
                    .trim()
                    .replace(/[<>:"/\\|?*]/g, "_")
                    .replace(/\.\./g, "_");
            if (!safeSubfolder) {
                return res.status(400).json({
                    success: false,
                    message:"Nama subfolder tidak valid"
                });
            }
            githubPath = `${folderLower}/${safeSubfolder}`;
        }
        // =================================================
        // URL GITHUB
        // =================================================

        const githubUrl =
            `https://api.github.com/repos/${owner}/${repo}/contents/${githubPath
                .split("/")
                .map(encodeURIComponent)
                .join("/")}?ref=${encodeURIComponent(branch)}`;
        console.log("LIST PATH:", githubPath);
        console.log("LIST URL:", githubUrl);
        // =================================================
        // REQUEST GITHUB
        // =================================================

        const githubResponse =
            await fetch(
                githubUrl,
                {
                    method: "GET",
                    headers: {
                        "Authorization":`Bearer ${token}`,
                        "Accept":"application/vnd.github+json",
                        "X-GitHub-Api-Version":"2022-11-28"
                    }
                }
            );
        // =================================================
        // ERROR GITHUB
        // =================================================
        if (!githubResponse.ok) {
            const error =await githubResponse.json();
            console.error("GitHub error:", error);
            return res
                .status(githubResponse.status)
                .json({
                    success: false,
                    message:"Gagal membaca folder GitHub",
                    github:error
                });
        }
        // =================================================
        // DATA GITHUB
        // =================================================
        const items =await githubResponse.json();
        //AMBIL SUBFOLDER
        if (!subfolder) {
            const folders =
                items
                    .filter(
                        item =>
                            item.type === "dir"
                    )
                    .map(
                        item => ({
                            name: item.name,
                            path: item.path
                        })
                    );

            return res.status(200).json({
                success: true,
                folder: folderLower,
                count: folders.length,
                folders: folders
            });
        }
//=====================================AMBIL FILE===================================
        const files =
            items
                .filter(
                    item =>
                        item.type === "file"
                )
                .map(
                    item => ({
                        name: item.name,
                        path: item.path,
                        download_url: item.download_url,
                        html_url: item.html_url,
                        size: item.size
                    })
                );
        // =================================================
        // HASIL FILE
        // =================================================
        return res.status(200).json({
            success: true,
            folder: folderLower,
            subfolder: subfolder,
            count: files.length,
            files: files
        });
    } catch (error) {
        console.error("LIST ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
