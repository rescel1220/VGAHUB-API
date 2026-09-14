```javascript
export default async function handler(req, res) {

    // =====================================================
    // CORS
    // =====================================================

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // =====================================================
    // HANDLE PREFLIGHT BROWSER
    // =====================================================

    if (req.method === "OPTIONS") {

        return res.status(200).end();

    }


    // =====================================================
    // TEST API DENGAN GET
    // =====================================================

    if (req.method === "GET") {

        return res.status(200).json({

            success: true,

            message: "API Vercel aktif"

        });

    }


    // =====================================================
    // HANYA POST UNTUK UPLOAD
    // =====================================================

    if (req.method !== "POST") {

        return res.status(405).json({

            success: false,

            message: "Method tidak diizinkan"

        });

    }


    try {

        // =================================================
        // AMBIL DATA
        // =================================================

        const {
            filename,
            content,
            folder
        } = req.body;


        // =================================================
        // CEK DATA
        // =================================================

        if (!filename || !content || !folder) {

            return res.status(400).json({

                success: false,

                message:
                    "filename, content, atau folder kosong"

            });

        }


        // =================================================
        // NORMALISASI NAMA FOLDER
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


        // =================================================
        // VALIDASI FOLDER
        // =================================================

        if (!allowedFolders.includes(folderLower)) {

            return res.status(400).json({

                success: false,

                message:
                    "Folder tidak diizinkan. Gunakan hmi, converter, atau mcu."

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
        // AMANKAN NAMA FILE
        // =================================================

        const safeFilename =
            filename
                .toString()
                .replace(/[^a-zA-Z0-9._-]/g, "_");


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
        // PATH GITHUB
        // =================================================

        const path =
            `${folderLower}/${safeFilename}`;


        // =================================================
        // URL GITHUB API
        // =================================================

        const githubUrl =
            `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;


        // =================================================
        // CEK FILE SUDAH ADA ATAU BELUM
        // =================================================

        let sha = undefined;


        const checkResponse =
            await fetch(githubUrl, {

                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`,

                    "Accept":
                        "application/vnd.github+json",

                    "X-GitHub-Api-Version":
                        "2022-11-28"

                }

            });


        // =================================================
        // AMBIL SHA FILE LAMA
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
                `Upload ${folderLower}: ${safeFilename}`,

            content:
                content,

            branch:
                branch

        };


        // =================================================
        // JIKA FILE SUDAH ADA
        // =================================================

        if (sha) {

            githubData.sha =
                sha;

        }


        // =================================================
        // UPLOAD KE GITHUB
        // =================================================

        const uploadResponse =
            await fetch(githubUrl, {

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

            });


        // =================================================
        // HASIL GITHUB
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

        return res.status(200).json({

            success: true,

            message:
                "File berhasil disimpan ke GitHub",

            filename:
                safeFilename,

            folder:
                folderLower,

            path:
                path,

            url:
                result.content?.html_url || null

        });


    } catch (error) {

        // =================================================
        // ERROR SERVER
        // =================================================

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}
```
