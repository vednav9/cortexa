import 'package:flutter/material.dart';
import '../../../../institution/presentation/pages/tabs/announcements_tab.dart';

/// Teacher announcements tab - can create and view announcements
/// Teachers can send announcements to students only (not to admin)
class TeacherAnnouncementsTab extends StatelessWidget {
  const TeacherAnnouncementsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const AnnouncementsTab(isReadOnly: false, audience: 'students');
  }
}
