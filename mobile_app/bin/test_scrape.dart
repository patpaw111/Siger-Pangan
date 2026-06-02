import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get(
      'https://news.google.com/search?q=beras&hl=id&gl=ID&ceid=ID:id',
      options: Options(headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
    );
    final html = response.data.toString();
    print('HTML Length: ${html.length}');
    
    // Check if we can find images.
    final imgMatches = RegExp(r'<img[^>]+src="([^">]+)"').allMatches(html).take(5);
    for (var match in imgMatches) {
       print('Img: ${match.group(1)}');
    }
    
    // Check if we can find article links.
    final aMatches = RegExp(r'<a[^>]+href="\./articles/([^">]+)"').allMatches(html).take(5);
    for (var match in aMatches) {
       print('Article CBMi: ${match.group(1)}');
    }
  } catch (e) {
    print(e);
  }
}
