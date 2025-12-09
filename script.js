// --- KONFIGURASI ---
// GANTI DENGAN URL SCRIPT BARU KAMU HASIL DEPLOY ULANG
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwLLIqeUwLWOZ7PwCzAzwRCvnqD-KHGXyynOFZyCabtpdWaz4erjRZgIvvQkbiw-xcNHQ/exec"; 

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
let allMemories = []; // Tempat menyimpan data yang ditarik dari Google Sheets

const grid = document.getElementById('galleryGrid');
const modal = document.getElementById('modalOverlay');
const statusText = document.getElementById('uploadStatus');
const saveBtn = document.querySelector('.btn-save');
const titleDisplay = document.getElementById('monthTitleDisplay');

// Init saat halaman dimuat
window.onload = () => {
    fetchAllData(); // Tarik data dari internet dulu
};

// --- FUNGSI TARIK DATA (GET) ---
function fetchAllData() {
    // Tampilkan loading di judul bulan biar user tau
    if(titleDisplay) titleDisplay.innerText = "Loading...";
    
    fetch(GOOGLE_SCRIPT_URL)
    .then(response => response.json())
    .then(data => {
        allMemories = data; // Simpan data dari database
        renderNav();
        renderGrid();
        updateTitle();
        
        // Mulai hujan sakura setelah data siap
        setInterval(createSakura, 300);
    })
    .catch(err => {
        console.error("Gagal ambil data:", err);
        titleDisplay.innerText = "Error :(";
    });
}

function updateTitle() {
    if(titleDisplay) titleDisplay.innerText = months[currentMonthIdx].name;
}

// --- RENDER NAVIGASI ---
function renderNav() {
    const nav = document.getElementById('monthNav');
    nav.innerHTML = '';
    
    months.forEach((m, i) => {
        const btn = document.createElement('button');
        const shortName = m.name.substring(0, 3);
        
        btn.className = `month-btn ${i === currentMonthIdx ? 'active' : ''}`;
        btn.innerText = shortName;
        
        btn.onclick = () => {
            if (i === currentMonthIdx) return;
            grid.classList.add('fade-out');
            titleDisplay.style.opacity = '0';

            setTimeout(() => {
                currentMonthIdx = i;
                renderNav();
                renderGrid();
                updateTitle();
                titleDisplay.style.opacity = '1';
                grid.classList.remove('fade-out');
            }, 300);
        };
        nav.appendChild(btn);
    });
}

// --- RENDER GRID ---
function renderGrid() {
    grid.innerHTML = '';
    const mData = months[currentMonthIdx];
    const monthName = mData.name;
    
    for (let d = 1; d <= mData.days; d++) {
        // Cari apakah ada data di tanggal & bulan ini dari database
        // Kita bandingkan string tanggal & bulan agar cocok
        const memory = allMemories.find(m => m.month == monthName && m.date == d);

        const slot = document.createElement('div');
        const rot = Math.floor(Math.random() * 5) - 2; 
        slot.style.transform = `rotate(${rot}deg)`;
        
        const dateBadge = `<div class="date-corner">${d}</div>`;

        if (memory) {
            // Jika data ditemukan
            slot.className = 'photo-slot slot-filled';
            slot.innerHTML = `
                ${dateBadge}
                <img src="${memory.image}" alt="Foto">
                <div class="caption-preview">${memory.caption || ""}</div>
            `;
            // Saat diklik, tampilkan modal view only (atau edit caption kalau mau ribet, tapi view only dulu biar aman)
            slot.onclick = () => openModal(d, memory);
        } else {
            // Jika kosong
            slot.className = 'photo-slot slot-empty';
            slot.innerHTML = `${dateBadge}<div style="font-size:2rem; opacity:0.3; color:#ff6b6b;">+</div>`;
            slot.onclick = () => openModal(d, null);
        }
        grid.appendChild(slot);
    }
}

// --- MODAL ---
function openModal(day, existingData) {
    activeDay = day; tempBase64 = null; currentFile = null;
    document.getElementById('modalTitle').innerText = `Tgl ${day} ${months[currentMonthIdx].name}`;
    document.getElementById('fileInput').value = ""; 
    const imgPreview = document.getElementById('previewImg');
    const captionInput = document.getElementById('captionInput');
    const btnChoose = document.getElementById('btnChooseFile');
    const btnDelete = document.getElementById('btnDelete'); // Tombol hapus kita sembunyikan dulu di mode online
    
    statusText.style.display = 'none';
    saveBtn.disabled = false;
    saveBtn.innerText = "Simpan";
    btnDelete.style.display = 'none'; // Hapus di database agak rumit, kita matikan dulu fiturnya untuk keamanan

    if (existingData) {
        // Mode Lihat Detail
        imgPreview.src = existingData.image; 
        imgPreview.style.display = "block";
        captionInput.value = existingData.caption;
        // Kalau sudah ada data, kita disable tombol simpan biar ga numpuk
        btnChoose.style.display = 'none';
        captionInput.disabled = true;
        saveBtn.style.display = 'none';
    } else {
        // Mode Upload Baru
        imgPreview.style.display = "none"; 
        imgPreview.src = "";
        captionInput.value = "";
        captionInput.disabled = false;
        btnChoose.style.display = 'inline-block';
        btnChoose.innerText = "📸 Pilih Foto";
        saveBtn.style.display = 'inline-block';
    }
    modal.style.display = "flex";
}

function closeModal() { modal.style.display = "none"; }

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

// --- SIMPAN KE DATABASE (POST) ---
function saveData() {
    if (!tempBase64 || !currentFile) {
        alert("Pilih foto dulu ya! 😋");
        return;
    }
    
    statusText.style.display = 'block';
    statusText.innerText = "Sedang mengirim ke Database Naura... ⏳";
    saveBtn.disabled = true;

    const payload = {
        month: months[currentMonthIdx].name, // Kirim Nama Bulan
        date: activeDay,                     // Kirim Tanggal
        image: tempBase64,
        mimeType: currentFile.type,
        filename: `Naura_${months[currentMonthIdx].name}_${activeDay}`,
        caption: document.getElementById('captionInput').value
    };

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        // Hapus mode 'no-cors' agar kita bisa baca respon JSON sukses/gagal
        // Google Script harus di-return sebagai JSON
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if(result.status === 'success') {
            alert("Berhasil masuk Database! 🎉");
            // Refresh data agar foto baru muncul
            closeModal();
            fetchAllData(); 
        } else {
            alert("Gagal menyimpan: " + result.message);
            saveBtn.disabled = false;
        }
    })
    .catch(err => {
        // Fallback kalau error jaringan
        console.error(err);
        alert("Upload terkirim! (Refresh halaman jika belum muncul) ✅");
        closeModal();
        fetchAllData(); 
    });
}

// --- SAKURA ANIMATION ---
function createSakura() {
    const sakura = document.createElement('div');
    sakura.classList.add('sakura');
    sakura.style.left = Math.random() * 100 + 'vw';
    sakura.style.animationDuration = Math.random() * 5 + 5 + 's';
    const size = Math.random() * 10 + 10 + 'px';
    sakura.style.width = size; sakura.style.height = size;
    document.body.appendChild(sakura);
    setTimeout(() => { sakura.remove(); }, 10000);
}

window.onclick = function(event) { if (event.target == modal) closeModal(); }