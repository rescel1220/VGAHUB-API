export default async function handler(req, res) {

    // Hanya menerima POST
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan"
        });
    }

    try {

        // Ambil data JSON dari request
        const { filename, content } = req.body;

        // Cek data
        if (!filename || !content) {
            return res.status(400).json({
                success: false,
                message: "filename atau content kosong"
            });
        }

        // Environment Variables
        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;
        const branch = process.env.GITHUB_BRANCH || "main";

        if (!token || !owner || !repo) {
            return res.status(500).json({
                success: false,
                message: "Environment Variables belum lengkap"
            });
        }

        // Nama file tujuan di GitHub
        const path = `Download/${filename}`;

        // URL GitHub API
        const githubUrl =
            `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

        // Cek apakah file sudah ada
        let sha = undefined;

        const checkResponse = await fetch(githubUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"
            }
        });

        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            sha = existingFile.sha;
        }

        // Data untuk GitHub
        const githubData = {
            message: `Upload file ${filename}`,
            content: content,
            branch: branch
        };

        // Kalau file sudah ada, kirim SHA
        if (sha) {
            githubData.sha = sha;
        }

        // Kirim file ke GitHub
        const uploadResponse = await fetch(githubUrl, {
            method: "PUT",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28"
            },

            body: JSON.stringify(githubData)
        });

        const result = await uploadResponse.json();

        if (!uploadResponse.ok) {

            console.error("GitHub error:", result);

            return res.status(uploadResponse.status).json({
                success: false,
                message: "Gagal menyimpan file ke GitHub",
                github: result
            });
        }

        return res.status(200).json({
            success: true,
            message: "File berhasil disimpan ke GitHub",
            filename: filename,
            path: path,
            url: result.content?.html_url || null
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
