import 'package:flutter/material.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../../rag_assistant/presentation/widgets/rag_chat_widget.dart';

class StudentQASectionTab extends StatefulWidget {
  const StudentQASectionTab({super.key});

  @override
  State<StudentQASectionTab> createState() => _StudentQASectionTabState();
}

class _StudentQASectionTabState extends State<StudentQASectionTab> {
  String _institutionId = '';

  @override
  void initState() {
    super.initState();
    final storage = getIt<HiveStorageService>();
    final user = storage.getCurrentUser();
    _institutionId = user?.institutionId ?? '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: RagChatWidget(
              institutionId: _institutionId,
              useHybridMode: true,
              welcomeMessage:
                  'Hi! I am your AI Study Assistant.\n\n'
                  'Ask me anything about your courses - I can search your course documents '
                  'and the web to give you the best answer.\n\n'
                  'Try asking:\n'
                  ' What is the difference between supervised and unsupervised learning?\n'
                  ' Explain MapReduce with an example\n'
                  ' Summarize key concepts in Big Data Analytics',
              placeholderText: 'Ask a question about your courses...',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.1),
            AppColors.primary.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
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
              Icons.forum_outlined,
              color: AppColors.primary,
              size: 26,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Q&A Assistant',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Ask AI questions about your courses',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.auto_awesome, color: Colors.green, size: 13),
                SizedBox(width: 4),
                Text(
                  'RAG + Web',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}