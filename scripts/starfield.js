// scripts/starfield.js (VERSI LEBIH CANGGIH & BERWARNA)

function createStarfield(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    // Jumlah bintang yang lebih banyak untuk efek yang lebih padat
    const num_stars = 500; 
    const stars = [];

    // Fungsi untuk mendapatkan warna bintang secara acak
    function getRandomStarColor() {
        const colors = [
            'rgba(173, 216, 230,',  // Light Blue
            'rgba(255, 255, 200,',  // Pale Yellow
            'rgba(255, 160, 120,',  // Light Salmon (for reddish stars)
            'rgba(200, 180, 255,',  // Light Purple
            'rgba(255, 255, 255,',  // White
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Objek Star (dengan penambahan kecepatan Z dan warna)
    function Star() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.z = Math.random() * W; // Kedalaman untuk efek parallax
        this.radius = Math.random() * 0.8 + 0.5; // Ukuran bintang lebih kecil dan bervariasi
        this.color = getRandomStarColor();
        this.alpha = Math.random() * 0.8 + 0.2; // Opacity awal lebih bervariasi
        this.rotationSpeed = (Math.random() - 0.5) * 0.005; // Kecepatan kedip/rotasi
    }

    // Inisialisasi bintang
    for (let i = 0; i < num_stars; i++) {
        stars.push(new Star());
    }

    let frame = 0; // Untuk animasi kedip/berdenyut

    function draw() {
        // Bersihkan canvas dengan efek trail yang halus (bukan clear penuh)
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // Sedikit transparan untuk efek trail
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = "lighter"; // Efek cahaya

        for (let i = 0; i < num_stars; i++) {
            let s = stars[i];

            // Update posisi berdasarkan kecepatan Z (ilusi bergerak ke depan)
            s.z -= 0.5; // Kecepatan pergerakan bintang (bisa diatur)
            if (s.z <= 0) { // Jika bintang sudah lewat
                stars[i] = new Star(); // Buat bintang baru
                s = stars[i];
                s.z = W; // Posisikan di kedalaman terjauh
            }

            // Hitung posisi 2D dari posisi 3D (Z)
            let sx = ((s.x - W / 2) * (W / s.z)) + W / 2;
            let sy = ((s.y - H / 2) * (W / s.z)) + H / 2;
            let s_radius = s.radius * (W / s.z); // Ukuran bintang juga berubah berdasarkan kedalaman

            // Efek kedip/berdenyut
            s.alpha += s.rotationSpeed;
            if (s.alpha > 1 || s.alpha < 0.2) {
                s.rotationSpeed *= -1; // Balik arah kedip
            }
            s.alpha = Math.max(0.2, Math.min(1, s.alpha)); // Batasi opacity

            // Gambar bintang
            ctx.fillStyle = s.color + s.alpha + ')'; // Gunakan warna dan alpha dinamis
            ctx.beginPath();
            ctx.arc(sx, sy, s_radius, 0, Math.PI * 2);
            ctx.fill();

            // Efek glow (opsional, bisa berat)
            ctx.shadowBlur = s_radius * 2;
            ctx.shadowColor = s.color + '0.8)';
        }
        ctx.shadowBlur = 0; // Reset shadow untuk elemen lain

        requestAnimationFrame(draw); // Loop animasi
    }

    // Handler responsive
    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        // Tidak perlu inisialisasi ulang bintang, mereka akan menyesuaikan
    });

    draw(); // Mulai animasi
}

window.createStarfield = createStarfield;
