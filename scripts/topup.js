// scripts/topup.js (Minimal Top Up Rp 1.000)

// GANTI DENGAN URL VERCEL API ANDA YANG AKTIF!
const API_BASE_URL = 'https://manzzy-id-backend.vercel.app/api'; 

document.addEventListener('DOMContentLoaded', () => {
    console.log("Topup script loaded.");

    const userToken = localStorage.getItem('userToken');
    const saldoElement = document.getElementById('current-user-saldo');
    const amountInput = document.getElementById('amount');
    const pakasirBtn = document.getElementById('payWithPakasirBtn');
    const manualBtn = document.getElementById('manualConfirmBtn');
    const manualInfo = document.getElementById('manual-info');

    // --- Cek Login & Muat Saldo Awal ---
    if (!userToken) {
        alert("Harap login untuk melakukan top up.");
        // Pastikan fungsi logoutUser ada (dari inline script HTML)
        if (typeof logoutUser === 'function') logoutUser();
        return;
    }

    async function loadCurrentSaldo() {
        try {
            const response = await fetch(`${API_BASE_URL}/data/dashboard-data`, { // Gunakan endpoint dashboard
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                 if (saldoElement) {
                     const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
                     saldoElement.textContent = formatRupiah(data.saldo);
                 }
            } else if (response.status === 401) {
                alert("Sesi habis, login kembali.");
                if (typeof logoutUser === 'function') logoutUser();
            } else {
                 if (saldoElement) saldoElement.textContent = "Error";
            }
        } catch (error) {
            console.error("Gagal memuat saldo:", error);
            if (saldoElement) saldoElement.textContent = "Error Koneksi";
        }
    }
    loadCurrentSaldo();

    // --- Logika Tombol Pakasir ---
    if (pakasirBtn && amountInput) {
        pakasirBtn.addEventListener('click', async () => {
            const amount = parseInt(amountInput.value);
            // === Validasi Minimal 1000 ===
            if (isNaN(amount) || amount < 1000) { 
                alert("Jumlah top up tidak valid (minimal Rp 1.000).");
                return;
            }
            // ========================

            pakasirBtn.disabled = true;
            pakasirBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            manualBtn.disabled = true;

            try {
                console.log("Requesting Pakasir payment URL for amount:", amount);
                const response = await fetch(`${API_BASE_URL}/payment/create-pakasir`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ amount })
                });

                const data = await response.json();

                if (response.ok && data.paymentUrl) {
                    console.log("Redirecting to Pakasir:", data.paymentUrl);
                    window.location.href = data.paymentUrl;
                } else if (response.status === 401) {
                     alert("Sesi habis, login kembali.");
                     if (typeof logoutUser === 'function') logoutUser();
                }
                else {
                    console.error("Pakasir request failed:", data);
                    alert(`Gagal membuat link pembayaran: ${data.message || 'Error tidak diketahui'}`);
                    pakasirBtn.disabled = false;
                    pakasirBtn.innerHTML = '<i class="fas fa-bolt"></i> Bayar Otomatis (Pakasir)';
                    manualBtn.disabled = false;
                }

            } catch (error) {
                console.error("Error creating Pakasir payment:", error);
                alert("Kesalahan koneksi saat menghubungi gateway pembayaran.");
                pakasirBtn.disabled = false;
                pakasirBtn.innerHTML = '<i class="fas fa-bolt"></i> Bayar Otomatis (Pakasir)';
                manualBtn.disabled = false;
            }
        });
    } else {
        console.error("Tombol Pakasir atau input jumlah tidak ditemukan.");
    }

    // --- Logika Tombol Manual ---
    if (manualBtn && amountInput && manualInfo) {
        manualBtn.addEventListener('click', () => {
             const amount = parseInt(amountInput.value);
            // === Validasi Minimal 1000 ===
            if (isNaN(amount) || amount < 1000) {
                alert("Jumlah top up tidak valid (minimal Rp 1.000).");
                return;
            }
            // ========================
            const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
            manualInfo.textContent = `Permintaan top up manual sebesar ${formatRupiah(amount)} telah dicatat. Silakan hubungi admin via WhatsApp untuk konfirmasi pembayaran dan proses saldo.`;
            manualInfo.style.display = 'block';
        });
    } else {
         console.error("Tombol Manual, input jumlah, atau info manual tidak ditemukan.");
    }

}); // Akhir DOMContentLoaded
