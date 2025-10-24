// scripts/admin.js (VERSI TERBARU - Full API Integration & CRUD)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data';

let userToken = localStorage.getItem('userToken'); 
let currentAdmin = JSON.parse(localStorage.getItem('loggedInUser'));

// --- Setup Elements & Helpers ---
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const adminUsernameElem = document.getElementById('admin-username');
const userTableBody = document.querySelector('#userTable tbody');
const productTableBody = document.querySelector('#productTable tbody');
const infoTableBody = document.querySelector('#infoTable tbody');
const addSaldoForm = document.getElementById('addSaldoForm');
const postProductForm = document.getElementById('postProductForm');
const addStockForm = document.getElementById('addStockForm'); 
const stockProductSelect = document.getElementById('stock-product-id'); 
const postInfoForm = document.getElementById('postInfoForm'); 
const logoutBtn = document.getElementById('logout-btn');


// --- 1. SETUP DAN VALIDASI ADMIN ---
if (!currentAdmin || !currentAdmin.isAdmin || !userToken) {
    alert('Akses Ditolak! Anda bukan Administrator atau sesi berakhir.');
    window.location.href = 'index.html';
}
adminUsernameElem.textContent = currentAdmin.username;


// --- 2. LOGIKA USER TABLE ---
async function renderUserTable() {
    try {
        const response = await fetch(`${API_DATA_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.ok) {
            const users = await response.json();
            userTableBody.innerHTML = ''; 
            
            users.forEach(user => {
                const row = userTableBody.insertRow();
                row.insertCell(0).textContent = user.username;
                
                const statusCell = row.insertCell(1);
                statusCell.textContent = user.isAdmin ? 'ADMIN' : 'USER';
                statusCell.style.color = user.isAdmin ? '#ff0000' : 'var(--color-text-light)';

                row.insertCell(2).textContent = formatRupiah(user.saldo);
                row.insertCell(3).textContent = user.transaksi;
            });
        }
    } catch (error) { console.error('Error fetching user data:', error); }
}
renderUserTable();


// --- 3. LOGIKA KELOLA PRODUK (READ, CREATE, DELETE) ---

async function loadProductSelect() {
    try {
        // Ambil data produk menggunakan token admin
        const response = await fetch(`${API_DATA_URL}/dashboard-data`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await response.json();
        // BUG FIX: Gunakan data.products yang dikirim dari backend
        const products = data.products || []; 

        stockProductSelect.innerHTML = '<option value="" disabled selected>-- Pilih Produk --</option>';
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p._id;
            option.textContent = `${p.name} (Stok Unik: ${p.stock})`;
            stockProductSelect.appendChild(option);
        });
        return products;
    } catch (error) { 
        console.error('Gagal memuat produk:', error); 
        return []; 
    }
}

async function renderProductTable() {
    const products = await loadProductSelect();
    productTableBody.innerHTML = '';

    products.forEach(product => {
        const row = productTableBody.insertRow();
        row.insertCell(0).textContent = product.name;
        row.insertCell(1).textContent = formatRupiah(product.price);
        row.insertCell(2).textContent = product.stock;

        const deleteCell = row.insertCell(3);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Hapus';
        deleteBtn.className = 'btn-primary';
        deleteBtn.style.backgroundColor = 'red';
        deleteBtn.onclick = () => deleteProduct(product._id, product.name);
        deleteCell.appendChild(deleteBtn);
    });
}
renderProductTable(); 


async function deleteProduct(id, name) {
    if (!confirm(`Yakin ingin menghapus produk: ${name}? Ini hanya menghapus definisi produk, bukan item stok unik yang sudah ada.`)) return;

    try {
        const response = await fetch(`${API_DATA_URL}/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${userToken}` }
        });

        if (response.ok) {
            alert(`Produk ${name} berhasil dihapus!`);
            renderProductTable();
        } else {
            const data = await response.json();
            alert(`Gagal menghapus produk: ${data.message}`);
        }
    } catch (error) {
        alert('Kesalahan koneksi saat menghapus produk.');
    }
}


// --- 4. LOGIKA FORM POST PRODUK BARU (CREATE) ---
postProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value.trim();
    const price = parseInt(document.getElementById('product-price').value);
    const desc = document.getElementById('product-desc').value.trim();
    const imageURL = document.getElementById('product-image').value.trim();
    
    if (price <= 0 || isNaN(price)) { alert("Harga tidak valid."); return; }

    try {
        const response = await fetch(`${API_DATA_URL}/admin/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
            body: JSON.stringify({ name, price, description: desc, imageURL }),
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(data.message + " Sekarang tambahkan stok item unik di bagian bawah.");
            postProductForm.reset();
            renderProductTable(); 
            loadProductSelect(); 
        } else {
            alert(`Gagal memposting produk: ${data.message || response.statusText}`);
        }
    } catch (error) { 
        alert('Kesalahan koneksi saat memposting produk.'); 
    }
});


