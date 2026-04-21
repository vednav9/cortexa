import 'package:flutter/material.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../teacher/data/models/mcq_model.dart';
import '../../../data/repositories/student_mcq_repository.dart';
import 'take_mcq_test_page.dart';

class MCQTestTab extends StatefulWidget {
  const MCQTestTab({super.key});

  @override
  State<MCQTestTab> createState() => _MCQTestTabState();
}

class _MCQTestTabState extends State<MCQTestTab> {
  final _storage = getIt<HiveStorageService>();
  late final StudentMcqRepository _repository;

  List<MCQSetModel> _mcqSets = [];
  String? _institutionId;
  bool _isLoading = true;
  String? _errorMessage;
  String? _startingTestId;

  @override
  void initState() {
    super.initState();
    _repository = StudentMcqRepository();
    _initializeAndLoad();
  }

  Future<void> _initializeAndLoad() async {
    final currentUser = _storage.getCurrentUser();
    final currentInstitution = _storage.getCurrentInstitution();
    final candidateInstitutionId =
        currentUser?.institutionId ??
        currentInstitution?['id']?.toString() ??
        currentInstitution?['_id']?.toString();

    _institutionId = candidateInstitutionId?.trim();

    if (_institutionId != null && _institutionId!.isNotEmpty) {
      await _loadMCQSets();
      return;
    }

    if (!mounted) return;
    setState(() {
      _isLoading = false;
      _errorMessage = 'Institution not found. Please re-login and try again.';
    });
  }

  Future<void> _loadMCQSets() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final sets = await _repository.getAssignedMCQSets(_institutionId!);
      if (!mounted) return;
      setState(() {
        _mcqSets = sets;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load tests. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _loadMCQSets,
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 20),
              if (_isLoading)
                _buildLoadingState()
              else if (_errorMessage != null)
                _buildErrorState()
              else
                _buildTestsList(),
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
            AppColors.primary.withValues(alpha: 0.04),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
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
                  'MCQ Tests',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    letterSpacing: 0.3,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Take assigned quizzes and track your progress',
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

  Widget _buildTestsList() {
    if (_mcqSets.isEmpty) return _buildEmptyState();

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _mcqSets.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, index) => _buildTestCard(_mcqSets[index]),
    );
  }

  Widget _buildTestCard(MCQSetModel mcqSet) {
    final isCompleted = mcqSet.hasAttempted;
    final isStarting = _startingTestId == mcqSet.id;
    final difficulty = _overallDifficulty(mcqSet.questions);
    final difficultyColor = _difficultyColor(difficulty);

    String completedText = 'Completed';
    if (mcqSet.attemptScore != null) {
      final score = mcqSet.attemptScore!;
      final scoreText = score == score.roundToDouble()
          ? score.toStringAsFixed(0)
          : score.toStringAsFixed(1);
      completedText = 'Completed - $scoreText%';
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.textTertiary.withValues(alpha: 0.18),
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        mcqSet.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: difficultyColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        difficulty[0].toUpperCase() + difficulty.substring(1),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: difficultyColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  mcqSet.courseName.isNotEmpty ? mcqSet.courseName : 'General',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (mcqSet.description != null &&
                    mcqSet.description!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    mcqSet.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetaItem(
                        icon: Icons.schedule,
                        label: '${mcqSet.duration} mins',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetaItem(
                        icon: Icons.quiz_outlined,
                        label: '${mcqSet.questionCount} questions',
                      ),
                    ),
                  ],
                ),
                if (isCompleted) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.25),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.check_circle,
                          size: 16,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          completedText,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: AppColors.textTertiary.withValues(alpha: 0.15),
                ),
              ),
            ),
            child: SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: isCompleted || isStarting
                    ? null
                    : () => _openTest(mcqSet),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  backgroundColor: isCompleted
                      ? AppColors.textTertiary.withValues(alpha: 0.35)
                      : AppColors.primary,
                  disabledForegroundColor: AppColors.textSecondary,
                  disabledBackgroundColor: AppColors.textTertiary.withValues(
                    alpha: 0.35,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(16),
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (isStarting)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    else
                      Icon(
                        isCompleted
                            ? Icons.check_circle_outline
                            : Icons.play_arrow_rounded,
                        size: 18,
                      ),
                    const SizedBox(width: 8),
                    Text(
                      isCompleted
                          ? 'Already Attempted'
                          : (isStarting ? 'Starting...' : 'Start Test'),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaItem({required IconData icon, required String label}) {
    return Row(
      children: [
        Icon(icon, size: 15, color: AppColors.textSecondary),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.quiz_outlined,
                size: 40,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'No Tests Available',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Check back later for new tests from your teachers.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.6,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 80),
      child: Center(
        child: Column(
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 16),
            Text(
              'Loading tests...',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.wifi_off_rounded,
              size: 36,
              color: AppColors.error,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Unable to Load Tests',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage ?? 'Something went wrong. Please try again.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _initializeAndLoad,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Try Again'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openTest(MCQSetModel mcqSet) async {
    if (mcqSet.hasAttempted) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You have already attempted this test.'),
          backgroundColor: AppColors.textPrimary,
        ),
      );
      return;
    }

    setState(() => _startingTestId = mcqSet.id);

    try {
      // Match web flow: verify and fetch latest test details before starting.
      final details = await _repository.getMCQSetDetails(mcqSet.id);

      // Keep full question payload when already available in assigned list data.
      final questions = mcqSet.questions.isNotEmpty
          ? mcqSet.questions
          : details.questions;

      final launchSet = MCQSetModel(
        id: details.id,
        title: details.title,
        description: details.description,
        courseId: details.courseId,
        courseName: details.courseName,
        createdById: details.createdById,
        createdByName: details.createdByName,
        questions: questions,
        createdAt: details.createdAt,
        dueDate: details.dueDate,
        duration: details.duration,
        isAssigned: details.isAssigned,
        hasAttempted: details.hasAttempted,
        attemptScore: details.attemptScore,
        attemptId: details.attemptId,
        totalAttempts: details.totalAttempts,
        averageScore: details.averageScore,
      );

      final testResult = await Navigator.push<Map<String, dynamic>>(
        context,
        MaterialPageRoute(
          builder: (context) => TakeMCQTestPage(mcqSet: launchSet),
        ),
      );

      if (testResult != null && mounted) {
        await _loadMCQSets();
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to start test: $e'),
          backgroundColor: AppColors.error,
        ),
      );
      await _loadMCQSets();
    } finally {
      if (mounted) {
        setState(() => _startingTestId = null);
      }
    }
  }

  String _overallDifficulty(List<MCQModel> questions) {
    if (questions.isEmpty) return 'medium';

    final counts = <String, int>{'easy': 0, 'medium': 0, 'hard': 0};
    for (final question in questions) {
      final value = (question.difficulty ?? 'medium').toLowerCase();
      counts[value] = (counts[value] ?? 0) + 1;
    }

    String best = 'medium';
    var bestCount = -1;
    for (final entry in counts.entries) {
      if (entry.value > bestCount) {
        best = entry.key;
        bestCount = entry.value;
      }
    }

    return best;
  }

  Color _difficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return const Color(0xFF22C55E);
      case 'medium':
        return Colors.orange;
      case 'hard':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }
}
