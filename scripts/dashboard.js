// scripts/dashboard.js (VERSI TERBARU - Full API & Profil Layout)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data';

let userToken = localStorage.getItem('userToken');
let userData = JSON.parse(localStorage.getItem('loggedInUser'));

// --- Setup Elements & Helpers ---
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0); // Default ke 0 jika null/undefined

const logoutUser = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
};

// Pastikan semua elemen ini ada di dashboard.html yang terbaru
const profileUsernameElement = document.getElementById('profile-username');
const profileSaldoElement = document.getElementById('profile-saldo');
const isiSaldoForm = document.getElementById('isiSaldoForm');
const logoutBtn = document.getElementById('logout-btn');
const productList = document.getElementById('product-list');
const adminInfoContainer = document.getElementById('admin-info-container');
const welcomeMenuText = document.getElementById('welcome-menu-item');
const hamburgerMenu = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');
const adminLink = document.getElementById('admin-link');
const purchaseModal = document.getElementById('purchase-modal');
const purchaseForm = document.getElementById('purchaseForm');


// --- Cek Status & Validasi Awal ---
if (!userData || !userToken) {
    alert('Anda harus login untuk mengakses Dashboard.');
    logoutUser();
} else {
    // Tampilkan username awal dari localStorage (akan diupdate oleh fetch)
    if (profileUsernameElement) profileUsernameElement.textContent = userData.username;
    if (welcomeMenuText) welcomeMenuText.textContent = `Hai, ${userData.username}`;
}


// --- LOGIKA HAMBURGER MENU ---
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
    if (!userToken) return; // Keluar jika token tidak ada

    try {
        const response = await fetch(`${API_DATA_URL}/dashboard-data`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (response.ok) {
            const data = await response.json();

            // 1. Update Profile Section (Menggunakan ID BARU)
            if (profileUsernameElement) {
                profileUsernameElement.textContent = data.username || '[Username Tidak Ditemukan]';
            } else {
                console.error("Error: Element with ID 'profile-username' not found.");
            }

            if (profileSaldoElement) {
                profileSaldoElement.textContent = formatRupiah(data.saldo); // Gunakan helper format
            } else {
                 console.error("Error: Element with ID 'profile-saldo' not found.");
            }

            // Update data lokal (untuk logika lain seperti validasi saldo pembelian)
            userData.saldo = data.saldo;
            userData.transaksi = data.transaksi; // Simpan transaksi meskipun tidak ditampilkan di profil
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
            // Tampilkan pesan error di profile jika fetch gagal
            if(profileUsernameElement) profileUsernameElement.textContent = 'Gagal Muat Data';
            if(profileSaldoElement) profileSaldoElement.textContent = 'Error';
        }
    } catch (error) {
        console.error('Koneksi gagal saat mengambil data user:', error);
        if(profileUsernameElement) profileUsernameElement.textContent = 'Error Koneksi';
        if(profileSaldoElement) profileSaldoElement.textContent = 'Error Koneksi';
    }
}
// Panggil fungsi utama saat halaman dimuat
fetchAndRenderDashboard();


// --- RENDERING PRODUCTS ---
function renderProductList(products) {
    // ... (Kode renderProductList tetap sama seperti versi sebelumnya) ...
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
        productListElement.appendChild(card);
    });
}

// --- RENDERING ADMIN INFO ---
function renderAdminInfo(infoList) {
    // ... (Kode renderAdminInfo tetap sama seperti versi sebelumnya) ...
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
window.openModal = function(id, name, price, desc, img) {
    // ... (Logika openModal tetap sama) ...
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
    if(purchaseModal) purchaseModal.style.display = 'block';
    if(hamburgerMenu) hamburgerMenu.classList.remove('active');
    if(navLinks) navLinks.classList.remove('active');
};

window.closeModal = function() {
    if(purchaseModal) purchaseModal.style.display = 'none';
};

window.closeSuccessModal = function() { // Pastikan fungsi ini ada
    const successModal = document.getElementById('success-modal');
    if(successModal) successModal.style.display = 'none';
};


// --- PEMBELIAN LOGIC (HANDLE SUBMIT) ---
if(purchaseForm){
    purchaseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productId = document.getElementById('modal-product-id').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const productName = document.getElementById('modal-product-name').textContent;
        const totalCostText = document.getElementById('total-cost').textContent;
        // Ambil angka saja dari string Rp XX.XXX
        const totalCost = parseFloat(totalCostText.replace(/[^0-9]/g, '')) || 0;

        if (quantity <= 0 || isNaN(quantity)) return alert('Jumlah pembelian tidak valid.');

        // Cek saldo lokal sebelum kirim API (lebih responsif)
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
                // Tampilkan Modal Sukses (bukan redirect WA)
                closeModal();
                fetchAndRenderDashboard(); // Update saldo & produk

                const waNumber = "62895605053911";
                const message = encodeURIComponent(
`*🛒 KONFIRMASI PEMBELIAN - MANZZY ID 🛒*

Halo Admin Manzzy ID,

Saya *${userData.username}* baru saja melakukan pembelian:

*Produk:*
\`\`\` ${productName} \`\`\`
*Jumlah:* ${quantity} item
*Total Harga:* *${formatRupiah(totalCost)}*

Mohon segera diproses. Terima kasih! 🙏`
                );
                const waLink = `https://wa.me/${waNumber}?text=${message}`;

                document.getElementById('whatsapp-confirm-button').href = waLink;
                document.getElementById('success-message').textContent = `Pembelian ${productName} (${quantity} unit) berhasil! Klik tombol di bawah untuk konfirmasi ke Admin via WhatsApp.`;

                const successModal = document.getElementById('success-modal');
                if(successModal) successModal.style.display = 'block';

            } else {
                alert(`Pembelian Gagal: ${data.message}`);
            }

        } catch (error) {
            alert('Kesalahan koneksi saat memproses pembelian.');
            console.error("Purchase Error:", error);
        }
    });
}


// --- LAIN-LAIN ---
window.showIsiSaldoForm = function() {
    const formCard = document.getElementById('card-isi-saldo');
    if(formCard) formCard.style.display = 'block';
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
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Mencegah link default jika ini <a>
        logoutUser();
    });
            }
