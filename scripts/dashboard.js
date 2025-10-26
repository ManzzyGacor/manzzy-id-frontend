// scripts/dashboard.js (VERSI LENGKAP FINAL - Profil Layout & API Realtime)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data';

let userToken = localStorage.getItem('userToken');
let userData = JSON.parse(localStorage.getItem('loggedInUser'));

// --- Setup Elements & Helpers ---
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const logoutUser = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
};

// Referensi Elemen Penting
const profileUsernameElement = document.getElementById('profile-username');
const profileSaldoElement = document.getElementById('profile-saldo');
const productList = document.getElementById('product-list');
const adminInfoContainer = document.getElementById('admin-info-container');
const hamburgerMenu = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');
const adminLink = document.getElementById('admin-link');
const purchaseModal = document.getElementById('purchase-modal');
const purchaseForm = document.getElementById('purchaseForm');
const isiSaldoForm = document.getElementById('isiSaldoForm'); // Event listener ada di bawah
const successModal = document.getElementById('success-modal'); 


// --- Cek Status & Validasi Awal ---
if (!userData || !userToken) {
    alert('Anda harus login untuk mengakses Dashboard.');
    logoutUser();
}


// --- LOGIKA UI DASAR ---
if(hamburgerMenu && navLinks){
    hamburgerMenu.addEventListener('click', () => {
        hamburgerMenu.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}
if(adminLink && userData){
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
}


// --- CORE FUNCTIONS (Mengambil Data dari API) ---

async function fetchAndRenderDashboard() {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) return; 

    try {
        const response = await fetch(`${API_DATA_URL}/dashboard-data`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (response.ok) {
            const data = await response.json();

            // 1. Update Profile Section (Username & Saldo)
            if (profileUsernameElement) { profileUsernameElement.textContent = data.username || '[Username Tidak Ditemukan]'; }
            if (profileSaldoElement) { profileSaldoElement.textContent = formatRupiah(data.saldo); }
            
            // Update data lokal
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


// --- RENDERING PRODUCTS ---

function renderProductList(products) {
    if (!productList) return;
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = `<p>Belum ada produk yang tersedia saat ini.</p>`;
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'container-card product-card';
        card.innerHTML = `
            <img src="${product.imageURL}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px; margin-bottom: 15px;">
            <h3 style="color: var(--color-accent);">${product.name}</h3>
            <p style="font-size: 1.2em; font-weight: bold; margin: 5px 0;">${formatRupiah(product.price)}</p>
            <p style="font-size: 0.9em; color: #aaa; flex-grow: 1;">Stok: ${product.stock} unit</p>
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
        productList.appendChild(card);
    });
}

// --- RENDERING ADMIN INFO ---

function renderAdminInfo(infoList) {
    if (!adminInfoContainer) return;
    adminInfoContainer.innerHTML = '';

    if (infoList.length === 0) {
        adminInfoContainer.innerHTML = `<p>Admin belum memposting informasi terbaru.</p>`;
        return;
    }

    infoList.forEach(info => {
        const date = new Date(info.createdAt);
        const formattedDate = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        adminInfoContainer.innerHTML += `
            <div style="margin-bottom: 20px; padding: 15px; border-left: 5px solid var(--color-accent); background-color: #1f1f1f; border-radius: 4px;">
                <h4 style="color: var(--color-accent); margin-bottom: 5px;">${info.title}</h4>
                <p style="font-size: 0.8em; color: #888; margin-bottom: 10px;">Diposting: ${formattedDate}</p>
                <p>${info.content}</p>
            </div>
        `;
    });
}


// --- MODAL LOGIC (Pembelian Produk Biasa) ---

window.openModal = function(id, name, price, desc, img) {
    if (!purchaseModal) return alert('Error: Modal pembelian tidak ditemukan.');

    // Pastikan elemen dalam modal ada sebelum mengisi
    const modalProductId = document.getElementById('modal-product-id');
    const modalProductName = document.getElementById('modal-product-name');
    const modalProductImage = document.getElementById('modal-product-image');
    const modalProductDesc = document.getElementById('modal-product-desc');
    const modalProductPrice = document.getElementById('modal-product-price');
    const quantityInput = document.getElementById('quantity');
    const totalCostElement = document.getElementById('total-cost');
    
    if (modalProductId) modalProductId.value = id;
    if (modalProductName) modalProductName.textContent = name;
    if (modalProductImage) modalProductImage.src = img;
    if (modalProductDesc) modalProductDesc.textContent = desc;
    if (modalProductPrice) modalProductPrice.textContent = formatRupiah(price);
    if (quantityInput) quantityInput.value = 1;

    if (quantityInput && totalCostElement) {
        quantityInput.oninput = function() {
            const q = parseInt(quantityInput.value) || 0;
            const total = price * q;
            totalCostElement.textContent = formatRupiah(total);
        };
        quantityInput.oninput();
    }
    
    purchaseModal.style.display = 'flex';
};

window.closeModal = function() {
    if (purchaseModal) purchaseModal.style.display = 'none';
};

window.closeSuccessModal = function() { // Fungsi untuk menutup modal sukses WA/Produk
    if (successModal) successModal.style.display = 'none';
};


// --- PEMBELIAN LOGIC (HANDLE SUBMIT PRODUK BIASA) ---
if(purchaseForm){
    purchaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('modal-product-id').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const productName = document.getElementById('modal-product-name').textContent;
        const totalCostText = document.getElementById('total-cost').textContent;
        const totalCost = parseFloat(totalCostText.replace(/[^0-9]/g, '')) || 0;
        const userToken = localStorage.getItem('userToken');

        if (quantity <= 0 || isNaN(quantity)) return alert('Jumlah pembelian tidak valid.');

        // Cek saldo lokal (walaupun backend akan cek lagi)
        const currentSaldo = userData.saldo || 0;
        if (currentSaldo < totalCost) {
            alert("Pembelian Gagal: Saldo tidak mencukupi!");
            closeModal();
            return;
        }

        if (!confirm(`Yakin beli ${quantity}x ${productName} dengan total biaya ${formatRupiah(totalCost)}? Saldo Anda akan dipotong.`)) {
            return;
        }

        try {
            // KIRIM KE ENDPOINT PRODUK BIASA
            const response = await fetch(`${API_DATA_URL}/purchase-simple`, { // Menggunakan endpoint simple
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify({ productId: productId, quantity: quantity }),
            });
            
            const data = await response.json();

            if (response.ok) {
                // Tampilkan Modal Sukses (bukan redirect WA)
                closeModal();
                fetchAndRenderDashboard(); // Update saldo & produk

                // Siapkan link WhatsApp untuk konfirmasi
                const waNumber = "628956053911";
                const message = encodeURIComponent(`Halo Admin, saya ${userData.username} baru saja membeli ${quantity}x ${productName} (Rp ${totalCost.toLocaleString('id-ID')}). Mohon konfirmasi.`);
                const waLink = `https://wa.me/${waNumber}?text=${message}`;

                // Tampilkan Modal Sukses Konfirmasi
                if(successModal){
                    document.getElementById('whatsapp-confirm-button').href = waLink;
                    document.getElementById('success-message').textContent = `Pembelian ${productName} (${quantity} unit) berhasil! Saldo baru Anda: ${formatRupiah(data.purchaseDetails.newSaldo)}. Klik tombol di bawah untuk konfirmasi pesanan ke Admin via WhatsApp.`;
                    successModal.style.display = 'flex';
                } else {
                    alert(`Pembelian Sukses! Saldo baru: ${formatRupiah(data.purchaseDetails.newSaldo)}. Lanjut ke WA.`);
                    window.location.href = waLink;
                }

            } else if (response.status === 401) {
                alert('Sesi habis. Login kembali.');
                logoutUser();
            } else {
                alert(`Pembelian Gagal: ${data.message}`);
                closeModal();
            }

        } catch (error) {
            alert('Kesalahan koneksi saat memproses pembelian.');
            console.error("Simple Purchase Error:", error);
        }
    });
}


// --- LAIN-LAIN ---

window.showIsiSaldoForm = function() {
    const formCard = document.getElementById('card-isi-saldo');
    if(formCard) formCard.style.display = 'flex'; // Gunakan flex
    if(formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if(hamburgerMenu) hamburgerMenu.classList.remove('active');
    if(navLinks) navLinks.classList.remove('active');
}

window.hideIsiSaldoForm = function() {
    const formCard = document.getElementById('card-isi-saldo');
    if(formCard) formCard.style.display = 'none';
}

if(isiSaldoForm){
    isiSaldoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const jumlah = parseInt(isiSaldoForm.jumlah.value);
        
        alert(`Permintaan isi saldo sebesar ${formatRupiah(jumlah)} berhasil dicatat! Harap tunggu konfirmasi Admin.`);
        isiSaldoForm.reset();
        window.hideIsiSaldoForm();
    });
}

if(logoutBtn){
    logoutBtn.addEventListener('click', () => {
        logoutUser();
    });
            }
