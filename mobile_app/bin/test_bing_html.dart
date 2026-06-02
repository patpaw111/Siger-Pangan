import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://www.bing.com/news/search?q=beras+indonesia');
    final html = response.data.toString();
    
    // Find all images in Bing News HTML
    final imgRegex = RegExp(r'<img[^>]+src="([^">]+)"');
    final matches = imgRegex.allMatches(html).take(10);
    for (var match in matches) {
       print(match.group(1));
    }
  } catch (e) {
    print(e);
  }
}
