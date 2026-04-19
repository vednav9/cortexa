import '../../data/models/chat_message_model.dart';

/// Events for RAG Chat
abstract class RagChatEvent {}

class LoadChatHistory extends RagChatEvent {}

class SendRagQuery extends RagChatEvent {
  final String query;
  final String? institutionId;
  final String? courseId;
  final List<String>? documentIds;
  final bool useHybrid;

  SendRagQuery({
    required this.query,
    this.institutionId,
    this.courseId,
    this.documentIds,
    this.useHybrid = false,
  });
}

class ClearChatHistory extends RagChatEvent {}

/// States for RAG Chat
abstract class RagChatState {}

class RagChatInitial extends RagChatState {}

class RagChatLoading extends RagChatState {
  final List<ChatMessage> messages;

  RagChatLoading(this.messages);
}

class RagChatLoaded extends RagChatState {
  final List<ChatMessage> messages;

  RagChatLoaded(this.messages);
}

class RagChatError extends RagChatState {
  final String message;
  final List<ChatMessage> messages;

  RagChatError(this.message, this.messages);
}
