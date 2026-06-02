import 'package:dio/dio.dart';
import 'package:xml/xml.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://news.search.yahoo.com/rss?p=harga+pangan+indonesia');
    final document = XmlDocument.parse(response.data.toString());
    final items = document.findAllElements('item');
    if (items.isNotEmpty) {
       print(items.first.toXmlString(pretty: true));
    } else {
       print('No items found');
    }
  } catch (e) {
    print(e);
  }
}
