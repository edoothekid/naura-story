// --- KONFIGURASI ---
// URL Google Script (Pastikan ini URL terbaru yang kamu deploy)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyVnieGeku9BfO4TRsPJ6KCAEpDHiIk17rRPJPVi7epmGmjEpZg_xgOgguhEaGdraPWw/exec";

const months = [
    { name: "Januari", days: 31 }, { name: "Februari", days: 28 },
    { name: "Maret", days: 31 }, { name: "April", days: 30 },
    { name: "Mei", days: 31 }, { name: "Juni", days: 30 },
    { name: "Juli", days: 31 }, { name: "Agustus", days: 31 },
    { name: "September", days: 30 }, { name: "Oktober", days: 31 },
    { name: "November", days: 30 }, { name: "Desember", days: 31 }
];

let currentMonthIdx = 0;
let activeDay = null;
let tempBase64 = null;
let currentFile = null;

const grid = document.getElementById('galleryGrid');
const modal = document.getElementById('modalOverlay');
const statusText = document.getElementById('uploadStatus');
const saveBtn = document.querySelector('.btn-save');
const titleDisplay = document.getElementById('monthTitleDisplay');

// Init saat halaman dimuat
window.onload = () => {
    renderNav();
    renderGrid();
    updateTitle();
};

// --- FUNGSI UPDATE JUDUL BULAN ---
function updateTitle() {
    if(titleDisplay) {
        titleDisplay.innerText = months[currentMonthIdx].name;
    }
}

// --- FUNGSI RENDER NAVIGASI (DENGAN ANIMASI) ---
function renderNav() {
    const nav = document.getElementById('monthNav');
    nav.innerHTML = '';
    
    months.forEach((m, i) => {
        const btn = document.createElement('button');
        // Singkat nama bulan jadi 3 huruf (Jan, Feb, Mar...)
        const shortName = m.name.substring(0, 3);
        
        btn.className = `month-btn ${i === currentMonthIdx ? 'active' : ''}`;
        btn.innerText = shortName;
        
        // INTERAKSI KLIK DENGAN ANIMASI FADE
        btn.onclick = () => {
            // Jangan lakukan apa-apa jika klik bulan yang sedang aktif
            if (i === currentMonthIdx) return;

            // 1. Animasi Keluar (Fade Out)
            grid.classList.add('fade-out');
            titleDisplay.style.opacity = '0'; // Judul ikut kedip

            // 2. Tunggu sebentar (300ms)
            setTimeout(() => {
                currentMonthIdx = i;
                
                // 3. Render Ulang Data Baru
                renderNav();
                renderGrid();
                updateTitle();

                // 4. Animasi Masuk (Fade In)
                titleDisplay.style.opacity = '1';
                grid.classList.remove('fade-out');
                
            }, 300); // Sesuai durasi transisi CSS
        };
        
        nav.appendChild(btn);
    });
}

// --- FUNGSI RENDER GRID FOTO ---
function renderGrid() {
    grid.innerHTML = '';
    const mData = months[currentMonthIdx];
    
    for (let d = 1; d <= mData.days; d++) {
        const key = `naura_memories_${mData.name}_${d}`;
        const rawData = localStorage.getItem(key);
        let data = rawData ? JSON.parse(rawData) : null;

        const slot = document.createElement('div');
        // Rotasi acak sedikit biar tidak kaku
        const rot = Math.floor(Math.random() * 5) - 2; 
        slot.style.transform = `rotate(${rot}deg)`;
        
        const dateBadge = `<div class="date-corner">${d}</div>`;

        if (data) {
            // Jika ada foto
            slot.className = 'photo-slot slot-filled';
            slot.innerHTML = `
                ${dateBadge}
                <img src="${data.image}" alt="Foto">
                <div class="caption-preview">${data.caption || ""}</div>
            `;
            slot.onclick = () => openModal(d, data);
        } else {
            // Jika kosong
            slot.className = 'photo-slot slot-empty';
            // Simbol plus (+)
            slot.innerHTML = `${dateBadge}<div style="font-size:2rem; opacity:0.3; color:#ff6b6b;">+</div>`;
            slot.onclick = () => openModal(d, null);
        }
        grid.appendChild(slot);
    }
}

