import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? (throw Exception('API_BASE_URL tidak ditemukan di .env'));

  static String get appName => dotenv.env['APP_NAME'] ?? 'Siger Pangan';

  static String get googleWebClientId => dotenv.env['GOOGLE_WEB_CLIENT_ID'] ?? '';

  static bool get isProduction =>
      (dotenv.env['APP_ENV'] ?? 'production') == 'production';
}
