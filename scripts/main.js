// scripts/main.js (Versi API - Backend MongoDB)

// GANTI DENGAN URL VERCEL API ANDA SETELAH DEPLOYMENT!
const API_URL = 'http://localhost:5000/api/auth';

const loginCard = document.getElementById('login-form-card');
const registerCard = document.getElementById('register-form-card');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

function switchForm(show, hide) {
  hide.style.opacity = 0;
  setTimeout(() => {
    hide.style.display = 'none';
    show.style.display = 'block';
    setTimeout(() => {
      show.style.opacity = 1;
    }, 10);
  }, 300);
}

showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  switchForm(registerCard, loginCard);
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  switchForm(loginCard, registerCard);
});

// --- REGISTRATION LOGIC ---
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = registerForm.username.value.trim();
  const password = registerForm.password.value;
  
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert(`Selamat, ${data.username}! Pendaftaran berhasil. Silakan login.`);
      switchForm(loginCard, registerCard);
      registerForm.reset();
    } else {
      alert(`Pendaftaran Gagal: ${data.message || 'Terjadi kesalahan.'}`);
    }
  } catch (error) {
    alert('Terjadi kesalahan koneksi server.');
  }
});

// --- LOGIN LOGIC ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value;
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const user = await response.json();
    
    if (response.ok) {
      localStorage.setItem('userToken', user.token);
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      
      alert(`Selamat datang, ${user.username}!`);
      
      if (user.isAdmin) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } else {
      alert(`Login Gagal: ${user.message || 'Username atau Password salah.'}`);
    }
  } catch (error) {
    alert('Terjadi kesalahan koneksi server.');
  }
  
  loginForm.reset();
});