import '../../../rag_assistant/data/models/mcq_model.dart';

/// States for Teacher MCQ BLoC
abstract class TeacherMcqState {}

/// Initial state
class TeacherMcqInitial extends TeacherMcqState {}

/// Loading state
class TeacherMcqLoading extends TeacherMcqState {
  final String? message;

  TeacherMcqLoading({this.message});
}

/// MCQs generated successfully
class McqsGenerated extends TeacherMcqState {
  final List<McqQuestion> mcqs;
  final String topic;
  final String difficulty;

  McqsGenerated({
    required this.mcqs,
    required this.topic,
    required this.difficulty,
  });
}

/// MCQ set saved successfully
class McqSetSaved extends TeacherMcqState {
  final String mcqSetId;
  final String title;
  final String message;

  McqSetSaved({
    required this.mcqSetId,
    required this.title,
    this.message = 'MCQ set saved successfully',
  });
}

/// MCQs added to set successfully
class McqsAddedToSet extends TeacherMcqState {
  final String mcqSetId;
  final String message;

  McqsAddedToSet({
    required this.mcqSetId,
    this.message = 'MCQs added to set successfully',
  });
}

/// MCQ sets loaded
class McqSetsLoaded extends TeacherMcqState {
  final List<Map<String, dynamic>> mcqSets;

  McqSetsLoaded(this.mcqSets);
}

/// MCQ set details loaded
class McqSetDetailsLoaded extends TeacherMcqState {
  final Map<String, dynamic> mcqSet;

  McqSetDetailsLoaded(this.mcqSet);
}

/// MCQ set assigned successfully
class McqSetAssigned extends TeacherMcqState {
  final String mcqSetId;
  final int studentCount;
  final String message;

  McqSetAssigned({
    required this.mcqSetId,
    required this.studentCount,
    this.message = 'MCQ set assigned successfully',
  });
}

/// MCQ results loaded
class McqResultsLoaded extends TeacherMcqState {
  final Map<String, dynamic> results;
  final String mcqSetId;

  McqResultsLoaded({
    required this.results,
    required this.mcqSetId,
  });
}

/// Error state
class TeacherMcqError extends TeacherMcqState {
  final String message;
  final String? errorCode;

  TeacherMcqError({
    required this.message,
    this.errorCode,
  });
}

/// Success state (generic)
class TeacherMcqSuccess extends TeacherMcqState {
  final String message;

  TeacherMcqSuccess(this.message);
}
