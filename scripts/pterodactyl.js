// scripts/pterodactyl.js (Implementasi API Asli)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data'; 
// GANTI DENGAN URL PANEL PTERODACTYL ANDA (tanpa /api/application)
const PTERO_PANEL_URL = 'https://nodepublikzeingacor.panel-freefire.biz.id'; 

const userToken = localStorage.getItem('userToken');
const serverListContainer = document.getElementById('server-list');
const orderServerForm = document.getElementById('orderServerForm');
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

// --- Cek Login ---
if (!userToken) {
    alert('Anda harus login untuk mengakses panel ini.');
    window.location.href = 'index.html';
}

// --- 1. MEMUAT DAFTAR SERVER PENGGUNA ---
async function fetchUserServers() {
    serverListContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Memuat daftar server...</p>'; // Loading indicator
    try {
        const response = await fetch(`${API_DATA_URL}/user-servers`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        if (response.status === 401) {
             alert('Sesi habis. Silakan login kembali.');
             window.location.href = 'index.html';
             return;
        }

        const servers = await response.json();

        if (response.ok) {
            if (!servers || servers.length === 0) {
                serverListContainer.innerHTML = '<p>Anda belum memiliki server. Pesan sekarang di formulir di atas!</p>';
                return;
            }

            serverListContainer.innerHTML = ''; // Kosongkan
            servers.forEach(server => {
                const card = document.createElement('div');
                card.className = `container-card server-card status-${server.status || 'unknown'}`; // Tambah class status
                card.innerHTML = `
                    <div class="server-info">
                        <h4>${server.productName}</h4>
                        <p>ID Panel: ${server.pterodactylServerId} | Status: <span style="font-weight: bold;">${(server.status || 'unknown').toUpperCase()}</span></p>
                        <p>Perpanjangan Berikutnya: ${server.renewalDate ? new Date(server.renewalDate).toLocaleDateString('id-ID') : 'N/A'}</p>
                    </div>
                    <div class="server-controls">
                        <button class="btn-primary control-btn" style="background-color: #4CAF50;" onclick="controlServer('${server.pterodactylServerId}', 'start')">START</button>
                        <button class="btn-primary control-btn" style="background-color: #ff9800;" onclick="controlServer('${server.pterodactylServerId}', 'restart')">RESTART</button>
                        <button class="btn-primary control-btn" style="background-color: #f44336;" onclick="controlServer('${server.pterodactylServerId}', 'stop')">STOP</button>
                        <a href="${PTERO_PANEL_URL}/server/${server.pterodactylServerId}" target="_blank" class="btn-primary control-btn" style="background-color: #2196F3;">BUKA PANEL</a>
                    </div>
                `;
                 serverListContainer.appendChild(card);
            });

        } else {
             serverListContainer.innerHTML = `<p style="color: red;">Gagal memuat daftar server: ${servers.message || response.statusText}</p>`;
        }
    } catch (error) {
        serverListContainer.innerHTML = '<p style="color: red;">Gagal koneksi ke API server.</p>';
        console.error('Error fetching servers:', error);
    }
}
// Panggil saat halaman dimuat
fetchUserServers();

// --- 2. LOGIKA PEMBELIAN SERVER BARU ---
if (orderServerForm) {
    orderServerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const serverName = document.getElementById('server-name').value.trim();
        const packageId = document.getElementById('package-id').value;
        
        if(!packageId) return alert("Harap pilih paket server terlebih dahulu.");
        if(!serverName) return alert("Harap masukkan nama server.");

        const selectedOption = document.getElementById('package-id').selectedOptions[0];
        const packageName = selectedOption ? selectedOption.text : packageId;

        if (!confirm(`Yakin ingin membeli ${packageName} dengan nama "${serverName}"? Saldo Anda akan dipotong.`)) return;

        const button = orderServerForm.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'MEMPROSES...';

        try {
            const response = await fetch(`${API_DATA_URL}/purchase/pterodactyl`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
                body: JSON.stringify({ packageId: packageId, serverName: serverName }),
            });
            
            const data = await response.json();

            if (response.ok) {
                alert(`Sukses! ${data.message}`);
                orderServerForm.reset();
                fetchUserServers(); // Muat ulang daftar server
                localStorage.removeItem('loggedInUser'); // Hapus cache data user agar saldo terupdate di dashboard
            } else {
                alert(`Gagal membuat server: ${data.message}`);
            }

        } catch (error) {
            alert('Kesalahan koneksi saat memesan server.');
        } finally {
            button.disabled = false;
            button.textContent = 'BELI & DEPLOY SEKARANG';
        }
    });
}


// --- 3. LOGIKA KONTROL SERVER ---
// CATATAN: Fungsi ini memerlukan endpoint backend baru (misal: POST /api/data/server-control)
window.controlServer = async (serverId, command) => {
    if (!confirm(`Yakin ingin ${command.toUpperCase()} server ID ${serverId}?`)) return;

    alert(`[INFO] Mengirim sinyal ${command.toUpperCase()} ke Server ID ${serverId}. Proses mungkin butuh beberapa saat.`);
    
    // Anda perlu membuat endpoint baru di backend untuk menangani ini
    /*
    try {
        const response = await fetch(`${API_DATA_URL}/server-control`, { // CONTOH ENDPOINT
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
            body: JSON.stringify({ serverId, command }),
        });
        const data = await response.json();
        if (response.ok) {
            alert(`Sinyal ${command.toUpperCase()} berhasil dikirim.`);
            // Opsional: Refresh status server setelah beberapa detik
            setTimeout(fetchUserServers, 5000); 
        } else {
            alert(`Gagal mengirim sinyal: ${data.message}`);
        }
    } catch (error) {
        alert('Gagal koneksi ke API kontrol server.');
    }
    */
};
