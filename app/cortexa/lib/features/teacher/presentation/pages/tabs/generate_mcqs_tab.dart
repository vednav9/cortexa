import 'package:flutter/material.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/network/api_client.dart';
import '../../../../../../core/config/api_config.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../data/models/course_model.dart';
import '../../../data/models/document_model.dart';
import '../../../data/models/mcq_model.dart';
import '../../../data/repositories/mcq_repository.dart';

enum SourceType { topic, document }

class GenerateMCQsTab extends StatefulWidget {
  const GenerateMCQsTab({super.key});

  @override
  State<GenerateMCQsTab> createState() => _GenerateMCQsTabState();
}

class _GenerateMCQsTabState extends State<GenerateMCQsTab> {
  // Dependencies
  final _apiClient = getIt<ApiClient>();
  late final MCQRepository _mcqRepository;

  // Controllers
  final _sourceInputController = TextEditingController();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  // State: Courses
  List<CourseModel> _courses = [];
  CourseModel? _selectedCourse;
  bool _isLoadingCourses = false;

  // State: Documents
  List<DocumentModel> _documents = [];
  DocumentModel? _selectedDocument;
  bool _isLoadingDocuments = false;

  // State: MCQ Generation
  SourceType _sourceType = SourceType.topic;
  int _numberOfQuestions = 5;
  String _difficulty = 'medium';
  bool _isGenerating = false;
  List<MCQModel> _generatedMCQs = [];
  String? _generationError;

  // State: Saving
  bool _isSaving = false;

  // State: Saved MCQ Sets
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
    _sourceInputController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  // ─────────────────────────────────────────── Course Loading ───────────────────────────────────────────
  
  Future<void> _loadCourses() async {
    setState(() => _isLoadingCourses = true);

    try {
      final response = await _apiClient.get(
        ApiConfig.teacherAuthorizedCourses,
        requiresAuth: true,
      );

      if (!mounted) return;

      if (response['success'] == true && response['courses'] is List) {
        final coursesList = (response['courses'] as List)
            .map((json) => CourseModel.fromJson(json as Map<String, dynamic>))
            .toList();

        setState(() {
          _courses = coursesList;
          _isLoadingCourses = false;
        });

        if (coursesList.isEmpty) {
          _showWarningToast('No courses assigned. Please contact your administrator.');
        }
      } else {
        throw Exception(response['message'] ?? 'Failed to load courses');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoadingCourses = false);
      _showErrorToast('Failed to load courses: ${e.toString()}');
    }
  }

