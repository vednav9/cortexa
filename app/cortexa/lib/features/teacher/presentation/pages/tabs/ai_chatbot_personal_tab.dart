import 'package:flutter/material.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../../rag_assistant/presentation/widgets/rag_chat_widget.dart';

class AIChatbotPersonalTab extends StatefulWidget {
  const AIChatbotPersonalTab({super.key});

  @override
  State<AIChatbotPersonalTab> createState() => _AIChatbotPersonalTabState();
}

class _AIChatbotPersonalTabState extends State<AIChatbotPersonalTab> {
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
      welcomeMessage: 'Hello! I\'m your AI assistant. I can help you with teaching resources, course content, and general topics from your uploaded materials. How can I assist you today?',
      placeholderText: 'Ask me anything about your courses...',
    );
  }
}
