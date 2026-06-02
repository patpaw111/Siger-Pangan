import 'package:flutter/material.dart';
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
  await dotenv.load(fileName: '.env');

  // Inisialisasi notifikasi lokal
  await NotificationService().init();

  // Inisialisasi background worker
  await BackgroundWorker.init();

  // Load preferences untuk state awal
  final prefs = await SharedPreferences.getInstance();
  final defaultRegion = prefs.getString('pref_default_region');
  final defaultMarketString = prefs.getString('pref_default_market') ?? 'Tradisional';
  
  int defaultMarket = 1;
  if (defaultMarketString == 'Modern') defaultMarket = 2;
  if (defaultMarketString == 'Grosir') defaultMarket = 3;

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
