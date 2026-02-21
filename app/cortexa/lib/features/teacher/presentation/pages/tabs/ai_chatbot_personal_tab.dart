import 'package:flutter/material.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../personal_chat/presentation/widgets/personal_chat_home_widget.dart';

class AIChatbotPersonalTab extends StatefulWidget {
  const AIChatbotPersonalTab({super.key});

  @override
  State<AIChatbotPersonalTab> createState() => _AIChatbotPersonalTabState();
}

class _AIChatbotPersonalTabState extends State<AIChatbotPersonalTab> {
  String _userId = '';
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  void _loadUser() {
    final user = getIt<HiveStorageService>().getCurrentUser();
    setState(() {
      _userId = user?.id ?? '';
      _userName = user?.fullName ?? user?.username ?? 'Teacher';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_userId.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF10B981)),
      );
    }
    return PersonalChatHomeWidget(
      userId: _userId,
      userName: _userName,
      role: 'teacher',
    );
  }
}
