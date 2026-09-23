
// =====================================================
// MATIKAN BODY PARSER VERCEL
// Agar file binary bisa dibaca langsung
// =====================================================
export const config = {
    api: {
        bodyParser: false,
    },
};

// =====================================================
// BACA REQUEST BINARY
// =====================================================
function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => {
            chunks.push(chunk);

        });

        req.on("end", () => {
            try {
                const buffer =Buffer.concat(chunks);
                resolve(buffer);
            } catch (error) {
                reject(error);
            }
        });
        req.on("error", (error) => {
            reject(error);
        });
    });
}

// =====================================================
// MAIN HANDLER
// =====================================================

export default async function handler(req, res) {
    // =================================================
    // CORS
    // =================================================
    res.setHeader( "Access-Control-Allow-Origin", "*");
    res.setHeader( "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader( "Access-Control-Allow-Headers", "Content-Type");
    // =================================================
    // PREFLIGHT
    // =================================================
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    // =================================================
    // TEST API
    // =================================================
    if (req.method === "GET") {
        return res.status(200).json({
            success: true,
            message:"API Vercel aktif - Binary Upload"
        });
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
        // AMBIL PARAMETER URL
        // =================================================
        const filename = req.query.filename;
        const folder = req.query.folder;
        const subfolder = req.query.subfolder;
        console.log("=================================");
        console.log("UPLOAD REQUEST");
        console.log("filename :",filename);

        console.log("folder   :", folder);
        console.log("subfolder:", subfolder);
        console.log("content-type:", req.headers["content-type"]);
        console.log("=================================");
        // =================================================
        // CEK PARAMETER
        // =================================================
        if (!filename || !folder || !subfolder) {
            return res.status(400).json({
                success: false,
                message:"filename, folder, atau subfolder kosong"
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
                message:"Folder tidak diizinkan. Gunakan hmi, converter, atau mcu."
            });
        }
        // =================================================
        // AMANKAN SUBFOLDER
        // =================================================
        let safeSubfolder =
            subfolder
                .toString()
                .trim();
        
        safeSubfolder =
            safeSubfolder
                .replace(
                    /[<>:"/\\|?*]/g,
                    "_"
                )
                .replace(
                    /\.\./g,
                    "_"
                )
                .replace(
                    /\s+/g,
                    "_"
                );


        if (!safeSubfolder) {
            return res.status(400).json({
                success: false,
                message: "Nama subfolder tidak valid"
            });
        }


        // =================================================
        // AMANKAN NAMA FILE
        // =================================================

        let safeFilename =
            filename
                .toString()
                .trim();

        safeFilename = safeFilename
                .replace(
                    /[<>:"/\\|?*]/g,
                    "_"
                )
                .replace(
                    /\.\./g,
                    "_"
                );


        if (!safeFilename) {
            return res.status(400).json({
                success: false,
                message: "Nama file tidak valid"
            });
        }


        // =================================================
        // ENVIRONMENT VARIABLES
        // =================================================
        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const branch = process.env.GITHUB_BRANCH || "main";
        // =================================================
        // CEK ENVIRONMENT
        // =================================================

        if (!token ||  !owner || !repo ) {
            return res.status(500).json({
                success: false,
                message: "Environment Variables belum lengkap"
            });
        }
        // =================================================
        // PATH GITHUB
        // =================================================

        const path = `${folderLower}/${safeSubfolder}/${safeFilename}`;
        console.log("UPLOAD PATH:", path);
        // =================================================
        // URL GITHUB
        // =================================================

        const githubUrl =
            `https://api.github.com/repos/${owner}/${repo}/contents/${path
                .split("/")
                .map(
                    encodeURIComponent
                )
                .join("/")}`;


        // =================================================
        // BACA FILE BINARY
        // =================================================

        console.log("Membaca binary file...");
        const buffer =await readRequestBody(req);
        console.log("FILE SIZE:", buffer.length, "bytes");
        // =================================================
        // CEK FILE KOSONG
        // =================================================
        if (!buffer || buffer.length === 0) {
            return res.status(400).json({
                success: false,
                message:"File kosong atau binary tidak diterima"
            });
        }


        // =================================================
        // BATAS INTERNAL
        // =================================================

        const maxSize =95 * 1024 * 1024;
        if (buffer.length > maxSize) {
            return res.status(413).json({
                success: false,
                message:"File terlalu besar. Maksimal sekitar 95 MB."
            });
        }


        // =================================================
        // BINARY -> BASE64
        //
        // Dilakukan di SERVER
        // =================================================
        const content =buffer.toString("base64");
        // =================================================
        // CEK FILE LAMA
        // =================================================

        let sha;


        const checkResponse =
            await fetch(
                githubUrl,
                {

                    method: "GET",

                    headers: {

                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28"
                    }
                }
            );


        // =================================================
        // AMBIL SHA JIKA FILE SUDAH ADA
        // =================================================

        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            sha = existingFile.sha;
        }
        // =================================================
        // DATA GITHUB
        // =================================================
        const githubData = {
            message: `Upload ${folderLower}/${safeSubfolder}: ${safeFilename}`,
            content: content,
            branch: branch
        };


        // =================================================
        // JIKA FILE SUDAH ADA
        // =================================================

        if (sha) {
            githubData.sha = sha;
        }


        // =================================================
        // UPLOAD KE GITHUB
        // =================================================

        console.log("Mengirim file ke GitHub...");


        const uploadResponse =
            await fetch(
                githubUrl,
                {

                    method: "PUT",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/vnd.github+json",

                        "Content-Type":
                            "application/json",

                        "X-GitHub-Api-Version":
                            "2022-11-28"

                    },

                    body:
                        JSON.stringify(
                            githubData
                        )

                }
            );


        // =================================================
        // RESPONSE GITHUB
        // =================================================

        const result = await uploadResponse.json();


        // =================================================
        // GITHUB ERROR
        // =================================================

        if (!uploadResponse.ok) {

            console.error("GitHub ERROR:", result);


            return res
                .status(
                    uploadResponse.status
                )
                .json({

                    success: false,

                    message:
                        "Gagal menyimpan file ke GitHub",

                    github:
                        result

                });

        }


        // =================================================
        // SUKSES
        // =================================================

        console.log(
            "UPLOAD BERHASIL:",
            path
        );


        return res.status(200).json({

            success: true,

            message:
                "File berhasil disimpan ke GitHub",

            filename:
                safeFilename,

            folder:
                folderLower,

            subfolder:
                safeSubfolder,

            path:
                path,

            size:
                buffer.length,

            url:
                result.content?.html_url ||
                null

        });


    } catch (error) {

        // =================================================
        // ERROR
        // =================================================

        console.error(
            "UPLOAD ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Terjadi kesalahan server"

        });

    }

}

