import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/constants/colors.dart';
import 'screens/auth/login_page.dart';
import 'screens/dashboard/dashboard_page.dart';
// FIKS: Impor ditambahkan agar rute navigasi di bawah mengenali halatmannya
import 'screens/monitor/monitor_screen.dart';
import 'screens/chatbot/chat_screen.dart';

void main() {
  runApp(
    // ProviderScope wajib ada di paling atas agar Riverpod bisa diakses di semua fitur
    const ProviderScope(
      child: SigerPanganApp(),
    ),
  );
}

class SigerPanganApp extends StatelessWidget {
  const SigerPanganApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Siger Pangan Mobile',
      debugShowCheckedModeBanner: false,
      
      // Konfigurasi Tema Global Aplikasi (Aksen Hijau DKPTPH)
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: AppColors.primaryGreen,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primaryGreen,
          primary: AppColors.primaryGreen,
        ),
      ),

      // Halaman pertama yang akan muncul saat aplikasi dibuka
      initialRoute: '/login',

      // Daftar rute navigasi untuk seluruh halaman Siger Pangan
      routes: {
        '/login': (context) => const LoginPage(),
        '/dashboard': (context) => const DashboardPage(),
        
        // FIKS: Komentar dibuka dan diarahkan ke screen yang tepat
        '/monitor': (context) => const MonitorScreen(),
        '/chatbot': (context) => const ChatScreen(),
      },
    );
  }
}