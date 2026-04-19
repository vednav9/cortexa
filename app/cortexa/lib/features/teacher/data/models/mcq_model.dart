class MCQModel {
  final String question;
  final List<String> options;
  final int correctAnswer;
  final String? explanation;
  final String? difficulty;

  MCQModel({
    required this.question,
    required this.options,
    required this.correctAnswer,
    this.explanation,
    this.difficulty,
  });

  factory MCQModel.fromJson(Map<String, dynamic> json) {
    List<String> options = [];
    var parsedCorrectAnswer = 0;

    if (json['options'] is List) {
      options = List<String>.from(
        (json['options'] as List).map((option) => option.toString()),
      );
    } else if (json['options'] is Map) {
      final optionsMap = json['options'] as Map<String, dynamic>;
      options = [
        optionsMap['A']?.toString() ??
            optionsMap['a']?.toString() ??
            'Option A',
        optionsMap['B']?.toString() ??
            optionsMap['b']?.toString() ??
            'Option B',
        optionsMap['C']?.toString() ??
            optionsMap['c']?.toString() ??
            'Option C',
        optionsMap['D']?.toString() ??
            optionsMap['d']?.toString() ??
            'Option D',
      ];
    } else {
      options = [
        json['option_a']?.toString() ?? 'Option A',
        json['option_b']?.toString() ?? 'Option B',
        json['option_c']?.toString() ?? 'Option C',
        json['option_d']?.toString() ?? 'Option D',
      ];
    }

    while (options.length < 4) {
      options.add('Option ${String.fromCharCode(65 + options.length)}');
    }
    if (options.length > 4) {
      options = options.sublist(0, 4);
    }

    final answerValue = json['correctAnswer'] ?? json['correct_answer'];
    if (answerValue is int) {
      parsedCorrectAnswer = answerValue;
    } else if (answerValue is String) {
      final normalizedAnswer = answerValue.trim().toUpperCase();
      if (normalizedAnswer.length == 1 &&
          normalizedAnswer.codeUnitAt(0) >= 65 &&
          normalizedAnswer.codeUnitAt(0) <= 68) {
        parsedCorrectAnswer = normalizedAnswer.codeUnitAt(0) - 65;
      }
    }
    parsedCorrectAnswer = parsedCorrectAnswer.clamp(0, 3);

    var normalizedDifficulty = json['difficulty']?.toString().toLowerCase();
    if (!['easy', 'medium', 'hard'].contains(normalizedDifficulty)) {
      normalizedDifficulty = 'medium';
    }

    final rawQuestion = json['question']?.toString() ?? 'Question';
    final cleanedQuestion = rawQuestion
        .replaceFirst(
          RegExp(r'^\s*(Q|Question)\s*\d+\s*[:.)-]\s*', caseSensitive: false),
          '',
        )
        .trim();

    return MCQModel(
      question: cleanedQuestion.isEmpty ? 'Question' : cleanedQuestion,
      options: options,
      correctAnswer: parsedCorrectAnswer,
      explanation: json['explanation']?.toString(),
      difficulty: normalizedDifficulty,
    );
  }

  Map<String, dynamic> toJson() {
    final normalizedOptions = List<String>.from(options);
    while (normalizedOptions.length < 4) {
      normalizedOptions.add(
        'Option ${String.fromCharCode(65 + normalizedOptions.length)}',
      );
    }

    final normalizedAnswer = correctAnswer.clamp(0, 3);

    return {
      'question': question,
      // Backend save endpoint expects list options and numeric correctAnswer.
      'options': normalizedOptions.sublist(0, 4),
      'correctAnswer': normalizedAnswer,
      // Keep legacy fields for compatibility with older backend parsing.
      'correct_answer': normalizedAnswer,
      'option_a': normalizedOptions[0],
      'option_b': normalizedOptions[1],
      'option_c': normalizedOptions[2],
      'option_d': normalizedOptions[3],
      'explanation': explanation ?? '',
      'difficulty': difficulty ?? 'medium',
    };
  }

  String get difficultyDisplay {
    if (difficulty == null || difficulty!.isEmpty) {
      return 'Medium';
    }
    return difficulty![0].toUpperCase() + difficulty!.substring(1);
  }

  String get correctOption =>
      options[correctAnswer.clamp(0, options.length - 1)];
}

