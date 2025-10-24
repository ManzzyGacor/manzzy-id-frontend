// scripts/dashboard.js (Versi API - Backend MongoDB)

// GANTI DENGAN URL VERCEL API ANDA SETELAH DEPLOYMENT!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data';
const API_AUTH_URL = 'https://manzzy-id-backend.vercel.app/api/auth'; 

let userToken = localStorage.getItem('userToken'); 
let userData = JSON.parse(localStorage.getItem('loggedInUser'));

// --- Setup Elements ---
const userSaldoElem = document.getElementById('user-saldo');
const userTransaksiElem = document.getElementById('user-transaksi');
const isiSaldoForm = document.getElementById('isiSaldoForm');
const logoutBtn = document.getElementById('logout-btn');
const productList = document.getElementById('product-list');
const adminInfoContainer = document.getElementById('admin-info-container');
const welcomeUsernameElem = document.getElementById('welcome-username');
const welcomeMenuText = document.getElementById('welcome-menu-item');
const hamburgerMenu = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');
const adminLink = document.getElementById('admin-link');

// --- Cek Status & Validasi ---
if (!userData || !userToken) {
    alert('Anda harus login untuk mengakses Dashboard.');
    window.location.href = 'index.html';
}

welcomeUsernameElem.textContent = userData.username;
welcomeMenuText.textContent = `Hai, ${userData.username}`;


// --- LOGIKA HAMBURGER MENU ---
hamburgerMenu.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('active');
    navLinks.classList.toggle('active');
});

if (!userData.isAdmin) {
    adminLink.textContent = 'Login Admin';
    adminLink.href = 'index.html'; 
    adminLink.addEventListener('click', () => {
        localStorage.removeItem('loggedInUser'); 
    });
} else {
    adminLink.textContent = 'Admin Panel';
    adminLink.href = 'admin.html';
}


// --- FUNGSI UTAMA DASHBOARD (MEMANGGIL API) ---
async function updateDashboard() {
    if (!userToken) return;

    try {
        const response = await fetch(`${API_DATA_URL}/user-dashboard`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Perbarui data lokal dengan data terbaru dari server
            userData.saldo = data.saldo;
            userData.transaksi = data.transaksi;
            localStorage.setItem('loggedInUser', JSON.stringify(userData)); 
            
            userSaldoElem.textContent = new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', minimumFractionDigits: 2,
            }).format(data.saldo);

            userTransaksiElem.textContent = data.transaksi;
        } else if (response.status === 401) {
            alert('Sesi habis. Silakan login kembali.');
            localStorage.removeItem('userToken');
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}
updateDashboard();

// Fungsi Tampilkan/Sembunyikan Form Isi Saldo
window.showIsiSaldoForm = function() {
    const formCard = document.getElementById('card-isi-saldo');
    formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    hamburgerMenu.classList.remove('active'); 
    navLinks.classList.remove('active');
}

window.hideIsiSaldoForm = function() {
    document.getElementById('card-isi-saldo').style.display = 'none';
}


// --- LOGIKA PRODUK DAN INFORMASI (Simulasi Frontend) ---
function getProducts() {
    const productsData = localStorage.getItem('manzzy_products');
    if (productsData) return JSON.parse(productsData);
    
    return [
        { id: 1, name: 'Premium ID Pass', price: 50000, desc: 'Akses ke semua fitur eksklusif, laporan bulanan, dan dukungan prioritas selama 1 bulan penuh.', imageURL: 'https://via.placeholder.com/150/00bcd4/000000?text=Premium' },
        { id: 2, name: 'Diamond Bundle', price: 150000, desc: 'Paket produk terbaik (3 item) dengan diskon 10% dan bonus E-book pengembangan diri.', imageURL: 'https://via.placeholder.com/150/ffd700/000000?text=Diamond' }
    ];
}

function renderProducts() {
    const productsToRender = getProducts();

    productList.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            <img src="${product.imageURL}" alt="Foto Produk" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 15px; border: 1px solid #333;">
            <h3 style="color: var(--color-accent);">${product.name}</h3>
            <p style="font-size: 0.9em; margin: 10px 0; flex-grow: 1;">${product.desc.substring(0, 100)}...</p>
            <p style="font-weight: 700; margin-bottom: 15px;">Harga: Rp ${product.price.toLocaleString('id-ID')}</p>
            <button class="btn-primary" onclick="buyProduct(${product.id}, ${product.price})" style="margin-top: auto;">BELI SEKARANG</button>
        </div>
    `).join('');
}
renderProducts();

window.buyProduct = function(id, price) {
    alert("Fungsi pembelian masih dalam simulasi. Saldo Anda saat ini: Rp " + userData.saldo.toLocaleString('id-ID'));
    // Pembelian yang sesungguhnya memerlukan endpoint API baru
};

const ADMIN_INFO = [
    { date: '23 Okt 2025', title: 'Maintenance Server', content: 'Server akan di maintenance pada pukul 03.00-05.00 WIB. Transaksi akan ditunda.' },
    { date: '20 Okt 2025', title: 'Promo Akhir Bulan', content: 'Nikmati diskon 20% untuk semua produk minggu ini!' }
];

function renderAdminInfo() {
    adminInfoContainer.innerHTML = ADMIN_INFO.map(info => `
        <div style="border-bottom: 1px dashed #333; padding: 15px 0;">
            <p style="color: var(--color-accent); font-weight: 600;">[${info.date}] ${info.title}</p>
            <p style="font-size: 0.9em;">${info.content}</p>
        </div>
    `).join('');
}
renderAdminInfo();

const purchaseForm = document.getElementById('purchaseForm');

purchaseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('modal-product-id').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    // Validasi sederhana
    if (quantity <= 0 || isNaN(quantity)) {
        alert("Jumlah pembelian tidak valid.");
        return;
    }

    if (!confirm(`Yakin beli ${quantity}x produk ini? Saldo Anda akan dipotong.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_DATA_URL}/purchase`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({ productId, quantity }),
        });
        
        const data = await response.json();

        if (response.ok) {
            updateDashboard(); // Perbarui saldo
            closeModal();
            
            // Arahkan ke halaman invoice
            window.location.href = `invoice.html?id=${data.invoice.invoiceNumber}`;

        } else {
            alert(`Pembelian Gagal: ${data.message}`);
        }

    } catch (error) {
        alert('Terjadi kesalahan koneksi server saat memproses pembelian.');
    }
});

// ... (logoutBtn.addEventListener tetap sama) ...

// --- LOGIKA FORM DAN LOGOUT ---
isiSaldoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const jumlah = parseInt(isiSaldoForm.jumlah.value);
    
    alert(`Permintaan isi saldo sebesar Rp ${jumlah.toLocaleString('id-ID')} berhasil dicatat! Harap tunggu konfirmasi dari Admin.`);
    isiSaldoForm.reset();
    hideIsiSaldoForm();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    alert('Anda berhasil logout.');
    window.location.href = 'index.html';
});
