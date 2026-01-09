import 'package:flutter/material.dart';
import '../../../../../../core/constants/app_colors.dart';
import 'take_mcq_test_page.dart';

class MCQTestTab extends StatefulWidget {
  const MCQTestTab({super.key});

  @override
  State<MCQTestTab> createState() => _MCQTestTabState();
}

class _MCQTestTabState extends State<MCQTestTab> {
  final List<Map<String, dynamic>> _tests = [];

  @override
  void initState() {
    super.initState();
    _loadTests();
  }

  Future<void> _loadTests() async {
    // Mock test data
    setState(() {
      _tests.addAll([
        {
          'id': '1',
          'title': 'Machine Learning Basics',
          'questions': 15,
          'duration': 30,
          'difficulty': 'Medium',
          'status': 'available',
        },
        {
          'id': '2',
          'title': 'Data Structures Quiz',
          'questions': 20,
          'duration': 45,
          'difficulty': 'Hard',
          'status': 'available',
        },
        {
          'id': '3',
          'title': 'Algorithm Analysis',
          'questions': 10,
          'duration': 20,
          'difficulty': 'Easy',
          'status': 'completed',
          'score': 85,
        },
      ]);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildTestsList(),
          ],
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
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
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
                  'MCQ Tests',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Take quizzes and track your progress',
                  style: TextStyle(
                    fontSize: 14,
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
    if (_tests.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(40),
          child: Text(
            'No tests available',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _tests.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final test = _tests[index];
        final isCompleted = test['status'] == 'completed';

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
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
                    child: Text(
                      test['title'],
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: _getDifficultyColor(test['difficulty']).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      test['difficulty'],
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _getDifficultyColor(test['difficulty']),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.question_answer_outlined,
                        size: 15,
                        color: AppColors.textSecondary.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${test['questions']} Questions',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                  // Row(
                  //   mainAxisSize: MainAxisSize.min,
                  //   children: [
                  //     Icon(
                  //       Icons.timer_outlined,
                  //       size: 15,
                  //       color: AppColors.textSecondary.withValues(alpha: 0.7),
                  //     ),
                  //     const SizedBox(width: 6),
                  //     Text(
                  //       '${test['duration']} mins',
                  //       style: TextStyle(
                  //         fontSize: 13,
                  //         color: AppColors.textSecondary.withValues(alpha: 0.7),
                  //       ),
                  //     ),
                  //   ],
                  // ),
                  if (isCompleted)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.check_circle,
                          size: 15,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Score: ${test['score']}%',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    if (isCompleted) {
                      // Navigate to view results
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TakeMCQTestPage(
                            test: test,
                            isReviewMode: true,
                          ),
                        ),
                      );
                    } else {
                      // Start new test
                      final score = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TakeMCQTestPage(test: test),
                        ),
                      );

                      // Update test status if score is returned
                      if (score != null && mounted) {
                        setState(() {
                          test['status'] = 'completed';
                          test['score'] = score;
                        });
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isCompleted 
                        ? AppColors.primary.withValues(alpha: 0.1)
                        : AppColors.primary,
                    foregroundColor: isCompleted 
                        ? AppColors.primary
                        : Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    isCompleted ? 'View Results' : 'Start Test',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'hard':
        return Colors.red;
      default:
        return AppColors.primary;
    }
  }
}
