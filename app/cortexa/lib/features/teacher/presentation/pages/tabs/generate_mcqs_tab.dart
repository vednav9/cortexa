import 'package:flutter/material.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/network/api_client.dart';
import '../../../../../../core/config/api_config.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../data/models/course_model.dart';
import '../../../data/models/mcq_model.dart';
import '../../../data/repositories/mcq_repository.dart';

enum SourceType { topic, document }

class GenerateMCQsTab extends StatefulWidget {
  const GenerateMCQsTab({super.key});

  @override
  State<GenerateMCQsTab> createState() => _GenerateMCQsTabState();
}

class _GenerateMCQsTabState extends State<GenerateMCQsTab> {
  final _apiClient = getIt<ApiClient>();
  late final MCQRepository _mcqRepository;
  final _topicController = TextEditingController();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  // State variables
  List<CourseModel> _courses = [];
  CourseModel? _selectedCourse;
  SourceType _sourceType = SourceType.topic;
  int _numberOfQuestions = 5;
  String _difficulty = 'medium';
  
  // Loading states
  bool _isLoadingCourses = false;
  bool _isGenerating = false;
  bool _isSaving = false;
  
  // Generated MCQs
  List<MCQModel> _generatedMCQs = [];
  
  // Saved MCQ Sets
  List<MCQSetModel> _savedMCQSets = [];
  bool _isLoadingSets = false;

  @override
  void initState() {
    super.initState();
    _mcqRepository = MCQRepository(_apiClient);
    _loadCourses();
  }

