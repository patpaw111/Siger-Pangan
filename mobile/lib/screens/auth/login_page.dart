import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import '../../core/constants/assets.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  // Controller untuk menangkap input data username & password
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  // State untuk mengontrol visibilitas password (show/hide)
  bool _obscurePassword = true;

  // State untuk menentukan apakah user berada di halaman Sign In (true) atau Sign Up (false)
  bool _isSignIn = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // FIX: Menggunakan warna putih keabu-abuan lembut agar serasi dengan logo JPEG kamu
      backgroundColor: Colors.grey.shade100, 
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Center(
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 1. Branding Logo (Mengambil jalur dari AppAssets global)
                Image.asset(
                  AppAssets.logoDkpth,
                  height: 120,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return const Icon(Icons.image_not_supported, size: 80, color: Colors.grey);
                  },
                ),
                const SizedBox(height: 20),

                // 2. Judul Institusi
                const Text(
                  "SIGER PANGAN",
                  style: TextStyle(
                    fontSize: 28, 
                    fontWeight: FontWeight.bold, 
                    color: AppColors.textPrimary,
                    letterSpacing: 1.2,
                  ),
                ),
                const Text(
                  "DKPTPH Provinsi Lampung",
                  style: TextStyle(fontSize: 16, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 35),
                
                // Sub-judul dinamis penanda status Sign In / Sign Up
                Text(
                  _isSignIn ? "Sign In" : "Sign Up",
                  style:  TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryGreen),
                ),
                const SizedBox(height: 20),

                // 3. Form Input Username
                TextField(
                  controller: _usernameController,
                  decoration: InputDecoration(
                    labelText: 'Username',
                    hintText: 'Masukkan username Anda',
                    prefixIcon: const Icon(Icons.person),
                    // FIX: Diaktifkan filled putih agar kotak input terlihat tegas di atas background abu-abu
                    filled: true, 
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:  BorderSide(color: AppColors.primaryGreen, width: 2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                
                // 4. Form Input Password (Dengan icon mata toggle show/hide)
                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Masukkan password Anda',
                    prefixIcon: const Icon(Icons.lock),
                    // FIX: Diaktifkan filled putih agar serasi
                    filled: true, 
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300, width: 1.5),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:  BorderSide(color: AppColors.primaryGreen, width: 2),
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                
                // 5. Tombol Aksi Utama (Masuk / Daftar)
                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: () {
                      if (_isSignIn) {
                        Navigator.pushReplacementNamed(context, '/dashboard');
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                           SnackBar(
                            content: Text('Pendaftaran akun berhasil! Silakan Sign In.'),
                            backgroundColor: AppColors.primaryGreen,
                          ),
                        );
                        setState(() {
                          _isSignIn = true;
                        });
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen, 
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                      elevation: 2, 
                    ),
                    child: Text(
                      _isSignIn ? "Masuk" : "Daftar Akun",
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                
                // 6. TOGGLE MENU BERPINDAH MENU SIGN IN / SIGN UP
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isSignIn ? "Belum punya akun? " : "Sudah punya akun? ",
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _isSignIn = !_isSignIn;
                        });
                      },
                      child: Text(
                        _isSignIn ? "Daftar" : "Sign In",
                        style:  TextStyle(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 30),
                const Text(
                  "Universitas Teknokrat Indonesia",
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}