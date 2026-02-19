import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/ai_repository.dart';
import '../../data/models/chat_message_model.dart';
import 'rag_chat_event.dart';

/// BLoC for RAG Chat functionality
class RagChatBloc extends Bloc<RagChatEvent, RagChatState> {
  final AiRepository _aiRepository;
  List<ChatMessage> _messages = [];

  RagChatBloc(this._aiRepository) : super(RagChatInitial()) {
    on<LoadChatHistory>(_onLoadChatHistory);
    on<SendRagQuery>(_onSendRagQuery);
    on<ClearChatHistory>(_onClearChatHistory);
  }

  Future<void> _onLoadChatHistory(
    LoadChatHistory event,
    Emitter<RagChatState> emit,
  ) async {
    try {
      emit(RagChatLoading(_messages));
      
      final history = await _aiRepository.getChatHistory();
      _messages = history;
      
      emit(RagChatLoaded(_messages));
    } catch (e) {
      print('❌ Error loading chat history: $e');
      emit(RagChatError('Failed to load chat history', _messages));
    }
  }

  Future<void> _onSendRagQuery(
    SendRagQuery event,
    Emitter<RagChatState> emit,
  ) async {
    try {
      // Add user message immediately
      final userMessage = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        message: event.query,
        isUser: true,
        timestamp: DateTime.now(),
      );
      
      _messages = [..._messages, userMessage];
      emit(RagChatLoading(_messages));

      // Query AI
      final response = event.useHybrid
          ? await _aiRepository.queryHybridAssistant(query: event.query)
          : await _aiRepository.queryRag(
              query: event.query,
              institutionId: event.institutionId,
            );

      // Add AI response
      final aiMessage = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        message: response.answer,
        isUser: false,
        timestamp: DateTime.now(),
        sources: response.sources.map((s) => s.documentName).toList(),
        context: response.context,
        isWebFallback: response.usedWebSearch,
      );

      _messages = [..._messages, aiMessage];
      emit(RagChatLoaded(_messages));
    } catch (e) {
      print('❌ Error sending RAG query: $e');
      emit(RagChatError(
        'Failed to get response. Please try again.',
        _messages,
      ));
      
      // Revert to loaded state after showing error
      await Future.delayed(const Duration(seconds: 2));
      emit(RagChatLoaded(_messages));
    }
  }

  Future<void> _onClearChatHistory(
    ClearChatHistory event,
    Emitter<RagChatState> emit,
  ) async {
    try {
      await _aiRepository.clearChatHistory();
      _messages = [];
      emit(RagChatLoaded(_messages));
    } catch (e) {
      print('❌ Error clearing chat history: $e');
      emit(RagChatError('Failed to clear chat history', _messages));
    }
  }
}
