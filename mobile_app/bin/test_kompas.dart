import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://www.kompas.com/tag/beras', options: Options(headers: {'User-Agent': 'Mozilla/5.0'}));
    print(response.data.toString().length);
  } catch (e) {
    print(e);
  }
}
