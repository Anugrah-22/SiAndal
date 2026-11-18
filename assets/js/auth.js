function showLogin() {
  document.getElementById('login').style.display = 'grid';
  document.getElementById('lu').focus();
}

document.getElementById('lf').onsubmit = async (e) => {
  e.preventDefault();
  const rawUser = document.getElementById('lu').value.trim();
  const uLower = rawUser.toLowerCase();

  // Cek apakah pengguna sudah didaftarkan operator di daftar pengguna
  const found = (D.users || []).find(u => u.username.toLowerCase() === uLower);

  let peran = 'guru';
  let kelasWali = '';
  let namaLengkap = rawUser || 'Pengguna';

  if (found) {
    peran = found.role;
    kelasWali = found.kelas || '';
    namaLengkap = found.nama;
  } else if (uLower === 'operator' || uLower === 'admin') {
    peran = 'operator';
    namaLengkap = 'Operator Sekolah';
  } else if (uLower === 'kepsek') {
    peran = 'kepsek';
    namaLengkap = 'Kepala Sekolah';
  }

  ME = { username: uLower, role: peran, nama: namaLengkap, kelas: kelasWali };
  localStorage.setItem('siandal.session', JSON.stringify(ME));

  document.getElementById('lp').value = '';
  document.getElementById('login').style.display = 'none';

  buildNav();
  go(ME.role === 'guru' ? 'input' : 'dasbor');
};

function logoutApp() {
  localStorage.removeItem('siandal.session');
  location.reload();
}