class MCQSetModel {
  final String id;
  final String title;
  final String? description;
  final String courseId;
  final String courseName;
  final String createdById;
  final String? createdByName;
  final List<MCQModel> questions;
  final DateTime createdAt;
  final DateTime? dueDate;
  final int duration;
  final bool isAssigned;
  final bool hasAttempted;
  final double? attemptScore;
  final String? attemptId;
  final int totalAttempts;
  final double averageScore;

  MCQSetModel({
    required this.id,
    required this.title,
    this.description,
    required this.courseId,
    required this.courseName,
    required this.createdById,
    this.createdByName,
    required this.questions,
    required this.createdAt,
    this.dueDate,
    this.duration = 30,
    this.isAssigned = false,
    this.hasAttempted = false,
    this.attemptScore,
    this.attemptId,
    this.totalAttempts = 0,
    this.averageScore = 0.0,
  });

  factory MCQSetModel.fromJson(Map<String, dynamic> json) {
    var parsedCourseId = '';
    var parsedCourseName = '';
    if (json['course'] is Map<String, dynamic>) {
      final course = json['course'] as Map<String, dynamic>;
      parsedCourseId = course['_id']?.toString() ?? '';
      parsedCourseName = course['name']?.toString() ?? '';
    } else {
      parsedCourseId = json['course']?.toString() ?? '';
      parsedCourseName = json['courseName']?.toString() ?? '';
    }

    var parsedCreatedById = '';
    String? parsedCreatedByName;
    if (json['createdBy'] is Map<String, dynamic>) {
      final createdBy = json['createdBy'] as Map<String, dynamic>;
      parsedCreatedById = createdBy['_id']?.toString() ?? '';
      parsedCreatedByName = createdBy['fullName']?.toString();
    } else {
      parsedCreatedById = json['createdBy']?.toString() ?? '';
    }

    final questionsJson =
        json['questions'] as List? ?? json['mcqs'] as List? ?? [];

    return MCQSetModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Untitled MCQ Set',
      description: json['description']?.toString(),
      courseId: parsedCourseId,
      courseName: parsedCourseName,
      createdById: parsedCreatedById,
      createdByName: parsedCreatedByName,
      questions: questionsJson
          .whereType<Map>()
          .map(
            (question) =>
                MCQModel.fromJson(Map<String, dynamic>.from(question)),
          )
          .toList(),
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      dueDate: DateTime.tryParse(json['dueDate']?.toString() ?? ''),
      duration: (json['duration'] as num?)?.toInt() ?? 30,
      isAssigned: json['isAssigned'] as bool? ?? false,
      hasAttempted: json['hasAttempted'] as bool? ?? false,
      attemptScore: (json['attemptScore'] as num?)?.toDouble(),
      attemptId: json['attemptId']?.toString(),
      totalAttempts: json['totalAttempts'] as int? ?? 0,
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'title': title,
      'description': description,
      'course': courseId,
      'courseName': courseName,
      'createdBy': createdById,
      'questions': questions.map((question) => question.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      if (dueDate != null) 'dueDate': dueDate!.toIso8601String(),
      'duration': duration,
      'isAssigned': isAssigned,
      'hasAttempted': hasAttempted,
      if (attemptScore != null) 'attemptScore': attemptScore,
      if (attemptId != null) 'attemptId': attemptId,
      'totalAttempts': totalAttempts,
      'averageScore': averageScore,
    };
  }

  int get questionCount => questions.length;

  String get formattedDate {
    final difference = DateTime.now().difference(createdAt);
    if (difference.inDays == 0) {
      return 'Today';
    }
    if (difference.inDays == 1) {
      return 'Yesterday';
    }
    if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    }

    final day = createdAt.day.toString().padLeft(2, '0');
    final month = createdAt.month.toString().padLeft(2, '0');
    final year = createdAt.year;
    return '$day/$month/$year';
  }
}
