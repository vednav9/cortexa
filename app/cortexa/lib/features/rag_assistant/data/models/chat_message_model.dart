import 'rag_response_model.dart';

class ChatMessage {
  final String id;
  final String message;
  final bool isUser;
  final DateTime timestamp;
  final List<String>? sources;
  final List<DocumentSource>? richSources;
  final String? context;
  final bool? isWebFallback;
  final String? searchMethod;

  ChatMessage({
    required this.id,
    required this.message,
    required this.isUser,
    required this.timestamp,
    this.sources,
    this.richSources,
    this.context,
    this.isWebFallback,
    this.searchMethod,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'message': message,
        'isUser': isUser,
        'timestamp': timestamp.toIso8601String(),
        'sources': sources,
        'richSources': richSources?.map((s) => s.toJson()).toList(),
        'context': context,
        'isWebFallback': isWebFallback,
        'searchMethod': searchMethod,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        message: json['message'] as String,
        isUser: json['isUser'] as bool,
        timestamp: DateTime.parse(json['timestamp'] as String),
        sources: (json['sources'] as List<dynamic>?)?.cast<String>(),
        richSources: (json['richSources'] as List<dynamic>?)
            ?.map((s) => DocumentSource.fromJson(s as Map<String, dynamic>))
            .toList(),
        context: json['context'] as String?,
        isWebFallback: json['isWebFallback'] as bool?,
        searchMethod: json['searchMethod'] as String?,
      );
}
