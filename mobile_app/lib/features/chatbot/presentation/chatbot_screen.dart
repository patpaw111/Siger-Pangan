import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/theme/app_theme.dart';


// Model
class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime time;
  final Map<String, dynamic>? nlpContext;

  const ChatMessage({
    required this.text,
    required this.isUser,
    required this.time,
    this.nlpContext,
  });
}

// Notifier
class ChatbotNotifier extends StateNotifier<List<ChatMessage>> {
  ChatbotNotifier() : super([
    ChatMessage(
      text: 'Halo! Saya Siger Pangan Bot 🌾\nTanya saya soal harga bahan pokok di Lampung.\n\nContoh:\n• "berapa harga beras di Bandar Lampung?"\n• "harga cabe rawit di lamsel"\n• "bandingkan harga ayam"',
      isUser: false,
      time: DateTime.now(),
    ),
  ]);

  final _dio = DioClient.instance;
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    // Tambah pesan user
    state = [...state, ChatMessage(text: text, isUser: true, time: DateTime.now())];
    _isLoading = true;

    try {
      final res = await _dio.post('/api/v1/chatbot/chat', data: {'text': text});
      final response = res.data['response'] as String? ?? 'Tidak ada respons';
      final nlpCtx = res.data['nlpContext'] as Map<String, dynamic>?;

      state = [...state, ChatMessage(
        text: response,
        isUser: false,
        time: DateTime.now(),
        nlpContext: nlpCtx,
      )];
    } on DioException catch (e) {
      final err = ApiException.fromDio(e);
      state = [...state, ChatMessage(
        text: 'Maaf, terjadi kesalahan: ${err.message}',
        isUser: false,
        time: DateTime.now(),
      )];
    } finally {
      _isLoading = false;
    }
  }
}

final chatbotProvider =
    StateNotifierProvider.autoDispose<ChatbotNotifier, List<ChatMessage>>(
  (_) => ChatbotNotifier(),
);

final chatbotLoadingProvider = StateProvider.autoDispose<bool>((_) => false);

// Screen
class ChatbotScreen extends ConsumerStatefulWidget {
  const ChatbotScreen({super.key});

  @override
  ConsumerState<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends ConsumerState<ChatbotScreen> {
  final _textCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _isSending = false;

  @override
  void dispose() {
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty || _isSending) return;
    _textCtrl.clear();
    setState(() => _isSending = true);
    await ref.read(chatbotProvider.notifier).sendMessage(text);
    setState(() => _isSending = false);
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatbotProvider);

    // Auto scroll setiap ada pesan baru
    ref.listen(chatbotProvider, (_, __) => _scrollToBottom());

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.eco_rounded, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Siger Bot', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                Text('NLP Harga Pangan', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.normal)),
              ],
            ),
          ],
        ),
        backgroundColor: AppColors.surface,
      ),
      body: Column(
        children: [
          // Chip suggestions
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: Row(
              children: [
                for (final q in [
                  'Berapa harga beras?',
                  'Harga ayam di Metro',
                  'Harga cabai lamsel',
                  'Daftar komoditas',
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ActionChip(
                      label: Text(q, style: const TextStyle(fontSize: 12)),
                      onPressed: () {
                        _textCtrl.text = q;
                        _send();
                      },
                      backgroundColor: AppColors.surfaceVariant,
                      side: BorderSide.none,
                    ),
                  ),
              ],
            ),
          ),

          // Messages
          Expanded(
            child: ListView.builder(
              controller: _scrollCtrl,
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              itemCount: messages.length + (_isSending ? 1 : 0),
              itemBuilder: (_, i) {
                if (i == messages.length && _isSending) {
                  return const _TypingIndicator();
                }
                return _MessageBubble(message: messages[i]);
              },
            ),
          ),

          // Input bar
          Container(
            padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.of(context).viewInsets.bottom + 12),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textCtrl,
                    onSubmitted: (_) => _send(),
                    textInputAction: TextInputAction.send,
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Tanya harga bahan pokok...',
                      hintStyle: const TextStyle(fontSize: 14, color: AppColors.textTertiary),
                      filled: true,
                      fillColor: AppColors.surfaceVariant,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _send,
                  child: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: _isSending ? AppColors.textTertiary : AppColors.primary,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: _isSending
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 30, height: 30,
              margin: const EdgeInsets.only(right: 8, bottom: 4),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.eco_rounded, color: AppColors.primary, size: 16),
            ),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.72),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? AppColors.primary : AppColors.surface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                border: isUser ? null : Border.all(color: const Color(0xFFE5E7EB)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                message.text,
                style: TextStyle(
                  color: isUser ? Colors.white : AppColors.textPrimary,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator();

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))
      ..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.3, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 30, height: 30,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(color: AppColors.surfaceVariant, borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.eco_rounded, color: AppColors.primary, size: 16),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: AnimatedBuilder(
              animation: _anim,
              builder: (_, __) => Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(3, (i) => Container(
                  width: 7, height: 7,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: _anim.value - (i * 0.1)),
                    borderRadius: BorderRadius.circular(4),
                  ),
                )),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
