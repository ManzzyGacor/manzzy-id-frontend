// scripts/starfield.js

// Fungsi untuk membuat Starfield Animation di Canvas
function createStarfield(canvasId) {
    // 1. Setup Canvas
    const canvas = document.getElementById(canvasId);
    if (!canvas) return; // Keluar jika elemen canvas tidak ditemukan

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const max_stars = 200;
    const stars = [];

    // 2. Objek Star
    function Star() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.radius = Math.random() * 1.2 + 0.5; // Ukuran bintang
        this.vx = Math.floor(Math.random() * 50) - 25; // Kecepatan X (untuk pergerakan halus)
        this.vy = Math.floor(Math.random() * 50) - 25; // Kecepatan Y
        this.alpha = Math.random(); // Opacity awal
        this.rotation = Math.random() * 360; 
    }

    // Inisialisasi bintang
    for (let i = 0; i < max_stars; i++) {
        stars.push(new Star());
    }

    // 3. Fungsi Gambar (Loop Animasi)
    function draw() {
        // Bersihkan canvas dengan warna latar belakang hitam pekat
        ctx.fillStyle = "#0a0a0a"; 
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = "lighter"; // Efek cahaya

        for (let i = 0; i < max_stars; i++) {
            let s = stars[i];

            // Update posisi
            s.x += s.vx / 3000;
            s.y += s.vy / 3000;
            s.alpha += Math.sin(s.rotation / 500) * 0.005; // Efek kedip/berdenyut

            // Batasi opacity
            if (s.alpha > 1) s.alpha = 1;
            if (s.alpha < 0) s.alpha = 0;

            // Jika bintang keluar batas, pindahkan ke sisi lain (membuat loop tanpa batas)
            if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) {
                stars[i] = new Star();
                // Posisikan bintang baru di sisi yang berlawanan dari mana ia keluar
                stars[i].x = s.x < 0 ? W : (s.x > W ? 0 : s.x);
                stars[i].y = s.y < 0 ? H : (s.y > H ? 0 : s.y);
            }

            // Gambar bintang
            ctx.fillStyle = "rgba(255, 255, 255, " + s.alpha + ")";
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        requestAnimationFrame(draw); // Panggil fungsi draw lagi (loop)
    }

    // 4. Handler Responsive (Menyesuaikan ukuran saat layar diubah)
    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        // Bintang akan menyesuaikan ke ukuran baru
    });

    // Mulai animasi
    draw();
}

// Ekspor fungsi agar bisa dipanggil dari HTML (misalnya: createStarfield('star-canvas');)
window.createStarfield = createStarfield;
