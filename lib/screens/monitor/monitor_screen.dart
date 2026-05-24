import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';

class Komoditas {
  final String nama;
  final String satuan;
  final int hargaSekarang;
  final int perubahan; // Positif = Naik, Negatif = Turun, 0 = Stabil
  final String ikon;

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
  final List<Komoditas> _daftarKomoditas = [
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
    Komoditas(nama: 'Kedelai Biji Kering', satuan: 'kg', hargaSekarang: 12000, perubahan: 0, ikon: '🫘'),
  ];

  @override
  Widget build(BuildContext context) {
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
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
              itemCount: _daftarKomoditas.length,
              itemBuilder: (context, index) {
                final item = _daftarKomoditas[index];
                return _buildCommodityCard(item);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommodityCard(Komoditas item) {
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
        ],
      ),
    );
  }
}