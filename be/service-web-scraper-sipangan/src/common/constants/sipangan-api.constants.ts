// ══════════════════════════════════════════════════════════════
// Konstanta API SiPangan Provinsi Lampung (Badan Pangan)
// Sumber: https://sipangan-lampungprov.badanpangan.go.id
// ══════════════════════════════════════════════════════════════

export const SIPANGAN_BASE_URL =
  'https://sipangan-lampungprov.badanpangan.go.id';

export const SIPANGAN_PANEL_HARGA_URL =
  `${SIPANGAN_BASE_URL}/portal/pdi/panel-harga`;

// ── Level Harga ──────────────────────────────────────────────
export const SIPANGAN_LEVEL_HARGA = [
  { id: 3, name: 'Eceran' },
  { id: 1, name: 'Produsen' },
];

// ── Komoditas Eceran (LEVEL_HARGA = 3) ──────────────────────
export const SIPANGAN_COMMODITIES_ECERAN = [
  { id: 27,  name: 'Beras Premium' },
  { id: 28,  name: 'Beras Medium' },
  { id: 29,  name: 'Kedelai Biji Kering (Impor)' },
  { id: 30,  name: 'Bawang Merah' },
  { id: 31,  name: 'Bawang Putih Bonggol' },
  { id: 32,  name: 'Cabai Merah Keriting' },
  { id: 33,  name: 'Cabai Rawit Merah' },
  { id: 34,  name: 'Daging Sapi Murni' },
  { id: 35,  name: 'Daging Ayam Ras' },
  { id: 36,  name: 'Telur Ayam Ras' },
  { id: 37,  name: 'Gula Konsumsi' },
  { id: 38,  name: 'Minyak Goreng Kemasan' },
  { id: 40,  name: 'Tepung Terigu (Curah)' },
  { id: 101, name: 'Minyak Goreng Curah' },
  { id: 102, name: 'Jagung Tk Peternak' },
  { id: 104, name: 'Ikan Kembung' },
  { id: 105, name: 'Ikan Tongkol' },
  { id: 106, name: 'Ikan Bandeng' },
  { id: 107, name: 'Garam Konsumsi' },
  { id: 108, name: 'Tepung Terigu Kemasan' },
  { id: 109, name: 'Beras SPHP' },
  { id: 126, name: 'Cabai Merah Besar' },
  { id: 127, name: 'Minyakita' },
  { id: 149, name: 'Daging Kerbau Beku (Impor Luar Negeri)' },
  { id: 152, name: 'Daging Kerbau Segar (Lokal)' },
  { id: 165, name: 'Beras Medium Non SPHP' },
  { id: 166, name: 'Beras Khusus (Lokal)' },
];

// ── Komoditas Produsen (LEVEL_HARGA = 1) ─────────────────────
export const SIPANGAN_COMMODITIES_PRODUSEN = [
  { id: 2,   name: 'GKP Tingkat Petani' },
  { id: 3,   name: 'GKP Tingkat Penggilingan' },
  { id: 4,   name: 'GKG Tingkat Penggilingan' },
  { id: 5,   name: 'Beras Medium Penggilingan' },
  { id: 6,   name: 'Beras Premium Penggilingan' },
  { id: 7,   name: 'Jagung Pipilan Kering' },
  { id: 8,   name: 'Kedelai Biji Kering (Lokal)' },
  { id: 9,   name: 'Bawang Merah' },
  { id: 10,  name: 'Cabai Merah Keriting' },
  { id: 11,  name: 'Cabai Rawit Merah' },
  { id: 12,  name: 'Sapi (Hidup)' },
  { id: 13,  name: 'Ayam Ras Pedaging (Hidup)' },
  { id: 14,  name: 'Telur Ayam Ras' },
  { id: 125, name: 'Cabai Merah Besar' },
  { id: 148, name: 'Gula Konsumsi di Petani/Pabrik Gula' },
];

// ── Daftar 16 Kab/Kota Lampung ──────────────────────────────
export const SIPANGAN_REGIONS = [
  'Provinsi Lampung',
  'Kabupaten Lampung Selatan',
  'Kabupaten Lampung Tengah',
  'Kabupaten Lampung Utara',
  'Kabupaten Lampung Barat',
  'Kabupaten Tulang Bawang',
  'Kabupaten Tanggamus',
  'Kabupaten Lampung Timur',
  'Kabupaten Way Kanan',
  'Kabupaten Pesawaran',
  'Kabupaten Pringsewu',
  'Kabupaten Mesuji',
  'Kabupaten Tulang Bawang Barat',
  'Kabupaten Pesisir Barat',
  'Kota Bandar Lampung',
  'Kota Metro',
];
