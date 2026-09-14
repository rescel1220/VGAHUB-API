
// =====================================================
// VGA HUB CENTER
// SCRIPT.JS
// =====================================================


// =====================================================
// URL API VERCEL
// =====================================================

const VERCEL_BASE_URL =
    "https://apivga.vercel.app";


// API UPLOAD
const VERCEL_UPLOAD_API =
    VERCEL_BASE_URL + "/api/upload";


// API LIST
const VERCEL_LIST_API =
    VERCEL_BASE_URL + "/api/list";


// =====================================================
// TENTUKAN FOLDER UTAMA BERDASARKAN HALAMAN
// =====================================================

function getFolderUtama() {

    const halaman =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    // ---------------------------------------------
    // CONVERTER
    // ---------------------------------------------

    if (halaman === "converter.html") {

        return "converter";

    }


    // ---------------------------------------------
    // MCU / MONO CHROME
    // ---------------------------------------------

    if (
        halaman === "mcu.html" ||
        halaman === "monochrome.html"
    ) {

        return "mcu";

    }


    // ---------------------------------------------
    // HMI
    // ---------------------------------------------

    if (halaman === "hmi.html") {

        return "hmi";

    }


    return null;
}


// =====================================================
// FUNGSI UNTUK UPLOAD
// =====================================================
// Menggunakan folder utama yang sama dengan daftar folder.
// =====================================================

function getUploadFolder() {

    return getFolderUtama();

}


// =====================================================
// TAMPILKAN / SEMBUNYIKAN FORM UPLOAD
// =====================================================

function tampilkanFormUpload() {

    const form =
        document.getElementById(
            "uploadForm"
        );


    if (!form) {

        console.error(
            "uploadForm tidak ditemukan"
        );

        return;

    }


    if (
        form.style.display === "none" ||
        form.style.display === ""
    ) {

        form.style.display =
            "block";

    } else {

        form.style.display =
            "none";

    }

}


// =====================================================
// TAMPILKAN FILE YANG DIPILIH
// =====================================================

function tampilkanFileDipilih() {

    const input =
        document.getElementById(
            "fileInput"
        );


    const daftar =
        document.getElementById(
            "fileList"
        );


    if (!input || !daftar) {

        return;

    }


    daftar.innerHTML = "";


    // ---------------------------------------------
    // BELUM ADA FILE
    // ---------------------------------------------

    if (input.files.length === 0) {

        daftar.innerHTML =
            "<p>Belum ada file dipilih.</p>";

        return;

    }


    // ---------------------------------------------
    // JUMLAH FILE
    // ---------------------------------------------

    const judul =
        document.createElement(
            "h3"
        );


    judul.textContent =
        "File yang dipilih: " +
        input.files.length;


    daftar.appendChild(
        judul
    );


    // ---------------------------------------------
    // TAMPILKAN SATU-SATU
    // ---------------------------------------------

    for (
        let i = 0;
        i < input.files.length;
        i++
    ) {

        const file =
            input.files[i];


        const item =
            document.createElement(
                "div"
            );


        item.className =
            "upload-file-item";


        item.textContent =
            (i + 1) +
            ". " +
            file.name +
            " (" +
            formatUkuranFile(
                file.size
            ) +
            ")";


        daftar.appendChild(
            item
        );

    }

}


// =====================================================
// FORMAT UKURAN FILE
// =====================================================

