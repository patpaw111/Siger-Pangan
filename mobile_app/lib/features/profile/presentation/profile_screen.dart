import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/router/app_router.dart';
import '../../auth/presentation/auth_notifier.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final initial = (user?.name ?? user?.email ?? 'U')[0].toUpperCase();
    
    // Format email jadi username (contoh: budi@gmail.com -> @budi)
    final username = user?.email != null ? '@${user!.email.split('@')[0]}' : '@user';

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
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
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 32),
            // Avatar
            Center(
              child: Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.primary, width: 2),
                ),
                alignment: Alignment.center,
                child: Text(
                  initial,
                  style: const TextStyle(fontSize: 36, color: AppColors.primary, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Name
            Text(
              user?.name ?? 'Pengguna',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 4),
            // Username
            Text(
              username,
              style: const TextStyle(fontSize: 14, color: AppColors.textTertiary, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 24),
            // Edit Profile Button
            ElevatedButton(
              onPressed: () => context.push(AppRoutes.editProfile),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF111111), // Almost black
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Edit Profile', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 32),
            // Divider
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Divider(color: Color(0xFFEEEEEE), thickness: 1),
            ),
            const SizedBox(height: 16),
            // Menu Items
            _buildProfileMenuItem(
              icon: Icons.settings_outlined,
              title: 'Settings',
              onTap: () => context.push(AppRoutes.settings),
            ),
            _buildProfileMenuItem(
              icon: Icons.person_outline,
              title: 'Account Setting',
              onTap: () => context.push(AppRoutes.accountSetting),
            ),
            _buildProfileMenuItem(
              icon: Icons.logout_outlined,
              title: 'Log out',
              onTap: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go(AppRoutes.login);
              },
              hideArrow: true, // Sesuai desain, logout tidak punya panah kanan
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool hideArrow = false,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            Icon(icon, color: AppColors.textPrimary, size: 24),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            if (!hideArrow)
              const Icon(Icons.chevron_right, color: AppColors.textPrimary, size: 24),
          ],
        ),
      ),
    );
  }
}