  @override
  void dispose() {
    _topicController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadCourses() async {
    setState(() => _isLoadingCourses = true);

    try {
      final response = await _apiClient.get(
        ApiConfig.teacherAuthorizedCourses,
        requiresAuth: true,
      );

      if (response['success'] == true) {
        final coursesData = response['courses'] as List? ?? [];
        final courses = coursesData
            .map((json) => CourseModel.fromJson(json))
            .toList();

        setState(() {
          _courses = courses;
          _isLoadingCourses = false;
        });
      } else {
        setState(() => _isLoadingCourses = false);
        if (mounted) {
          _showErrorSnackBar(response['message'] ?? 'Failed to load courses');
        }
      }
    } catch (e) {
      setState(() => _isLoadingCourses = false);
      if (mounted) {
        _showErrorSnackBar('Error loading courses');
      }
    }
  }

  Future<void> _loadSavedMCQSets() async {
    if (_selectedCourse == null) return;

    setState(() => _isLoadingSets = true);

    try {
      final sets = await _mcqRepository.getMCQSets(courseId: _selectedCourse!.id);
      setState(() {
        _savedMCQSets = sets;
        _isLoadingSets = false;
      });
    } catch (e) {
      setState(() => _isLoadingSets = false);
      if (mounted) {
        _showErrorSnackBar('Failed to load saved MCQ sets');
      }
    }
  }

  Future<void> _generateMCQs() async {
    if (_selectedCourse == null) {
      _showErrorSnackBar('Please select a course first');
      return;
    }

    if (_topicController.text.trim().isEmpty) {
      _showErrorSnackBar(
        _sourceType == SourceType.topic
            ? 'Please enter a topic'
            : 'Please enter a document name',
      );
      return;
    }

    setState(() => _isGenerating = true);

    try {
      final mcqs = await _mcqRepository.generateMCQs(
        courseId: _selectedCourse!.id,
        topic: _topicController.text.trim(),
        sourceType: _sourceType == SourceType.topic ? 'topic' : 'document',
        count: _numberOfQuestions,
        difficulty: _difficulty,
      );

      setState(() {
        _generatedMCQs = mcqs;
        _isGenerating = false;
      });

      if (mcqs.isEmpty) {
        _showWarningSnackBar('AI returned no MCQs. Try a broader topic or different source type.');
      } else {
        _showSuccessSnackBar('Generated ${mcqs.length} MCQ${mcqs.length != 1 ? 's' : ''} successfully');
      }
    } catch (e) {
      setState(() => _isGenerating = false);
      _showErrorSnackBar('Failed to generate MCQs: ${e.toString().replaceAll('Exception: ', '')}');
    }
  }

  Future<void> _saveMCQSet() async {
    if (_generatedMCQs.isEmpty) {
      _showErrorSnackBar('No MCQs to save');
      return;
    }

    if (_selectedCourse == null) {
      _showErrorSnackBar('Please select a course first');
      return;
    }

    await _showSaveDialog();
  }

  Future<void> _showSaveDialog() async {
    _titleController.clear();
    _descriptionController.clear();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Save MCQ Set'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Saving ${_generatedMCQs.length} MCQ${_generatedMCQs.length != 1 ? 's' : ''}',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _titleController,
                decoration: InputDecoration(
                  labelText: 'Title *',
                  hintText: 'e.g., Data Structures Quiz 1',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                maxLength: 100,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _descriptionController,
                decoration: InputDecoration(
                  labelText: 'Description (Optional)',
                  hintText: 'Brief description of this MCQ set...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                maxLines: 3,
                maxLength: 500,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (_titleController.text.trim().isEmpty) {
                _showWarningSnackBar('Please enter a title');
                return;
              }
              Navigator.pop(context, true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result == true) {
      await _performSave();
    }
  }

  Future<void> _performSave() async {
    setState(() => _isSaving = true);

    try {
      await _mcqRepository.saveMCQSet(
        courseId: _selectedCourse!.id,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        mcqs: _generatedMCQs,
      );

      setState(() {
        _isSaving = false;
        _generatedMCQs = [];
        _topicController.clear();
      });

      _showSuccessSnackBar('MCQ set saved successfully');

      // Reload saved sets
      _loadSavedMCQSets();
    } catch (e) {
      setState(() => _isSaving = false);
      _showErrorSnackBar('Failed to save MCQ set: ${e.toString().replaceAll('Exception: ', '')}');
    }
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showWarningSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.orange.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async {
          await  _loadCourses();
          if (_selectedCourse != null) {
            await _loadSavedMCQSets();
          }
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildCourseSelector(),
              if (_selectedCourse != null) ...[
                const SizedBox(height: 24),
                _buildGenerationCard(),
                if (_generatedMCQs.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _buildGeneratedMCQsCard(),
                ],
                const SizedBox(height: 32),
                _buildSavedMCQSetsSection(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.1),
            AppColors.primary.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.quiz_outlined,
              color: AppColors.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Generate MCQs',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Create AI-powered multiple choice questions',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseSelector() {
    if (_isLoadingCourses) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    if (_courses.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange.shade700, size: 24),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'No courses assigned yet. Please contact your admin.',
                style: TextStyle(fontSize: 14, color: AppColors.textPrimary),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Course',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.textTertiary.withValues(alpha: 0.3),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<CourseModel>(
              value: _selectedCourse,
              isExpanded: true,
              hint: const Text('Choose a course...'),
              icon: const Icon(Icons.keyboard_arrow_down),
              items: _courses.map((course) {
                return DropdownMenuItem(
                  value: course,
                  child: Text('${course.name} (${course.code})'),
                );
              }).toList(),
              onChanged: (course) {
                setState(() => _selectedCourse = course);
                if (course != null) {
                  _loadSavedMCQSets();
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGenerationCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Generate Questions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 20),
          _buildSourceTypeToggle(),
          const SizedBox(height: 20),
          _buildSourceInput(),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildQuestionCount()),
              const SizedBox(width: 16),
              Expanded(child: _buildDifficultySelector()),
            ],
          ),
          const SizedBox(height: 24),
          _buildGenerateButton(),
        ],
      ),
    );
  }

  Widget _buildSourceTypeToggle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Source Type',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildSourceTypeButton(
                'Topic',
                SourceType.topic,
                Icons.lightbulb_outline,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildSourceTypeButton(
                'Document',
                SourceType.document,
                Icons.description_outlined,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSourceTypeButton(String label, SourceType type, IconData icon) {
    final isSelected = _sourceType == type;
    return InkWell(
      onTap: () => setState(() => _sourceType = type),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : AppColors.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : AppColors.textTertiary.withValues(alpha: 0.3),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSourceInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _sourceType == SourceType.topic ? 'Enter Topic' : 'Document Name',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _topicController,
          decoration: InputDecoration(
            hintText: _sourceType == SourceType.topic
                ? 'e.g., Data Structures and Algorithms'
                : 'Enter the document name from uploaded notes...',
            hintStyle: TextStyle(
              color: AppColors.textSecondary.withValues(alpha: 0.6),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppColors.textTertiary.withValues(alpha: 0.3),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppColors.textTertiary.withValues(alpha: 0.3),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(
                color: AppColors.primary,
                width: 2,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildQuestionCount() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Question Count',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.textTertiary.withValues(alpha: 0.3),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: _numberOfQuestions,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down, size: 20),
              items: [5, 10, 15, 20].map((count) {
                return DropdownMenuItem(
                  value: count,
                  child: Text('$count MCQs'),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _numberOfQuestions = value);
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDifficultySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Difficulty',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.textTertiary.withValues(alpha: 0.3),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _difficulty,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down, size: 20),
              items: ['easy', 'medium', 'hard'].map((diff) {
                return DropdownMenuItem(
                  value: diff,
                  child: Text(diff[0].toUpperCase() + diff.substring(1)),
                );
              }).toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _difficulty = value);
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGenerateButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _isGenerating ? null : _generateMCQs,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.textSecondary.withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: _isGenerating
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
                  SizedBox(width: 12),
                  Text(
                    'Generating...',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ],
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.auto_awesome, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Generate MCQs',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildGeneratedMCQsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Generated MCQs (${_generatedMCQs.length})',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveMCQSet,
                icon: _isSaving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.save_outlined, size: 18),
                label: const Text('Save'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _generatedMCQs.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final mcq = _generatedMCQs[index];
              return _buildMCQCard(mcq, index + 1);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMCQCard(MCQModel mcq, int number) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.textTertiary.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '$number',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  mcq.question,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getDifficultyColor(mcq.difficulty ?? 'medium')
                      .withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  mcq.difficultyDisplay,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: _getDifficultyColor(mcq.difficulty ?? 'medium'),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...List.generate(mcq.options.length, (index) {
            final isCorrect = index == mcq.correctAnswer;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCorrect
                          ? Colors.green.withValues(alpha: 0.1)
                          : Colors.transparent,
                      border: Border.all(
                        color: isCorrect
                            ? Colors.green
                            : AppColors.textSecondary.withValues(alpha: 0.3),
                        width: isCorrect ? 2 : 1,
                      ),
                    ),
                    child: isCorrect
                        ? const Icon(
                            Icons.check,
                            size: 14,
                            color: Colors.green,
                          )
                        : null,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${ String.fromCharCode(65 + index)}. ${mcq.options[index]}',
                      style: TextStyle(
                        fontSize: 13,
                        color: isCorrect
                            ? Colors.green.shade700
                            : AppColors.textPrimary,
                        fontWeight: isCorrect ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          if (mcq.explanation != null && mcq.explanation!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 16, color: Colors.blue.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      mcq.explanation!,
                      style: TextStyle(
                        fontSize: 12,
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
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.green;
      case 'hard':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  Widget _buildSavedMCQSetsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Saved MCQ Sets',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        if (_isLoadingSets)
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          )
        else if (_savedMCQSets.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.quiz,
                    size: 48,
                    color: AppColors.textSecondary.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'No saved MCQ sets yet',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary.withValues(alpha: 0.8),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Generated MCQ sets will appear here',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _savedMCQSets.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final set = _savedMCQSets[index];
              return _buildMCQSetCard(set);
            },
          ),
      ],
    );
  }

  Widget _buildMCQSetCard(MCQSetModel set) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.textTertiary.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      set.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (set.description != null && set.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        set.description!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _buildInfoChip(
                Icons.quiz_outlined,
                '${set.questionCount} MCQs',
                Colors.blue,
              ),
              _buildInfoChip(
                Icons.calendar_today_outlined,
                set.formattedDate,
                Colors.green,
              ),
              if (set.totalAttempts > 0)
                _buildInfoChip(
                  Icons.people_outline,
                  '${set.totalAttempts} attempt${set.totalAttempts != 1 ? 's' : ''}',
                  Colors.purple,
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
