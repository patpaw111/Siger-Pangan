import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://api-berita-indonesia.vercel.app/cnbc/market/');
    print(response.data.toString().substring(0, 500));
  } catch (e) {
    print(e);
  }
}
