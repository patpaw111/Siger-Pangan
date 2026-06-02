import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../news/presentation/news_notifier.dart';

class NewsSection extends ConsumerWidget {
  const NewsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedCategory = ref.watch(selectedNewsCategoryProvider);
    final newsAsync = ref.watch(newsFeedProvider(selectedCategory));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Text(
            'Berita & Pasar',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
          ),
        ),
        
        // Category Tabs
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            children: NewsCategory.values.map((category) {
              final isSelected = selectedCategory == category;
              final label = category.name[0].toUpperCase() + category.name.substring(1);
              
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(label),
                  selected: isSelected,
                  onSelected: (_) {
                    ref.read(selectedNewsCategoryProvider.notifier).state = category;
                  },
                  backgroundColor: AppColors.surfaceVariant,
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                  showCheckmark: false,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: const BorderSide(color: Colors.transparent),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        
        const SizedBox(height: 16),

        // News List
        newsAsync.when(
          data: (articles) {
            if (articles.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('Tidak ada berita terbaru.', style: TextStyle(color: AppColors.textTertiary))),
              );
            }
            
            return ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: articles.length > 5 ? 5 : articles.length, // Show max 5 news
              separatorBuilder: (ctx, i) => const Divider(height: 24, color: Color(0xFFF3F4F6)),
              itemBuilder: (context, i) {
                final article = articles[i];
                return InkWell(
                  onTap: () async {
                    final url = Uri.parse(article.link);
                    if (await canLaunchUrl(url)) {
                      await launchUrl(url, mode: LaunchMode.externalApplication);
                    }
                  },
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 70,
                        height: 70,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: CachedNetworkImage(
                          imageUrl: 'https://loremflickr.com/200/200/market,indonesia?lock=${article.title.hashCode}',
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => _buildPlaceholder(article.source),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              article.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                                color: AppColors.textPrimary,
                                height: 1.4,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Text(
                                  article.source,
                                  style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(width: 8),
                                const Text('•', style: TextStyle(color: AppColors.textTertiary, fontSize: 10)),
                                const SizedBox(width: 8),
                                Text(
                                  article.pubDate,
                                  style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => Padding(
            padding: const EdgeInsets.all(24),
            child: Center(child: Text('Gagal memuat berita: $e')),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder(String source) {
    // Generate a consistent color based on the source name
    final colors = [
      const Color(0xFF10B981), // Emerald
      const Color(0xFF3B82F6), // Blue
      const Color(0xFFF59E0B), // Amber
      const Color(0xFF8B5CF6), // Purple
      const Color(0xFFEC4899), // Pink
    ];
    final color = colors[source.length % colors.length];
    final initial = source.isNotEmpty ? source[0].toUpperCase() : 'N';

    return Container(
      color: color.withValues(alpha: 0.15),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 28,
          ),
        ),
      ),
    );
  }
}
