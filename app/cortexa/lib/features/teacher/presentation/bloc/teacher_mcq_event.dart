import '../../../rag_assistant/data/models/mcq_model.dart';

/// Events for Teacher MCQ BLoC
abstract class TeacherMcqEvent {}

/// Event: Generate MCQs from topic
class GenerateMcqsEvent extends TeacherMcqEvent {
  final String courseId;
  final String topic;
  final int count;
  final String difficulty;

  GenerateMcqsEvent({
    required this.courseId,
    required this.topic,
    this.count = 5,
    this.difficulty = 'medium',
  });
}

/// Event: Save MCQ set
class SaveMcqSetEvent extends TeacherMcqEvent {
  final String title;
  final String courseId;
  final List<McqQuestion> mcqs;
  final int? timeLimit;

  SaveMcqSetEvent({
    required this.title,
    required this.courseId,
    required this.mcqs,
    this.timeLimit,
  });
}

/// Event: Add MCQs to existing set
class AddToMcqSetEvent extends TeacherMcqEvent {
  final String mcqSetId;
  final List<McqQuestion> mcqs;

  AddToMcqSetEvent({
    required this.mcqSetId,
    required this.mcqs,
  });
}

/// Event: Load all MCQ sets
class LoadMcqSetsEvent extends TeacherMcqEvent {}

/// Event: Load specific MCQ set details
class LoadMcqSetDetailsEvent extends TeacherMcqEvent {
  final String mcqSetId;

  LoadMcqSetDetailsEvent(this.mcqSetId);
}

/// Event: Assign MCQ set to students
class AssignMcqSetEvent extends TeacherMcqEvent {
  final String mcqSetId;
  final List<String> studentIds;
  final DateTime? dueDate;

  AssignMcqSetEvent({
    required this.mcqSetId,
    required this.studentIds,
    this.dueDate,
  });
}

/// Event: Load MCQ results
class LoadMcqResultsEvent extends TeacherMcqEvent {
  final String mcqSetId;

  LoadMcqResultsEvent(this.mcqSetId);
}

/// Event: Edit MCQ question
class EditMcqQuestionEvent extends TeacherMcqEvent {
  final int index;
  final McqQuestion updatedQuestion;

  EditMcqQuestionEvent({
    required this.index,
    required this.updatedQuestion,
  });
}

/// Event: Remove MCQ question
class RemoveMcqQuestionEvent extends TeacherMcqEvent {
  final int index;

  RemoveMcqQuestionEvent(this.index);
}

/// Event: Clear generated MCQs
class ClearGeneratedMcqsEvent extends TeacherMcqEvent {}

/// Event: Reset to initial state
class ResetMcqStateEvent extends TeacherMcqEvent {}
