import 'package:flutter/material.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../../rag_assistant/presentation/widgets/rag_chat_widget.dart';

class RAGChatbotTab extends StatefulWidget {
  const RAGChatbotTab({super.key});

  @override
  State<RAGChatbotTab> createState() => _RAGChatbotTabState();
}

class _RAGChatbotTabState extends State<RAGChatbotTab> {
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
      welcomeMessage: 'Hello! I\'m your AI Assistant powered by RAG + Web. Ask me anything about your course materials!',
      placeholderText: 'Ask me about your courses...',
    );
  }
}
