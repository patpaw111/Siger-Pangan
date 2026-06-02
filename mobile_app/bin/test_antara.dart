import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://www.antaranews.com/search/beras.xml');
    print(response.statusCode);
  } catch (e) {
    print(e);
  }
}
