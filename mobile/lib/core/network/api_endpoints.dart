class ApiEndpoints {
  // 1. Base URL Server (Arahkan ke Nginx API Gateway sesuai IP Localhost/Hotspot laptopmu)
  // Gunakan '10.0.2.2' jika kamu running lewat Android Emulator, atau IP local (misal: 192.168.x.x) jika pakai HP fisik.
  static const String baseUrl = 'http://10.0.2.2:61893'; 

  // 2. Endpoint Modul Autentikasi (NestJS Backend)
  static const String login = '$baseUrl/api/auth/login';
  static const String profile = '$baseUrl/api/auth/profile';

  // 3. Endpoint Modul Pantauan Pangan (NestJS Backend - PostgreSQL)
  static const String commodities = '$baseUrl/api/commodities';
  static const String priceRecords = '$baseUrl/api/prices';
  static const String regions = '$baseUrl/api/regions'; // 15 Kabupaten/Kota Lampung

  // 4. Endpoint Modul Chatbot AI (FastAPI / NestJS proxy ke Gemini-1.5-Flash)
  static const String chatbot = '$baseUrl/api/chatbot/chat';
}