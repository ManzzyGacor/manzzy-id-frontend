// scripts/pterodactyl.js (Implementasi API Asli & Kontrol & Tampilkan Kredensial - FINAL)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data';
// GANTI DENGAN URL PANEL PTERODACTYL ANDA (tanpa /api/application)
const PTERO_PANEL_URL = 'https://nodepublikzeingacor.panel-freefire.biz.id'; // Contoh: https://panel.manzzy.web.id

const userToken = localStorage.getItem('userToken'); // Ambil token dari localStorage
const serverListContainer = document.getElementById('server-list');
const orderServerForm = document.getElementById('orderServerForm');
const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

// --- Fungsi Logout Helper ---
function logoutUser() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
};

// --- Cek Login Awal ---
if (!userToken) { // Periksa apakah token ADA
    console.error("Token login tidak ditemukan di localStorage!"); // Pesan debug
    alert('Anda harus login untuk mengakses panel ini. Token tidak ditemukan.');
    logoutUser(); // Redirect jika tidak ada token
} else {
    console.log("Token ditemukan:", userToken.substring(0, 10) + "..."); // Tampilkan sebagian token untuk debug
}

// --- 1. MEMUAT DAFTAR SERVER PENGGUNA ---
async function fetchUserServers() {
    // Pastikan container ada sebelum mencoba mengisi
    if (!serverListContainer) {
        console.error("Elemen #server-list tidak ditemukan di HTML.");
        return;
    }
    serverListContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Memuat daftar server...</p>'; // Loading indicator

    // Pastikan token masih ada (mungkin dihapus oleh proses lain)
    const currentToken = localStorage.getItem('userToken');
    if (!currentToken) return logoutUser(); // Logout jika token hilang

    try {
        const response = await fetch(`${API_DATA_URL}/user-servers`, {
            headers: {
                'Authorization': `Bearer ${currentToken}` // Kirim token di header
            }
        });

        if (response.status === 401) { // Error jika token tidak valid/kadaluarsa
             console.error("Fetch User Servers Gagal: 401 Unauthorized (Token salah/kadaluarsa?)");
             alert('Sesi habis atau token tidak valid. Silakan login kembali.');
             logoutUser(); // Hapus token lama & redirect
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
                // Tambahkan class container-card agar styling sama
                card.className = `container-card server-card status-${server.status || 'unknown'}`;
                card.innerHTML = `
                    <div class="server-info">
                        <h4>${server.productName}</h4>
                        <p>ID Panel: ${server.pterodactylServerId} | Status: <span style="font-weight: bold;">${(server.status || 'unknown').toUpperCase()}</span></p>
                        <p>Perpanjangan Berikutnya: ${server.renewalDate ? new Date(server.renewalDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
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
             console.error("Fetch User Servers Gagal:", response.status, servers.message);
             serverListContainer.innerHTML = `<p style="color: red;">Gagal memuat daftar server: ${servers.message || response.statusText}</p>`;
        }
    } catch (error) {
        serverListContainer.innerHTML = '<p style="color: red;">Gagal koneksi ke API server.</p>';
        console.error('Error fetching servers:', error);
    }
}
// Panggil saat halaman dimuat (jika script dijalankan setelah DOM ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchUserServers);
} else {
    fetchUserServers();
}


// --- 2. LOGIKA PEMBELIAN SERVER BARU ---
if (orderServerForm) {
    orderServerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const serverName = document.getElementById('server-name').value.trim();
        const packageId = document.getElementById('package-id').value;
        const currentToken = localStorage.getItem('userToken'); // Ambil token terbaru

        if(!currentToken) return logoutUser(); // Cek token lagi sebelum submit
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}` // Kirim token saat membeli
                },
                body: JSON.stringify({ packageId: packageId, serverName: serverName }),
            });

            const data = await response.json();

            if (response.ok) {
                // --- MENAMPILKAN KREDENSIAL DI ALERT ---
                let successMessage = `Sukses! ${data.message}`;
                if (data.pterodactylCredentials && data.pterodactylCredentials.username) {
                    successMessage += `\n\nLogin Pterodactyl Panel:\nUsername: ${data.pterodactylCredentials.username}\nPassword: ${data.pterodactylCredentials.password}\n\nHarap simpan kredensial ini!`;
                }
                alert(successMessage);
                // ----------------------------------------

                orderServerForm.reset();
                fetchUserServers(); // Muat ulang daftar server
                localStorage.removeItem('loggedInUser'); // Hapus cache data user agar saldo terupdate di dashboard
            } else if (response.status === 401) {
                 console.error("Purchase Failed: 401 Unauthorized");
                 alert('Sesi habis atau token tidak valid. Silakan login kembali.');
                 logoutUser();
            } else {
                console.error("Purchase Failed:", response.status, data.message);
                alert(`Gagal membuat server: ${data.message}`);
            }

        } catch (error) {
            alert('Kesalahan koneksi saat memesan server.');
             console.error('Error ordering server:', error);
        } finally {
            button.disabled = false;
            button.textContent = 'BELI & DEPLOY SEKARANG';
        }
    });
}


