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

  // Ambil daftar pengguna terbaru dari Supabase jika sedang online
  if (navigator.onLine) {
    const { data, error } = await sb.from('users').select('*');
    if (!error && data) {
      D.users = data;
      saveLocalData();
    }
  }

  const found = (D.users || []).find(u => u.username.toLowerCase() === uLower);

  btn.disabled = false;
  btn.textContent = 'Masuk';

  if (!found) {
    toast('Akun tidak ditemukan. Periksa koneksi internet atau hubungi Operator.');
    return;
  }
  if (found.pass !== rawPass) {
    toast('Kata sandi salah!');
    return;
  }

  ME = {
    username: found.username,
    role: found.role,
    nama: found.nama,
    kelas: found.kelas || ''
  };

  localStorage.setItem('siandal.v6.me', JSON.stringify(ME));
  document.getElementById('lp').value = '';
  document.getElementById('login').style.display = 'none';

  await pullFromCloud();
  buildNav();
  go(ME.role === 'guru' ? 'input' : 'dasbor');
};

function logoutApp() {
  localStorage.removeItem('siandal.v6.me');
  location.reload();
}