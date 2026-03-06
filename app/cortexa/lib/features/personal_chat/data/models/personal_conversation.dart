/// Represents a named conversation session in the Personal AI chat.
/// Stored as a plain Map in Hive (no adapter needed).
class PersonalConversation {
  final String id;
  final String title;
  final DateTime createdAt;
  final DateTime lastUpdatedAt;
  final String lastMessagePreview;

  const PersonalConversation({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.lastUpdatedAt,
    this.lastMessagePreview = '',
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'createdAt': createdAt.millisecondsSinceEpoch,
        'lastUpdatedAt': lastUpdatedAt.millisecondsSinceEpoch,
        'lastMessagePreview': lastMessagePreview,
      };

  factory PersonalConversation.fromMap(Map map) => PersonalConversation(
        id: map['id'] as String,
        title: map['title'] as String,
        createdAt:
            DateTime.fromMillisecondsSinceEpoch(map['createdAt'] as int),
        lastUpdatedAt:
            DateTime.fromMillisecondsSinceEpoch(map['lastUpdatedAt'] as int),
        lastMessagePreview: map['lastMessagePreview'] as String? ?? '',
      );

  PersonalConversation copyWith({
    String? id,
    String? title,
    DateTime? createdAt,
    DateTime? lastUpdatedAt,
    String? lastMessagePreview,
  }) =>
      PersonalConversation(
        id: id ?? this.id,
        title: title ?? this.title,
        createdAt: createdAt ?? this.createdAt,
        lastUpdatedAt: lastUpdatedAt ?? this.lastUpdatedAt,
        lastMessagePreview: lastMessagePreview ?? this.lastMessagePreview,
      );
}
