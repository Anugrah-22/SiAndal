/* ===== Utilitas Dasar ===== */
const $ = i => document.getElementById(i);
const E = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const sub = (d, n) => new Date(Date.parse(d) - n * 864e5).toISOString().slice(0, 10);
const TD = iso(new Date());

const ST = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Alpa' };
const COL = { H: '#1B6E4F', S: '#E0A800', I: '#2B6CB0', A: '#C0392B' };
const ROLE = { operator: 'operator', guru: 'wali kelas/guru', kepsek: 'kepala sekolah' };
const TABS = [
  ['dasbor', 'Dasbor'],
  ['input', 'Input Absensi'],
  ['rekap', 'Rekap'],
  ['siswa', 'Data Siswa'],
  ['lap', 'Laporan'],
  ['pengguna', 'Pengguna'],
  ['panduan', 'Panduan']
];

const tgl = d => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const fmt = p => p == null ? '–' : (+p.toFixed(1)) + '%';
const kelas = () => [...new Set(D.siswa.map(s => s.kelas))].sort();
const sis = id => D.siswa.find(s => s.id == id);

let tmr;
function toast(t) {
  const e = $('toast');
  e.textContent = t;
  e.style.display = 'block';
  clearTimeout(tmr);
  tmr = setTimeout(() => e.style.display = 'none', 3200);
}

function recs(f) {
  const r = [];
  for (const d in D.abs) {
    if (f.date && d !== f.date) continue;
    if (f.month && d.slice(0, 7) !== f.month) continue;
    for (const k in D.abs[d]) {
      if (f.kelas && k !== f.kelas) continue;
      for (const id in D.abs[d][k]) {
        if (sis(id)) r.push({ d, k, id, s: D.abs[d][k][id] });
      }
    }
  }
  return r;
}

const pct = r => r.length ? r.filter(x => x.s === 'H').length / r.length * 100 : null;
const cnt = r => { const c = { H: 0, S: 0, I: 0, A: 0 }; r.forEach(x => c[x.s]++); return c; };
const noData = () => '<div class="box empty">Belum ada data siswa.<br><br><button class="btn" onclick="go(\'siswa\')">Buka Data Siswa</button></div>';

/* ===== Navigasi ===== */
let tab = 'dasbor';
$('nav').onclick = e => { const t = e.target.dataset.t; if (t) go(t); };

function go(t) {
  tab = t;
  TABS.forEach(x => $('t-' + x[0]).classList.toggle('on', x[0] === t));
  [...$('nav').children].forEach(b => b.classList.toggle('on', b.dataset.t === t));
  scrollTo(0, 0);
  render();
}

function fillK(id, all) {
  const s = $(id), v = s.value;
  const k = (id === 'iKelas' && ME && ME.kelas) ? [ME.kelas] : kelas();
  s.innerHTML = (all ? '<option value="">Semua kelas</option>' : '') + k.map(x => `<option>${E(x)}</option>`).join('');
  if (k.includes(v) || (all && v === '')) s.value = v;
}

function render() {
  ['dKelas', 'rKelas', 'sKelas'].forEach(i => fillK(i, true));
  fillK('iKelas', false);
  ({
    dasbor: rDasbor,
    input: rInput,
    rekap: rRekap,
    siswa: rSiswa,
    lap: rLap,
    pengguna: rPengguna,
    panduan: () => {}
  })[tab]();
}

function buildNav() {
  const ok = {
    operator: TABS.map(t => t[0]),
    guru: ['dasbor', 'input', 'rekap', 'panduan'],
    kepsek: ['dasbor', 'rekap', 'lap', 'panduan']
  }[ME.role];

  $('nav').innerHTML = TABS.filter(t => ok.includes(t[0]))
    .map(t => `<button data-t="${t[0]}">${t[1]}</button>`).join('');
  $('who').innerHTML = `${E(ME.nama)} (${ROLE[ME.role]}) <button class="lk" data-k="sync">Sinkron</button><button class="lk" data-k="out">Keluar</button>`;
}

$('who').onclick = async e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.k === 'sync') {
    toast('Menyinkronkan data...');
    const ok = await pullFromCloud();
    if (ok) { render(); toast('Sinkronisasi cloud selesai!'); }
    else toast('Gagal terhubung ke server. Data tetap aman di perangkat.');
  }
  if (b.dataset.k === 'out') return logoutApp();
};

