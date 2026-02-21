import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/bloc/terminology/terminology_bloc.dart';
import '../../../../core/bloc/terminology/terminology_event.dart';
import '../../../dashboard/data/models/institution_display_model.dart';
import '../../../dashboard/presentation/pages/query_desk_page.dart';
import '../../../institution/presentation/pages/tabs/institution_dashboard_tab.dart';
import 'tabs/teacher_announcements_tab.dart';
import 'tabs/see_students_tab.dart';
import 'tabs/teacher_qa_portal_tab.dart';
import 'tabs/teacher_assessment_tab.dart';
import 'tabs/ai_chatbot_personal_tab.dart';
import 'tabs/generate_mcqs_tab.dart';
import 'tabs/upload_notes_tab.dart';
import 'tabs/voice_to_text_tab.dart';

enum TeacherTab {
  dashboard,
  announcements,
  seeStudents,
  uploadNotes,
  generateMCQs,
  voiceToText,
  qaPortal,
  assessment,
  aiChatbot,
  queryDesk,
}

class TeacherDashboardPage extends StatefulWidget {
  final InstitutionDisplayModel institution;

  const TeacherDashboardPage({
    super.key,
    required this.institution,
  });

  @override
  State<TeacherDashboardPage> createState() => _TeacherDashboardPageState();
}

class _TeacherDashboardPageState extends State<TeacherDashboardPage> {
  TeacherTab _currentTab = TeacherTab.dashboard;

  @override
  void initState() {
    super.initState();
    // Load terminology to ensure correct institution type is displayed
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TerminologyBloc>().add(LoadInstitutionType());
    });
  }

  @override
  Widget build(BuildContext context) {
    final storage = getIt<HiveStorageService>();
    final currentUser = storage.getCurrentUser();
    final userName = currentUser?.fullName ?? currentUser?.username ?? 'Teacher';
    final userEmail = currentUser?.email ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: AppColors.primary),
            onPressed: () => Scaffold.of(context).openDrawer(),
            padding: EdgeInsets.zero,
            visualDensity: VisualDensity.compact,
          ),
        ),
        title: Text(
          userName,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        titleSpacing: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined,
                color: AppColors.primary),
            onPressed: () {
              setState(() => _currentTab = TeacherTab.announcements);
            },
            tooltip: 'Notifications',
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: _buildDrawer(userName, userEmail),
      body: _buildMainContent(),
    );
  }

  Widget _buildDrawer(String userName, String userEmail) {
    return Drawer(
      backgroundColor: AppColors.surface,
      child: SafeArea(
        child: Column(
          children: [
            // User profile section
            InkWell(
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Profile page coming soon'),
                    backgroundColor: AppColors.primary,
                  ),
                );
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.2),
                      AppColors.primary.withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                      child: Text(
                        userName.isNotEmpty
                            ? userName.substring(0, 1).toUpperCase()
                            : 'T',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 28,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            userEmail,
                            style: TextStyle(
                              color: AppColors.textSecondary.withValues(alpha: 0.8),
                              fontSize: 13,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.arrow_forward_ios,
                      size: 16,
                      color: AppColors.textSecondary.withValues(alpha: 0.6),
                    ),
                  ],
                ),
              ),
            ),
            Divider(
              height: 1,
              thickness: 1,
              color: AppColors.borderDark.withValues(alpha: 0.3),
            ),

            // Navigation items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _buildDrawerItem(
                    icon: Icons.home_outlined,
                    title: 'Institution Dashboard',
                    tab: TeacherTab.dashboard,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.campaign_outlined,
                    title: 'Announcements',
                    tab: TeacherTab.announcements,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.people_outline,
                    title: 'See Students',
                    tab: TeacherTab.seeStudents,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.upload_file_outlined,
                    title: 'Upload Notes',
                    tab: TeacherTab.uploadNotes,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.quiz_outlined,
                    title: 'Generate MCQs (AI)',
                    tab: TeacherTab.generateMCQs,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.mic_outlined,
                    title: 'Voice to Text',
                    tab: TeacherTab.voiceToText,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.question_answer_outlined,
                    title: 'Q&A Portal',
                    tab: TeacherTab.qaPortal,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.assignment_outlined,
                    title: 'Assessment',
                    tab: TeacherTab.assessment,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.smart_toy_outlined,
                    title: 'AI Chatbot Personal',
                    tab: TeacherTab.aiChatbot,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.help_outline,
                    title: 'Query Desk',
                    tab: TeacherTab.queryDesk,
                    context: context,
                  ),
                ],
              ),
            ),

            // Back to Cortexa button
            Padding(
              padding: const EdgeInsets.all(16),
              child: InkWell(
                onTap: () {
                  Navigator.pop(context); // Close drawer
                  Navigator.pop(context); // Go back to Cortexa dashboard
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.primary,
                      width: 2,
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.arrow_back,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Back to Cortexa',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required TeacherTab tab,
    required BuildContext context,
  }) {
    final isSelected = _currentTab == tab;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isSelected
            ? AppColors.primary.withValues(alpha: 0.15)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: isSelected
            ? Border.all(
                color: AppColors.primary.withValues(alpha: 0.3),
                width: 1,
              )
            : null,
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected ? AppColors.primary : AppColors.textSecondary,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? AppColors.primary : AppColors.textPrimary,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        onTap: () {
          Navigator.pop(context);
          if (!isSelected) {
            setState(() => _currentTab = tab);
          }
        },
      ),
    );
  }

  Widget _buildMainContent() {
    switch (_currentTab) {
      case TeacherTab.dashboard:
        return InstitutionDashboardTab(institution: widget.institution);
      case TeacherTab.announcements:
        return const TeacherAnnouncementsTab();
      case TeacherTab.seeStudents:
        return const SeeStudentsTab();
      case TeacherTab.uploadNotes:
        return const UploadNotesTab();
      case TeacherTab.generateMCQs:
        return const GenerateMCQsTab();
      case TeacherTab.voiceToText:
        return const VoiceToTextTab();
      case TeacherTab.qaPortal:
        return const TeacherQAPortalTab();
      case TeacherTab.assessment:
        return const TeacherAssessmentTab();
      case TeacherTab.aiChatbot:
        return const AIChatbotPersonalTab();
      case TeacherTab.queryDesk:
        return const QueryDeskPage();
    }
  }
}
