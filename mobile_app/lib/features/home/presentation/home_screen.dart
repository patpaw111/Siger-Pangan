import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/router/app_router.dart';
import '../../prices/presentation/prices_notifier.dart';
import 'widgets/dashboard_chart.dart';
import 'widgets/news_section.dart';


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
          _ChatbotTabPlaceholder(),
          _SurveyTabPlaceholder(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedTab,
          onTap: (i) {
            if (i == 1) {
              context.push(AppRoutes.chatbot);
              return;
            }
            setState(() => _selectedTab = i);
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: 'Beranda'),
            BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: 'Chatbot'),
            BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), activeIcon: Icon(Icons.assignment), label: 'Survey'),
          ],
        ),
      ),
    );
  }
}

// ─── Dashboard Tab (Financial Mode) ──────────────────────────
class _DashboardTab extends ConsumerWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rawPricesAsync = ref.watch(latestPricesProvider(1));

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Clean
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Siger Pangan',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            color: AppColors.primaryDark,
                            fontWeight: FontWeight.w800,
                            fontSize: 24,
                            letterSpacing: -0.5,
                          ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => context.push(AppRoutes.profile),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person, color: AppColors.primary, size: 20),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),

          // Main Chart Area
          Expanded(
            child: rawPricesAsync.when(
              data: (prices) {
                if (prices.isEmpty) return const Center(child: Text('Data tidak tersedia'));
                
                final selectedCommodity = ref.watch(selectedDashboardCommodityProvider) ?? prices.first;
                return SingleChildScrollView(
                  child: Column(
                    children: [
                      DashboardChart(commodity: selectedCommodity),
                      const SizedBox(height: 16),
                      const NewsSection(),
                      const SizedBox(height: 32),
                    ],
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }
}

  
// ─── Chatbot placeholder ─────────────────────────────────────
class _ChatbotTabPlaceholder extends StatelessWidget {
  const _ChatbotTabPlaceholder();
  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

// ─── Survey placeholder ─────────────────────────────────────
class _SurveyTabPlaceholder extends StatelessWidget {
  const _SurveyTabPlaceholder();
  @override
  Widget build(BuildContext context) => const Center(
    child: Text('Halaman Survey', style: TextStyle(fontSize: 18, color: AppColors.textSecondary)),
  );
}
