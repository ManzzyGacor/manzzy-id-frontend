// scripts/dashboard.js (VERSI TERBARU - Full API Integration)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
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

// --- Helpers ---
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const logoutUser = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
};

// --- Cek Status & Validasi Awal ---
if (!userData || !userToken) {
    alert('Anda harus login untuk mengakses Dashboard.');
    logoutUser();
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

// --- CORE FUNCTIONS ---

/**
 * Mengambil dan merender semua data dashboard (Saldo, Transaksi, Produk, Info)
 */
async function fetchAndRenderDashboard() {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) return;

    try {
        const response = await fetch(`${API_DATA_URL}/dashboard-data`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (response.ok) {
            const data = await response.json();
            
            // 1. Update Saldo & Transaksi
            userSaldoElem.textContent = formatRupiah(data.saldo);
            userTransaksiElem.textContent = data.transaksi;

            // Update local user data
            userData.saldo = data.saldo;
            userData.transaksi = data.transaksi;
            localStorage.setItem('loggedInUser', JSON.stringify(userData));

            // 2. Render Produk
            renderProductList(data.products || []); 
            
            // 3. Render Informasi Admin
            renderAdminInfo(data.information || []);
            
        } else if (response.status === 401) {
            alert('Sesi Anda berakhir, silakan login kembali.');
            logoutUser();
        } else {
            console.error('Gagal mengambil data dashboard:', response.statusText);
        }
    } catch (error) {
        console.error('Koneksi gagal saat mengambil data user:', error);
    }
}
fetchAndRenderDashboard();

// --- RENDERING FUNCTIONS ---

function renderProductList(products) {
    const productListElement = document.getElementById('product-list');
    productListElement.innerHTML = '';

    if (products.length === 0) {
        productListElement.innerHTML = `<p>Belum ada produk yang tersedia saat ini.</p>`;
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'container-card product-card';
        card.innerHTML = `
            <img src="${product.imageURL}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 15px;">
            <h3 style="color: var(--color-accent);">${product.name}</h3>
            <p style="font-size: 1.2em; font-weight: bold; margin: 5px 0;">${formatRupiah(product.price)}</p>
            <p style="font-size: 0.9em; color: #aaa; flex-grow: 1;">Stok Hitungan: ${product.stock} item</p>
            <button class="btn-primary" 
                    onclick="openModal(
                        '${product._id}', 
                        '${product.name}', 
                        ${product.price}, 
                        '${product.description}', 
                        '${product.imageURL}')"
                    style="margin-top: 15px;"
                    ${product.stock === 0 ? 'disabled style="background-color: #555;"' : ''}>
                ${product.stock === 0 ? 'STOK HABIS' : 'BELI SEKARANG'}
            </button>
        `;
        productListElement.appendChild(card);
    });
}

function renderAdminInfo(infoList) {
    const infoContainer = document.getElementById('admin-info-container');
    infoContainer.innerHTML = '';

    if (infoList.length === 0) {
        infoContainer.innerHTML = `<p>Admin belum memposting informasi terbaru.</p>`;
        return;
    }

    infoList.forEach(info => {
        const date = new Date(info.createdAt);
        const formattedDate = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        infoContainer.innerHTML += `
            <div style="margin-bottom: 20px; padding: 15px; border-left: 5px solid var(--color-accent); background-color: #1f1f1f; border-radius: 4px;">
                <h4 style="color: var(--color-accent); margin-bottom: 5px;">${info.title}</h4>
                <p style="font-size: 0.8em; color: #888; margin-bottom: 10px;">Diposting: ${formattedDate}</p>
                <p>${info.content}</p>
            </div>
        `;
    });
}


// --- MODAL LOGIC (Pembelian) ---

const purchaseModal = document.getElementById('purchase-modal');
const purchaseForm = document.getElementById('purchaseForm');

window.openModal = function(id, name, price, desc, img) {
    document.getElementById('modal-product-id').value = id;
    document.getElementById('modal-product-name').textContent = name;
    document.getElementById('modal-product-image').src = img;
    document.getElementById('modal-product-desc').textContent = desc;
    
    document.getElementById('modal-product-price').textContent = formatRupiah(price);
    document.getElementById('quantity').value = 1;

    const quantityInput = document.getElementById('quantity');
    quantityInput.oninput = function() {
        const q = parseInt(quantityInput.value) || 0;
        const total = price * q;
        document.getElementById('total-cost').textContent = formatRupiah(total);
    };
    
    quantityInput.oninput();
    purchaseModal.style.display = 'block';
    hamburgerMenu.classList.remove('active'); 
    navLinks.classList.remove('active');
};

window.closeModal = function() {
    purchaseModal.style.display = 'none';
};


// --- PEMBELIAN LOGIC (HANDLE SUBMIT) ---
purchaseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('modal-product-id').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    if (quantity <= 0 || isNaN(quantity)) return alert('Jumlah pembelian tidak valid.');

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
            alert(`Pembelian Berhasil! ${data.message}`);
            closeModal();
            fetchAndRenderDashboard(); 
            // Arahkan ke halaman invoice
            window.location.href = `invoice.html?id=${data.invoice.invoiceNumber}`;

        } else {
            alert(`Pembelian Gagal: ${data.message}`);
        }

    } catch (error) {
        alert('Kesalahan koneksi saat memproses pembelian.');
    }
});


// --- LAIN-LAIN ---

window.showIsiSaldoForm = function() {
    // ... (Logika showIsiSaldoForm tetap sama)
    const formCard = document.getElementById('card-isi-saldo');
    formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    hamburgerMenu.classList.remove('active'); 
    navLinks.classList.remove('active');
}

window.hideIsiSaldoForm = function() {
    document.getElementById('card-isi-saldo').style.display = 'none';
}

isiSaldoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const jumlah = parseInt(isiSaldoForm.jumlah.value);
    
    alert(`Permintaan isi saldo sebesar ${formatRupiah(jumlah)} berhasil dicatat! Harap tunggu konfirmasi Admin.`);
    isiSaldoForm.reset();
    window.hideIsiSaldoForm();
});

logoutBtn.addEventListener('click', () => {
    logoutUser();
});
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