// --- FUNGSI MODAL POPUP ---
function openModal(day, existingData) {
    activeDay = day; 
    tempBase64 = null; 
    currentFile = null;
    
    document.getElementById('modalTitle').innerText = `Tgl ${day} ${months[currentMonthIdx].name}`;
    document.getElementById('fileInput').value = ""; 
    const imgPreview = document.getElementById('previewImg');
    const captionInput = document.getElementById('captionInput');
    const btnChoose = document.getElementById('btnChooseFile');
    const btnDelete = document.getElementById('btnDelete');
    
    // Reset status upload
    statusText.style.display = 'none';
    saveBtn.disabled = false;
    saveBtn.innerText = "Simpan";

    if (existingData) {
        imgPreview.src = existingData.image; 
        imgPreview.style.display = "block";
        captionInput.value = existingData.caption;
        btnChoose.innerText = "Ganti Foto";
        btnDelete.style.display = "inline-block";
        tempBase64 = existingData.image;
    } else {
        imgPreview.style.display = "none"; 
        imgPreview.src = "";
        captionInput.value = "";
        btnChoose.innerText = "📸 Pilih Foto";
        btnDelete.style.display = "none";
    }
    modal.style.display = "flex";
}

function closeModal() {
    modal.style.display = "none";
}

function handleFileSelect(input) {
    if (input.files && input.files[0]) {
        currentFile = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            tempBase64 = e.target.result;
            document.getElementById('previewImg').src = tempBase64;
            document.getElementById('previewImg').style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- FUNGSI SIMPAN & UPLOAD ---
function saveData() {
    if (!tempBase64) {
        alert("Upload foto dulu dong! 😋");
        return;
    }
    const caption = document.getElementById('captionInput').value;
    const monthName = months[currentMonthIdx].name;

    // 1. Simpan ke LocalStorage Browser (Biar cepat muncul)
    const dataObj = { image: tempBase64, caption: caption };
    const key = `naura_memories_${monthName}_${activeDay}`;
    
    try {
        localStorage.setItem(key, JSON.stringify(dataObj));
    } catch (e) {
        alert("Memori browser penuh! Coba hapus beberapa foto lama.");
        return;
    }

    // 2. Upload ke Google Drive (Jika ada file baru)
    if (currentFile) {
        statusText.style.display = 'block';
        saveBtn.disabled = true;
        saveBtn.innerText = "Mengupload...";

        const payload = {
            image: tempBase64,
            mimeType: currentFile.type,
            filename: `Naura_${monthName}_Tgl${activeDay}.jpg`
        };

        // Kirim data ke Google Apps Script
        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert("Berhasil disimpan & dikirim ke Drive! ✅");
            closeModal();
            renderGrid();
        })
        .catch(err => {
            console.error(err);
            // Tetap tutup modal karena data lokal sudah tersimpan
            alert("Tersimpan di web, tapi gagal koneksi ke Drive ⚠️");
            closeModal();
            renderGrid();
        });

    } else {
        // Jika cuma ganti caption tanpa ganti foto
        closeModal();
        renderGrid();
    }
}

// --- FUNGSI HAPUS ---
function deleteData() {
    if(confirm("Yakin mau hapus kenangan ini? 😢")) {
        const key = `naura_memories_${months[currentMonthIdx].name}_${activeDay}`;
        localStorage.removeItem(key);
        closeModal();
        renderGrid();
    }
}

// Tutup modal kalau klik di luar area putih
window.onclick = function(event) {
    if (event.target == modal) closeModal();
}

// --- LOGIKA HUJAN SAKURA ---

function createSakura() {
    const sakura = document.createElement('div');
    sakura.classList.add('sakura');
    
    // Posisi acak dari kiri ke kanan layar (0% - 100%)
    sakura.style.left = Math.random() * 100 + 'vw';
    
    // Durasi jatuh acak (antara 5 sampai 10 detik) biar natural
    sakura.style.animationDuration = Math.random() * 5 + 5 + 's';
    
    // Ukuran acak (kecil/besar dikit)
    const size = Math.random() * 10 + 10 + 'px';
    sakura.style.width = size;
    sakura.style.height = size;
    
    document.body.appendChild(sakura);

    // Hapus elemen setelah animasi selesai (10 detik) biar browser ga berat
    setTimeout(() => {
        sakura.remove();
    }, 10000);
}

// Buat bunga baru setiap 300 milidetik (0.3 detik)
setInterval(createSakura, 300);