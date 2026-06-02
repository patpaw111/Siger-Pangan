import 'dart:io';
import 'package:dio/dio.dart';
import 'package:xml/xml.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://news.google.com/rss/search?q=beras+indonesia&hl=id&gl=ID&ceid=ID:id');
    final document = XmlDocument.parse(response.data.toString());
    final items = document.findAllElements('item');
    if (items.isNotEmpty) {
      print(items.first.toXmlString(pretty: true));
    }
  } catch(e) {
    print(e);
  }
}
