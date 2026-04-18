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
import '../../../institution/presentation/pages/tabs/academic_structure_tab.dart';
import 'tabs/student_announcements_tab.dart';
import 'tabs/mcq_test_tab.dart';
import 'tabs/rag_chatbot_tab.dart';
import 'tabs/student_qa_section_tab.dart';

enum StudentTab {
  dashboard,
  announcements,
  mcqTest,
  ragChatbot,
  qaSection,
  academicStructure,
  queryDesk,
}

class StudentDashboardPage extends StatefulWidget {
  final InstitutionDisplayModel institution;

  const StudentDashboardPage({
    super.key,
    required this.institution,
  });

  @override
  State<StudentDashboardPage> createState() => _StudentDashboardPageState();
}

class _StudentDashboardPageState extends State<StudentDashboardPage> {
  StudentTab _currentTab = StudentTab.dashboard;

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
    final userName = currentUser?.fullName ?? currentUser?.username ?? 'Student';
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
              setState(() => _currentTab = StudentTab.announcements);
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
                            : 'S',
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
                    tab: StudentTab.dashboard,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.campaign_outlined,
                    title: 'Announcements',
                    tab: StudentTab.announcements,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.quiz_outlined,
                    title: 'MCQ Test',
                    tab: StudentTab.mcqTest,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.auto_awesome_outlined,
                    title: 'AI Assistance',
                    tab: StudentTab.ragChatbot,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.question_answer_outlined,
                    title: 'Q&A Portal',
                    tab: StudentTab.qaSection,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.account_tree_outlined,
                    title: 'Academic Structure',
                    tab: StudentTab.academicStructure,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.help_outline,
                    title: 'Query Desk',
                    tab: StudentTab.queryDesk,
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
    required StudentTab tab,
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
      case StudentTab.dashboard:
        return InstitutionDashboardTab(institution: widget.institution);
      case StudentTab.announcements:
        return const StudentAnnouncementsTab();
      case StudentTab.mcqTest:
        return const MCQTestTab();
      case StudentTab.ragChatbot:
        return const RAGChatbotTab();
      case StudentTab.qaSection:
        return const StudentQASectionTab();
      case StudentTab.academicStructure:
        return const AcademicStructureTab(readOnly: true);
      case StudentTab.queryDesk:
        return QueryDeskPage(institutionId: widget.institution.id);
    }
  }
}
