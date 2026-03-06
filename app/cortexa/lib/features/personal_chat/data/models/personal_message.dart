/// Represents a single message in the Personal AI chat.
/// Stored as a plain Map in Hive (no adapter needed).
class PersonalMessage {
  final String id;
  final String text;
  final bool isUser;
  final DateTime timestamp;
  /// Optional: name of attached file/image (for display badge)
  final String? attachmentName;
  /// Optional: 'image' | 'document'
  final String? attachmentType;

  const PersonalMessage({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.attachmentName,
    this.attachmentType,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'text': text,
        'isUser': isUser,
        'timestamp': timestamp.millisecondsSinceEpoch,
        if (attachmentName != null) 'attachmentName': attachmentName,
        if (attachmentType != null) 'attachmentType': attachmentType,
      };

  factory PersonalMessage.fromMap(Map map) => PersonalMessage(
        id: map['id'] as String,
        text: map['text'] as String,
        isUser: map['isUser'] as bool,
        timestamp:
            DateTime.fromMillisecondsSinceEpoch(map['timestamp'] as int),
        attachmentName: map['attachmentName'] as String?,
        attachmentType: map['attachmentType'] as String?,
      );

  PersonalMessage copyWith({
    String? id,
    String? text,
    bool? isUser,
    DateTime? timestamp,
    String? attachmentName,
    String? attachmentType,
  }) =>
      PersonalMessage(
        id: id ?? this.id,
        text: text ?? this.text,
        isUser: isUser ?? this.isUser,
        timestamp: timestamp ?? this.timestamp,
        attachmentName: attachmentName ?? this.attachmentName,
        attachmentType: attachmentType ?? this.attachmentType,
      );
}
