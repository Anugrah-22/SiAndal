// Ganti URL dan ANON KEY di bawah ini dengan milik proyek Supabase Anda
const SUPABASE_URL = 'https://PROYEK-ANDA.supabase.co';
const SUPABASE_KEY = 'MASUKKAN-ANON-PUBLIC-KEY-ANDA-DI-SINI';

const sb = (SUPABASE_URL.startsWith('http') && !SUPABASE_URL.includes('PROYEK-ANDA'))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Penyimpanan lokal (Local-First) agar tetap jalan saat offline
let D = JSON.parse(localStorage.getItem('siandal.data') || '{"siswa":[],"abs":{},"users":[]}');
let ME = null;

function saveLocalData() {
  localStorage.setItem('siandal.data', JSON.stringify(D));
}