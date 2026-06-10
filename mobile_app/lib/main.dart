import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/services/notification_service.dart';
import 'core/services/background_worker.dart';
import 'features/prices/presentation/prices_notifier.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env sebelum app berjalan
  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint('Error loading .env: $e');
  }

  // Inisialisasi notifikasi lokal
  try {
    await NotificationService().init();
  } catch (e) {
    debugPrint('Error init notifications: $e');
  }

  // Inisialisasi background worker
  try {
    await BackgroundWorker.init();
  } catch (e) {
    debugPrint('Error init background worker: $e');
  }

  // Load preferences untuk state awal
  final prefs = await SharedPreferences.getInstance();
  final defaultRegion = prefs.getString('pref_default_region');
  final defaultMarketString = prefs.getString('pref_default_market') ?? 'Eceran';
  
  int defaultMarket = 3; // Default ke 3 (Eceran untuk SiPangan, Pedagang Besar untuk BI)
  if (defaultMarketString == 'Tradisional' || defaultMarketString == 'Produsen') defaultMarket = 1;
  if (defaultMarketString == 'Modern' || defaultMarketString == 'Grosir') defaultMarket = 2;
  if (defaultMarketString == 'Eceran') defaultMarket = 3;

  runApp(
    // ProviderScope wajib di root untuk Riverpod
    ProviderScope(
      overrides: [
        if (defaultRegion != null && defaultRegion != 'Semua Wilayah') 
          selectedRegionDashboardProvider.overrideWith((ref) => defaultRegion),
        selectedMarketTypeProvider.overrideWith((ref) => defaultMarket),
      ],
      child: const SigerPanganApp(),
    ),
  );
}

class SigerPanganApp extends ConsumerWidget {
  const SigerPanganApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Siger Pangan',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
