function showLogin() {
  const loginBox = document.getElementById('login');
  const userInput = document.getElementById('lu');
  if (loginBox) loginBox.style.display = 'grid';
  if (userInput) userInput.focus();
}

document.getElementById('lf').onsubmit = (e) => {
  e.preventDefault();
  const rawUser = document.getElementById('lu').value.trim();
  const uLower = rawUser.toLowerCase();

  // Cek apakah pengguna ada di daftar akun yang dibuat Operator
  const found = (D.users || []).find(u => u.username.toLowerCase() === uLower);

  let role = 'guru';
  let kelasWali = '';
  let namaLengkap = rawUser || 'Wali Kelas';

  if (found) {
    role = found.role;
    kelasWali = found.kelas || '';
    namaLengkap = found.nama;
  } else if (uLower === 'operator' || uLower === 'admin') {
    role = 'operator';
    namaLengkap = 'Operator Sekolah';
  } else if (uLower === 'kepsek') {
    role = 'kepsek';
    namaLengkap = 'Kepala Sekolah';
  }

  ME = { username: uLower, role, nama: namaLengkap, kelas: kelasWali };
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