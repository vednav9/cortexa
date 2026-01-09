import 'package:flutter/material.dart';
import 'dart:io';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/services/terminology_service.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../../dashboard/data/models/institution_display_model.dart';

class InstitutionDashboardTab extends StatefulWidget {
  final InstitutionDisplayModel institution;

  const InstitutionDashboardTab({
    super.key,
    required this.institution,
  });

  @override
  State<InstitutionDashboardTab> createState() => _InstitutionDashboardTabState();
}

class _InstitutionDashboardTabState extends State<InstitutionDashboardTab> {
  final _storage = getIt<HiveStorageService>();
  int _departmentsCount = 0;
  int _coursesCount = 0;
  int _semestersCount = 0;
  int _studentsCount = 0;
  int _teachersCount = 0;
  String _adminEmail = 'Not available';
  String _adminPhone = 'Not available';
  String _institutionWebsite = 'Not available';

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  void _loadStats() {
    try {
      final institutionId = widget.institution.id;
      final departments = _storage.getAllDepartments(institutionId: institutionId);
      final courses = _storage.getAllCourses(institutionId: institutionId);
      final semesters = _storage.getAllSemesters(institutionId: institutionId);
      
      // Load institution details from Hive
      final institutionData = _storage.findInstitutionById(institutionId);
      
      // Count accepted invitations by role
      final allInvitations = _storage.getAllInvitations();
      final institutionInvitations = allInvitations.where((inv) => 
        inv['institution_id'] == institutionId && 
        inv['status']?.toString().toLowerCase() == 'accepted'
      ).toList();
      
      final students = institutionInvitations.where((inv) => inv['role'] == 'student').length;
      final teachers = institutionInvitations.where((inv) => inv['role'] == 'teacher').length;
      
      setState(() {
        _departmentsCount = departments.length;
        _coursesCount = courses.length;
        _semestersCount = semesters.length;
        _studentsCount = students;
        _teachersCount = teachers;
        
        // Set contact information from institution data
        if (institutionData != null) {
          _adminEmail = institutionData['admin_email']?.toString() ?? 'Not available';
          _adminPhone = institutionData['admin_phone_number']?.toString() ?? 'Not available';
          _institutionWebsite = institutionData['institution_website']?.toString() ?? 'Not available';
        }
      });
    } catch (e) {
      print('Error loading stats: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const ClampingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Section with Institution Name and Description
          Container(
            width: double.infinity,
            height: MediaQuery.of(context).size.height * 0.25,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(int.parse('0xff${widget.institution.primaryBrandColor.replaceAll('#', '')}')).withValues(alpha: 0.8),
                  Color(int.parse('0xff${widget.institution.primaryBrandColor.replaceAll('#', '')}')).withValues(alpha: 0.5),
                ],
              ),
            ),
            child: Stack(
              children: [
                // Background pattern
                Positioned.fill(
                  child: Opacity(
                    opacity: 0.1,
                    child: Image.asset(
                      'assets/images/pattern.png',
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(),
                    ),
                  ),
                ),
                // Content
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Row(
                    children: [
                      // Institution Logo
                      if (widget.institution.logoUrl != null && widget.institution.logoUrl!.isNotEmpty)
                        Container(
                          width: 60,
                          height: 60,
                          margin: const EdgeInsets.only(right: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(
                              File(widget.institution.logoUrl!),
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  color: Colors.white,
                                  child: Icon(
                                    Icons.school,
                                    color: Color(int.parse('0xff${widget.institution.primaryBrandColor.replaceAll('#', '')}')),
                                    size: 30,
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      // Name and Description
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.institution.name,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 12),
                            if (widget.institution.description.isNotEmpty)
                              Text(
                                widget.institution.description,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white.withValues(alpha: 0.9),
                                  height: 1.4,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Stats Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Overview',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.people_outline,
                        iconColor: Colors.blue,
                        count: _studentsCount.toString(),
                        label: 'Students',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.person_outline,
                        iconColor: Colors.green,
                        count: _teachersCount.toString(),
                        label: 'Teachers',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.business_outlined,
                        iconColor: Colors.purple,
                        count: _departmentsCount.toString(),
                        label: context.mounted ? TerminologyService.getOrganizationalUnitLabel(context, plural: true) : 'Departments',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.calendar_today_outlined,
                        iconColor: Colors.orange,
                        count: _semestersCount.toString(),
                        label: context.mounted ? TerminologyService.getTimePeriodLabel(context, plural: true) : 'Semesters',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        icon: Icons.book_outlined,
                        iconColor: Colors.teal,
                        count: _coursesCount.toString(),
                        label: context.mounted ? TerminologyService.getLearningProgramLabel(context, plural: true) : 'Courses',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Container()), // Empty space for symmetry
                  ],
                ),
              ],
            ),
          ),

          // About Us Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.info_outline,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'About Us',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoCard(
                          icon: Icons.account_balance,
                          iconColor: Colors.blue,
                          label: 'Type',
                          value: widget.institution.type,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildInfoCard(
                          icon: Icons.location_on,
                          iconColor: Colors.red,
                          label: 'Location',
                          value: '${widget.institution.city}, ${widget.institution.country}',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Contact Information Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.contact_mail_outlined,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Contact Information',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildContactItem(
                    icon: Icons.email,
                    iconColor: Colors.pink,
                    label: 'Email',
                    value: _adminEmail,
                  ),
                  const SizedBox(height: 12),
                  _buildContactItem(
                    icon: Icons.phone,
                    iconColor: Colors.green,
                    label: 'Phone',
                    value: _adminPhone,
                  ),
                  const SizedBox(height: 12),
                  _buildContactItem(
                    icon: Icons.language,
                    iconColor: Colors.blue,
                    label: 'Website',
                    value: _institutionWebsite,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconColor,
    required String count,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 24,
                color: iconColor,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: iconColor,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            count,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: iconColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.borderDark.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: iconColor,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary.withValues(alpha: 0.7),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildContactItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            size: 22,
            color: iconColor,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
