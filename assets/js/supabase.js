// Ganti URL dan ANON KEY di bawah ini dengan milik proyek Supabase Anda
const SUPABASE_URL = 'https://sujlwnjdwvvkhfrusteb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UCbi8_uz28YtEzZlVqOkgA_3mOfEUK2';

const sb = (SUPABASE_URL.startsWith('http') && !SUPABASE_URL.includes('PROYEK-ANDA'))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Penyimpanan data utama di memori perangkat
let D = JSON.parse(localStorage.getItem('siandal.v6.data') || '{"siswa":[],"abs":{},"users":[]}');
let ME = null;

function saveLocalData() {
  try {
    localStorage.setItem('siandal.v6.data', JSON.stringify(D));
  } catch (e) {
    toast('Penyimpanan browser penuh.');
  }
}

// Fungsi sinkronisasi dasar ke Supabase (jika tabel sudah disiapkan)
async function syncCloud() {
  saveLocalData();
  if (!sb) {
    toast('Data tersimpan aman di perangkat (Supabase URL belum diisi).');
    return;
  }
  toast('Data lokal tersimpan dan siap disinkronkan ke Supabase.');
}