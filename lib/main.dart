import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:siger_pangan_mobile/screens/login_page.dart'; // Pastikan nama paket sesuai pubspec.yaml

void main() {
  // Dibungkus dengan ProviderScope agar Riverpod bisa digunakan di seluruh aplikasi
  runApp(
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
      title: 'Siger Pangan - DKPTPH Lampung',
      debugShowCheckedModeBanner: false,
      
      // Tema aplikasi disesuaikan dengan identitas brand Siger Pangan
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.green.shade700,
          primary: Colors.green.shade800,
        ),
        
        // Pengaturan default untuk input text field agar rapi di semua halaman
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          filled: true,
          fillColor: Colors.white,
        ),
      ),

      // Aplikasi dimulai langsung dari halaman Login
      home: const LoginPage(),
    );
  }
}