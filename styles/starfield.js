// scripts/starfield.js

// Fungsi untuk membuat Starfield Animation di Canvas
function createStarfield(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const max_stars = 200;
    const stars = [];

    // Objek Star
    function Star() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.radius = Math.random() * 1.2 + 0.5; // Ukuran bintang
        this.vx = Math.floor(Math.random() * 50) - 25; // Kecepatan X
        this.vy = Math.floor(Math.random() * 50) - 25; // Kecepatan Y
        this.alpha = Math.random(); // Opacity untuk efek kedip
        this.rotation = Math.random() * 360; 
    }

    // Inisialisasi bintang
    for (let i = 0; i < max_stars; i++) {
        stars.push(new Star());
    }

    function draw() {
        // Bersihkan canvas
        ctx.fillStyle = "#0a0a0a"; // Warna latar belakang hitam pekat
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = "lighter";

        for (let i = 0; i < max_stars; i++) {
            let s = stars[i];

            // Update posisi
            s.x += s.vx / 3000;
            s.y += s.vy / 3000;
            s.alpha += Math.sin(s.rotation / 500) * 0.005; // Efek kedip

            // Batasi opacity
            if (s.alpha > 1) s.alpha = 1;
            if (s.alpha < 0) s.alpha = 0;

            // Jika bintang keluar batas, pindahkan ke sisi lain
            if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) {
                stars[i] = new Star();
                stars[i].x = s.x < 0 ? W : (s.x > W ? 0 : s.x);
                stars[i].y = s.y < 0 ? H : (s.y > H ? 0 : s.y);
            }

            // Gambar bintang
            ctx.fillStyle = "rgba(255, 255, 255, " + s.alpha + ")";
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        requestAnimationFrame(draw); // Menggunakan requestAnimationFrame untuk performa yang lebih baik
    }

    // Handler resize window
    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
    });

    // Mulai animasi
    draw();
}

// Ekspor fungsi agar bisa dipanggil dari HTML
window.createStarfield = createStarfield;
