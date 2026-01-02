// --- KONFIGURASI ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwq7nqgH2YshtOOcDgS_KlXquELaFgdyym4NVJH3o_v62itSUkid7Cb4hOnyHgdZpIIxw/exec"; 

const months = [
    { name: "Januari", days: 31 }, { name: "Februari", days: 28 },
    { name: "Maret", days: 31 }, { name: "April", days: 30 },
    { name: "Mei", days: 31 }, { name: "Juni", days: 30 },
    { name: "Juli", days: 31 }, { name: "Agustus", days: 31 },
    { name: "September", days: 30 }, { name: "Oktober", days: 31 },
    { name: "November", days: 30 }, { name: "Desember", days: 31 }
];

let currentYear = 2026; 
let currentMonthIdx = 0;
let activeDay = null;
let tempBase64 = null;
let currentFile = null;
let allMemories = []; 
let isEditing = false;

const grid = document.getElementById('galleryGrid');
const modal = document.getElementById('modalOverlay');
const letterModal = document.getElementById('letterModal');
const statusText = document.getElementById('uploadStatus');
const saveBtn = document.querySelector('.btn-save');
const titleDisplay = document.getElementById('monthTitleDisplay');
const loadingScreen = document.getElementById('loadingScreen');

// Init
window.onload = () => { 
    fetchAllData(); 
};

// --- FUNGSI GANTI TAHUN ---
function changeYear(year) {
    currentYear = year;
    document.getElementById('btn2025').classList.remove('active');
    document.getElementById('btn2026').classList.remove('active');
    document.getElementById(`btn${year}`).classList.add('active');
    renderGrid();
}

// --- TARIK DATA ---
function fetchAllData() {
    fetch(GOOGLE_SCRIPT_URL)
    .then(r => r.json())
    .then(data => {
        allMemories = data;
        renderNav();
        renderGrid();
        updateTitle();
        setInterval(createSakura, 300);
        
        // --- LOGIKA HILANGKAN LOADING & MUNCULKAN SURAT ---
        if(loadingScreen) loadingScreen.style.display = 'none';
        
        // Ini kuncinya: Ubah display surat dari 'none' (CSS) jadi 'flex' (JS)
        const letterBtn = document.getElementById('letterBtn');
        if(letterBtn) letterBtn.style.display = 'flex';
    })
    .catch(err => {
        console.error(err);
        if(loadingScreen) loadingScreen.innerHTML = "<p style='color:red'>Gagal memuat data :(</p>";
    });
}

function updateTitle() {
    if(titleDisplay) titleDisplay.innerText = months[currentMonthIdx].name;
}

// --- RENDER NAV ---
function renderNav() {
    const nav = document.getElementById('monthNav');
    nav.innerHTML = '';
    months.forEach((m, i) => {
        const btn = document.createElement('button');
        btn.className = `month-btn ${i === currentMonthIdx ? 'active' : ''}`;
        btn.innerText = m.name.substring(0, 3);
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
    for (let d = 1; d <= mData.days; d++) {
        const memory = allMemories.find(m => m.year == currentYear && m.month == mData.name && m.date == d);
        const slot = document.createElement('div');
        const rot = Math.floor(Math.random() * 5) - 2; 
        slot.style.transform = `rotate(${rot}deg)`;
        const dateBadge = `<div class="date-corner">${d}</div>`;

        if (memory) {
            slot.className = 'photo-slot slot-filled';
            slot.innerHTML = `
                ${dateBadge}
                <img src="${memory.image}" alt="Foto">
                <div class="caption-preview">${memory.caption || ""}</div>
            `;
            slot.onclick = () => openModal(d, memory);
        } else {
            slot.className = 'photo-slot slot-empty';
            slot.innerHTML = `${dateBadge}<div style="font-size:2rem; opacity:0.3; color:#ff6b6b;">+</div>`;
            slot.onclick = () => openModal(d, null);
        }
        grid.appendChild(slot);
    }
}

// --- MODAL ---
function openModal(day, existingData) {
    activeDay = day; 
    tempBase64 = null; 
    currentFile = null;
    
    document.getElementById('modalTitle').innerText = `Tgl ${day} ${months[currentMonthIdx].name} ${currentYear}`;
    document.getElementById('fileInput').value = ""; 
    const imgPreview = document.getElementById('previewImg');
    const captionInput = document.getElementById('captionInput');
    const btnChoose = document.getElementById('btnChooseFile');
    const btnDelete = document.getElementById('btnDelete');
    
    statusText.style.display = 'none';
    saveBtn.disabled = false;
    saveBtn.innerText = "Simpan";
    captionInput.disabled = false; 
    btnChoose.style.display = 'inline-block'; 
    saveBtn.style.display = 'inline-block'; 

    if (existingData) {
        isEditing = true;
        imgPreview.src = existingData.image; 
        imgPreview.style.display = "block";
        captionInput.value = existingData.caption;
        btnChoose.innerText = "Ganti Foto"; 
        btnDelete.style.display = 'inline-block'; 
    } else {
        isEditing = false;
        imgPreview.style.display = "none"; 
        imgPreview.src = "";
        captionInput.value = "";
        btnChoose.innerText = "📸 Pilih Foto";
        btnDelete.style.display = 'none'; 
    }
    modal.style.display = "flex";
}

function closeModal() { modal.style.display = "none"; }

// --- LOGIKA SURAT RAHASIA ---
function openLetter() {
    letterModal.style.display = "flex";
}

function closeLetter() {
    letterModal.style.display = "none";
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

// --- SIMPAN ---
function saveData() {
    if (!isEditing && !tempBase64) {
        alert("Pilih foto dulu ya! 😋");
        return;
    }
    statusText.style.display = 'block';
    statusText.innerText = isEditing ? "Mengupdate data... ⏳" : "Mengupload kenangan... ⏳";
    saveBtn.disabled = true;

    const payload = {
        action: 'save', 
        year: currentYear, 
        month: months[currentMonthIdx].name,
        date: activeDay,
        caption: document.getElementById('captionInput').value,
        image: tempBase64, 
        mimeType: currentFile ? currentFile.type : null,
        filename: `Naura_${currentYear}_${months[currentMonthIdx].name}_${activeDay}`
    };
    sendRequest(payload);
}

// --- HAPUS ---
function deleteData() {
    if(confirm("Yakin mau hapus kenangan ini? 😢")) {
        statusText.style.display = 'block';
        statusText.innerText = "Menghapus kenangan... 🗑️";
        const payload = {
            action: 'delete',
            year: currentYear, 
            month: months[currentMonthIdx].name,
            date: activeDay
        };
        sendRequest(payload);
    }
}

function sendRequest(payload) {
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(result => {
        if(result.status === 'success') {
            alert(result.message);
            closeModal();
            fetchAllData(); 
        } else {
            alert("Gagal: " + result.message);
            saveBtn.disabled = false;
        }
    })
    .catch(err => {
        console.error(err);
        alert("Proses selesai (Cek hasilnya)."); 
        closeModal();
        fetchAllData();
    });
}

// --- SAKURA ---
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

// --- MUSIK ---
const music = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');
let isPlaying = false;

function toggleMusic() {
    if (isPlaying) {
        music.pause();
        musicBtn.classList.remove('music-spin');
        musicBtn.innerText = "🎵";
    } else {
        music.play();
        musicBtn.classList.add('music-spin');
        musicBtn.innerText = "💿";
    }
    isPlaying = !isPlaying;
}

// --- TUTUP MODAL SAAT KLIK LUAR ---
window.onclick = function(event) {
    if (event.target == modal) closeModal();
    if (event.target == letterModal) closeLetter();
}