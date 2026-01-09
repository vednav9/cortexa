import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/bloc/terminology/terminology_bloc.dart';
import '../../../../core/bloc/terminology/terminology_event.dart';
import '../../../dashboard/data/models/institution_display_model.dart';
import '../../../dashboard/presentation/pages/invite_people_page.dart';
import '../../../dashboard/presentation/pages/query_desk_page.dart';
import 'tabs/institution_dashboard_tab.dart';
import 'tabs/announcements_tab.dart';
import 'tabs/manage_users_tab.dart';
import 'tabs/academic_structure_tab.dart';

enum InstitutionAdminTab {
  dashboard,
  announcements,
  invitePeople,
  manageUsers,
  academicStructure,
  queryDesk,
}

class InstitutionAdminDashboardPage extends StatefulWidget {
  final InstitutionDisplayModel institution;

  const InstitutionAdminDashboardPage({
    super.key,
    required this.institution,
  });

  @override
  State<InstitutionAdminDashboardPage> createState() =>
      _InstitutionAdminDashboardPageState();
}

class _InstitutionAdminDashboardPageState
    extends State<InstitutionAdminDashboardPage> {
  InstitutionAdminTab _currentTab = InstitutionAdminTab.dashboard;

  @override
  void initState() {
    super.initState();
    // Reload terminology to ensure correct institution type is displayed
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TerminologyBloc>().add(LoadInstitutionType());
    });
  }

  @override
  Widget build(BuildContext context) {
    final storage = getIt<HiveStorageService>();
    final currentUser = storage.getCurrentUser();
    final userName = currentUser?.fullName ?? currentUser?.username ?? 'Admin';
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
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Notifications coming soon'),
                  backgroundColor: AppColors.primary,
                ),
              );
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
                            : '?',
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
                    tab: InstitutionAdminTab.dashboard,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.campaign_outlined,
                    title: 'Announcements',
                    tab: InstitutionAdminTab.announcements,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.person_add_outlined,
                    title: 'Invite People',
                    tab: InstitutionAdminTab.invitePeople,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.people_outline,
                    title: 'Manage Users',
                    tab: InstitutionAdminTab.manageUsers,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.account_tree_outlined,
                    title: 'Academic Structure',
                    tab: InstitutionAdminTab.academicStructure,
                    context: context,
                  ),
                  _buildDrawerItem(
                    icon: Icons.help_outline,
                    title: 'Query Desk',
                    tab: InstitutionAdminTab.queryDesk,
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
    required InstitutionAdminTab tab,
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
      case InstitutionAdminTab.dashboard:
        return InstitutionDashboardTab(institution: widget.institution);
      case InstitutionAdminTab.announcements:
        return const AnnouncementsTab();
      case InstitutionAdminTab.invitePeople:
        return const InvitePeoplePage();
      case InstitutionAdminTab.manageUsers:
        return const ManageUsersTab();
      case InstitutionAdminTab.academicStructure:
        return const AcademicStructureTab();
      case InstitutionAdminTab.queryDesk:
        return const QueryDeskPage();
    }
  }

  // Widget _buildPlaceholder({
  //   required IconData icon,
  //   required String title,
  //   required String description,
  // }) {
  //   return Container(
  //     padding: const EdgeInsets.all(40),
  //     child: Center(
  //       child: Column(
  //         mainAxisAlignment: MainAxisAlignment.center,
  //         children: [
  //           Container(
  //             width: 120,
  //             height: 120,
  //             decoration: BoxDecoration(
  //               color: AppColors.primary.withValues(alpha: 0.1),
  //               borderRadius: BorderRadius.circular(60),
  //               border: Border.all(
  //                 color: AppColors.primary.withValues(alpha: 0.2),
  //                 width: 2,
  //               ),
  //             ),
  //             child: Icon(
  //               icon,
  //               size: 60,
  //               color: AppColors.primary.withValues(alpha: 0.7),
  //             ),
  //           ),
  //           const SizedBox(height: 32),
  //           Text(
  //             title,
  //             style: const TextStyle(
  //               fontSize: 28,
  //               fontWeight: FontWeight.bold,
  //               color: AppColors.textPrimary,
  //             ),
  //             textAlign: TextAlign.center,
  //           ),
  //           const SizedBox(height: 16),
  //           Container(
  //             constraints: const BoxConstraints(maxWidth: 500),
  //             child: Text(
  //               description,
  //               style: TextStyle(
  //                 fontSize: 16,
  //                 color: AppColors.textSecondary.withValues(alpha: 0.8),
  //                 height: 1.6,
  //               ),
  //               textAlign: TextAlign.center,
  //             ),
  //           ),
  //           const SizedBox(height: 40),
  //           Container(
  //             padding: const EdgeInsets.all(20),
  //             decoration: BoxDecoration(
  //               color: AppColors.surface,
  //               borderRadius: BorderRadius.circular(16),
  //               border: Border.all(
  //                 color: AppColors.borderDark.withValues(alpha: 0.2),
  //                 width: 1,
  //               ),
  //             ),
  //             child: Row(
  //               mainAxisSize: MainAxisSize.min,
  //               children: [
  //                 Icon(
  //                   Icons.info_outline,
  //                   size: 20,
  //                   color: AppColors.textTertiary.withValues(alpha: 0.6),
  //                 ),
  //                 const SizedBox(width: 12),
  //                 Text(
  //                   'This feature is under development',
  //                   style: TextStyle(
  //                     fontSize: 14,
  //                     color: AppColors.textTertiary.withValues(alpha: 0.7),
  //                     fontStyle: FontStyle.italic,
  //                   ),
  //                 ),
  //               ],
  //             ),
  //           ),
  //         ],
  //       ),
  //     ),
  //   );
  // }
}
