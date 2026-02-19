import 'package:flutter/material.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../../rag_assistant/presentation/widgets/rag_chat_widget.dart';

class StudentAIChatbotTab extends StatefulWidget {
  const StudentAIChatbotTab({super.key});

  @override
  State<StudentAIChatbotTab> createState() => _StudentAIChatbotTabState();
}

class _StudentAIChatbotTabState extends State<StudentAIChatbotTab> {
  String _institutionId = '';

  @override
  void initState() {
    super.initState();
    _loadInstitutionId();
  }

  void _loadInstitutionId() {
    final storage = getIt<HiveStorageService>();
    final currentInstitution = storage.getCurrentInstitution();
    setState(() {
      _institutionId = currentInstitution?['_id'] ?? currentInstitution?['id'] ?? '';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_institutionId.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return RagChatWidget(
      institutionId: _institutionId,
      useHybridMode: true,
      welcomeMessage: 'Hello! I\'m your Personal AI Assistant. How can I help you with your studies today?',
      placeholderText: 'Ask me anything...',
    );
  }
}