/* ===== Mode Koneksi ===== */
function mode() {
  const h = location.hostname;
  let t, c;
  if (!navigator.onLine) { t = 'Offline'; c = '#6b7280'; }
  else if (location.protocol === 'file:' || /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) { t = 'Lokal'; c = '#D9730D'; }
  else { t = 'Online'; c = '#1B6E4F'; }
  $('mode').innerHTML = `<i style="background:${c}"></i>${t}`;
}
addEventListener('online', mode);
addEventListener('offline', mode);

/* ===== Grafik SVG (Tanpa Library Eksternal) ===== */
function barSvg(items) {
  if (!items.length) return '<div class="empty">Belum ada data.</div>';
  const W = Math.max(300, items.length * 70), H = 190, b = 34, t = 14;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Kehadiran per kelas">`;
  [0, 50, 100].forEach(v => {
    const y = H - b - (H - b - t) * v / 100;
    s += `<line x1="30" x2="${W}" y1="${y}" y2="${y}" stroke="#d5ddd8"/><text x="26" y="${y + 4}" font-size="10" text-anchor="end" fill="#5b6761">${v}</text>`;
  });
  const w = (W - 30) / items.length;
  items.forEach((it, i) => {
    const h = it.p == null ? 0 : (H - b - t) * it.p / 100, x = 30 + i * w + w * .2;
    s += `<rect x="${x}" y="${H - b - h}" width="${w * .6}" height="${h}" fill="${it.p != null && it.p < 90 ? '#D9730D' : '#1B6E4F'}" rx="2"><title>${E(it.k)}: ${fmt(it.p)}</title></rect>
    <text x="${x + w * .3}" y="${H - b - h - 4}" font-size="11" text-anchor="middle" font-weight="700">${it.p == null ? '' : Math.round(it.p)}</text>
    <text x="${x + w * .3}" y="${H - 14}" font-size="11" text-anchor="middle">${E(it.k)}</text>`;
  });
  return s + '</svg>';
}

function donutSvg(c, n) {
  if (!n) return '<div class="empty">Belum ada data.</div>';
  const R = 50, C = 2 * Math.PI * R;
  let o = 0, s = '<svg viewBox="0 0 250 130" width="100%" role="img" aria-label="Komposisi status kehadiran"><g transform="translate(65,65) rotate(-90)"><circle r="50" fill="none" stroke="#eee" stroke-width="22"/>';
  for (const k in c) {
    if (!c[k]) continue;
    const l = c[k] / n * C;
    s += `<circle r="50" fill="none" stroke="${COL[k]}" stroke-width="22" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-o}"/>`;
    o += l;
  }
  s += `</g><text x="65" y="71" text-anchor="middle" font-size="18" font-weight="700">${Math.round(c.H / n * 100)}%</text>`;
  let y = 34;
  for (const k in c) {
    s += `<rect x="140" y="${y - 9}" width="12" height="12" fill="${COL[k]}"/><text x="158" y="${y + 2}" font-size="12">${k} ${ST[k]} (${c[k]})</text>`;
    y += 22;
  }
  return s + '</svg>';
}

function lineSvg(pts) {
  if (!pts.length) return '<div class="empty">Belum ada data bulan ini.</div>';
  const W = Math.max(320, pts.length * 50), H = 200, l = 34, b = 30, t = 14;
  const X = i => pts.length < 2 ? (W + l) / 2 : l + (W - l - 10) * i / (pts.length - 1);
  const Y = v => H - b - (H - b - t) * v / 100;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Tren kehadiran harian">`;
  [0, 50, 100].forEach(v => s += `<line x1="${l}" x2="${W}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d5ddd8"/><text x="${l - 4}" y="${Y(v) + 4}" font-size="10" text-anchor="end" fill="#5b6761">${v}</text>`);
  s += `<line x1="${l}" x2="${W}" y1="${Y(90)}" y2="${Y(90)}" stroke="#D9730D" stroke-dasharray="5 4"/><text x="${W}" y="${Y(90) - 4}" font-size="10" text-anchor="end" fill="#D9730D">batas 90%</text>`;
  s += `<polyline fill="none" stroke="#1B6E4F" stroke-width="2.5" points="${pts.map((p, i) => X(i) + ',' + Y(p.p)).join(' ')}"/>`;
  pts.forEach((p, i) => s += `<circle cx="${X(i)}" cy="${Y(p.p)}" r="4" fill="${p.p < 90 ? '#D9730D' : '#1B6E4F'}"><title>${tgl(p.d)}: ${fmt(p.p)}</title></circle><text x="${X(i)}" y="${H - 10}" font-size="10" text-anchor="middle">${p.d.slice(8)}</text>`);
  return s + '</svg>';
}

