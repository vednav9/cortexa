import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/teacher_ai_repository.dart';
import '../../../rag_assistant/data/models/mcq_model.dart';
import 'teacher_mcq_event.dart';
import 'teacher_mcq_state.dart';

/// BLoC for managing teacher MCQ operations
class TeacherMcqBloc extends Bloc<TeacherMcqEvent, TeacherMcqState> {
  final TeacherAiRepository _repository;
  
  // Store generated MCQs in memory for editing before saving
  List<McqQuestion> _generatedMcqs = [];
  
  TeacherMcqBloc(this._repository) : super(TeacherMcqInitial()) {
    on<GenerateMcqsEvent>(_onGenerateMcqs);
    on<SaveMcqSetEvent>(_onSaveMcqSet);
    on<AddToMcqSetEvent>(_onAddToMcqSet);
    on<LoadMcqSetsEvent>(_onLoadMcqSets);
    on<LoadMcqSetDetailsEvent>(_onLoadMcqSetDetails);
    on<AssignMcqSetEvent>(_onAssignMcqSet);
    on<LoadMcqResultsEvent>(_onLoadMcqResults);
    on<EditMcqQuestionEvent>(_onEditMcqQuestion);
    on<RemoveMcqQuestionEvent>(_onRemoveMcqQuestion);
    on<ClearGeneratedMcqsEvent>(_onClearGeneratedMcqs);
    on<ResetMcqStateEvent>(_onResetMcqState);
  }

  Future<void> _onGenerateMcqs(
    GenerateMcqsEvent event,
    Emitter<TeacherMcqState> emit,
  ) async {
    emit(TeacherMcqLoading(message: 'Generating MCQs...'));
    
    try {
      final mcqs = await _repository.generateMcqs(
        courseId: event.courseId,
        topic: event.topic,
        sourceType: event.sourceType,
        documentId: event.documentId,
        count: event.count,
        difficulty: event.difficulty,
      );

      _generatedMcqs = mcqs;

      emit(McqsGenerated(
        mcqs: mcqs,
        topic: event.topic,
        difficulty: event.difficulty,
      ));
    } catch (e) {
      emit(TeacherMcqError(message: e.toString()));
    }
  }

  Future<void> _onSaveMcqSet(
    SaveMcqSetEvent event,
    Emitter<TeacherMcqState> emit,
  ) async {
    emit(TeacherMcqLoading(message: 'Saving MCQ set...'));
    
    try {
      final mcqSetId = await _repository.saveMcqSet(
        title: event.title,
        courseId: event.courseId,
        mcqs: event.mcqs,
        timeLimit: event.timeLimit,
      );

      // Clear generated MCQs after saving
      _generatedMcqs = [];

      emit(McqSetSaved(
        mcqSetId: mcqSetId,
        title: event.title,
      ));
    } catch (e) {
      emit(TeacherMcqError(message: e.toString()));
    }
  }

  Future<void> _onAddToMcqSet(
    AddToMcqSetEvent event,
    Emitter<TeacherMcqState> emit,
  ) async {
    emit(TeacherMcqLoading(message: 'Adding MCQs to set...'));
    
    try {
      await _repository.addToMcqSet(
        mcqSetId: event.mcqSetId,
        mcqs: event.mcqs,
      );

      emit(McqsAddedToSet(mcqSetId: event.mcqSetId));
    } catch (e) {
      emit(TeacherMcqError(message: e.toString()));
    }
  }

  Future<void> _onLoadMcqSets(
    LoadMcqSetsEvent event,
    Emitter<TeacherMcqState> emit,
  ) async {
    emit(TeacherMcqLoading(message: 'Loading MCQ sets...'));
    
    try {
      final mcqSets = await _repository.getMcqSets();

      emit(McqSetsLoaded(mcqSets));
    } catch (e) {
      emit(TeacherMcqError(message: e.toString()));
    }
  }

  Future<void> _onLoadMcqSetDetails(
    LoadMcqSetDetailsEvent event,
    Emitter<TeacherMcqState> emit,
  ) async {
    emit(TeacherMcqLoading(message: 'Loading MCQ set details...'));
    
    try {
      // TODO: Add getMcqSetDetails method to repository
      // For now, we can load from the list
      final mcqSets = await _repository.getMcqSets();
      final mcqSet = mcqSets.firstWhere(
        (set) => set['_id'] == event.mcqSetId,
        orElse: () => throw Exception('MCQ set not found'),
      );

      emit(McqSetDetailsLoaded(mcqSet));
    } catch (e) {
      emit(TeacherMcqError(message: e.toString()));
    }
  }

  Future<void> _onAssignMcqSet(
    AssignMcqSetEvent event,
    Emitter<TeacherMcqState> emit,
  ) async {
    emit(TeacherMcqLoading(message: 'Assigning MCQ set...'));
    
    try {
      await _repository.assignMcqSet(
        mcqSetId: event.mcqSetId,
        studentIds: event.studentIds,
        dueDate: event.dueDate,
      );

      emit(McqSetAssigned(
        mcqSetId: event.mcqSetId,
        studentCount: event.studentIds.length,
      ));
    } catch (e) {
      emit(TeacherMcqError(message: e.toString()));
    }
  }

  Future<void> _onLoadMcqResults(
    LoadMcqResultsEvent event,
    Emitter<TeacherMcqState> emit,
  ) async {
    emit(TeacherMcqLoading(message: 'Loading results...'));
    
    try {
      final results = await _repository.getMcqResults(event.mcqSetId);

      emit(McqResultsLoaded(
        results: results,
        mcqSetId: event.mcqSetId,
      ));
    } catch (e) {
      emit(TeacherMcqError(message: e.toString()));
    }
  }

  void _onEditMcqQuestion(
    EditMcqQuestionEvent event,
    Emitter<TeacherMcqState> emit,
  ) {
    if (event.index >= 0 && event.index < _generatedMcqs.length) {
      _generatedMcqs[event.index] = event.updatedQuestion;
      
      // Re-emit the current state with updated MCQs
      if (state is McqsGenerated) {
        final currentState = state as McqsGenerated;
        emit(McqsGenerated(
          mcqs: List.from(_generatedMcqs),
          topic: currentState.topic,
          difficulty: currentState.difficulty,
        ));
      }
    }
  }

  void _onRemoveMcqQuestion(
    RemoveMcqQuestionEvent event,
    Emitter<TeacherMcqState> emit,
  ) {
    if (event.index >= 0 && event.index < _generatedMcqs.length) {
      _generatedMcqs.removeAt(event.index);
      
      // Re-emit the current state with updated MCQs
      if (state is McqsGenerated) {
        final currentState = state as McqsGenerated;
        emit(McqsGenerated(
          mcqs: List.from(_generatedMcqs),
          topic: currentState.topic,
          difficulty: currentState.difficulty,
        ));
      }
    }
  }

  void _onClearGeneratedMcqs(
    ClearGeneratedMcqsEvent event,
    Emitter<TeacherMcqState> emit,
  ) {
    _generatedMcqs = [];
    emit(TeacherMcqInitial());
  }

  void _onResetMcqState(
    ResetMcqStateEvent event,
    Emitter<TeacherMcqState> emit,
  ) {
    _generatedMcqs = [];
    emit(TeacherMcqInitial());
  }

  List<McqQuestion> get generatedMcqs => List.unmodifiable(_generatedMcqs);
}