// --- 3. LOGIKA KONTROL SERVER ---
window.controlServer = async (serverId, command) => {
    const currentToken = localStorage.getItem('userToken'); // Ambil token terbaru
    if(!currentToken) return logoutUser(); // Cek token

    if (!confirm(`Yakin ingin ${command.toUpperCase()} server ID ${serverId}?`)) return;

    alert(`[INFO] Mengirim sinyal ${command.toUpperCase()} ke Server ID ${serverId}. Mohon tunggu...`);

    const buttons = document.querySelectorAll(`.server-card button[onclick*="'${serverId}'"], .server-card a[href*="${serverId}"]`);
    buttons.forEach(btn => btn.style.opacity = '0.5'); // Redupkan tombol sementara

    try {
        const response = await fetch(`${API_DATA_URL}/server-control`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}` // Kirim token untuk kontrol
            },
            body: JSON.stringify({ serverId, command }),
        });
        const data = await response.json();

        if (response.ok) {
            alert(`Sinyal ${command.toUpperCase()} berhasil dikirim.`);
            // Beri jeda sedikit sebelum refresh status, Pterodactyl butuh waktu
            setTimeout(fetchUserServers, 7000); // Refresh setelah 7 detik
        } else if (response.status === 401) {
            console.error("Server Control Failed: 401 Unauthorized");
            alert('Sesi habis atau token tidak valid. Silakan login kembali.');
            logoutUser();
        } else {
            console.error("Server Control Failed:", response.status, data.message);
            alert(`Gagal mengirim sinyal: ${data.message}`);
            buttons.forEach(btn => btn.style.opacity = '1'); // Kembalikan opacity jika gagal
        }
    } catch (error) {
        alert('Gagal koneksi ke API kontrol server.');
        console.error('Error controlling server:', error);
        buttons.forEach(btn => btn.style.opacity = '1'); // Kembalikan opacity jika gagal
    } finally {
         // Kembalikan opacity setelah selesai (baik sukses maupun gagal, setelah timeout refresh)
         // setTimeout(() => buttons.forEach(btn => btn.style.opacity = '1'), 8000); // Sesuaikan timeout
    }
};

// Pastikan fungsi show/hide modal saldo ada jika dipanggil dari HTML
function showIsiSaldoForm() {
    const formCard = document.getElementById('card-isi-saldo');
    if(formCard) formCard.style.display = 'block';
}
function hideIsiSaldoForm() {
    const formCard = document.getElementById('card-isi-saldo');
    if(formCard) formCard.style.display = 'none';
    }                // --- PESAN ALERT BARU DENGAN PASSWORD PREDICTABLE ---
                let successMessage = `Sukses! ${data.message}`;
                if (data.pterodactylCredentials && data.pterodactylCredentials.username) {
                    successMessage += `\n\nLogin Pterodactyl Panel:\nUsername: ${data.pterodactylCredentials.username}\nPassword: ${data.pterodactylCredentials.username}123\n\nHarap simpan kredensial ini!`; // Langsung sebutkan format password
                }
                alert(successMessage);
                // --------------------------------------------------

                orderServerForm.reset();
                fetchUserServers(); // Muat ulang daftar server
                localStorage.removeItem('loggedInUser'); // Hapus cache data user agar saldo terupdate di dashboard
            } else if (response.status === 401) {
                 console.error("Purchase Failed: 401 Unauthorized");
                 alert('Sesi habis atau token tidak valid. Silakan login kembali.');
                 logoutUser();
            } else {
                console.error("Purchase Failed:", response.status, data.message);
                alert(`Gagal membuat server: ${data.message}`);
            }

        } catch (error) {
            alert('Kesalahan koneksi saat memesan server.');
             console.error('Error ordering server:', error);
        } finally {
            button.disabled = false;
            button.textContent = 'BELI & DEPLOY SEKARANG';
        }
    });
}


// --- 3. LOGIKA KONTROL SERVER ---
window.controlServer = async (serverId, command) => {
    if (!confirm(`Yakin ingin ${command.toUpperCase()} server ID ${serverId}?`)) return;

    alert(`[INFO] Mengirim sinyal ${command.toUpperCase()} ke Server ID ${serverId}. Mohon tunggu...`);

    const buttons = document.querySelectorAll(`.server-card button[onclick*="'${serverId}'"]`);
    buttons.forEach(btn => btn.disabled = true);

    try {
        const response = await fetch(`${API_DATA_URL}/server-control`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
            body: JSON.stringify({ serverId, command }),
        });
        const data = await response.json();

        if (response.ok) {
            alert(`Sinyal ${command.toUpperCase()} berhasil dikirim.`);
            setTimeout(fetchUserServers, 7000); // Refresh status server setelah 7 detik
        } else if (response.status === 401) {
            console.error("Server Control Failed: 401 Unauthorized");
            alert('Sesi habis atau token tidak valid. Silakan login kembali.');
            logoutUser();
        } else {
            console.error("Server Control Failed:", response.status, data.message);
            alert(`Gagal mengirim sinyal: ${data.message}`);
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        alert('Gagal koneksi ke API kontrol server.');
        console.error('Error controlling server:', error);
        buttons.forEach(btn => btn.disabled = false);
    }
};

// Fungsi logout helper
function logoutUser() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
};