/* ===== Dasbor ===== */
function rDasbor() {
  if (!D.siswa.length) { $('dOut').innerHTML = noData(); return; }
  const d = $('dDate').value || ($('dDate').value = TD), k = $('dKelas').value;
  const r = recs({ date: d, kelas: k }), c = cnt(r), p = pct(r);
  const bars = (k ? [k] : kelas()).map(x => ({ k: x, p: pct(recs({ date: d, kelas: x })) }));
  const mon = d.slice(0, 7), d7 = sub(d, 6);
  const rank = kelas().map(x => {
    const a = recs({ month: mon, kelas: x }), w = recs({ kelas: x }).filter(y => y.d >= d7 && y.d <= d);
    return { k: x, p: pct(a), perfect: w.length > 0 && w.every(y => y.s === 'H') };
  }).filter(x => x.p != null).sort((a, b) => b.p - a.p);

  $('dOut').innerHTML = `<div class="cards">
    <div class="card big" style="--c:#1B6E4F"><b>${fmt(p)}</b><span>Hadir pada ${tgl(d)}</span></div>
    ${['S', 'I', 'A'].map(s => `<div class="card" style="--c:${COL[s]}"><b>${c[s]}</b><span>${s} ${ST[s]}</span></div>`).join('')}</div>
    ${r.length ? '' : '<p class="mut">Belum ada absensi pada tanggal ini.</p>'}
    <div class="two"><div class="box"><h3>Kehadiran per kelas (%)</h3>${barSvg(bars)}</div><div class="box"><h3>Komposisi status</h3>${donutSvg(c, r.length)}</div></div>
    <div class="box" style="margin-top:14px"><h3>Kelas Andalan, bulan ${mon}</h3>${rank.length ? rank.map((x, i) => `<div class="rank${i ? '' : ' top'}"><span class="n">${i + 1}</span><span>Kelas ${E(x.k)}</span>${x.perfect ? '<span class="badge">Hadir 100% Minggu Ini</span>' : ''}<span class="p">${fmt(x.p)}</span></div>`).join('') : '<div class="empty">Peringkat muncul setelah absensi diisi.</div>'}</div>`;
}
$('dDate').onchange = $('dKelas').onchange = rDasbor;

/* ===== Input Absensi ===== */
let cur = {};
function rInput() {
  const o = $('iOut');
  if (!D.siswa.length) { o.innerHTML = noData(); return; }
  const d = $('iDate').value || ($('iDate').value = TD), k = $('iKelas').value;
  const L = D.siswa.filter(s => s.kelas === k).sort((a, b) => a.nama.localeCompare(b.nama));
  const ex = (D.abs[d] || {})[k] || {};
  cur = {};
  L.forEach(s => { if (ex[s.id]) cur[s.id] = ex[s.id]; });

  o.innerHTML = L.map((s, i) => `<div class="row" id="r${s.id}"><span class="nm">${i + 1}. ${E(s.nama)}</span><div class="sb">${['H', 'S', 'I', 'A'].map(x => `<button data-id="${s.id}" data-s="${x}" style="--c:${COL[x]}" class="${cur[s.id] === x ? 'on' : ''}" aria-label="${ST[x]}">${x}</button>`).join('')}</div></div>`).join('') || '<div class="empty">Kelas belum punya siswa.</div>';
}

$('iOut').onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  cur[b.dataset.id] = b.dataset.s;
  [...b.parentNode.children].forEach(x => x.classList.toggle('on', x === b));
  $('r' + b.dataset.id).classList.remove('miss');
};

$('iAll').onclick = () => {
  document.querySelectorAll('#iOut .sb').forEach(g => {
    const h = g.querySelector('[data-s=H]');
    cur[h.dataset.id] = 'H';
    [...g.children].forEach(x => x.classList.toggle('on', x === h));
  });
};

