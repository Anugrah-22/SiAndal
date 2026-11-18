function showLogin() {
  const loginBox = document.getElementById('login');
  const userInput = document.getElementById('lu');
  if (loginBox) loginBox.style.display = 'grid';
  if (userInput) userInput.focus();
}

document.getElementById('lf').onsubmit = async (e) => {
  e.preventDefault();
  const rawUser = document.getElementById('lu').value.trim();
  const rawPass = document.getElementById('lp').value;
  const uLower = rawUser.toLowerCase();
  const btn = document.getElementById('lb');

  btn.disabled = true;
  btn.textContent = 'Memeriksa...';

  try {
    // 1. Coba ambil daftar pengguna dari Supabase jika tersedia
    if (navigator.onLine && typeof sb !== 'undefined' && sb) {
      const { data, error } = await sb.from('users').select('*');
      if (error) {
        console.error('Supabase error:', error.message);
        toast('Info server: ' + error.message);
      } else if (data) {
        D.users = data;
        saveLocalData();
      }
    }
  } catch (err) {
    console.error('Koneksi gagal:', err);
  }

  btn.disabled = false;
  btn.textContent = 'Masuk';

  // 2. Cocokkan dengan data pengguna dari database
  let found = (D.users || []).find(u => u.username.toLowerCase() === uLower);

  // Cadangan darurat jika database Supabase masih kosong/belum terhubung
  if (!found && uLower === 'operator' && rawPass === 'admin123') {
    found = { username: 'operator', nama: 'Operator Sekolah', role: 'operator', kelas: '', pass: 'admin123' };
  }

  if (!found) {
    toast('Akun tidak ditemukan.');
    return;
  }
  if (found.pass !== rawPass) {
    toast('Kata sandi salah!');
    return;
  }

  // 3. Simpan sesi dan masuk ke aplikasi
  ME = {
    username: found.username,
    role: found.role,
    nama: found.nama,
    kelas: found.kelas || ''
  };

  localStorage.setItem('siandal.v6.me', JSON.stringify(ME));
  document.getElementById('lp').value = '';
  document.getElementById('login').style.display = 'none';

  if (typeof pullFromCloud === 'function') await pullFromCloud();
  buildNav();
  go(ME.role === 'guru' ? 'input' : 'dasbor');
};

function logoutApp() {
  localStorage.removeItem('siandal.v6.me');
  location.reload();
}