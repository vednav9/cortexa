import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
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
  final Map<String, _TestResult> _completedTests = {};
  String? _institutionId;
  bool _isLoading = true;
  String? _errorMessage;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _repository = StudentMcqRepository();
    _initializeAndLoad();
  }

  Future<void> _initializeAndLoad() async {
    final currentUser = _storage.getCurrentUser();
    _institutionId = currentUser?.institutionId ??
        (_storage.getCurrentInstitution()?['id'] as String?);

    if (_institutionId != null && _institutionId!.isNotEmpty) {
      await _loadMCQSets();
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Institution not found. Please re-login and try again.';
      });
    }
  }

  Future<void> _loadMCQSets() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final sets = await _repository.getAssignedMCQSets(_institutionId!);
      if (mounted) {
        setState(() {
          _mcqSets = sets;
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          if (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout) {
            _errorMessage = 'No internet connection. Please check your network.';
          } else if (e.response?.statusCode == 401) {
            _errorMessage = 'Session expired. Please log in again.';
          } else {
            _errorMessage = 'Failed to load tests. Please try again.';
          }
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Something went wrong. Please try again.';
        });
      }
    }
  }

  List<MCQSetModel> get _filteredSets {
    if (_filterStatus == 'completed') {
      return _mcqSets.where((s) => _completedTests.containsKey(s.id)).toList();
    } else if (_filterStatus == 'available') {
      return _mcqSets.where((s) => !_completedTests.containsKey(s.id)).toList();
    }
    return _mcqSets;
  }

  int get _completedCount => _completedTests.length;
  int get _availableCount =>
      _mcqSets.where((s) => !_completedTests.containsKey(s.id)).length;

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
              else ...[
                _buildStatsRow(),
                const SizedBox(height: 16),
                _buildFilterChips(),
                const SizedBox(height: 16),
                _buildTestsList(),
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

  Widget _buildStatsRow() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = (constraints.maxWidth - 12) / 2;
        return Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    icon: Icons.check_circle_outline,
                    label: 'Available',
                    count: _availableCount,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    icon: Icons.emoji_events_outlined,
                    label: 'Completed',
                    count: _completedCount,
                    color: Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: cardWidth,
              child: _buildStatCard(
                icon: Icons.quiz,
                label: 'Total',
                count: _mcqSets.length,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required int count,
    required Color color,
  }) {
    return Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 5),
                Flexible(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '$count',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      );
  }

  Widget _buildFilterChips() {
    const filters = [
      {'value': 'all', 'label': 'All'},
      {'value': 'available', 'label': 'Available'},
      {'value': 'completed', 'label': 'Completed'},
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((f) {
          final isSelected = _filterStatus == f['value'];
          return Padding(
            padding: const EdgeInsets.only(right: 10),
            child: GestureDetector(
              onTap: () => setState(() => _filterStatus = f['value']!),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.textTertiary.withValues(alpha: 0.25),
                  ),
                ),
                child: Text(
                  f['label']!,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color:
                        isSelected ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTestsList() {
    final sets = _filteredSets;
    if (sets.isEmpty) return _buildEmptyState();
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: sets.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, i) => _buildTestCard(sets[i]),
    );
  }

  Widget _buildTestCard(MCQSetModel mcqSet) {
    final result = _completedTests[mcqSet.id];
    final isCompleted = result != null;
    final difficulty = _overallDifficulty(mcqSet.questions);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCompleted
              ? AppColors.primary.withValues(alpha: 0.25)
              : AppColors.textTertiary.withValues(alpha: 0.18),
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
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
                    isCompleted
                        ? Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.check_circle,
                                    size: 14, color: AppColors.primary),
                                const SizedBox(width: 4),
                                Text(
                                  '${result.score}%',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.blue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'Available',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.blue,
                              ),
                            ),
                          ),
                  ],
                ),
                if (mcqSet.description != null &&
                    mcqSet.description!.isNotEmpty) ...[
                  const SizedBox(height: 8),
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
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _buildInfoChip(
                      icon: Icons.question_answer_outlined,
                      label: '${mcqSet.questionCount} Questions',
                    ),
                    _buildDifficultyChip(difficulty),
                    if (mcqSet.courseName.isNotEmpty)
                      _buildInfoChip(
                        icon: Icons.book_outlined,
                        label: mcqSet.courseName,
                      ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                    color: AppColors.textTertiary.withValues(alpha: 0.15)),
              ),
            ),
            child: SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => _openTest(mcqSet, isCompleted, result),
                style: TextButton.styleFrom(
                  foregroundColor:
                      isCompleted ? AppColors.primary : Colors.white,
                  backgroundColor: isCompleted
                      ? AppColors.primary.withValues(alpha: 0.05)
                      : AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: const RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.vertical(bottom: Radius.circular(16)),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isCompleted
                          ? Icons.visibility_outlined
                          : Icons.play_arrow_rounded,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isCompleted ? 'View Results' : 'Start Test',
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

  Widget _buildInfoChip({required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.textTertiary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(
            label,
            style:
                const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildDifficultyChip(String difficulty) {
    final color = _difficultyColor(difficulty);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        difficulty[0].toUpperCase() + difficulty.substring(1),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final isFiltered = _filterStatus != 'all';
    final label =
        _filterStatus[0].toUpperCase() + _filterStatus.substring(1);
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
            Text(
              isFiltered ? 'No $label Tests' : 'No MCQ Tests Yet',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              isFiltered
                  ? 'You haven\'t ${ _filterStatus == 'completed' ? 'completed' : 'started' } any tests yet.'
                  : 'Your teacher hasn\'t assigned any MCQ tests yet.',
              textAlign: TextAlign.center,
              style: const TextStyle(
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
              style: TextStyle(
                  color: AppColors.textSecondary, fontSize: 14),
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
            child: const Icon(Icons.wifi_off_rounded,
                size: 36, color: AppColors.error),
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
            _errorMessage!,
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
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openTest(
      MCQSetModel mcqSet, bool isCompleted, _TestResult? result) async {
    final testResult = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => TakeMCQTestPage(
          mcqSet: mcqSet,
          isReviewMode: isCompleted,
          previousAnswers: result?.answers,
          previousScore: result?.score,
        ),
      ),
    );

    if (testResult != null && mounted && !isCompleted) {
      setState(() {
        _completedTests[mcqSet.id] = _TestResult(
          score: testResult['score'] as int,
          answers: Map<int, int>.from(testResult['answers'] as Map),
        );
      });
    }
  }

  String _overallDifficulty(List<MCQModel> questions) {
    if (questions.isEmpty) return 'medium';
    final counts = <String, int>{'easy': 0, 'medium': 0, 'hard': 0};
    for (final q in questions) {
      final d = (q.difficulty ?? 'medium').toLowerCase();
      counts[d] = (counts[d] ?? 0) + 1;
    }
    return counts.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
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

class _TestResult {
  final int score;
  final Map<int, int> answers;

  const _TestResult({required this.score, required this.answers});
}
