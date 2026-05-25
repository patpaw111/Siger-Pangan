import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/gemini_service.dart';

// Model untuk menampung struktur pesan chat
class ChatMessage {
  final String text;
  final bool isUser;

  ChatMessage({required this.text, required this.isUser});
}

// StateNotifier untuk mengelola daftar pesan menggunakan gemini-1.5-flash
class AiNotifier extends StateNotifier<List<ChatMessage>> {
  final GeminiService _geminiService = GeminiService();

  AiNotifier() : super([]);

  // Fungsi untuk menambahkan pesan user ke dalam layar
  void addUserMessage(String message) {
    state = [...state, ChatMessage(text: message, isUser: true)];
    _fetchGeminiResponse(message);
  }

  // Logika memanggil respon asli dari GeminiService
  void _fetchGeminiResponse(String userMessage) async {
    // Tambahkan indikator loading "Sedang mengetik..."
    state = [...state, ChatMessage(text: 'Sedang mengetik...', isUser: false)];

    // Ambil jawaban asli dari API Gemini
    final jawabanAi = await _geminiService.tanyaGemini(userMessage);

    // Hapus indikator loading, lalu masukkan jawaban asli dari Gemini
    state.removeLast();
    state = [...state, ChatMessage(text: jawabanAi, isUser: false)];
  }
}

// Provider global yang dibaca oleh chat_screen.dart
final aiProvider = StateNotifierProvider<AiNotifier, List<ChatMessage>>((ref) {
  return AiNotifier();
});