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
    // Handle different response formats from AI/Backend
    List<String> options = [];
    int correctAnswer = 0;

    // Handle options in different formats
    if (json['options'] != null && json['options'] is List) {
      // Format 1: Array ["text1", "text2", "text3", "text4"]
      options = List<String>.from(json['options']);
    } else if (json['options'] != null && json['options'] is Map) {
      // Format 2: Object {A: "text", B: "text", C: "text", D: "text"}
      final optionsMap = json['options'] as Map<String, dynamic>;
      options = [
        optionsMap['A']?.toString() ?? optionsMap['a']?.toString() ?? 'Option A',
        optionsMap['B']?.toString() ?? optionsMap['b']?.toString() ?? 'Option B',
        optionsMap['C']?.toString() ?? optionsMap['c']?.toString() ?? 'Option C',
        optionsMap['D']?.toString() ?? optionsMap['d']?.toString() ?? 'Option D',
      ];
    } else {
      // Format 3: Separate fields {option_a, option_b, option_c, option_d}
      options = [
        json['option_a']?.toString() ?? 'Option A',
        json['option_b']?.toString() ?? 'Option B',
        json['option_c']?.toString() ?? 'Option C',
        json['option_d']?.toString() ?? 'Option D',
      ];
    }

    // Ensure options has exactly 4 items
    while (options.length < 4) {
      options.add('Option ${String.fromCharCode(65 + options.length)}');
    }
    if (options.length > 4) {
      options = options.sublist(0, 4);
    }

    // Handle correctAnswer in different formats
    final answerValue = json['correctAnswer'] ?? json['correct_answer'];
    if (answerValue is int) {
      // Already a number (0-3)
      correctAnswer = answerValue;
    } else if (answerValue is String) {
      // Convert letter to index (A=0, B=1, C=2, D=3)
      final letter = answerValue.toUpperCase();
      if (letter.length == 1 && letter.codeUnitAt(0) >= 65 && letter.codeUnitAt(0) <= 68) {
        correctAnswer = letter.codeUnitAt(0) - 65;
      } else {
        correctAnswer = 0; // Default to first option
      }
    } else {
      correctAnswer = 0; // Default to first option
    }

    // Ensure correctAnswer is within valid range
    if (correctAnswer < 0 || correctAnswer > 3) {
      correctAnswer = 0;
    }

    // Handle difficulty - normalize to lowercase
    String? difficulty = json['difficulty']?.toString().toLowerCase();
    if (difficulty != null && !['easy', 'medium', 'hard'].contains(difficulty)) {
      difficulty = 'medium';
    }

    return MCQModel(
      question: json['question']?.toString() ?? 'Question',
      options: options,
      correctAnswer: correctAnswer,
      explanation: json['explanation']?.toString(),
      difficulty: difficulty ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'options': options.length == 4 ? options : [...options, ...List.generate(4 - options.length, (i) => 'Option ${String.fromCharCode(65 + options.length + i)}')].sublist(0, 4),
      'correctAnswer': correctAnswer >= 0 && correctAnswer <= 3 ? correctAnswer : 0,
      'explanation': explanation ?? '',
      'difficulty': difficulty ?? 'medium',
    };
  }

  String get difficultyDisplay {
    if (difficulty == null || difficulty!.isEmpty) return 'Medium';
    return difficulty![0].toUpperCase() + difficulty!.substring(1);
  }

  String get correctOption => options[correctAnswer];
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
  final bool isAssigned;
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
    this.isAssigned = false,
    this.totalAttempts = 0,
    this.averageScore = 0.0,
  });

  factory MCQSetModel.fromJson(Map<String, dynamic> json) {
    // Handle course as object or string
    String courseId = '';
    String courseName = '';
    if (json['course'] is Map) {
      courseId = json['course']['_id'] as String;
      courseName = json['course']['name'] as String? ?? '';
    } else {
      courseId = json['course'] as String;
      courseName = json['courseName'] as String? ?? '';
    }

    // Handle createdBy as object or string
    String createdById = '';
    String? createdByName;
    if (json['createdBy'] is Map) {
      createdById = json['createdBy']['_id'] as String;
      createdByName = json['createdBy']['fullName'] as String?;
    } else {
      createdById = json['createdBy'] as String;
    }

    return MCQSetModel(
      id: json['_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      courseId: courseId,
      courseName: courseName,
      createdById: createdById,
      createdByName: createdByName,
      questions: (json['questions'] as List?)
              ?.map((q) => MCQModel.fromJson(q))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      isAssigned: json['isAssigned'] as bool? ?? false,
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
      'createdBy': createdById,
      'questions': questions.map((q) => q.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'isAssigned': isAssigned,
      'totalAttempts': totalAttempts,
      'averageScore': averageScore,
    };
  }

  int get questionCount => questions.length;

  String get formattedDate {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      final day = createdAt.day.toString().padLeft(2, '0');
      final month = createdAt.month.toString().padLeft(2, '0');
      final year = createdAt.year;
      return '$day/$month/$year';
    }
  }
}
