// scripts/pterodactyl.js (VERSI LENGKAP - Debugging Ditambahkan)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
const API_DATA_URL = 'https://manzzy-id-backend.vercel.app/api/data';
// GANTI DENGAN URL PANEL PTERODACTYL ANDA (tanpa /api/application)
const PTERO_PANEL_URL = 'https://nodepublikzeingacor.panel-freefire.biz.id/'; // Contoh: https://panel.manzzy.web.id

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

// --- Fungsi Logout Helper ---
function logoutUser() {
    console.log("Logging out..."); // Debug
    localStorage.removeItem('userToken');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
};

// --- Jalankan setelah DOM siap ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded. Initializing pterodactyl script..."); // Debug

    const userToken = localStorage.getItem('userToken');
    const serverListContainer = document.getElementById('server-list');
    const orderServerForm = document.getElementById('orderServerForm');

    // --- Cek Login Awal ---
    if (!userToken) {
        console.error("Token login tidak ditemukan di localStorage!");
        alert('Anda harus login untuk mengakses panel ini. Token tidak ditemukan.');
        logoutUser(); // Redirect jika tidak ada token
        return; // Hentikan eksekusi script
    } else {
        console.log("Token ditemukan:", userToken.substring(0, 10) + "...");
    }

    // --- 1. MEMUAT DAFTAR SERVER PENGGUNA ---
    async function fetchUserServers() {
        if (!serverListContainer) {
            console.error("Elemen #server-list tidak ditemukan di HTML.");
            return;
        }
        serverListContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Memuat daftar server...</p>';

        const currentToken = localStorage.getItem('userToken'); // Ambil token terbaru
        if (!currentToken) return logoutUser(); // Logout jika token hilang

        try {
            console.log("Fetching user servers from:", `${API_DATA_URL}/user-servers`); // Debug URL
            const response = await fetch(`${API_DATA_URL}/user-servers`, {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            console.log("Fetch response status:", response.status); // Debug status

            if (response.status === 401) {
                 console.error("Fetch User Servers Gagal: 401 Unauthorized");
                 alert('Sesi habis atau token tidak valid. Silakan login kembali.');
                 logoutUser();
                 return;
            }

            const servers = await response.json();
            console.log("Servers data received:", servers); // Debug data

            if (response.ok) {
                if (!servers || servers.length === 0) {
                    serverListContainer.innerHTML = '<p>Anda belum memiliki server. Pesan sekarang!</p>';
                    return;
                }

                serverListContainer.innerHTML = '';
                servers.forEach(server => {
                    const card = document.createElement('div');
                    card.className = `container-card server-card status-${server.status || 'unknown'}`;
                    card.innerHTML = `
                        <div class="server-info">
                            <h4>${server.productName || 'Nama Server Tidak Ada'}</h4>
                            <p>ID Panel: ${server.pterodactylServerId || 'N/A'} | Status: <span style="font-weight: bold;">${(server.status || 'unknown').toUpperCase()}</span></p>
                            <p>Perpanjangan: ${server.renewalDate ? new Date(server.renewalDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
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
    // Panggil saat DOM siap
    fetchUserServers();

    // --- 2. LOGIKA PEMBELIAN SERVER BARU ---
    if (orderServerForm) {
        console.log("Event listener untuk orderServerForm ditambahkan."); // Debug
        orderServerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Form pembelian disubmit!"); // Debug

            const serverNameElement = document.getElementById('server-name');
            const packageIdElement = document.getElementById('package-id');

            // Cek elemen form
            if (!serverNameElement || !packageIdElement) {
                console.error("Elemen form 'server-name' atau 'package-id' tidak ditemukan!");
                alert("Terjadi kesalahan pada formulir. Harap refresh halaman.");
                return;
            }

            const serverName = serverNameElement.value.trim();
            const packageId = packageIdElement.value;
            const currentToken = localStorage.getItem('userToken'); // Ambil token terbaru

            if(!currentToken) return logoutUser();
            if(!packageId) return alert("Harap pilih paket server.");
            if(!serverName) return alert("Harap masukkan nama server.");

            const selectedOption = packageIdElement.selectedOptions[0];
            const packageName = selectedOption ? selectedOption.text : packageId;

            if (!confirm(`Yakin ingin membeli ${packageName} dengan nama "${serverName}"? Saldo Anda akan dipotong.`)) return;

            const button = orderServerForm.querySelector('button[type="submit"]');
            if (!button) {
                console.error("Tombol submit tidak ditemukan di form!");
                return;
            }
            button.disabled = true;
            button.textContent = 'MEMPROSES...';

            try {
                console.log("Mengirim request pembelian ke:", `${API_DATA_URL}/purchase/pterodactyl`); // Debug
                const response = await fetch(`${API_DATA_URL}/purchase/pterodactyl`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`
                    },
                    body: JSON.stringify({ packageId: packageId, serverName: serverName }),
                });

                console.log("Response pembelian diterima:", response.status); // Debug

                const data = await response.json();
                console.log("Data response pembelian:", data); // Debug

                if (response.ok) {
                    let successMessage = `Sukses! ${data.message}`;
                    // Tampilkan kredensial HANYA jika backend mengirimnya
                    if (data.pterodactylCredentials && data.pterodactylCredentials.password) {
                        successMessage += `\n\nLogin Pterodactyl Panel:\nUsername: ${data.pterodactylCredentials.username}\nPassword: ${data.pterodactylCredentials.password}\n\nHarap simpan kredensial ini!`;
                    } else if (data.pterodactylCredentials && data.pterodactylCredentials.username) {
                        // Jika password null (karena user sudah ada)
                         successMessage += `\n\nLogin Pterodactyl Panel dengan akun:\nUsername: ${data.pterodactylCredentials.username}\n(Gunakan password Pterodactyl Anda yang sudah ada)`;
                    }
                    alert(successMessage);

                    orderServerForm.reset();
                    fetchUserServers();
                    localStorage.removeItem('loggedInUser'); // Hapus cache data user agar saldo terupdate di dashboard
                } else if (response.status === 401) {
                     console.error("Purchase Failed: 401 Unauthorized");
                     alert('Sesi habis. Login kembali.');
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
    } else {
        console.error("Error: Form dengan ID 'orderServerForm' tidak ditemukan!"); // Debug jika form tidak ada
    }

    // --- 3. LOGIKA KONTROL SERVER ---
    // Buat fungsi controlServer menjadi global agar bisa dipanggil dari HTML
    window.controlServer = async (serverId, command) => {
         const currentToken = localStorage.getItem('userToken');
         if(!currentToken) return logoutUser();

        if (!confirm(`Yakin ingin ${command.toUpperCase()} server ID ${serverId}?`)) return;

        alert(`[INFO] Mengirim sinyal ${command.toUpperCase()} ke Server ID ${serverId}. Mohon tunggu...`);

        const buttons = document.querySelectorAll(`.server-card button[onclick*="'${serverId}'"], .server-card a[href*="${serverId}"]`);
        buttons.forEach(btn => btn.style.opacity = '0.5');

        try {
            console.log("Mengirim kontrol server:", serverId, command); // Debug
            const response = await fetch(`${API_DATA_URL}/server-control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify({ serverId, command }),
            });
            const data = await response.json();

            console.log("Response kontrol server:", response.status, data); // Debug

            if (response.ok) {
                alert(`Sinyal ${command.toUpperCase()} berhasil dikirim.`);
                setTimeout(fetchUserServers, 7000); // Refresh setelah 7 detik
            } else if (response.status === 401) {
                console.error("Server Control Failed: 401 Unauthorized");
                alert('Sesi habis. Login kembali.');
                logoutUser();
            } else {
                console.error("Server Control Failed:", response.status, data.message);
                alert(`Gagal mengirim sinyal: ${data.message}`);
                buttons.forEach(btn => btn.style.opacity = '1');
            }
        } catch (error) {
            alert('Gagal koneksi ke API kontrol server.');
            console.error('Error controlling server:', error);
            buttons.forEach(btn => btn.style.opacity = '1');
        } finally {
             // Jangan langsung kembalikan opacity, tunggu refresh
        }
    };

}); // Akhir dari DOMContentLoaded
