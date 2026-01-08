import 'package:flutter/material.dart';
import '../../../../institution/presentation/pages/tabs/announcements_tab.dart';

/// Student announcements tab - read-only view
/// Students can view announcements but cannot create them
class StudentAnnouncementsTab extends StatelessWidget {
  const StudentAnnouncementsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const AnnouncementsTab(isReadOnly: true);
  }
}
