import 'package:dio/dio.dart';
import 'package:xml/xml.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://www.bing.com/news/search?q=beras+indonesia&format=rss');
    final document = XmlDocument.parse(response.data.toString());
    final items = document.findAllElements('item');
    if (items.isNotEmpty) {
       print(items.first.toXmlString(pretty: true));
    }
  } catch (e) {
    print(e);
  }
}
