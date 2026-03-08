class CourseOption {
  final String id;
  final String name;
  final String code;

  const CourseOption({
    required this.id,
    required this.name,
    required this.code,
  });

  factory CourseOption.fromJson(Map<String, dynamic> json) => CourseOption(
        id: json['_id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        code: json['code']?.toString() ?? '',
      );

  String get displayName => '$code - $name';
}

class QAUserRef {
  final String userId;
  final String userType;
  final String name;
  final String? email;

  const QAUserRef({
    required this.userId,
    required this.userType,
    required this.name,
    this.email,
  });

  factory QAUserRef.fromJson(Map<String, dynamic> json) => QAUserRef(
        userId: json['userId']?.toString() ?? '',
        userType: json['userType']?.toString() ?? '',
        name: json['name']?.toString() ?? 'Unknown',
        email: json['email']?.toString(),
      );
}

class QAAnswer {
  final String id;
  final QAUserRef answeredBy;
  final String text;
  final bool isAccepted;
  final List<String> upvotes;
  final DateTime answeredAt;

  const QAAnswer({
    required this.id,
    required this.answeredBy,
    required this.text,
    required this.isAccepted,
    required this.upvotes,
    required this.answeredAt,
  });

  factory QAAnswer.fromJson(Map<String, dynamic> json) => QAAnswer(
        id: json['_id']?.toString() ?? '',
        answeredBy: QAUserRef.fromJson(
          json['answeredBy'] as Map<String, dynamic>? ?? {},
        ),
        text: json['text']?.toString() ?? '',
        isAccepted: json['isAccepted'] as bool? ?? false,
        upvotes: (json['upvotes'] as List?)
                ?.map((e) => e.toString())
                .toList() ??
            [],
        answeredAt: DateTime.tryParse(
                json['answeredAt']?.toString() ?? '') ??
            DateTime.now(),
      );
}

class QAItem {
  final String id;
  final String title;
  final String description;
  final String category;
  final String priority;
  final String status;
  final String? courseId;
  final String? courseName;
  final String? courseCode;
  final QAUserRef askedBy;
  final bool isAnonymous;
  final List<String> tags;
  final List<QAAnswer> answers;
  final List<String> upvotes;
  final int views;
  final DateTime createdAt;

  const QAItem({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.priority,
    required this.status,
    this.courseId,
    this.courseName,
    this.courseCode,
    required this.askedBy,
    required this.isAnonymous,
    required this.tags,
    required this.answers,
    required this.upvotes,
    required this.views,
    required this.createdAt,
  });

  factory QAItem.fromJson(Map<String, dynamic> json) {
    String? courseId, courseName, courseCode;
    if (json['course'] is Map) {
      final c = json['course'] as Map<String, dynamic>;
      courseId = c['_id']?.toString();
      courseName = c['name']?.toString();
      courseCode = c['code']?.toString();
    } else if (json['course'] is String) {
      courseId = json['course'] as String;
    }

    return QAItem(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'general',
      priority: json['priority']?.toString() ?? 'normal',
      status: json['status']?.toString() ?? 'open',
      courseId: courseId,
      courseName: courseName,
      courseCode: courseCode,
      askedBy: QAUserRef.fromJson(
        json['askedBy'] as Map<String, dynamic>? ?? {},
      ),
      isAnonymous: json['isAnonymous'] as bool? ?? false,
      tags: (json['tags'] as List?)?.map((e) => e.toString()).toList() ?? [],
      answers: (json['answers'] as List?)
              ?.map((e) => QAAnswer.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      upvotes:
          (json['upvotes'] as List?)?.map((e) => e.toString()).toList() ?? [],
      views: json['views'] as int? ?? 0,
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
              DateTime.now(),
    );
  }

  QAItem copyWith({
    String? status,
    List<QAAnswer>? answers,
    List<String>? upvotes,
    int? views,
  }) =>
      QAItem(
        id: id,
        title: title,
        description: description,
        category: category,
        priority: priority,
        status: status ?? this.status,
        courseId: courseId,
        courseName: courseName,
        courseCode: courseCode,
        askedBy: askedBy,
        isAnonymous: isAnonymous,
        tags: tags,
        answers: answers ?? this.answers,
        upvotes: upvotes ?? this.upvotes,
        views: views ?? this.views,
        createdAt: createdAt,
      );
}

class QAStats {
  final int total;
  final int open;
  final int inProgress;
  final int resolved;
  final int closed;

  const QAStats({
    required this.total,
    required this.open,
    required this.inProgress,
    required this.resolved,
    required this.closed,
  });

  const QAStats.empty()
      : total = 0,
        open = 0,
        inProgress = 0,
        resolved = 0,
        closed = 0;

  factory QAStats.fromJson(Map<String, dynamic> json) => QAStats(
        total: json['total'] as int? ?? 0,
        open: json['open'] as int? ?? 0,
        inProgress: json['inProgress'] as int? ?? 0,
        resolved: json['resolved'] as int? ?? 0,
        closed: json['closed'] as int? ?? 0,
      );
}
