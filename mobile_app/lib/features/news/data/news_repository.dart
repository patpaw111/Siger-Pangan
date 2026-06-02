import 'package:dio/dio.dart';
import 'package:xml/xml.dart';
import '../domain/news_article.dart';

class NewsRepository {
  final Dio _dio = Dio();

  NewsRepository();

  Future<List<NewsArticle>> fetchNews(String query) async {
    try {
      final url = 'https://news.google.com/rss/search?q=$query&hl=id&gl=ID&ceid=ID:id';
      final response = await _dio.get(url);
      
      if (response.statusCode == 200) {
        final document = XmlDocument.parse(response.data.toString());
        final items = document.findAllElements('item').take(5).toList();
        
        return items.map((node) {
          final title = node.findElements('title').firstOrNull?.innerText ?? 'Tanpa Judul';
          final link = node.findElements('link').firstOrNull?.innerText ?? '';
          final pubDate = node.findElements('pubDate').firstOrNull?.innerText ?? '';
          final source = node.findElements('source').firstOrNull?.innerText ?? 'Google News';
          
          return NewsArticle.fromXml(title, link, _formatPubDate(pubDate), source, null);
        }).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Gagal memuat berita: $e');
    }
  }

  String _formatPubDate(String pubDate) {
    if (pubDate.isEmpty) return '';
    try {
      // pubDate Google News format: "Tue, 28 May 2024 10:30:00 GMT"
      final parts = pubDate.split(' ');
      if (parts.length >= 4) {
        return '${parts[1]} ${parts[2]} ${parts[3]}'; // "28 May 2024"
      }
      return pubDate;
    } catch (e) {
      return pubDate;
    }
  }
}
