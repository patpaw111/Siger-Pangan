import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';

class Komoditas {
  String nama;
  String satuan;
  int hargaSekarang;
  int perubahan; // Positif = Naik, Negatif = Turun, 0 = Stabil
  String ikon;

  Komoditas({
    required this.nama,
    required this.satuan,
    required this.hargaSekarang,
    required this.perubahan,
    required this.ikon,
  });
}

class MonitorScreen extends StatefulWidget {
  const MonitorScreen({super.key});

  @override
  State<MonitorScreen> createState() => _MonitorScreenState();
}

class _MonitorScreenState extends State<MonitorScreen> {
  String _filterWaktu = 'hari_ini';

  // Diubah menjadi non-final agar daftar datanya bisa ditambah, diedit, dan dihapus
  List<Komoditas> _daftarKomoditas = [
    Komoditas(nama: 'Beras Medium', satuan: 'kg', hargaSekarang: 13500, perubahan: 200, ikon: '🌾'),
    Komoditas(nama: 'Beras Premium', satuan: 'kg', hargaSekarang: 15000, perubahan: 0, ikon: '🌾'),
    Komoditas(nama: 'Gula Pasir Konsumsi', satuan: 'kg', hargaSekarang: 17500, perubahan: 500, ikon: '🍬'),
    Komoditas(nama: 'Minyak Goreng Kemasan', satuan: 'liter', hargaSekarang: 18000, perubahan: -300, ikon: '🛢️'),
    Komoditas(nama: 'Minyak Goreng Curah', satuan: 'kg', hargaSekarang: 16500, perubahan: 0, ikon: '🛢️'),
    Komoditas(nama: 'Daging Sapi Murni', satuan: 'kg', hargaSekarang: 130000, perubahan: 1500, ikon: '🥩'),
    Komoditas(nama: 'Daging Ayam Ras', satuan: 'kg', hargaSekarang: 36000, perubahan: -1000, ikon: '🍗'),
    Komoditas(nama: 'Telur Ayam Ras', satuan: 'kg', hargaSekarang: 28500, perubahan: 400, ikon: '🥚'),
    Komoditas(nama: 'Cabai Merah Keriting', satuan: 'kg', hargaSekarang: 45000, perubahan: -2000, ikon: '🌶️'),
    Komoditas(nama: 'Cabai Rawit Merah', satuan: 'kg', hargaSekarang: 55000, perubahan: 3000, ikon: '🌶️'),
    Komoditas(nama: 'Bawang Merah', satuan: 'kg', hargaSekarang: 38000, perubahan: 800, ikon: '🧅'),
    Komoditas(nama: 'Bawang Putih Bonggol', satuan: 'kg', hargaSekarang: 40000, perubahan: 0, ikon: '🧄'),
    Komoditas(nama: 'Tepung Terigu Curah', satuan: 'kg', hargaSekarang: 11000, perubahan: -100, ikon: '🥡'),
    Komoditas(nama: 'Jagung Pipilan Kering', satuan: 'kg', hargaSekarang: 8500, perubahan: 150, ikon: '🌽'),
    Komoditas(nama: 'Kedelai Biji Kering', satuan: 'kg', hargaSekarang: 12000, perubahan: 0, ikon: '𫛚'),
  ];

  List<Komoditas> _getFilteredKomoditas() {
    if (_filterWaktu == 'minggu_ini') {
      return _daftarKomoditas.map((item) {
        return Komoditas(
          nama: item.nama,
          satuan: item.satuan,
          hargaSekarang: item.hargaSekarang + (item.perubahan * 2),
          perubahan: item.perubahan * 3,
          ikon: item.ikon,
        );
      }).toList();
    } else if (_filterWaktu == 'bulan_ini') {
      return _daftarKomoditas.map((item) {
        return Komoditas(
          nama: item.nama,
          satuan: item.satuan,
          hargaSekarang: item.hargaSekarang + (item.perubahan * 5),
          perubahan: item.perubahan * 7,
          ikon: item.ikon,
        );
      }).toList();
    }
    return _daftarKomoditas;
  }

