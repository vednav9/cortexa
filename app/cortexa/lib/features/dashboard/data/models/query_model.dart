class UserRef {
  final String userId;
  final String userModel; // 'Admin', 'Teacher', 'Student'
  final String name;
  final String? email;

  UserRef({
    required this.userId,
    required this.userModel,
    required this.name,
    this.email,
  });

  factory UserRef.fromJson(Map<String, dynamic> json) {
    return UserRef(
      userId: json['userId']?.toString() ?? '',
      userModel: json['userModel']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'userModel': userModel,
      'name': name,
      if (email != null) 'email': email,
    };
  }
}

class QueryReply {
  final String id;
  final String text;
  final UserRef repliedBy;
  final DateTime repliedAt;

  QueryReply({
    required this.id,
    required this.text,
    required this.repliedBy,
    required this.repliedAt,
  });

  factory QueryReply.fromJson(Map<String, dynamic> json) {
    return QueryReply(
      id: json['_id']?.toString() ?? '',
      text: json['text']?.toString() ?? '',
      repliedBy: UserRef.fromJson(json['repliedBy'] as Map<String, dynamic>),
      repliedAt: DateTime.parse(json['repliedAt']?.toString() ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'text': text,
      'repliedBy': repliedBy.toJson(),
      'repliedAt': repliedAt.toIso8601String(),
    };
  }
}

class Query {
  final String id;
  final String title;
  final String description;
  final String category; // general, technical, academic, administrative
  final String priority; // low, normal, high, urgent
  final String status; // open, in-progress, resolved, closed
  final String institution;
  final UserRef createdBy;
  final List<QueryReply> replies;
  final UserRef? assignedTo;
  final DateTime? resolvedAt;
  final UserRef? resolvedBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  Query({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.priority,
    required this.status,
    required this.institution,
    required this.createdBy,
    required this.replies,
    this.assignedTo,
    this.resolvedAt,
    this.resolvedBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Query.fromJson(Map<String, dynamic> json) {
    return Query(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      category: json['category']?.toString() ?? 'general',
      priority: json['priority']?.toString() ?? 'normal',
      status: json['status']?.toString() ?? 'open',
      institution: json['institution']?.toString() ?? '',
      createdBy: UserRef.fromJson(json['createdBy'] as Map<String, dynamic>),
      replies: (json['replies'] as List<dynamic>?)
          ?.map((r) => QueryReply.fromJson(r as Map<String, dynamic>))
          .toList() ?? [],
      assignedTo: json['assignedTo'] != null
          ? UserRef.fromJson(json['assignedTo'] as Map<String, dynamic>)
          : null,
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'].toString())
          : null,
      resolvedBy: json['resolvedBy'] != null
          ? UserRef.fromJson(json['resolvedBy'] as Map<String, dynamic>)
          : null,
      createdAt: DateTime.parse(
        json['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
      ),
      updatedAt: DateTime.parse(
        json['updatedAt']?.toString() ?? DateTime.now().toIso8601String(),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'category': category,
      'priority': priority,
      'status': status,
      'institution': institution,
      'createdBy': createdBy.toJson(),
      'replies': replies.map((r) => r.toJson()).toList(),
      if (assignedTo != null) 'assignedTo': assignedTo!.toJson(),
      if (resolvedAt != null) 'resolvedAt': resolvedAt!.toIso8601String(),
      if (resolvedBy != null) 'resolvedBy': resolvedBy!.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Query copyWith({
    String? id,
    String? title,
    String? description,
    String? category,
    String? priority,
    String? status,
    String? institution,
    UserRef? createdBy,
    List<QueryReply>? replies,
    UserRef? assignedTo,
    DateTime? resolvedAt,
    UserRef? resolvedBy,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Query(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      institution: institution ?? this.institution,
      createdBy: createdBy ?? this.createdBy,
      replies: replies ?? this.replies,
      assignedTo: assignedTo ?? this.assignedTo,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      resolvedBy: resolvedBy ?? this.resolvedBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class QueryStats {
  final int total;
  final int open;
  final int inProgress;
  final int resolved;

  QueryStats({
    required this.total,
    required this.open,
    required this.inProgress,
    required this.resolved,
  });

  factory QueryStats.fromJson(Map<String, dynamic> json) {
    return QueryStats(
      total: json['total'] as int? ?? 0,
      open: json['open'] as int? ?? 0,
      inProgress: json['inProgress'] as int? ?? 0,
      resolved: json['resolved'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'open': open,
      'inProgress': inProgress,
      'resolved': resolved,
    };
  }
}
