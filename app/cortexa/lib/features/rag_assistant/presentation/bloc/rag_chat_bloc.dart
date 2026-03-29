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
      // Add user message immediately so the UI responds at once
      final userMessage = ChatMessage(
        id: '${DateTime.now().millisecondsSinceEpoch}_q',
        message: event.query,
        isUser: true,
        timestamp: DateTime.now(),
      );

      _messages = [..._messages, userMessage];
      emit(RagChatLoading(_messages));

      // Always use the Node-backend RAG pipeline (handles RAG + web internally)
      final response = await _aiRepository.queryRag(
        query: event.query,
        institutionId: event.institutionId,
      );

      // Add AI response with full source data
      final aiMessage = ChatMessage(
        id: '${DateTime.now().millisecondsSinceEpoch}_a',
        message: response.answer,
        isUser: false,
        timestamp: DateTime.now(),
        sources: response.sources.map((s) => s.documentName).toList(),
        richSources: response.sources,
        isWebFallback: response.usedWebSearch,
        searchMethod: response.searchMethod,
      );

      _messages = [..._messages, aiMessage];
      emit(RagChatLoaded(_messages));
    } catch (e) {
      print('❌ Error sending RAG query: $e');
      emit(RagChatError(
        'Could not get an answer. Please check your connection and try again.',
        _messages,
      ));
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