// --- 5. LOGIKA FORM TAMBAH STOK UNIK ---
addStockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('stock-product-id').value;
    const itemsData = document.getElementById('stock-items-data').value.trim();
    
    if (!productId || !itemsData) return alert("Pilih produk dan masukkan data item unik.");

    const items = itemsData.split('\n').map(item => item.trim()).filter(item => item.length > 0);

    if (items.length === 0) return alert("Masukkan setidaknya satu item unik.");

    try {
        const response = await fetch(`${API_DATA_URL}/admin/add-stock-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
            body: JSON.stringify({ productId, items }),
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            addStockForm.reset();
            renderProductTable();
            loadProductSelect(); 
        } else {
            alert(`Gagal menambah stok: ${data.message || response.statusText}`);
        }

    } catch (error) {
        alert('Kesalahan koneksi saat menambah stok item.');
    }
});


// --- 6. LOGIKA KELOLA INFORMASI ---
postInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('info-title').value.trim();
    const content = document.getElementById('info-content').value.trim();

    try {
        const response = await fetch(`${API_DATA_URL}/admin/info`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${userToken}` 
            },
            body: JSON.stringify({ title, content }),
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            postInfoForm.reset();
            renderInfoTable(); // Perbarui tampilan tabel informasi
        } else {
            alert(`Gagal memposting informasi: ${data.message || response.statusText}`);
        }
    } catch (error) {
        alert('Kesalahan koneksi saat memposting informasi.');
    }
});

async function renderInfoTable() {
    try {
        // Ambil data dari endpoint dashboard-data (yang juga mengembalikan info)
        const response = await fetch(`${API_DATA_URL}/dashboard-data`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await response.json();
        const info = data.information || [];
        
        infoTableBody.innerHTML = '';
        
        info.forEach(item => {
            const row = infoTableBody.insertRow();
            row.insertCell(0).textContent = item.title;
            row.insertCell(1).textContent = new Date(item.createdAt).toLocaleDateString();

            const deleteCell = row.insertCell(2);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Hapus (WIP)'; 
            deleteBtn.className = 'btn-primary';
            deleteBtn.style.backgroundColor = 'red';
            deleteBtn.onclick = () => alert('Fungsi hapus informasi belum diimplementasikan di backend!');
            deleteCell.appendChild(deleteBtn);
        });

    } catch (error) { console.error('Error fetching info data:', error); }
}
renderInfoTable();


// --- 7. LOGIKA FORM ADD SALDO ---
addSaldoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUsername = document.getElementById('target-username').value.trim();
    const amount = parseInt(document.getElementById('amount-add').value);

    if (amount <= 0 || isNaN(amount)) { alert("Jumlah saldo tidak valid."); return; }
    
    try {
        const response = await fetch(`${API_DATA_URL}/admin/add-saldo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
            body: JSON.stringify({ username: targetUsername, amount: amount }),
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            addSaldoForm.reset();
            renderUserTable(); 
        } else {
            alert(`Gagal: ${data.message}`);
        }
    } catch (error) { alert('Terjadi kesalahan koneksi server saat menambah saldo.'); }
});


// --- LOGIKA LOGOUT ADMIN ---
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    alert('Admin berhasil logout.');
    window.location.href = 'index.html';
});
