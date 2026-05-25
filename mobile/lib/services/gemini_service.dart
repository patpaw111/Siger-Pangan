import 'dart:convert';
import 'package:http/http.dart' as http;

class GeminiService {
  // BASE URL fiks mengarah ke gerbang API Gateway/Nginx kelompok kalian
  final String _baseUrl = "https://sigerpangan.my.id/api/v1/nlp/chat"; 

  /// Fungsi untuk mengirim pertanyaan dari Flutter ke Backend Service NLP (FastAPI)
  Future<String> tanyaGemini(String prompt) async {
    try {
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: jsonEncode({
          "message": prompt, // Menyesuaikan dengan key request di spesifikasi OpenAPI
        }),
      );

      print("Status Code Backend: ${response.statusCode}");
      print("Respon Backend: ${response.body}");

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Mengambil teks balasan dari key 'reply' sesuai rancangan FastAPI
        return data['reply'] ?? "Maaf, format respon server tidak sesuai.";
      } else {
        return "Gagal mendapatkan jawaban. Server merespon dengan status: ${response.statusCode}";
      }
    } catch (e) {
      print("Error Detail Chatbot: $e");
      return "Terjadi kesalahan koneksi ke server Siger Pangan. Pastikan server FastAPI backend sudah aktif.";
    }
  }
}