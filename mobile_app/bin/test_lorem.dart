import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get('https://loremflickr.com/200/200/agriculture,indonesia', options: Options(followRedirects: false, validateStatus: (status) => true));
    print(response.statusCode);
    print(response.headers.value('location'));
  } catch (e) {
    print(e);
  }
}
