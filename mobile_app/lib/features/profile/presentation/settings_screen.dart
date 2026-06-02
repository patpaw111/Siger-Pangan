import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/notification_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _priceAlert = true;
  bool _newsAlert = false;
  final String _defaultRegion = 'Kota Bandar Lampung';
  final String _defaultMarket = 'Tradisional';

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _priceAlert = prefs.getBool('pref_price_alert') ?? true;
      _newsAlert = prefs.getBool('pref_news_alert') ?? false;
    });
  }

  Future<void> _updatePref(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);

    // Saat toggle notifikasi berubah, jadwalkan atau batalkan notifikasi harian
    final priceAlert = prefs.getBool('pref_price_alert') ?? false;
    final newsAlert = prefs.getBool('pref_news_alert') ?? false;
    final anyActive = priceAlert || newsAlert;

    if (anyActive) {
      await NotificationService().scheduleDailyNotifications();
    } else {
      await NotificationService().cancelAllScheduled();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16, top: 8, bottom: 8),
          child: InkWell(
            onTap: () => context.pop(),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.arrow_back, size: 20, color: Colors.black),
            ),
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Notifikasi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          SwitchListTile(
            title: const Text('Peringatan Lonjakan Harga', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            subtitle: const Text('Dapatkan notifikasi jika ada kenaikan drastis', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
            value: _priceAlert,
            onChanged: (val) {
              setState(() => _priceAlert = val);
              _updatePref('pref_price_alert', val);
            },
            activeTrackColor: AppColors.primary,
            contentPadding: EdgeInsets.zero,
          ),
          SwitchListTile(
            title: const Text('Berita Komoditas Terbaru', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            subtitle: const Text('Notifikasi artikel dan analisis pasar harian', style: TextStyle(fontSize: 12, color: AppColors.textTertiary)),
            value: _newsAlert,
            onChanged: (val) {
              setState(() => _newsAlert = val);
              _updatePref('pref_news_alert', val);
            },
            activeTrackColor: AppColors.primary,
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 24),
          const Divider(color: Color(0xFFEEEEEE), thickness: 1),
          const SizedBox(height: 24),
          const Text('Preferensi Beranda', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 16),
          ListTile(
            title: const Text('Wilayah Default', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            subtitle: Text(_defaultRegion, style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.chevron_right),
            contentPadding: EdgeInsets.zero,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pemilihan wilayah sedang dalam tahap pengembangan.')));
            },
          ),
          ListTile(
            title: const Text('Pasar Default', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            subtitle: Text(_defaultMarket, style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.chevron_right),
            contentPadding: EdgeInsets.zero,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pemilihan pasar sedang dalam tahap pengembangan.')));
            },
          ),
        ],
      ),
    );
  }
}
