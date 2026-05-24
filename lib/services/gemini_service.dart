import 'package:google_generative_ai/google_generative_ai.dart';

class GeminiService {
  // API Key milik Ihya
  final String _apiKey = "AIzaSyDJ8doC9GYn_V5eIrvgVdi-vPOJv_f5FSo";
  late GenerativeModel _model;

  GeminiService() {
    // Inisialisasi model gemini-1.5-flash dengan RequestOptions versi baru
    _model = GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: _apiKey,
      requestOptions: const RequestOptions(apiVersion: 'v1beta'),
    );
  }

  /// Fungsi untuk mengirimkan pertanyaan ke Gemini AI dan mendapatkan jawaban teks
  Future<String> tanyaGemini(String prompt) async {
    try {
      if (_apiKey.isEmpty) {
        return "Gagal terhubung: API Key Gemini belum diatur di file gemini_service.dart.";
      }

      final content = [Content.text(prompt)];
      final response = await _model.generateContent(content);
      
      if (response.text != null && response.text!.isNotEmpty) {
        return response.text!;
      } else {
        return "Maaf, Gemini tidak memberikan jawaban. Silakan coba lagi.";
      }
    } catch (e) {
      print("Error Gemini Service: $e");
      return "Terjadi kesalahan saat menghubungi Asisten AI. Coba lakukan Hot Restart aplikasi.";
    }
  }
}