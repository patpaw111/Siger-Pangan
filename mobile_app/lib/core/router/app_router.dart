import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/edit_profile_screen.dart';
import '../../features/profile/presentation/settings_screen.dart';
import '../../features/profile/presentation/account_setting_screen.dart';
import '../../features/chatbot/presentation/chatbot_screen.dart';
import '../storage/secure_storage.dart';

// Route names — pake const agar tidak typo
class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const register = '/register';
  static const home = '/home';
  static const profile = '/profile';
  static const editProfile = '/profile/edit';
  static const settings = '/profile/settings';
  static const accountSetting = '/profile/account';
  static const chatbot = '/chatbot';
}

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    redirect: (context, state) async {
      final token = await SecureStorage.getToken();
      final isLoggedIn = token != null;
      final isOnLogin = state.matchedLocation == AppRoutes.login;
      final isOnRegister = state.matchedLocation == AppRoutes.register;
      final isOnSplash = state.matchedLocation == AppRoutes.splash;

      if (isOnSplash) {
        return isLoggedIn ? AppRoutes.home : AppRoutes.login;
      }
      
      // Jika belum login, dan BUKAN di halaman login atau register -> paksa ke login
      if (!isLoggedIn && !isOnLogin && !isOnRegister) return AppRoutes.login;
      
      // Jika sudah login, tidak boleh ke halaman login atau register -> arahkan ke home
      if (isLoggedIn && (isOnLogin || isOnRegister)) return AppRoutes.home;
      
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, __) => const _SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, __) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (_, __) => const HomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.chatbot,
        builder: (_, __) => const ChatbotScreen(),
      ),
      GoRoute(
        path: AppRoutes.profile,
        builder: (_, __) => const ProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        builder: (_, __) => const EditProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (_, __) => const SettingsScreen(),
      ),
      GoRoute(
        path: AppRoutes.accountSetting,
        builder: (_, __) => const AccountSettingScreen(),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(
        child: Text('Halaman tidak ditemukan: ${state.uri}'),
      ),
    ),
  );
});

// Splash screen sederhana — redirect ditangani GoRouter redirect callback
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final headerColor = isDark ? const Color(0xFF1B5E20) : const Color(0xFF2E7D32);

    return Scaffold(
      backgroundColor: headerColor,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.eco_rounded, color: Color(0xFF2E7D32), size: 40),
            ),
            const SizedBox(height: 16),
            Text(
              'Siger Pangan',
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'Pantau Harga Pangan',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white70,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
