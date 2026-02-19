class McqQuestion {
  final String question;
  final List<String> options;
  final int correctAnswer; // 0-based index
  final String? explanation;

  McqQuestion({
    required this.question,
    required this.options,
    required this.correctAnswer,
    this.explanation,
  });

  factory McqQuestion.fromJson(Map<String, dynamic> json) {
    // Handle options as list OR as object with A/B/C/D keys
    List<String> optionsList;
    int correctIndex;

    if (json['options'] is List) {
      // Options is already a list
      optionsList = (json['options'] as List<dynamic>).cast<String>();
      
      // Handle correctAnswer as either index or letter
      final correctAnswer = json['correct_answer'] ?? json['correctAnswer'] ?? json['answer'];
      if (correctAnswer is int) {
        correctIndex = correctAnswer;
      } else if (correctAnswer is String) {
        // Convert letter (A/B/C/D) to index
        correctIndex = correctAnswer.toUpperCase().codeUnitAt(0) - 65; // A=0, B=1, etc
      } else {
        correctIndex = 0;
      }
    } else if (json['options'] is Map) {
      // Options is a map with keys A, B, C, D
      final optionsMap = json['options'] as Map;
      optionsList = [
        optionsMap['A'] ?? '',
        optionsMap['B'] ?? '',
        optionsMap['C'] ?? '',
        optionsMap['D'] ?? '',
      ];
      
      // Correct answer should be A/B/C/D
      final correctLetter = (json['correct_answer'] ?? json['correctAnswer'] ?? 'A') as String;
      correctIndex = correctLetter.toUpperCase().codeUnitAt(0) - 65;
    } else {
      // Fallback for old format with option_a, option_b, etc
      optionsList = [
        json['option_a'] ?? '',
        json['option_b'] ?? '',
        json['option_c'] ?? '',
        json['option_d'] ?? '',
      ];
      correctIndex = json['correct_answer'] is int 
          ? json['correct_answer'] 
          : 0;
    }

    return McqQuestion(
      question: json['question'] as String,
      options: optionsList,
      correctAnswer: correctIndex,
      explanation: json['explanation'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'question': question,
        'options': options,
        'correct_answer': correctAnswer,
        'explanation': explanation,
      };

  // Helper getters for backward compatibility
  String get optionA => options.isNotEmpty ? options[0] : '';
  String get optionB => options.length > 1 ? options[1] : '';
  String get optionC => options.length > 2 ? options[2] : '';
  String get optionD => options.length > 3 ? options[3] : '';
}

class McqSet {
  final String id;
  final String title;
  final String? description;
  final List<McqQuestion> questions;
  final String courseId;
  final String? courseName;
  final String createdBy;
  final String? createdByName;
  final DateTime? dueDate;
  final int? duration; // in minutes
  final bool isAssigned;
  final List<String>? assignedTo;
  final int? passingPercentage;

  McqSet({
    required this.id,
    required this.title,
    this.description,
    required this.questions,
    required this.courseId,
    this.courseName,
    required this.createdBy,
    this.createdByName,
    this.dueDate,
    this.duration,
    required this.isAssigned,
    this.assignedTo,
    this.passingPercentage,
  });

  factory McqSet.fromJson(Map<String, dynamic> json) {
    return McqSet(
      id: json['_id'] as String? ?? json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      questions: (json['questions'] as List<dynamic>)
          .map((q) => McqQuestion.fromJson(q as Map<String, dynamic>))
          .toList(),
      courseId: json['course']?['_id'] as String? ?? 
               json['courseId'] as String? ?? 
               json['course'] as String,
      courseName: json['course']?['name'] as String?,
      createdBy: json['createdBy']?['_id'] as String? ?? 
                json['createdBy'] as String,
      createdByName: json['createdBy']?['fullName'] as String?,
      dueDate: json['dueDate'] != null 
          ? DateTime.parse(json['dueDate'] as String) 
          : null,
      duration: json['duration'] as int?,
      isAssigned: json['isAssigned'] as bool? ?? false,
      assignedTo: (json['assignedTo'] as List<dynamic>?)?.cast<String>(),
      passingPercentage: json['passingPercentage'] as int? ?? 60,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'title': title,
        'description': description,
        'questions': questions.map((q) => q.toJson()).toList(),
        'courseId': courseId,
        'createdBy': createdBy,
        'dueDate': dueDate?.toIso8601String(),
        'duration': duration,
        'isAssigned': isAssigned,
        'assignedTo': assignedTo,
        'passingPercentage': passingPercentage,
      };
}

class McqAttempt {
  final String id;
  final String mcqSetId;
  final String studentId;
  final Map<int, String> userAnswers; // question index -> selected answer
  final int score;
  final double percentage;
  final bool passed;
  final DateTime submittedAt;
  final int timeTaken; // in seconds

  McqAttempt({
    required this.id,
    required this.mcqSetId,
    required this.studentId,
    required this.userAnswers,
    required this.score,
    required this.percentage,
    required this.passed,
    required this.submittedAt,
    required this.timeTaken,
  });

  factory McqAttempt.fromJson(Map<String, dynamic> json) {
    return McqAttempt(
      id: json['_id'] as String? ?? json['id'] as String,
      mcqSetId: json['mcqSet'] as String? ?? json['mcqSetId'] as String,
      studentId: json['student'] as String? ?? json['studentId'] as String,
      userAnswers: Map<int, String>.from(
        (json['userAnswers'] as Map<String, dynamic>).map(
          (k, v) => MapEntry(int.parse(k), v as String),
        ),
      ),
      score: json['score'] as int,
      percentage: (json['percentage'] as num).toDouble(),
      passed: json['passed'] as bool,
      submittedAt: DateTime.parse(json['submittedAt'] as String),
      timeTaken: json['timeTaken'] as int,
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'mcqSetId': mcqSetId,
        'studentId': studentId,
        'userAnswers': userAnswers.map((k, v) => MapEntry(k.toString(), v)),
        'score': score,
        'percentage': percentage,
        'passed': passed,
        'submittedAt': submittedAt.toIso8601String(),
        'timeTaken': timeTaken,
      };
}

class McqGenerateRequest {
  final String sourceType; // 'text', 'document', 'topic'
  final String source;
  final int numQuestions;
  final String difficulty; // 'easy', 'medium', 'hard'

  McqGenerateRequest({
    required this.sourceType,
    required this.source,
    this.numQuestions = 5,
    this.difficulty = 'medium',
  });

  Map<String, dynamic> toJson() => {
        'source_type': sourceType,
        'source': source,
        'num_questions': numQuestions,
        'difficulty': difficulty,
      };
}
