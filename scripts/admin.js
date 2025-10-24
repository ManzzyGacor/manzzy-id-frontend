// scripts/admin.js (Versi API - Backend MongoDB)

// GANTI DENGAN URL VERCEL API ANDA SETELAH DEPLOYMENT!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data';

let userToken = localStorage.getItem('userToken'); 
let currentAdmin = JSON.parse(localStorage.getItem('loggedInUser'));

const adminUsernameElem = document.getElementById('admin-username');
const userTableBody = document.querySelector('#userTable tbody');
const addSaldoForm = document.getElementById('addSaldoForm');
const postProductForm = document.getElementById('postProductForm');
const logoutBtn = document.getElementById('logout-btn');


// --- 1. SETUP DAN VALIDASI ADMIN ---
if (!currentAdmin || !currentAdmin.isAdmin || !userToken) {
    alert('Akses Ditolak! Anda bukan Administrator atau sesi berakhir.');
    window.location.href = 'index.html';
}

adminUsernameElem.textContent = currentAdmin.username;


// --- 2. LOGIKA USER TABLE (MEMANGGIL API) ---
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

                const saldoCell = row.insertCell(2);
                saldoCell.textContent = new Intl.NumberFormat('id-ID', {
                    style: 'currency', currency: 'IDR', minimumFractionDigits: 2,
                }).format(user.saldo);
                
                row.insertCell(3).textContent = user.transaksi;
            });
        } else if (response.status === 403 || response.status === 401) {
             alert('Akses Admin Ditolak/Sesi habis.');
             localStorage.removeItem('userToken');
             localStorage.removeItem('loggedInUser');
             window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}
renderUserTable();


// --- 3. LOGIKA ADD SALDO MANUAL (MEMANGGIL API) ---
addSaldoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const targetUsername = document.getElementById('target-username').value.trim();
    const amount = parseInt(document.getElementById('amount-add').value);

    if (amount <= 0 || isNaN(amount)) {
        alert("Jumlah saldo tidak valid.");
        return;
    }
    
    try {
        const response = await fetch(`${API_DATA_URL}/admin/add-saldo`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`,
            },
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
    } catch (error) {
        alert('Terjadi kesalahan koneksi server saat menambah saldo.');
    }
});


// --- 4. LOGIKA POST PRODUK BARU (Simulasi Frontend) ---
function getAllProducts() {
    const productsData = localStorage.getItem('manzzy_products');
    return productsData ? JSON.parse(productsData) : [];
}

postProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value.trim();
    const price = parseInt(document.getElementById('product-price').value);
    const desc = document.getElementById('product-desc').value.trim();
    const imageURL = document.getElementById('product-image').value.trim();
    
    if (price <= 0 || isNaN(price)) {
        alert("Harga tidak valid.");
        return;
    }

    let allProducts = getAllProducts();
    const newId = allProducts.length > 0 ? Math.max(...allProducts.map(p => p.id)) + 1 : 1;

    const newProduct = { id: newId, name: name, price: price, desc: desc, imageURL: imageURL };
    allProducts.push(newProduct);
    
    localStorage.setItem('manzzy_products', JSON.stringify(allProducts));
    
    alert(`Sukses! Produk baru '${name}' telah diposting. (Perlu refresh Dashboard untuk melihat)`);
    postProductForm.reset();
});

// --- 5. LOGIKA LOGOUT ADMIN ---
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    alert('Admin berhasil logout.');
    window.location.href = 'index.html';
});

// --- SINKRONISASI AWAL PRODUK ---
const INITIAL_PRODUCTS = getAllProducts();
localStorage.setItem('manzzy_products', JSON.stringify(INITIAL_PRODUCTS));