$('iSave').onclick = async () => {
  const d = $('iDate').value, k = $('iKelas').value, L = D.siswa.filter(s => s.kelas === k);
  if (!d || !L.length) return toast('Pilih tanggal dan kelas yang memiliki siswa.');
  const m = L.filter(s => !cur[s.id]);
  m.forEach(s => $('r' + s.id).classList.add('miss'));
  if (m.length) {
    $('r' + m[0].id).scrollIntoView({ block: 'center' });
    return toast(m.length + ' siswa belum dipilih statusnya.');
  }
  (D.abs[d] = D.abs[d] || {})[k] = Object.assign({}, cur);
  saveLocalData();

  if (navigator.onLine) {
    const rows = Object.keys(cur).map(sid => ({
      id: `${d}_${sid}`,
      tanggal: d,
      kelas: k,
      siswa_id: sid,
      status: cur[sid]
    }));
    await sb.from('absensi').upsert(rows);
    toast('Absensi tersimpan ke Cloud!');
  } else {
    toast('Offline: Absensi tersimpan di HP.');
  }

  $('dDate').value = d;
  $('dKelas').value = k;
  go('dasbor');
};
$('iDate').onchange = $('iKelas').onchange = rInput;

/* ===== Rekap & WhatsApp Orang Tua ===== */
function rekap(m, k) {
  const by = {};
  recs({ month: m, kelas: k }).forEach(x => (by[x.id] = by[x.id] || []).push(x));
  return Object.keys(by).map(id => {
    const a = by[id], c = cnt(a);
    const last = a.filter(x => x.s !== 'H').sort((p, q) => q.d > p.d ? 1 : -1)[0];
    return { s: sis(id), c, n: a.length, p: c.H / a.length * 100, last };
  });
}

function wa(x) {
  if (!x.last || !x.s.hp) return '';
  const n = x.s.hp.replace(/\D/g, '').replace(/^0/, '62');
  const t = `Assalamualaikum, ananda ${x.s.nama} (${x.s.kelas}) tidak hadir pada ${tgl(x.last.d)} (${ST[x.last.s]}). Kehadiran ananda bulan ini ${fmt(x.p)}. Mohon konfirmasi dari Bapak/Ibu. Terima kasih. SMA IT Andalan.`;
  return `<a class="btn" style="display:inline-grid;place-items:center;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/${n}?text=${encodeURIComponent(t)}">Kirim pesan</a>`;
}

function rRekap() {
  if (!D.siswa.length) { $('rOut').innerHTML = noData(); return; }
  const m = $('rMon').value || ($('rMon').value = TD.slice(0, 7)), k = $('rKelas').value;
  const r = recs({ month: m, kelas: k });
  const ds = [...new Set(r.map(x => x.d))].sort(), pts = ds.map(d => ({ d, p: pct(r.filter(x => x.d === d)) }));
  const rows = rekap(m, k).sort((a, b) => a.p - b.p), low = rows.filter(x => x.p < 90).length;

  $('rOut').innerHTML = `<div class="box"><h3>Tren kehadiran harian (%)</h3>${lineSvg(pts)}</div>
    <div class="box"><h3>Siswa dan kehadiran ${low ? `<span class="badge" style="background:#fdeedd;border-color:#f0b982;color:#9a4d08">${low} siswa di bawah 90%</span>` : ''}</h3>
    ${rows.length ? `<p class="mut">Siswa dengan kehadiran di bawah 90% perlu tindak lanjut (baris oranye). Tombol pesan membuka WhatsApp dan butuh internet.</p><div class="sc"><table><tr><th>Nama</th><th>Kelas</th><th>H</th><th>S</th><th>I</th><th>A</th><th>Hadir</th><th></th></tr>
    ${rows.map(x => `<tr class="${x.p < 90 ? 'w' : ''}"><td>${E(x.s.nama)}</td><td>${E(x.s.kelas)}</td><td>${x.c.H}</td><td>${x.c.S}</td><td>${x.c.I}</td><td>${x.c.A}</td><td><b>${fmt(x.p)}</b></td><td>${x.p < 90 ? wa(x) : ''}</td></tr>`).join('')}</table></div>` : '<div class="empty">Belum ada absensi pada bulan ini.</div>'}</div>`;
}
$('rMon').onchange = $('rKelas').onchange = rRekap;

