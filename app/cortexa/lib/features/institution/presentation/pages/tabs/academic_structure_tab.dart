import 'package:flutter/material.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/services/terminology_service.dart';
import 'departments_tab.dart';
import 'courses_tab.dart';
import 'semesters_tab.dart';
import 'academic_calendar_tab.dart';
import 'faculty_tab.dart';

class AcademicStructureTab extends StatefulWidget {
  final bool readOnly;

  const AcademicStructureTab({super.key, this.readOnly = false});

  @override
  State<AcademicStructureTab> createState() => _AcademicStructureTabState();
}

class _AcademicStructureTabState extends State<AcademicStructureTab>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TerminologyBuilder(
      builder: (context, type) {
        return Scaffold(
          backgroundColor: AppColors.background,
          body: Column(
            children: [
              // Tab Bar
              Container(
                color: AppColors.surface,
                child: TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  indicator: const UnderlineTabIndicator(
                    borderSide: BorderSide(
                      color: AppColors.primary,
                      width: 3,
                    ),
                  ),
                  indicatorSize: TabBarIndicatorSize.label,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  dividerColor: AppColors.borderDark.withValues(alpha: 0.1),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  tabs: [
                    Tab(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.business_outlined, size: 18),
                            const SizedBox(width: 8),
                            Text(TerminologyService.getOrganizationalUnitLabel(context, plural: true)),
                          ],
                        ),
                      ),
                    ),
                    Tab(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.calendar_view_month_outlined, size: 18),
                            const SizedBox(width: 8),
                            Text(TerminologyService.getTimePeriodLabel(context, plural: true)),
                          ],
                        ),
                      ),
                    ),
                    Tab(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.book_outlined, size: 18),
                            const SizedBox(width: 8),
                            Text(TerminologyService.getLearningProgramLabel(context, plural: true)),
                          ],
                        ),
                      ),
                    ),
                    const Tab(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.event_note_outlined, size: 18),
                            SizedBox(width: 8),
                            Text('Academic Calendar'),
                          ],
                        ),
                      ),
                    ),
                    const Tab(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.people_outline, size: 18),
                            SizedBox(width: 8),
                            Text('Faculty'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Tab Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    DepartmentsTab(readOnly: widget.readOnly),
                    SemestersTab(readOnly: widget.readOnly),
                    CoursesTab(readOnly: widget.readOnly),
                    AcademicCalendarTab(readOnly: widget.readOnly),
                    FacultyTab(readOnly: widget.readOnly),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
