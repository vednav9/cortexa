class ChatMessage {
  final String id;
  final String message;
  final bool isUser;
  final DateTime timestamp;
  final List<String>? sources;
  final String? context;
  final bool? isWebFallback;

  ChatMessage({
    required this.id,
    required this.message,
    required this.isUser,
    required this.timestamp,
    this.sources,
    this.context,
    this.isWebFallback,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'message': message,
        'isUser': isUser,
        'timestamp': timestamp.toIso8601String(),
        'sources': sources,
        'context': context,
        'isWebFallback': isWebFallback,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id'] as String,
        message: json['message'] as String,
        isUser: json['isUser'] as bool,
        timestamp: DateTime.parse(json['timestamp'] as String),
        sources: (json['sources'] as List<dynamic>?)?.cast<String>(),
        context: json['context'] as String?,
        isWebFallback: json['isWebFallback'] as bool?,
      );
}
