
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
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );


    // =====================================================
    // HANDLE OPTIONS
    // =====================================================

    if (req.method === "OPTIONS") {

        return res.status(200).end();

    }


    // =====================================================
    // HANYA GET
    // =====================================================

    if (req.method !== "GET") {

        return res.status(405).json({

            success: false,

            message: "Method tidak diizinkan"

        });

    }


    try {

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
        // CEK ENV
        // =================================================

        if (!token || !owner || !repo) {

            return res.status(500).json({

                success: false,

                message:
                    "Environment Variables belum lengkap"

            });

        }


        // =================================================
        // AMBIL TYPE DARI URL
        // =================================================

        const type =
            req.query.type;


        // =================================================
        // TENTUKAN FOLDER
        // =================================================

        let path;


        if (type === "manual") {

            // Manual Book
            path =
                "Download/ManualBook";

        }

        else if (type === "galeri") {

            // Foto / Video
            path =
                "Download/FotoVideo";

        }

        else {

            // Kompatibilitas dengan sistem lama
            path =
                "Download";

        }


        // =================================================
        // URL GITHUB API
        // =================================================

        const githubUrl =
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;


        // =================================================
        // REQUEST KE GITHUB
        // =================================================

        const response =
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
        // AMBIL HASIL
        // =================================================

        const data =
            await response.json();


        // =================================================
        // CEK ERROR GITHUB
        // =================================================

        if (!response.ok) {

            console.error(
                "GitHub error:",
                data
            );


            return res
                .status(response.status)
                .json({

                    success: false,

                    message:
                        `Gagal membaca folder ${path}`,

                    github:
                        data

                });

        }


        // =================================================
        // FILTER FILE
        // =================================================

        const files =
            data
                .filter(item =>
                    item.type === "file"
                )
                .map(item => ({

                    name:
                        item.name,

                    path:
                        item.path,

                    download_url:
                        item.download_url,

                    html_url:
                        item.html_url

                }));


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            type:
                type || "all",

            folder:
                path,

            count:
                files.length,

            files:
                files

        });


    } catch (error) {

        console.error(error);


        return res.status(500).json({

            success: false,

            message:
                error.message

        });

    }

}