  // --- FUNGSI CRUD LOGIC (DIALOG FORM FORMULIR) ---
  void _tampilkanFormDialog({Komoditas? itemLama, int? indeksAsli}) {
    final bool isEdit = itemLama != null;
    final txtNama = TextEditingController(text: isEdit ? itemLama.nama : '');
    final txtSatuan = TextEditingController(text: isEdit ? itemLama.satuan : 'kg');
    final txtHarga = TextEditingController(text: isEdit ? itemLama.hargaSekarang.toString() : '');
    final txtPerubahan = TextEditingController(text: isEdit ? itemLama.perubahan.toString() : '0');
    final txtIkon = TextEditingController(text: isEdit ? itemLama.ikon : '🌾');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        title: Text(isEdit ? 'Edit Komoditas' : 'Tambah Komoditas Pangan', 
            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: txtIkon, decoration: const InputDecoration(labelText: 'Ikon Emoji (e.g. 🍅, 🥕)')),
              TextField(controller: txtNama, decoration: const InputDecoration(labelText: 'Nama Pangan')),
              TextField(controller: txtSatuan, decoration: const InputDecoration(labelText: 'Satuan (e.g. kg, liter)')),
              TextField(controller: txtHarga, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Harga (Rp)')),
              TextField(controller: txtPerubahan, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Perubahan Nilai (Minus jika turun)')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal', style: TextStyle(color: Colors.grey))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryGreen),
            onPressed: () {
              if (txtNama.text.isEmpty || txtHarga.text.isEmpty) return;

              setState(() {
                if (isEdit && indeksAsli != null) {
                  // Aksi Update / Edit
                  _daftarKomoditas[indeksAsli] = Komoditas(
                    nama: txtNama.text,
                    satuan: txtSatuan.text,
                    hargaSekarang: int.parse(txtHarga.text),
                    perubahan: int.parse(txtPerubahan.text),
                    ikon: txtIkon.text,
                  );
                } else {
                  // Aksi Add / Tambah Baru
                  _daftarKomoditas.add(Komoditas(
                    nama: txtNama.text,
                    satuan: txtSatuan.text,
                    hargaSekarang: int.parse(txtHarga.text),
                    perubahan: int.parse(txtPerubahan.text),
                    ikon: txtIkon.text,
                  ));
                }
              });
              Navigator.pop(context);
            },
            child: Text(isEdit ? 'Simpan' : 'Tambah', style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dataTampil = _getFilteredKomoditas();

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        backgroundColor: AppColors.primaryGreen,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Pantauan Harga Pangan',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
        ),
        elevation: 0,
      ),
      // MENU ADD: Tombol melayang di kanan bawah untuk tambah data
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primaryGreen,
        child: const Icon(Icons.add, color: Colors.white, size: 28),
        onPressed: () => _tampilkanFormDialog(),
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(15),
            color: AppColors.primaryGreen.withOpacity(0.1),
            child: Row(
              children: [
                Icon(Icons.location_on, color: AppColors.primaryGreen, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Provinsi Lampung — Data Terbaru',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 14),
                ),
              ],
            ),
          ),
          _buildFilterTab(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
              itemCount: dataTampil.length,
              itemBuilder: (context, index) {
                final item = dataTampil[index];
                
                // Cari indeks asli di array _daftarKomoditas agar manipulasi edit/delete tidak salah baris
                final int indeksAsli = _daftarKomoditas.indexWhere((element) => element.nama == item.nama);

                return _buildCommodityCard(item, indeksAsli);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 15.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _customChoiceChip('Hari Ini', 'hari_ini'),
          _customChoiceChip('Minggu Ini', 'minggu_ini'),
          _customChoiceChip('Bulan Ini', 'bulan_ini'),
        ],
      ),
    );
  }

  Widget _customChoiceChip(String label, String value) {
    final bool isSelected = _filterWaktu == value;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: isSelected ? Colors.white : Colors.grey.shade700,
        ),
      ),
      selected: isSelected,
      selectedColor: AppColors.primaryGreen,
      backgroundColor: Colors.white,
      shadowColor: Colors.black.withOpacity(0.1),
      elevation: isSelected ? 2 : 0,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      onSelected: (bool selected) {
        if (selected) {
          setState(() {
            _filterWaktu = value;
          });
        }
      },
    );
  }

  Widget _buildCommodityCard(Komoditas item, int indeksAsli) {
    IconData trendIcon = Icons.trending_flat;
    Color trendColor = Colors.grey;
    String infoPerubahan = 'Stabil';

    if (item.perubahan > 0) {
      trendIcon = Icons.trending_up;
      trendColor = Colors.red.shade600;
      infoPerubahan = '+Rp ${item.perubahan}';
    } else if (item.perubahan < 0) {
      trendIcon = Icons.trending_down;
      trendColor = Colors.green.shade600;
      infoPerubahan = '-Rp ${item.perubahan.abs()}';
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Text(item.ikon, style: const TextStyle(fontSize: 24)),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.nama,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                Text(
                  'Per 1 ${item.satuan}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Rp ${item.hargaSekarang}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Icon(trendIcon, color: trendColor, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    infoPerubahan,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: trendColor),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(width: 5),
          // MENU EDIT & DELETE: Berbentuk tombol opsi tiga titik di ujung kanan kartu
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.grey),
            onSelected: (aksi) {
              if (aksi == 'edit') {
                _tampilkanFormDialog(itemLama: item, indeksAsli: indeksAsli);
              } else if (aksi == 'delete') {
                setState(() {
                  _daftarKomoditas.removeAt(indeksAsli);
                });
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit, color: Colors.orange, size: 20),
                    SizedBox(width: 8),
                    Text('Edit'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: Colors.red, size: 20),
                    SizedBox(width: 8),
                    Text('Hapus'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}