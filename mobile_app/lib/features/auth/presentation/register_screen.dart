import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/router/app_router.dart';
import 'auth_notifier.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _handleRegister() {
    if (!_formKey.currentState!.validate()) return;
    // TODO: Implement register logic
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Fitur Sign Up belum tersedia.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);

    final headerColor = isDark ? AppColors.primaryDark : AppColors.primary;
    final surfaceColor = isDark ? AppColors.darkSurface : Colors.white;
    final textColor = isDark ? Colors.white : Colors.black;

    return Scaffold(
      backgroundColor: headerColor,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              flex: 2,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                      child: const Icon(Icons.eco_rounded, color: AppColors.primary, size: 40),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Siger Pangan',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                            color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              flex: 6,
              child: ClipPath(
                clipper: _RegisterClipper(),
                child: Container(
                  color: surfaceColor,
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: SingleChildScrollView(
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 80),
                          Text(
                            'Daftar',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                                  color: textColor, fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 30),
                          TextFormField(
                            controller: _nameCtrl,
                            keyboardType: TextInputType.name,
                            textInputAction: TextInputAction.next,
                            style: TextStyle(color: textColor),
                            decoration: _inputDecoration(isDark, 'Nama Lengkap', 'Ahmad Fulan'),
                            validator: (v) => v == null || v.isEmpty ? 'Nama wajib diisi' : null,
                          ),
                          const SizedBox(height: 20),
                          TextFormField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            textInputAction: TextInputAction.next,
                            style: TextStyle(color: textColor),
                            decoration: _inputDecoration(isDark, 'Email', 'contoh@email.com'),
                            validator: (v) => v == null || !v.contains('@') ? 'Email tidak valid' : null,
                          ),
                          const SizedBox(height: 20),
                          TextFormField(
                            controller: _passwordCtrl,
                            obscureText: _obscurePassword,
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _handleRegister(),
                            style: TextStyle(color: textColor),
                            decoration: _inputDecoration(isDark, 'Kata Sandi', '').copyWith(
                              suffixIcon: IconButton(
                                icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: textColor.withValues(alpha: 0.5)),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                            ),
                            validator: (v) => v == null || v.length < 6 ? 'Kata sandi minimal 6 karakter' : null,
                          ),
                          const SizedBox(height: 40),
                          ElevatedButton(
                            onPressed: _handleRegister,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isDark ? const Color(0xFF334155) : Colors.black,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Daftar'),
                          ),
                          if (authState.error != null) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: AppColors.error.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      authState.error!.replaceAll('ApiException(401): ', ''),
                                      style: const TextStyle(color: AppColors.error, fontSize: 13, height: 1.4),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          const SizedBox(height: 32),
                          Center(
                            child: Text(
                              'Atau daftar dengan',
                              style: TextStyle(color: textColor.withValues(alpha: 0.5)),
                            ),
                          ),
                          const SizedBox(height: 20),
                          OutlinedButton(
                            onPressed: authState.isLoading
                                ? null
                                : () async {
                                    final success = await ref.read(authProvider.notifier).signInWithGoogle();
                                    if (success) {
                                      if (!context.mounted) return;
                                      context.go(AppRoutes.home);
                                    }
                                  },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFE5E7EB)),
                              backgroundColor: isDark ? AppColors.darkSurfaceVariant : const Color(0xFFF9FAFB),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Image.asset(
                                  'assets/images/google_logo.png',
                                  height: 24,
                                  width: 24,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Daftar dengan Google',
                                  style: TextStyle(
                                    color: textColor,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 40),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Sudah punya akun? ",
                                style: TextStyle(color: textColor.withValues(alpha: 0.7), fontFamily: 'Poppins'),
                              ),
                              GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTap: () {
                                  context.pop();
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                                  child: Text(
                                    'Masuk',
                                    style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontFamily: 'Poppins'),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(bool isDark, String label, String hint) {
    final borderColor = isDark ? Colors.white38 : Colors.black26;
    final focusedColor = isDark ? Colors.white : Colors.black;

    return InputDecoration(
      labelText: label,
      hintText: hint,
      filled: false,
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
      border: UnderlineInputBorder(borderSide: BorderSide(color: borderColor)),
      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: borderColor)),
      focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: focusedColor, width: 2)),
      errorBorder: const UnderlineInputBorder(borderSide: BorderSide(color: AppColors.error)),
    );
  }
}

class _RegisterClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(size.width, size.height);
    path.lineTo(size.width, 80);
    path.lineTo(size.width / 2, 0);
    path.lineTo(0, 80);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
