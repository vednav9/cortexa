import 'package:flutter/material.dart';
import '../../../../teacher/presentation/pages/tabs/ai_chatbot_personal_tab.dart';

class RAGChatbotTab extends StatelessWidget {
  const RAGChatbotTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const AIChatbotPersonalTab(studentMode: true);
  }
}
