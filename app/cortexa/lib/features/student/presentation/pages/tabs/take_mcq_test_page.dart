import 'dart:async';

import 'package:flutter/material.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../teacher/data/models/mcq_model.dart';
import '../../../data/repositories/student_mcq_repository.dart';

class TakeMCQTestPage extends StatefulWidget {
  final MCQSetModel mcqSet;
  final bool isReviewMode;
  final Map<int, int>? previousAnswers;
  final int? previousScore;

  const TakeMCQTestPage({
    super.key,
    required this.mcqSet,
    this.isReviewMode = false,
    this.previousAnswers,
    this.previousScore,
  });

  @override
  State<TakeMCQTestPage> createState() => _TakeMCQTestPageState();
}

class _TakeMCQTestPageState extends State<TakeMCQTestPage> {
  late final List<MCQModel> _questions;
  final Map<int, int> _selectedAnswers = {};
  int _currentQuestionIndex = 0;
  bool _isTestCompleted = false;
  int? _score;
  bool _isSubmitting = false;
  final _startTime = DateTime.now();
  Timer? _timer;
  int? _timeLeftSeconds;

  @override
  void initState() {
    super.initState();
    _questions = widget.mcqSet.questions;

    if (widget.isReviewMode) {
      _isTestCompleted = true;
      _score = widget.previousScore;
      if (widget.previousAnswers != null) {
        _selectedAnswers.addAll(widget.previousAnswers!);
      }
    } else {
      final durationMinutes = widget.mcqSet.duration > 0
          ? widget.mcqSet.duration
          : 30;
      _timeLeftSeconds = durationMinutes * 60;
      _startTimer();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _isSubmitting || _isTestCompleted) {
        timer.cancel();
        return;
      }

      final remaining = _timeLeftSeconds ?? 0;
      if (remaining <= 1) {
        timer.cancel();
        setState(() => _timeLeftSeconds = 0);
        _submitTest();
        return;
      }

      setState(() => _timeLeftSeconds = remaining - 1);
    });
  }

  String _formatCountdown(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  Widget _buildTimerBadge() {
    final remaining = _timeLeftSeconds ?? 0;
    final isUrgent = remaining <= 60;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isUrgent
            ? AppColors.error.withValues(alpha: 0.12)
            : AppColors.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isUrgent
              ? AppColors.error.withValues(alpha: 0.35)
              : AppColors.primary.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.timer_outlined,
            size: 16,
            color: isUrgent ? AppColors.error : AppColors.primary,
          ),
          const SizedBox(width: 6),
          Text(
            _formatCountdown(remaining),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isUrgent ? AppColors.error : AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  void _selectAnswer(int questionIndex, int answerIndex) {
    if (_isTestCompleted) return;
    setState(() {
      _selectedAnswers[questionIndex] = answerIndex;
    });
  }

  void _nextQuestion() {
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() => _currentQuestionIndex++);
    }
  }

  void _previousQuestion() {
    if (_currentQuestionIndex > 0) {
      setState(() => _currentQuestionIndex--);
    }
  }

  Future<void> _submitTest() async {
    if (_isSubmitting || _isTestCompleted) return;

    _timer?.cancel();

    int correctAnswers = 0;
    for (int i = 0; i < _questions.length; i++) {
      if (_selectedAnswers[i] == _questions[i].correctAnswer) {
        correctAnswers++;
      }
    }
    final score = ((_questions.isEmpty
            ? 0.0
            : correctAnswers / _questions.length) *
        100)
        .round();
    final timeTaken = DateTime.now().difference(_startTime).inSeconds;
    final percentage = _questions.isEmpty
        ? 0.0
        : (correctAnswers / _questions.length) * 100;

    setState(() {
      _score = score;
      _isTestCompleted = true;
      _isSubmitting = true;
    });

    // Submit to backend (fire and forget â€” non-fatal)
    final repo = StudentMcqRepository();
    await repo.submitAttempt(
      mcqSetId: widget.mcqSet.id,
      answers: Map<int, int>.from(_selectedAnswers),
      timeTaken: timeTaken,
      score: score,
      totalQuestions: _questions.length,
      percentage: percentage,
    );

    if (mounted) {
      setState(() => _isSubmitting = false);
      _showResultDialog(correctAnswers, score);
    }
  }

  void _showResultDialog(int correctAnswers, int score) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.celebration, color: AppColors.primary, size: 28),
            SizedBox(width: 12),
            Text(
              'Test Completed!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(
                    '$score%',
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'You got $correctAnswers out of ${_questions.length} correct',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context, {
                'score': score,
                'answers': Map<int, int>.from(_selectedAnswers),
              });
            },
            child: const Text(
              'Exit',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                  horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('View Answers'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_questions.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation: 0,
          leading: IconButton(
            icon:
                const Icon(Icons.arrow_back, color: AppColors.textPrimary),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            widget.mcqSet.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.quiz_outlined,
                    size: 64, color: AppColors.textTertiary),
                SizedBox(height: 16),
                Text(
                  'No questions in this test.',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentQuestion = _questions[_currentQuestionIndex];
    final progress = (_currentQuestionIndex + 1) / _questions.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: _isTestCompleted
            ? IconButton(
                icon: const Icon(Icons.arrow_back,
                    color: AppColors.textPrimary),
                onPressed: () => Navigator.pop(context,
                    widget.isReviewMode
                        ? null
                        : {
                            'score': _score,
                            'answers':
                                Map<int, int>.from(_selectedAnswers),
                          }),
              )
            : IconButton(
                icon: const Icon(Icons.close, color: AppColors.textPrimary),
                onPressed: _confirmExit,
              ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.mcqSet.title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              _isTestCompleted
                  ? 'Score: $_score%'
                  : 'Question ${_currentQuestionIndex + 1} of ${_questions.length}',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
        actions: (_isTestCompleted || _timeLeftSeconds == null)
            ? null
            : [
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Center(child: _buildTimerBadge()),
                ),
              ],
        bottom: _isTestCompleted
            ? null
            : PreferredSize(
                preferredSize: const Size.fromHeight(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor:
                      AppColors.textTertiary.withValues(alpha: 0.2),
                  valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.primary),
                ),
              ),
      ),
      body: _isSubmitting
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(height: 16),
                  Text(
                    'Submitting your answers...',
                    style: TextStyle(
                        color: AppColors.textSecondary, fontSize: 14),
                  ),
                ],
              ),
            )
          : _isTestCompleted
              ? _buildResultsView()
              : _buildQuestionView(currentQuestion),
      bottomNavigationBar:
          (_isTestCompleted || _isSubmitting) ? null : _buildNavigationBar(),
    );
  }

  void _confirmExit() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Exit Test?',
          style: TextStyle(color: AppColors.textPrimary),
        ),
        content: const Text(
          'Your progress will be lost if you exit now.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Exit'),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionView(MCQModel question) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.textTertiary.withValues(alpha: 0.2),
              ),
            ),
            child: Text(
              question.question,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Select your answer:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ...List.generate(question.options.length, (index) {
            final isSelected =
                _selectedAnswers[_currentQuestionIndex] == index;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => _selectAnswer(_currentQuestionIndex, index),
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.primary.withValues(alpha: 0.1)
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : AppColors.textTertiary.withValues(alpha: 0.2),
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : Colors.transparent,
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.textTertiary
                                    .withValues(alpha: 0.3),
                            width: 2,
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: isSelected
                            ? const Icon(Icons.check,
                                size: 16, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          question.options[index],
                          style: TextStyle(
                            fontSize: 15,
                            color: AppColors.textPrimary,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildResultsView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.1),
                  AppColors.primary.withValues(alpha: 0.04),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Icon(Icons.emoji_events,
                    size: 64, color: AppColors.primary),
                const SizedBox(height: 16),
                Text(
                  'Your Score: $_score%',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  (_score ?? 0) >= 70 ? 'Great job! ðŸŽ‰' : 'Keep practicing!',
                  style: const TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          const Text(
            'Review Answers',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _questions.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final question = _questions[index];
              final selectedAnswer = _selectedAnswers[index];
              final correctAnswer = question.correctAnswer;
              final isCorrect = selectedAnswer == correctAnswer;

              return Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isCorrect
                        ? AppColors.primary.withValues(alpha: 0.3)
                        : Colors.red.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: isCorrect
                                ? AppColors.primary.withValues(alpha: 0.1)
                                : Colors.red.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isCorrect
                                    ? Icons.check_circle
                                    : Icons.cancel,
                                size: 16,
                                color:
                                    isCorrect ? AppColors.primary : Colors.red,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                isCorrect ? 'Correct' : 'Wrong',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isCorrect
                                      ? AppColors.primary
                                      : Colors.red,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        Text(
                          'Q${index + 1}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      question.question,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (selectedAnswer != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isCorrect
                              ? AppColors.primary.withValues(alpha: 0.05)
                              : Colors.red.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isCorrect ? Icons.check : Icons.close,
                              size: 18,
                              color: isCorrect ? AppColors.primary : Colors.red,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Your answer: ${question.options[selectedAnswer]}',
                                style: TextStyle(
                                  fontSize: 13,
                                  color:
                                      isCorrect ? AppColors.primary : Colors.red,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.remove_circle_outline,
                                size: 18, color: Colors.orange),
                            SizedBox(width: 8),
                            Text(
                              'Not answered',
                              style: TextStyle(
                                  fontSize: 13, color: Colors.orange),
                            ),
                          ],
                        ),
                      ),
                    if (!isCorrect) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.lightbulb,
                                size: 18, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Correct answer: ${question.options[correctAnswer]}',
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (question.explanation != null &&
                        question.explanation!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.textTertiary.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: AppColors.textTertiary
                                  .withValues(alpha: 0.15)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.info_outline,
                                size: 16, color: AppColors.textTertiary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                question.explanation!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                  height: 1.4,
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
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationBar() {
    final hasPrevious = _currentQuestionIndex > 0;
    final isLastQuestion = _currentQuestionIndex == _questions.length - 1;
    final allAnswered = _selectedAnswers.length == _questions.length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(
              color: AppColors.textTertiary.withValues(alpha: 0.2)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: hasPrevious ? _previousQuestion : null,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.textPrimary,
                side: BorderSide(
                  color: AppColors.textTertiary.withValues(alpha: 0.3),
                ),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.arrow_back, size: 20),
              label: const Text(
                'Previous',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {
                if (isLastQuestion) {
                  if (!allAnswered) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Please answer all questions before submitting.'),
                        backgroundColor: AppColors.textPrimary,
                      ),
                    );
                    return;
                  }
                  _submitTest();
                  return;
                }
                _nextQuestion();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor:
                    AppColors.textTertiary.withValues(alpha: 0.2),
                disabledForegroundColor: AppColors.textSecondary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              icon: Icon(
                isLastQuestion ? Icons.check_circle : Icons.arrow_forward,
                size: 20,
              ),
              label: const Text(
                'Next',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
