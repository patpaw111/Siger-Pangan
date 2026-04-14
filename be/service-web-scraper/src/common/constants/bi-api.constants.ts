// Semua ID komoditas & kategori dari API BI Harga Pangan
// GET https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetRefCommodityAndCategory

export const BI_PROVINCE_LAMPUNG_ID = 10;

export const BI_MARKET_TYPES = [
  { id: 1, name: 'Pasar Tradisional' },
  { id: 2, name: 'Pasar Modern' },
  { id: 3, name: 'Pedagang Besar' },
];

// Semua kategori (cat_id = null → ini adalah header category)
export const BI_CATEGORIES = [
  { id: 'cat_1',  name: 'Beras',        denomination: 'kg' },
  { id: 'cat_2',  name: 'Daging Ayam',  denomination: 'kg' },
  { id: 'cat_3',  name: 'Daging Sapi',  denomination: 'kg' },
  { id: 'cat_4',  name: 'Telur Ayam',   denomination: 'kg' },
  { id: 'cat_5',  name: 'Bawang Merah', denomination: 'kg' },
  { id: 'cat_6',  name: 'Bawang Putih', denomination: 'kg' },
  { id: 'cat_7',  name: 'Cabai Merah',  denomination: 'kg' },
  { id: 'cat_8',  name: 'Cabai Rawit',  denomination: 'kg' },
  { id: 'cat_9',  name: 'Minyak Goreng',denomination: 'kg' },
  { id: 'cat_10', name: 'Gula Pasir',   denomination: 'kg' },
];

// Semua komoditas detail (cat_id → parent category)
export const BI_COMMODITIES = [
  { id: 'com_1',  name: 'Beras Kualitas Bawah I',          cat_id: 'cat_1',  denomination: 'kg' },
  { id: 'com_2',  name: 'Beras Kualitas Bawah II',         cat_id: 'cat_1',  denomination: 'kg' },
  { id: 'com_3',  name: 'Beras Kualitas Medium I',         cat_id: 'cat_1',  denomination: 'kg' },
  { id: 'com_4',  name: 'Beras Kualitas Medium II',        cat_id: 'cat_1',  denomination: 'kg' },
  { id: 'com_5',  name: 'Beras Kualitas Super I',          cat_id: 'cat_1',  denomination: 'kg' },
  { id: 'com_6',  name: 'Beras Kualitas Super II',         cat_id: 'cat_1',  denomination: 'kg' },
  { id: 'com_7',  name: 'Daging Ayam Ras Segar',           cat_id: 'cat_2',  denomination: 'kg' },
  { id: 'com_8',  name: 'Daging Sapi Kualitas 1',          cat_id: 'cat_3',  denomination: 'kg' },
  { id: 'com_9',  name: 'Daging Sapi Kualitas 2',          cat_id: 'cat_3',  denomination: 'kg' },
  { id: 'com_10', name: 'Telur Ayam Ras Segar',            cat_id: 'cat_4',  denomination: 'kg' },
  { id: 'com_11', name: 'Bawang Merah Ukuran Sedang',      cat_id: 'cat_5',  denomination: 'kg' },
  { id: 'com_12', name: 'Bawang Putih Ukuran Sedang',      cat_id: 'cat_6',  denomination: 'kg' },
  { id: 'com_13', name: 'Cabai Merah Besar',               cat_id: 'cat_7',  denomination: 'kg' },
  { id: 'com_14', name: 'Cabai Merah Keriting',            cat_id: 'cat_7',  denomination: 'kg' },
  { id: 'com_15', name: 'Cabai Rawit Hijau',               cat_id: 'cat_8',  denomination: 'kg' },
  { id: 'com_16', name: 'Cabai Rawit Merah',               cat_id: 'cat_8',  denomination: 'kg' },
  { id: 'com_17', name: 'Minyak Goreng Curah',             cat_id: 'cat_9',  denomination: 'liter' },
  { id: 'com_18', name: 'Minyak Goreng Kemasan Bermerk 1', cat_id: 'cat_9',  denomination: 'liter' },
  { id: 'com_19', name: 'Minyak Goreng Kemasan Bermerk 2', cat_id: 'cat_9',  denomination: 'liter' },
  { id: 'com_20', name: 'Gula Pasir Kualitas Premium',     cat_id: 'cat_10', denomination: 'kg' },
  { id: 'com_21', name: 'Gula Pasir Lokal',                cat_id: 'cat_10', denomination: 'kg' },
];

// Semua comcat_id (kategori + komoditas) untuk parameter API
export const ALL_COMCAT_IDS = [
  ...BI_CATEGORIES.map((c) => c.id),
  ...BI_COMMODITIES.map((c) => c.id),
].join(',');

// Base URL API BI Harga Pangan
export const BI_BASE_URL = 'https://www.bi.go.id/hargapangan';
export const BI_API_BASE = `${BI_BASE_URL}/WebSite/TabelHarga`;
