import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/prices/presentation/price_chart_screen.dart';
import '../../features/chatbot/presentation/chatbot_screen.dart';
import '../storage/secure_storage.dart';

// Route names — pake const agar tidak typo
class AppRoutes {
  static const splash = '/';
  static const login = '/login';
  static const register = '/register';
  static const home = '/home';
  static const priceChart = '/prices/chart';
  static const chatbot = '/chatbot';
  static const profile = '/profile';
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
        path: AppRoutes.priceChart,
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return PriceChartScreen(
            commodityId: extra?['commodityId'] ?? '',
            commodityName: extra?['commodityName'] ?? '',
          );
        },
      ),
      GoRoute(
        path: AppRoutes.chatbot,
        builder: (_, __) => const ChatbotScreen(),
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
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}
