import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../data/repositories/teacher_ai_repository.dart';
import '../../../rag_assistant/data/models/mcq_model.dart';
import '../bloc/teacher_mcq_bloc.dart';
import '../bloc/teacher_mcq_event.dart';
import '../bloc/teacher_mcq_state.dart';

class TeacherMcqGenerationPage extends StatefulWidget {
  const TeacherMcqGenerationPage({super.key});

  @override
  State<TeacherMcqGenerationPage> createState() => _TeacherMcqGenerationPageState();
}

class _TeacherMcqGenerationPageState extends State<TeacherMcqGenerationPage> {
  final TextEditingController _topicController = TextEditingController();
  final TextEditingController _countController = TextEditingController(text: '5');
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _timeLimitController = TextEditingController();
  
  String? _selectedCourseId;
  String _selectedDifficulty = 'medium';
  List<Map<String, dynamic>> _authorizedCourses = [];
  late TeacherMcqBloc _mcqBloc;

  @override
  void initState() {
    super.initState();
    _mcqBloc = TeacherMcqBloc(getIt<TeacherAiRepository>());
    _loadAuthorizedCourses();
  }

  void _loadAuthorizedCourses() {
    final storage = getIt<HiveStorageService>();
    final courses = storage.getAuthorizedCourses() ?? [];
    setState(() {
      _authorizedCourses = courses;
      if (courses.isNotEmpty) {
        _selectedCourseId = courses.first['_id'] ?? courses.first['id'];
      }
    });
  }

  @override
  void dispose() {
    _topicController.dispose();
    _countController.dispose();
    _titleController.dispose();
    _timeLimitController.dispose();
    _mcqBloc.close();
    super.dispose();
  }

  void _generateMcqs() {
    if (_selectedCourseId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a course')),
      );
      return;
    }

    final topic = _topicController.text.trim();
    if (topic.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a topic')),
      );
      return;
    }

    final count = int.tryParse(_countController.text) ?? 5;

    _mcqBloc.add(GenerateMcqsEvent(
      courseId: _selectedCourseId!,
      topic: topic,
      count: count,
      difficulty: _selectedDifficulty,
    ));
  }

  void _saveMcqSet(List<McqQuestion> mcqs) {
    if (_selectedCourseId == null) return;

    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a title for the MCQ set')),
      );
      return;
    }

    final timeLimit = int.tryParse(_timeLimitController.text);

    _mcqBloc.add(SaveMcqSetEvent(
      title: title,
      courseId: _selectedCourseId!,
      mcqs: mcqs,
      timeLimit: timeLimit,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _mcqBloc,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Generate MCQs'),
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
        ),
        body: BlocConsumer<TeacherMcqBloc, TeacherMcqState>(
          listener: (context, state) {
            if (state is TeacherMcqError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            } else if (state is McqSetSaved) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.green,
                ),
              );
              _titleController.clear();
              _timeLimitController.clear();
            }
          },
          builder: (context, state) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Course selection
                  _buildCourseDropdown(),
                  const SizedBox(height: 16),

                  // Topic input
                  TextField(
                    controller: _topicController,
                    decoration: InputDecoration(
                      labelText: 'Topic',
                      hintText: 'e.g., Photosynthesis, World War II, etc.',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      prefixIcon: const Icon(Icons.topic),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Difficulty and count
                  Row(
                    children: [
                      Expanded(
                        child: _buildDifficultyDropdown(),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: _countController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Count',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            prefixIcon: const Icon(Icons.numbers),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Generate button
                  ElevatedButton.icon(
                    onPressed: state is TeacherMcqLoading ? null : _generateMcqs,
                    icon: state is TeacherMcqLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.auto_awesome),
                    label: Text(
                      state is TeacherMcqLoading
                          ? state.message ?? 'Generating...'
                          : 'Generate MCQs',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),

                  // Display generated MCQs
                  if (state is McqsGenerated) ...[
                    const SizedBox(height: 24),
                    _buildGeneratedMcqsSection(state),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildCourseDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.divider),
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedCourseId,
          isExpanded: true,
          hint: const Text('Select Course'),
          icon: const Icon(Icons.arrow_drop_down),
          items: _authorizedCourses.map((course) {
            final id = course['_id'] ?? course['id'];
            final name = course['name'] ?? 'Unnamed Course';
            return DropdownMenuItem<String>(
              value: id,
              child: Text(name),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedCourseId = value;
            });
          },
        ),
      ),
    );
  }

  Widget _buildDifficultyDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.divider),
        borderRadius: BorderRadius.circular(12),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedDifficulty,
          isExpanded: true,
          icon: const Icon(Icons.arrow_drop_down),
          items: const [
            DropdownMenuItem(value: 'easy', child: Text('Easy')),
            DropdownMenuItem(value: 'medium', child: Text('Medium')),
            DropdownMenuItem(value: 'hard', child: Text('Hard')),
          ],
          onChanged: (value) {
            setState(() {
              _selectedDifficulty = value ?? 'medium';
            });
          },
        ),
      ),
    );
  }

  Widget _buildGeneratedMcqsSection(McqsGenerated state) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Generated MCQs (${state.mcqs.length})',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                _mcqBloc.add(ClearGeneratedMcqsEvent());
              },
            ),
          ],
        ),
        const SizedBox(height: 8),

        Text(
          'Topic: ${state.topic} | Difficulty: ${state.difficulty}',
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 16),

        // MCQ list
        ...List.generate(state.mcqs.length, (index) {
          final mcq = state.mcqs[index];
          return _buildMcqCard(mcq, index);
        }),

        const SizedBox(height: 16),

        // Save section
        TextField(
          controller: _titleController,
          decoration: InputDecoration(
            labelText: 'MCQ Set Title',
            hintText: 'e.g., ${state.topic} Quiz',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            prefixIcon: const Icon(Icons.title),
          ),
        ),
        const SizedBox(height: 12),

        TextField(
          controller: _timeLimitController,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            labelText: 'Time Limit (minutes) - Optional',
            hintText: 'e.g., 30',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            prefixIcon: const Icon(Icons.timer),
          ),
        ),
        const SizedBox(height: 16),

        ElevatedButton.icon(
          onPressed: () => _saveMcqSet(state.mcqs),
          icon: const Icon(Icons.save),
          label: const Text('Save MCQ Set'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMcqCard(McqQuestion mcq, int index) {
    final options = [mcq.optionA, mcq.optionB, mcq.optionC, mcq.optionD];
    final correctIndex = mcq.correctAnswer;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Question header
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Q${index + 1}',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    mcq.question,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Options
            ...List.generate(options.length, (optionIndex) {
              final isCorrect = optionIndex == correctIndex;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isCorrect
                      ? Colors.green.withOpacity(0.1)
                      : AppColors.surface,
                  border: Border.all(
                    color: isCorrect ? Colors.green : AppColors.divider,
                    width: isCorrect ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Text(
                      '${String.fromCharCode(65 + optionIndex)}.',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isCorrect ? Colors.green : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        options[optionIndex],
                        style: TextStyle(
                          color: isCorrect ? Colors.green.shade800 : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (isCorrect)
                      const Icon(Icons.check_circle, color: Colors.green, size: 20),
                  ],
                ),
              );
            }),

            // Explanation
            if (mcq.explanation != null && mcq.explanation!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.withOpacity(0.2)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, size: 18, color: Colors.blue.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        mcq.explanation!,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.blue.shade900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