/* ===== Data Siswa ===== */
async function impor(txt) {
  let added = 0, skip = 0;
  const baru = [];
  txt.split(/\r?\n/).forEach((l, i) => {
    if (!l.trim()) return;
    const c = l.split(/\t|;|,/).map(x => x.replace(/^"|"$/g, '').trim());
    if (i === 0 && /^nama$/i.test(c[0])) return;
    if (!c[0] || !c[1]) { skip++; return; }
    const dup = D.siswa.some(s => s.nama.toLowerCase() === c[0].toLowerCase() && s.kelas.toLowerCase() === c[1].toLowerCase());
    if (dup) { skip++; return; }
    const item = { id: 'S' + Date.now() + Math.random().toString(36).slice(2, 6), nama: c[0], kelas: c[1], hp: c[2] || '' };
    D.siswa.push(item);
    baru.push(item);
    added++;
  });
  saveLocalData();
  if (baru.length && navigator.onLine) await sb.from('siswa').insert(baru);
  toast(`${added} siswa ditambahkan${skip ? `, ${skip} dilewati` : ''}.`);
  render();
}

$('sImp').onclick = () => { impor($('sPaste').value); $('sPaste').value = ''; };
$('sFile').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => impor(String(r.result));
  r.readAsText(f);
  e.target.value = '';
};

function rSiswa() {
  const k = $('sKelas').value;
  const L = D.siswa.filter(s => !k || s.kelas === k).sort((a, b) => a.kelas.localeCompare(b.kelas) || a.nama.localeCompare(b.nama));
  $('sCount').textContent = `(${L.length} siswa, ${kelas().length} kelas)`;
  $('sOut').innerHTML = L.length
    ? `<table><tr><th>Nama</th><th>Kelas</th><th>HP orang tua</th><th></th></tr>${L.map(s => `<tr><td>${E(s.nama)}</td><td>${E(s.kelas)}</td><td>${E(s.hp)}</td><td style="white-space:nowrap"><button class="btn o" data-e="${s.id}" style="min-height:36px">Ubah</button> <button class="btn r" data-x="${s.id}" style="min-height:36px">Hapus</button></td></tr>`).join('')}</table>`
    : '<div class="empty">Belum ada siswa. Tempel daftar nama siswa di atas lalu klik Impor.</div>';
}

$('sOut').onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.x) {
    const s = sis(b.dataset.x);
    if (confirm('Hapus ' + s.nama + '?')) {
      D.siswa = D.siswa.filter(x => x.id !== s.id);
      saveLocalData();
      render();
    }
  }
  if (b.dataset.e) {
    const s = sis(b.dataset.e);
    const n = prompt('Nama', s.nama); if (n === null) return;
    const k = prompt('Kelas', s.kelas); if (k === null) return;
    const h = prompt('Nomor HP orang tua', s.hp); if (h === null) return;
    if (!n.trim() || !k.trim()) return toast('Nama dan kelas tidak boleh kosong.');
    s.nama = n.trim(); s.kelas = k.trim(); s.hp = h.trim();
    saveLocalData();
    render();
  }
};
$('sKelas').onchange = rSiswa;

