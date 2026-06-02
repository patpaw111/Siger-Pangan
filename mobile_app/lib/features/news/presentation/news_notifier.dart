import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/news_repository.dart';
import '../domain/news_article.dart';
import '../../prices/presentation/prices_notifier.dart';

final newsRepositoryProvider = Provider<NewsRepository>((ref) {
  return NewsRepository();
});

// Enum for News Categories
enum NewsCategory {
  daerah('harga pangan lampung OR pertanian lampung OR inflasi lampung'),
  nasional('harga pangan indonesia OR inflasi indonesia'),
  internasional('global food prices OR world agriculture');

  final String query;
  const NewsCategory(this.query);
}

final selectedNewsCategoryProvider = StateProvider<NewsCategory>((ref) => NewsCategory.daerah);

final newsFeedProvider = FutureProvider.family<List<NewsArticle>, NewsCategory>((ref, category) async {
  final repository = ref.watch(newsRepositoryProvider);
  final commodity = ref.watch(selectedDashboardCommodityProvider);
  
  String finalQuery = category.query;
  if (commodity != null) {
    // Memasukkan nama komoditas agar berita sesuai dengan grafik
    finalQuery = '"${commodity.commodityName}" AND (${category.query})';
  }
  
  return repository.fetchNews(finalQuery);
});
