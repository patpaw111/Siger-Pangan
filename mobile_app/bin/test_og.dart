import 'package:dio/dio.dart';
import 'package:xml/xml.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://news.google.com/rss/search?q=beras+indonesia&hl=id&gl=ID&ceid=ID:id');
    final document = XmlDocument.parse(response.data.toString());
    final items = document.findAllElements('item').take(5).toList();
    
    for (var i = 0; i < items.length; i++) {
      final link = items[i].findElements('link').first.innerText;
      print('Article $i link: $link');
      
      try {
        final articleResponse = await dio.get(link, options: Options(receiveTimeout: const Duration(seconds: 5)));
        final html = articleResponse.data.toString();
        
        final ogRegex = RegExp(r'<meta[^>]+property="og:image"[^>]+content="([^">]+)"');
        final match = ogRegex.firstMatch(html);
        if (match != null && match.groupCount >= 1) {
           print('FOUND OG:IMAGE: ${match.group(1)}');
        } else {
           print('No og:image found for article $i');
        }
      } catch (e) {
        print('Error fetching article $i: $e');
      }
      print('---');
    }
  } catch(e) {
    print('Error: $e');
  }
}
