import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/router/app_router.dart';
import '../../../shared/widgets/price_card.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../prices/presentation/prices_notifier.dart';
import '../../auth/presentation/auth_notifier.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedTab,
        children: const [
          _DashboardTab(),
          _PricesTab(),
          _ChatbotTabPlaceholder(),
          _ProfileTab(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedTab,
          onTap: (i) {
            if (i == 2) {
              context.push(AppRoutes.chatbot);
              return;
            }
            setState(() => _selectedTab = i);
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Beranda'),
            BottomNavigationBarItem(icon: Icon(Icons.trending_up_outlined), activeIcon: Icon(Icons.trending_up), label: 'Harga'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: 'Chatbot'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profil'),
          ],
        ),
      ),
    );
  }
}

// ─── Dashboard Tab ──────────────────────────────────────────
class _DashboardTab extends ConsumerWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pricesAsync = ref.watch(latestPricesProvider(1));

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AppColors.primaryDark, AppColors.primary],
                ),
              ),
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Siger Pangan',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          Text(
                            'Harga Bahan Pokok Lampung',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.8),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                      const Icon(Icons.eco_rounded, color: Colors.white, size: 36),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Summary cards
                  pricesAsync.when(
                    data: (prices) => Row(
                      children: [
                        _SummaryChip(label: '${prices.length} Komoditas', icon: Icons.inventory_2_outlined),
                        const SizedBox(width: 10),
                        _SummaryChip(label: 'Update Hari Ini', icon: Icons.update),
                      ],
                    ),
                    loading: () => const SizedBox.shrink(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ),

          // Section title
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Text(
                'Harga Terbaru',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              ),
            ),
          ),

          // Price list
          pricesAsync.when(
            data: (prices) => SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: PriceCard(
                      record: prices[i],
                      onTap: () => context.push(AppRoutes.priceChart, extra: {
                        'commodityId': prices[i].commodityBiId,
                        'commodityName': prices[i].commodityName,
                      }),
                    ),
                  ),
                  childCount: prices.length > 10 ? 10 : prices.length,
                ),
              ),
            ),
            loading: () => SliverList(
              delegate: SliverChildBuilderDelegate(
                (_, __) => const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                  child: ShimmerBox(width: double.infinity, height: 80, radius: 16),
                ),
                childCount: 6,
              ),
            ),
            error: (e, _) => SliverToBoxAdapter(
              child: ErrorView(
                message: 'Gagal memuat data harga',
                onRetry: () => ref.invalidate(latestPricesProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final IconData icon;

  const _SummaryChip({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 14),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// ─── Prices Tab ─────────────────────────────────────────────
class _PricesTab extends ConsumerWidget {
  const _PricesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final marketType = ref.watch(selectedMarketTypeProvider);
    final pricesAsync = ref.watch(latestPricesProvider(marketType));

    return SafeArea(
      child: Column(
        children: [
          // Filter bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Text('Daftar Harga', style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                _MarketTypeFilter(selected: marketType),
              ],
            ),
          ),
          Expanded(
            child: pricesAsync.when(
              data: (prices) => ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                itemCount: prices.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (ctx, i) => PriceCard(
                  record: prices[i],
                  onTap: () => ctx.push(AppRoutes.priceChart, extra: {
                    'commodityId': prices[i].commodityBiId,
                    'commodityName': prices[i].commodityName,
                  }),
                ),
              ),
              loading: () => const LoadingIndicator(),
              error: (e, _) => ErrorView(
                message: 'Gagal memuat harga',
                onRetry: () => ref.invalidate(latestPricesProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MarketTypeFilter extends ConsumerWidget {
  final int selected;
  const _MarketTypeFilter({required this.selected});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final labels = {1: 'Tradisional', 2: 'Modern', 3: 'Grosir'};
    return DropdownButton<int>(
      value: selected,
      underline: const SizedBox.shrink(),
      style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w500),
      items: labels.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
      onChanged: (v) => ref.read(selectedMarketTypeProvider.notifier).state = v!,
    );
  }
}

// ─── Chatbot placeholder ─────────────────────────────────────
class _ChatbotTabPlaceholder extends StatelessWidget {
  const _ChatbotTabPlaceholder();
  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

// ─── Profile Tab ─────────────────────────────────────────────
class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 16),
            CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.surfaceVariant,
              child: Text(
                (user?.name ?? user?.email ?? 'U')[0].toUpperCase(),
                style: const TextStyle(fontSize: 32, color: AppColors.primary, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),
            Text(user?.name ?? '-', style: Theme.of(context).textTheme.titleLarge),
            Text(user?.email ?? '-', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(user?.role ?? '-',
                  style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
            ),
            const Spacer(),
            ElevatedButton.icon(
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go(AppRoutes.login);
              },
              icon: const Icon(Icons.logout),
              label: const Text('Keluar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