function formatUkuranFile(bytes) {

    if (bytes === 0) {

        return "0 Byte";

    }


    const ukuran = [

        "Byte",
        "KB",
        "MB",
        "GB",
        "TB"

    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    const indexAman =
        Math.min(
            index,
            ukuran.length - 1
        );


    return (

        bytes /
        Math.pow(
            1024,
            indexAman
        )

    )
        .toFixed(2)
        +
        " " +
        ukuran[indexAman];

}


// =====================================================
// KONVERSI FILE KE BASE64
// =====================================================

function fileKeBase64(file) {

    return new Promise(
        function (
            resolve,
            reject
        ) {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    try {

                        const result =
                            reader.result;


                        const base64 =
                            result.split(",")[1];


                        if (!base64) {

                            reject(
                                new Error(
                                    "Gagal mengubah file ke Base64"
                                )
                            );

                            return;

                        }


                        resolve(
                            base64
                        );

                    } catch (error) {

                        reject(
                            error
                        );

                    }

                };


            reader.onerror =
                function () {

                    reject(
                        new Error(
                            "Gagal membaca file"
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


// =====================================================
// UPLOAD SEMUA FILE
// =====================================================

async function uploadSemuaFile() {

    const input =
        document.getElementById(
            "fileInput"
        );


    const status =
        document.getElementById(
            "uploadStatus"
        );


    const folderInput =
        document.getElementById(
            "folderInput"
        );


    // =================================================
    // CEK ELEMENT
    // =================================================

    if (!input) {

        console.error(
            "fileInput tidak ditemukan"
        );

        return;

    }


    if (!status) {

        console.error(
            "uploadStatus tidak ditemukan"
        );

        return;

    }


    if (!folderInput) {

        status.innerHTML =
            "❌ Input nama folder tidak ditemukan.";

        return;

    }


    // =================================================
    // CEK FILE
    // =================================================

    if (input.files.length === 0) {

        status.innerHTML =
            "❌ Silakan pilih file terlebih dahulu.";

        return;

    }


    // =================================================
    // AMBIL NAMA FOLDER UTAMA
    // =================================================

    const folder =
        getUploadFolder();


    if (!folder) {

        status.innerHTML =
            "❌ Folder utama tidak diketahui.";

        return;

    }


    // =================================================
    // AMBIL NAMA SUBFOLDER
    // =================================================

    const subfolder =
        folderInput.value.trim();


    if (subfolder === "") {

        status.innerHTML =
            "❌ Silakan masukkan nama folder.";

        folderInput.focus();

        return;

    }


    // =================================================
    // AMANKAN NAMA SUBFOLDER
    // =================================================

    const safeSubfolder =
        subfolder
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );


    if (safeSubfolder === "") {

        status.innerHTML =
            "❌ Nama folder tidak valid.";

        return;

    }


    // =================================================
    // STATUS AWAL
    // =================================================

    status.innerHTML =
        "⏳ Menyiapkan upload...";


    let berhasil = 0;

    let gagal = 0;


    // =================================================
    // UPLOAD FILE SATU PER SATU
    // =================================================

    for (
        let i = 0;
        i < input.files.length;
        i++
    ) {

        const file =
            input.files[i];


        status.innerHTML =
            "⏳ Upload file " +
            (i + 1) +
            " dari " +
            input.files.length +
            ": " +
            escapeHtml(
                file.name
            );


        try {

            // -----------------------------------------
            // BASE64
            // -----------------------------------------

            const base64 =
                await fileKeBase64(
                    file
                );


            // -----------------------------------------
            // DATA KE API
            // -----------------------------------------

            const data = {

                filename:
                    file.name,

                content:
                    base64,

                folder:
                    folder,

                subfolder:
                    safeSubfolder

            };


            console.log(
                "Upload data:",
                {
                    filename: file.name,
                    folder: folder,
                    subfolder: safeSubfolder
                }
            );


            // -----------------------------------------
            // REQUEST VERCEL
            // -----------------------------------------

            const response =
                await fetch(
                    VERCEL_UPLOAD_API,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                data
                            )

                    }
                );


            // -----------------------------------------
            // AMBIL RESPONSE
            // -----------------------------------------

            const result =
                await response.json();


            // -----------------------------------------
            // CEK RESPONSE
            // -----------------------------------------

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(

                    result.message ||
                    "Upload gagal"

                );

            }


            berhasil++;


        } catch (error) {

            console.error(
                "Upload error:",
                error
            );


            gagal++;

        }

    }


    // =================================================
    // HASIL AKHIR
    // =================================================

    status.innerHTML =
        "✅ Upload selesai.<br>" +
        "Folder: " +
        escapeHtml(
            folder
        ) +
        "/" +
        escapeHtml(
            safeSubfolder
        ) +
        "<br>" +
        "Berhasil: " +
        berhasil +
        "<br>" +
        "Gagal: " +
        gagal;


    // =================================================
    // RESET INPUT FILE
    // =================================================

    input.value = "";


    const daftar =
        document.getElementById(
            "fileList"
        );


    if (daftar) {

        daftar.innerHTML =
            "<p>Belum ada file dipilih.</p>";

    }


    // =================================================
    // REFRESH DAFTAR FOLDER
    // =================================================

    loadDaftarFolder();

}


// =====================================================
// LOAD DAFTAR FOLDER
// =====================================================

async function loadDaftarFolder() {

    const folderList =
        document.getElementById(
            "folderList"
        );


    // ---------------------------------------------
    // ELEMENT TIDAK ADA
    // ---------------------------------------------

    if (!folderList) {

        return;

    }


    // ---------------------------------------------
    // FOLDER UTAMA
    // ---------------------------------------------

    const folderUtama =
        getFolderUtama();


    if (!folderUtama) {

        folderList.innerHTML =
            "❌ Folder halaman tidak diketahui.";

        return;

    }


    // ---------------------------------------------
    // STATUS
    // ---------------------------------------------

    folderList.innerHTML =
        "<p>⏳ Memuat daftar folder...</p>";


    try {

        const url =
            VERCEL_LIST_API +
            "?folder=" +
            encodeURIComponent(
                folderUtama
            );


        console.log(
            "Load folder:",
            url
        );


        const response =
            await fetch(
                url
            );


        const result =
            await response.json();


        // -----------------------------------------
        // CEK RESPONSE
        // -----------------------------------------

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(

                result.message ||
                "Gagal mengambil daftar folder"

            );

        }


        // -----------------------------------------
        // TIDAK ADA FOLDER
        // -----------------------------------------

        if (
            !result.folders ||
            result.folders.length === 0
        ) {

            folderList.innerHTML =
                "<p>📁 Belum ada folder.</p>";

            return;

        }


        // -----------------------------------------
        // BERSIHKAN
        // -----------------------------------------

        folderList.innerHTML = "";


        // -----------------------------------------
        // JUDUL
        // -----------------------------------------

        const judul =
            document.createElement(
                "p"
            );


        judul.textContent =
            "Jumlah folder: " +
            result.folders.length;


        folderList.appendChild(
            judul
        );


        // -----------------------------------------
        // BUAT DAFTAR
        // -----------------------------------------

        result.folders.forEach(
            function (
                folder
            ) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "folder-item";


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.textContent =
                    "📁 " +
                    folder.name;


                button.addEventListener(
                    "click",
                    function () {

                        bukaFolder(
                            folder.name
                        );

                    }
                );


                item.appendChild(
                    button
                );


                folderList.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "Load folder error:",
            error
        );


        folderList.innerHTML =
            "❌ Gagal memuat daftar folder.<br>" +
            escapeHtml(
                error.message
            );

    }

}


// =====================================================
// BUKA FOLDER
// =====================================================

async function bukaFolder(
    namaFolder
) {

    const folderUtama =
        getFolderUtama();


    const fileList =
        document.getElementById(
            "fileListFolder"
        );


    const judul =
        document.getElementById(
            "judulFile"
        );


    if (
        !folderUtama ||
        !fileList
    ) {

        return;

    }


    // =================================================
    // JUDUL
    // =================================================

    if (judul) {

        judul.textContent =
            "Isi Folder: " +
            namaFolder;

    }


    // =================================================
    // STATUS
    // =================================================

    fileList.innerHTML =
        "<p>⏳ Memuat file...</p>";


    try {

        const url =
            VERCEL_LIST_API +
            "?folder=" +
            encodeURIComponent(
                folderUtama
            ) +
            "&subfolder=" +
            encodeURIComponent(
                namaFolder
            );


        console.log(
            "Load files:",
            url
        );


        const response =
            await fetch(
                url
            );


        const result =
            await response.json();


        // -----------------------------------------
        // CEK RESPONSE
        // -----------------------------------------

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(

                result.message ||
                "Gagal membaca isi folder"

            );

        }


        // -----------------------------------------
        // FOLDER KOSONG
        // -----------------------------------------

        if (
            !result.files ||
            result.files.length === 0
        ) {

            fileList.innerHTML =
                "<p>📁 Folder masih kosong.</p>";

            return;

        }


        // -----------------------------------------
        // BERSIHKAN
        // -----------------------------------------

        fileList.innerHTML = "";


        // -----------------------------------------
        // TAMPILKAN FILE
        // -----------------------------------------

        result.files.forEach(
            function (
                file
            ) {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "file-item";


                // ---------------------------------
                // INFO FILE
                // ---------------------------------

                const info =
                    document.createElement(
                        "div"
                    );


                info.className =
                    "file-info";


                const icon =
                    document.createElement(
                        "span"
                    );


                icon.className =
                    "file-icon";


                icon.textContent =
                    "📄";


                const name =
                    document.createElement(
                        "span"
                    );


                name.className =
                    "file-name";


                name.textContent =
                    file.name;


                info.appendChild(
                    icon
                );


                info.appendChild(
                    name
                );


                // ---------------------------------
                // ACTION
                // ---------------------------------

                const action =
                    document.createElement(
                        "div"
                    );


                action.className =
                    "file-action";


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    file.download_url;


                link.target =
                    "_blank";


                link.rel =
                    "noopener noreferrer";


                link.textContent =
                    "Buka / Download";


                action.appendChild(
                    link
                );


                // ---------------------------------
                // GABUNGKAN
                // ---------------------------------

                item.appendChild(
                    info
                );


                item.appendChild(
                    action
                );


                fileList.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        console.error(
            "Load file error:",
            error
        );


        fileList.innerHTML =
            "❌ Gagal memuat isi folder.<br>" +
            escapeHtml(
                error.message
            );

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// =====================================================
// EVENT DOMCONTENTLOADED
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ---------------------------------------------
        // FILE INPUT
        // ---------------------------------------------

        const input =
            document.getElementById(
                "fileInput"
            );


        if (input) {

            input.addEventListener(
                "change",
                tampilkanFileDipilih
            );

        }


        // ---------------------------------------------
        // LOAD DAFTAR FOLDER
        // ---------------------------------------------

        loadDaftarFolder();

    }
);