  Future<void> _loadSavedMCQSets() async {
    if (_selectedCourse == null) return;

    setState(() => _isLoadingSets = true);

    try {
      final sets = await _mcqRepository.getMCQSets(courseId: _selectedCourse!.id);
      if (mounted) {
        setState(() {
          _savedMCQSets = sets;
          _isLoadingSets = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoadingSets = false);
      _showErrorToast('Failed to load MCQ sets');
    }
  }

  Future<void> _loadDocumentsForCourse() async {
    if (_selectedCourse == null) return;

    setState(() {
      _isLoadingDocuments = true;
      _documents = [];
      _selectedDocument = null;
    });

    try {
      final response = await _apiClient.get(
        '${ApiConfig.teacherGetDocuments}/${_selectedCourse!.id}',
        requiresAuth: true,
      );

      if (!mounted) return;

      if (response['success'] == true && response['documents'] is List) {
        final docs = (response['documents'] as List)
            .map((json) => DocumentModel.fromJson(json as Map<String, dynamic>))
            .where((d) => d.isProcessed)
            .toList();

        setState(() {
          _documents = docs;
          _isLoadingDocuments = false;
        });
      } else {
        setState(() {
          _isLoadingDocuments = false;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingDocuments = false;
      });
    }
  }

  // ─────────────────────────────────────────── MCQ Generation ───────────────────────────────────────────

  Future<void> _generateMCQs() async {
    // Validation
    if (_selectedCourse == null) {
      _showErrorToast('Please select a course');
      return;
    }

    final sourceValue = _sourceType == SourceType.topic
        ? _sourceInputController.text.trim()
        : (_selectedDocument?.originalName ?? '');

    if (sourceValue.isEmpty) {
      _showErrorToast(_sourceType == SourceType.topic
          ? 'Please enter a topic'
          : 'Please select a document');
      return;
    }

    setState(() {
      _isGenerating = true;
      _generationError = null;
      _generatedMCQs = [];
    });

    try {
      final mcqs = await _mcqRepository.generateMCQs(
        courseId: _selectedCourse!.id,
        topic: sourceValue,
        sourceType: _sourceType == SourceType.topic ? 'topic' : 'document',
        count: _numberOfQuestions,
        difficulty: _difficulty,
        documentId: _sourceType == SourceType.document ? _selectedDocument?.id : null,
      );

      if (!mounted) return;

      if (mcqs.isEmpty) {
        setState(() {
          _isGenerating = false;
          _generationError = 'AI returned no MCQs. Try a different topic or broader search.';
        });
        _showWarningToast(_generationError!);
      } else {
        setState(() {
          _generatedMCQs = mcqs;
          _isGenerating = false;
        });
        _showSuccessToast('Generated ${mcqs.length} MCQ${mcqs.length != 1 ? 's' : ''}');
      }
    } catch (e) {
      if (!mounted) return;
      final errorMsg = _cleanErrorMessage(e.toString());
      setState(() {
        _isGenerating = false;
        _generationError = errorMsg;
      });
      _showErrorToast(errorMsg.isEmpty
          ? 'Generation failed within 40 seconds. Try a shorter topic or fewer questions.'
          : errorMsg);
    }
  }

  // ─────────────────────────────────────────── MCQ Saving ───────────────────────────────────────────

  Future<void> _saveMCQSet() async {
    if (_generatedMCQs.isEmpty) {
      _showErrorToast('No MCQs to save');
      return;
    }

    if (_selectedCourse == null) {
      _showErrorToast('Course selection lost. Please select again.');
      return;
    }

    await _showSaveDialog();
  }

  Future<void> _showSaveDialog() async {
    _titleController.clear();
    _descriptionController.clear();

    final shouldSave = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Save MCQ Set', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Saving ${_generatedMCQs.length} MCQ${_generatedMCQs.length != 1 ? 's' : ''}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _titleController,
                decoration: InputDecoration(
                  labelText: 'Title *',
                  hintText: 'e.g., Data Structures Quiz 1',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.title),
                ),
                maxLength: 100,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _descriptionController,
                decoration: InputDecoration(
                  labelText: 'Description (optional)',
                  hintText: 'Add notes about this MCQ set...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.description),
                  alignLabelWithHint: true,
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
          ElevatedButton.icon(
            onPressed: () {
              if (_titleController.text.trim().isEmpty) {
                _showWarningToast('Please enter a title');
                return;
              }
              Navigator.pop(context, true);
            },
            icon: const Icon(Icons.check),
            label: const Text('Save'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    ) ?? false;

    if (shouldSave) {
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

      if (!mounted) return;

      setState(() {
        _isSaving = false;
        _generatedMCQs = [];
        if (_sourceType == SourceType.topic) {
          _sourceInputController.clear();
        } else {
          _selectedDocument = null;
        }
      });

      _showSuccessToast('MCQ set saved successfully');
      await _loadSavedMCQSets();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      _showErrorToast('Failed to save: ${_cleanErrorMessage(e.toString())}');
    }
  }

  // ─────────────────────────────────────────── UI Helpers ───────────────────────────────────────────

  void _showErrorToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(message, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
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

  void _showSuccessToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(message, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
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

  void _showWarningToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(message, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
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

  String _cleanErrorMessage(String error) {
    return error
        .replaceAll('Exception: ', '')
        .replaceAll('Error: ', '')
        .replaceAll(RegExp(r'.*?:\s*'), '')
        .split('\n')
        .first
        .trim();
  }

  // ─────────────────────────────────────────── Build ───────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async {
          await _loadCourses();
          if (_selectedCourse != null) {
            await _loadSavedMCQSets();
            if (_sourceType == SourceType.document) {
              await _loadDocumentsForCourse();
            }
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
                _buildGenerationPanel(),
                if (_generatedMCQs.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _buildGeneratedMCQsPanel(),
                ],
                const SizedBox(height: 32),
                _buildSavedSetsSection(),
              ],
              const SizedBox(height: 24),
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
            AppColors.primary.withValues(alpha: 0.15),
            AppColors.primary.withValues(alpha: 0.08),
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
            child: const Icon(Icons.quiz_outlined, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI MCQ Generator',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                SizedBox(height: 4),
                Text(
                  'Generate intelligent multiple-choice questions',
                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
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
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
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
              child: Text('No courses assigned. Contact your admin.', style: TextStyle(fontSize: 14)),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Course', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.textTertiary.withValues(alpha: 0.3)),
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
                setState(() {
                  _selectedCourse = course;
                  _documents = [];
                  _selectedDocument = null;
                });
                if (course != null) {
                  _loadSavedMCQSets();
                  if (_sourceType == SourceType.document) {
                    _loadDocumentsForCourse();
                  }
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGenerationPanel() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Generate Questions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 20),
          _buildSourceTypeToggle(),
          const SizedBox(height: 20),
          _buildSourceInput(),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildQuestionCountDropdown()),
              const SizedBox(width: 16),
              Expanded(child: _buildDifficultyDropdown()),
            ],
          ),
          const SizedBox(height: 24),
          _buildGenerateButton(),
          if (_generationError != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.red.shade200)),
              child: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.red.shade700, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_generationError!, style: TextStyle(fontSize: 12, color: Colors.red.shade700))),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSourceTypeToggle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Source Type', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildSourceTypeButton('Topic', SourceType.topic, Icons.lightbulb_outline)),
            const SizedBox(width: 12),
            Expanded(child: _buildSourceTypeButton('Document', SourceType.document, Icons.description_outlined)),
          ],
        ),
      ],
    );
  }

  Widget _buildSourceTypeButton(String label, SourceType type, IconData icon) {
    final isSelected = _sourceType == type;
    return InkWell(
      onTap: () {
        setState(() {
          _sourceType = type;
          if (type == SourceType.topic) {
            _selectedDocument = null;
          }
        });

        if (type == SourceType.document && _selectedCourse != null) {
          _loadDocumentsForCourse();
        }
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.textTertiary.withValues(alpha: 0.3),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: isSelected ? AppColors.primary : AppColors.textSecondary, size: 20),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isSelected ? AppColors.primary : AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildSourceInput() {
    if (_sourceType == SourceType.document) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Document', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          if (_isLoadingDocuments)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.textTertiary.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                  SizedBox(width: 12),
                  Text('Loading uploaded documents...'),
                ],
              ),
            )
          else if (_documents.isEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.shade300),
              ),
              child: const Text(
                'No processed documents found for this course. Upload and process notes first.',
                style: TextStyle(fontSize: 13),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.textTertiary.withValues(alpha: 0.3)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<DocumentModel>(
                  value: _selectedDocument,
                  isExpanded: true,
                  hint: const Text('Choose uploaded document...'),
                  icon: const Icon(Icons.keyboard_arrow_down),
                  items: _documents.map((doc) {
                    return DropdownMenuItem<DocumentModel>(
                      value: doc,
                      child: Text(doc.originalName),
                    );
                  }).toList(),
                  onChanged: (doc) {
                    setState(() => _selectedDocument = doc);
                  },
                ),
              ),
            ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Enter Topic', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        TextField(
          controller: _sourceInputController,
          decoration: InputDecoration(
            hintText: 'e.g., Python Basics, DBMS Joins, OOP in Java',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          maxLines: 1,
        ),
      ],
    );
  }

  Widget _buildQuestionCountDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Questions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.textTertiary.withValues(alpha: 0.3))),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<int>(
              value: _numberOfQuestions,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down, size: 20),
              items: [5, 10].map((count) => DropdownMenuItem(value: count, child: Text('$count MCQs'))).toList(),
              onChanged: (value) {
                if (value != null) setState(() => _numberOfQuestions = value);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDifficultyDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Difficulty', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.textTertiary.withValues(alpha: 0.3))),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _difficulty,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down, size: 20),
              items: ['easy', 'medium', 'hard'].map((diff) => DropdownMenuItem(value: diff, child: Text(diff[0].toUpperCase() + diff.substring(1)))).toList(),
              onChanged: (value) {
                if (value != null) setState(() => _difficulty = value);
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
      child: ElevatedButton.icon(
        onPressed: _isGenerating ? null : _generateMCQs,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          disabledBackgroundColor: AppColors.textSecondary.withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        icon: _isGenerating ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white))) : const Icon(Icons.auto_awesome),
        label: Text(_isGenerating ? 'Generating...' : 'Generate MCQs', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildGeneratedMCQsPanel() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Generated MCQs (${_generatedMCQs.length})', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveMCQSet,
                icon: _isSaving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white))) : const Icon(Icons.save_outlined, size: 18),
                label: const Text('Save'),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade600, foregroundColor: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _generatedMCQs.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, index) => _buildMCQCard(_generatedMCQs[index], index + 1),
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
        border: Border.all(color: AppColors.textTertiary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Center(child: Text('$number', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary))),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(mcq.question, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getDifficultyColor(mcq.difficulty ?? 'medium').withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  mcq.difficultyDisplay,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _getDifficultyColor(mcq.difficulty ?? 'medium')),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Options
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
                      color: isCorrect ? Colors.green.withValues(alpha: 0.1) : Colors.transparent,
                      border: Border.all(
                        color: isCorrect ? Colors.green : AppColors.textSecondary.withValues(alpha: 0.3),
                        width: isCorrect ? 2 : 1,
                      ),
                    ),
                    child: isCorrect ? const Icon(Icons.check, size: 14, color: Colors.green) : null,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${String.fromCharCode(65 + index)}. ${mcq.options[index]}',
                      style: TextStyle(
                        fontSize: 13,
                        color: isCorrect ? Colors.green.shade700 : AppColors.textPrimary,
                        fontWeight: isCorrect ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
          // Explanation
          if (mcq.explanation != null && mcq.explanation!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.blue.shade50.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(8)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, size: 16, color: Colors.blue.shade700),
                  const SizedBox(width: 8),
                  Expanded(child: Text(mcq.explanation!, style: TextStyle(fontSize: 12, color: Colors.blue.shade900))),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSavedSetsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Saved MCQ Sets', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        const SizedBox(height: 12),
        if (_isLoadingSets)
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
            child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (_savedMCQSets.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
            child: Center(
              child: Column(
                children: [
                  Icon(Icons.quiz, size: 48, color: AppColors.textSecondary.withValues(alpha: 0.4)),
                  const SizedBox(height: 12),
                  Text('No saved MCQ sets yet', style: TextStyle(fontSize: 14, color: AppColors.textSecondary.withValues(alpha: 0.8), fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _savedMCQSets.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, index) => _buildMCQSetCard(_savedMCQSets[index]),
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
        border: Border.all(color: AppColors.textTertiary.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(set.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary), maxLines: 2),
                    const SizedBox(height: 4),
                    Text('${set.questionCount} questions', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: () {
                  // TODO: Assign MCQ action
                },
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                child: const Text('Assign', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
          if (set.description != null && set.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(set.description!, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary), maxLines: 2, overflow: TextOverflow.ellipsis),
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
}
