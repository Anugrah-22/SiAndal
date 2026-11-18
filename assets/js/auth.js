// Sandi bawaan untuk akun utama Operator (silakan ganti sesuai keinginan)
const SANDI_OPERATOR = 'admin123';

function showLogin() {
  const loginBox = document.getElementById('login');
  const userInput = document.getElementById('lu');
  if (loginBox) loginBox.style.display = 'grid';
  if (userInput) userInput.focus();
}

document.getElementById('lf').onsubmit = (e) => {
  e.preventDefault();
  const rawUser = document.getElementById('lu').value.trim();
  const rawPass = document.getElementById('lp').value;
  const uLower = rawUser.toLowerCase();

  // 1. Cek apakah login sebagai Operator Utama
  if (uLower === 'operator') {
    if (rawPass !== SANDI_OPERATOR) {
      toast('Kata sandi Operator salah!');
      return;
    }
    ME = { username: 'operator', role: 'operator', nama: 'Operator Sekolah', kelas: '' };
  } else {
    // 2. Cek apakah nama pengguna dan sandi cocok dengan data buatan Operator
    const found = (D.users || []).find(u => u.username.toLowerCase() === uLower);
    
    if (!found) {
      toast('Akun tidak ditemukan. Hubungi Operator sekolah.');
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
  }

  // Simpan sesi masuk yang valid
  localStorage.setItem('siandal.v6.me', JSON.stringify(ME));
  document.getElementById('lp').value = '';
  document.getElementById('login').style.display = 'none';

  buildNav();
  go(ME.role === 'guru' ? 'input' : 'dasbor');
};

function logoutApp() {
  localStorage.removeItem('siandal.v6.me');
  location.reload();
}