/* ===== Laporan & Ekspor ===== */
function lRows(m) {
  return rekap(m, '').sort((a, b) => a.s.kelas.localeCompare(b.s.kelas) || a.s.nama.localeCompare(b.s.nama));
}
function rLap() { $('lMon').value = $('lMon').value || TD.slice(0, 7); }
function dl(name, txt, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

$('lCsv').onclick = () => {
  const m = $('lMon').value, r = lRows(m);
  if (!r.length) return toast('Belum ada absensi pada bulan ini.');
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  dl(`Rekap_Absensi_${m}.csv`, '\ufeff' + ['Nama,Kelas,Hadir,Sakit,Izin,Alpa,Persen Hadir'].concat(r.map(x => [q(x.s.nama), q(x.s.kelas), x.c.H, x.c.S, x.c.I, x.c.A, fmt(x.p)].join(','))).join('\r\n'), 'text/csv');
};

$('lPrint').onclick = () => {
  const m = $('lMon').value, r = lRows(m);
  if (!r.length) return toast('Belum ada absensi pada bulan ini.');
  $('pr').innerHTML = `<h2>Laporan Kehadiran Siswa – ${m}</h2><div>SMA IT Andalan Internasional Boarding School, Kab. Bone. Dicetak ${tgl(TD)}.</div>` + kelas().map(k => {
    const L = r.filter(x => x.s.kelas === k);
    return L.length ? `<h2>Kelas ${E(k)} (rata-rata hadir ${fmt(pct(recs({ month: m, kelas: k })))})</h2><table><tr><th>Nama</th><th>H</th><th>S</th><th>I</th><th>A</th><th>Hadir</th></tr>${L.map(x => `<tr><td>${E(x.s.nama)}</td><td>${x.c.H}</td><td>${x.c.S}</td><td>${x.c.I}</td><td>${x.c.A}</td><td>${fmt(x.p)}</td></tr>`).join('')}</table>` : '';
  }).join('');
  print();
};

$('lJson').onclick = () => {
  const m = $('lMon').value;
  if (!recs({ month: m }).length) return toast('Belum ada absensi pada bulan ini.');
  const ks = kelas().filter(k => recs({ month: m, kelas: k }).length).map(k => {
    const a = recs({ month: m, kelas: k });
    return {
      kelas: k,
      jumlah_siswa: D.siswa.filter(s => s.kelas === k).length,
      persen_hadir: +pct(a).toFixed(1),
      harian: [...new Set(a.map(x => x.d))].sort().map(d => ({ tanggal: d, persen: +pct(a.filter(x => x.d === d)).toFixed(1) }))
    };
  });
  dl(`Rekap_Online_${m}.json`, JSON.stringify({ sekolah: 'SMA IT Andalan Internasional Boarding School', bulan: m, dibuat: TD, kelas: ks }, null, 1), 'application/json');
};

/* ===== Pengguna (Operator) ===== */
function rPengguna() {
  if (!D.users) D.users = [];
  $('uOut').innerHTML = D.users.length
    ? `<table><tr><th>Pengguna</th><th>Nama</th><th>Peran</th><th>Kelas</th><th></th></tr>${D.users.map((u, i) => `<tr><td>${E(u.username)}</td><td>${E(u.nama)}</td><td>${ROLE[u.role]}</td><td>${E(u.kelas || 'semua')}</td><td><button class="btn r" data-d="${i}" style="min-height:36px">Hapus</button></td></tr>`).join('')}</table>`
    : '<div class="empty">Belum ada pengguna tambahan.</div>';
}

$('uAdd').onclick = async () => {
  if (!D.users) D.users = [];
  const u = $('uU').value.trim(), n = $('uN').value.trim(), p = $('uP').value.trim();
  if (!u || !n || !p) return toast('Nama pengguna, nama lengkap, dan kata sandi wajib diisi.');
  if (p.length < 6) return toast('Kata sandi minimal 6 karakter.');
  if (D.users.some(x => x.username.toLowerCase() === u.toLowerCase())) return toast('Nama pengguna sudah dipakai.');

  const newUser = { username: u, nama: n, role: $('uR').value, kelas: $('uK').value.trim(), pass: p };
  if (navigator.onLine) {
    const { error } = await sb.from('users').insert([newUser]);
    if (error) return toast('Gagal menyimpan ke server: ' + error.message);
    await pullFromCloud();
  } else {
    D.users.push(newUser);
    saveLocalData();
  }
  ['uU', 'uN', 'uK', 'uP'].forEach(i => $(i).value = '');
  toast('Pengguna berhasil ditambahkan.');
  rPengguna();
};

$('uOut').onclick = async e => {
  const b = e.target.closest('button');
  if (!b || b.dataset.d === undefined) return;
  const target = D.users[Number(b.dataset.d)];
  if (target && confirm('Hapus pengguna ' + target.nama + '?')) {
    if (navigator.onLine && target.id && typeof sb !== 'undefined' && sb) {
      await sb.from('users').delete().eq('id', target.id);
    }
    D.users.splice(Number(b.dataset.d), 1);
    saveLocalData();
    rPengguna();
  }
};

/* ===== Inisialisasi PWA & Jalankan Aplikasi ===== */
let DP = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); DP = e; $('inst').style.display = ''; });
$('inst').onclick = () => { if (DP) { DP.prompt(); DP = null; $('inst').style.display = 'none'; } };
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) {
  $('inst').style.display = '';
  $('inst').onclick = () => alert('Di iPhone: buka lewat Safari, ketuk tombol Bagikan, lalu pilih Tambah ke Layar Utama.');
}
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

async function start() {
  mode();
  const saved = localStorage.getItem('siandal.v6.me');
  if (saved) {
    ME = JSON.parse(saved);
    $('login').style.display = 'none';
    buildNav();
    go(ME.role === 'guru' ? 'input' : 'dasbor');
    if (typeof pullFromCloud === 'function' && await pullFromCloud()) render();
  } else {
    showLogin();
  }
}

// Jalankan aplikasi pertama kali
start();