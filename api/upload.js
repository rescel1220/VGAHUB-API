
export default async function handler(req, res) {

    // =====================================================
    // CORS
    // =====================================================

    res.setHeader("Access-Control-Allow-Origin", "*");

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // =====================================================
    // PREFLIGHT
    // =====================================================

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    // =====================================================
    // TEST API
    // =====================================================

    if (req.method === "GET") {

        return res.status(200).json({

            success: true,

            message: "API Vercel aktif - Binary Upload"

        });

    }


    // =====================================================
    // HANYA POST
    // =====================================================

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message: "Method tidak diizinkan"

        });

    }


    try {

        // =================================================
        // AMBIL PARAMETER DARI URL
        // =================================================

        const filename =
            req.query.filename;

        const folder =
            req.query.folder;

        const subfolder =
            req.query.subfolder;


        console.log("=================================");
        console.log("UPLOAD REQUEST");
        console.log("filename :", filename);
        console.log("folder   :", folder);
        console.log("subfolder:", subfolder);
        console.log("=================================");


        // =================================================
        // CEK DATA WAJIB
        // =================================================

        if (!filename || !folder || !subfolder) {

            return res.status(400).json({

                success: false,

                message:
                    "filename, folder, atau subfolder kosong"

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

                message:
                    "Folder tidak diizinkan. Gunakan hmi, converter, atau mcu."

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
                .replace(/[<>:"/\\|?*]/g, "_")
                .replace(/\.\./g, "_")
                .replace(/\s+/g, "_");


        // =================================================
        // CEK SUBFOLDER
        // =================================================

        if (!safeSubfolder) {

            return res.status(400).json({

                success: false,

                message:
                    "Nama subfolder tidak valid"

            });

        }


        // =================================================
        // AMANKAN NAMA FILE
        // =================================================

        let safeFilename =
            filename
                .toString()
                .trim();


        safeFilename =
            safeFilename
                .replace(/[<>:"/\\|?*]/g, "_")
                .replace(/\.\./g, "_");


        // =================================================
        // CEK NAMA FILE
        // =================================================

        if (!safeFilename) {

            return res.status(400).json({

                success: false,

                message:
                    "Nama file tidak valid"

            });

        }


        // =================================================
        // ENVIRONMENT VARIABLES
        // =================================================

        const token =
            process.env.GITHUB_TOKEN;

        const owner =
            process.env.GITHUB_OWNER;

        const repo =
            process.env.GITHUB_REPO;

        const branch =
            process.env.GITHUB_BRANCH || "main";


        // =================================================
        // CEK ENVIRONMENT
        // =================================================

        if (!token || !owner || !repo) {

            return res.status(500).json({

                success: false,

                message:
                    "Environment Variables belum lengkap"

            });

        }


        // =================================================
        // PATH GITHUB
        //
        // CONTOH:
        //
        // converter/scn/manual.pdf
        //
        // =================================================

        const path =
            `${folderLower}/${safeSubfolder}/${safeFilename}`;


        console.log(
            "UPLOAD PATH:",
            path
        );


        // =================================================
        // URL GITHUB API
        // =================================================

        const githubUrl =
            `https://api.github.com/repos/${owner}/${repo}/contents/${path
                .split("/")
                .map(encodeURIComponent)
                .join("/")}`;


        console.log(
            "GITHUB URL:",
            githubUrl
        );


        // =================================================
        // BACA FILE BINARY
        // =================================================

        const arrayBuffer =
            await req.arrayBuffer();


        const buffer =
            Buffer.from(arrayBuffer);


        console.log(
            "FILE SIZE:",
            buffer.length,
            "bytes"
        );


        // =================================================
        // CEK FILE KOSONG
        // =================================================

        if (buffer.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "File kosong atau tidak diterima server"

            });

        }


        // =================================================
        // BATAS GITHUB
        //
        // GitHub Contents API tidak cocok untuk file
        // yang sangat besar.
        //
        // Kita beri batas aman 95 MB.
        // =================================================

        const maxSize =
            95 * 1024 * 1024;


        if (buffer.length > maxSize) {

            return res.status(413).json({

                success: false,

                message:
                    "Ukuran file terlalu besar. Maksimal sekitar 95 MB."

            });

        }


        // =================================================
        // UBAH BINARY -> BASE64
        //
        // Hanya dilakukan di SERVER.
        // Browser tidak lagi melakukan Base64.
        // =================================================

        const content =
            buffer.toString("base64");


        // =================================================
        // CEK FILE SUDAH ADA
        // =================================================

        let sha = undefined;


        const checkResponse =
            await fetch(
                githubUrl,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                        "Accept":
                            "application/vnd.github+json",

                        "X-GitHub-Api-Version":
                            "2022-11-28"

                    }

                }
            );


        // =================================================
        // AMBIL SHA
        // =================================================

        if (checkResponse.ok) {

            const existingFile =
                await checkResponse.json();

            sha =
                existingFile.sha;

        }


        // =================================================
        // DATA UNTUK GITHUB
        // =================================================

        const githubData = {

            message:
                `Upload ${folderLower}/${safeSubfolder}: ${safeFilename}`,

            content:
                content,

            branch:
                branch

        };


        // =================================================
        // FILE SUDAH ADA
        // =================================================

        if (sha) {

            githubData.sha =
                sha;

        }


        // =================================================
        // UPLOAD KE GITHUB
        // =================================================

        console.log(
            "Mengirim file ke GitHub..."
        );


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
                        JSON.stringify(githubData)

                }
            );


        // =================================================
        // BACA RESPONSE GITHUB
        // =================================================

        const result =
            await uploadResponse.json();


        // =================================================
        // GITHUB ERROR
        // =================================================

        if (!uploadResponse.ok) {

            console.error(
                "GitHub error:",
                result
            );


            return res
                .status(uploadResponse.status)
                .json({

                    success: false,

                    message:
                        "Gagal menyimpan file ke GitHub",

                    github:
                        result

                });

        }


        // =================================================
        // BERHASIL
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
                result.content?.html_url || null

        });


    } catch (error) {

        // =================================================
        // ERROR SERVER
        // =================================================

        console.error(
            "UPLOAD ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message || "Terjadi kesalahan server"

        });

    }

}

