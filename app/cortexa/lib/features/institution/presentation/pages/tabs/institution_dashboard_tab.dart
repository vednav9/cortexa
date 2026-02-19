import 'package:flutter/material.dart';
import 'dart:io';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/services/terminology_service.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../../dashboard/data/models/institution_display_model.dart';
import '../../../data/repositories/institution_admin_repository.dart';

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
  final _adminRepository = getIt<InstitutionAdminRepository>();
  
  int _departmentsCount = 0;
  int _coursesCount = 0;
  int _semestersCount = 0;
  int _studentsCount = 0;
  int _teachersCount = 0;
  String _adminEmail = 'Not available';
  String _adminPhone = 'Not available';
  String _institutionWebsite = 'Not available';
  String _institutionDescription = '';
  bool _isLoadingFreshData = false;

  @override
  void initState() {
    super.initState();
    _loadLocalStats();
    _fetchFreshData();
  }

  /// Load stats from local Hive storage for immediate display
  void _loadLocalStats() {
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
      
      if (mounted) {
        setState(() {
          _departmentsCount = departments.length;
          _coursesCount = courses.length;
          _semestersCount = semesters.length;
          _studentsCount = students;
          _teachersCount = teachers;
          
          // Set contact information from institution data
          if (institutionData != null) {
            _adminEmail = institutionData['admin_email']?.toString() ?? 
                         institutionData['contact']?['email']?.toString() ?? 
                         'Not available';
            _adminPhone = institutionData['admin_phone_number']?.toString() ?? 
                         institutionData['contact']?['phone']?.toString() ?? 
                         'Not available';
            _institutionWebsite = institutionData['institution_website']?.toString() ?? 
                                 institutionData['contact']?['website']?.toString() ?? 
                                 'Not available';
            _institutionDescription = institutionData['description']?.toString() ?? widget.institution.description;
          }
        });
      }
    } catch (e) {
      print('❌ Error loading local stats: $e');
    }
  }

  /// Fetch fresh data from backend API
  Future<void> _fetchFreshData() async {
    if (!mounted) return;
    
    setState(() => _isLoadingFreshData = true);

    try {
      print('🔄 Fetching fresh institution data from backend...');
      
      // Check user role to call correct endpoint
      final currentUser = _storage.getCurrentUser();
      final userRole = currentUser?.role?.toLowerCase() ?? 'admin';
      
      Map<String, dynamic> institutionData;
      
      // Try to fetch from backend based on user role
      try {
        if (userRole == 'admin') {
          institutionData = await _adminRepository.getMyInstitution();
        } else {
          // For teachers/students, just use local cached data
          print('⚠️ Non-admin user, using cached data only');
          setState(() => _isLoadingFreshData = false);
          return;
        }
      } catch (e) {
        print('⚠️ Backend fetch failed, using cached data: $e');
        setState(() => _isLoadingFreshData = false);
        return; // Fail silently, keep using cached data
      }
      
      if (!mounted) return;

      // Update stats from backend response
      setState(() {
        final stats = institutionData['stats'] as Map<String, dynamic>?;
        if (stats != null) {
          _studentsCount = stats['students'] as int? ?? _studentsCount;
          _teachersCount = stats['teachers'] as int? ?? _teachersCount;
          _coursesCount = stats['courses'] as int? ?? _coursesCount;
          _departmentsCount = stats['departments'] as int? ?? _departmentsCount;
          _semestersCount = stats['semesters'] as int? ?? _semestersCount;
        }

        // Update contact information
        final contact = institutionData['contact'] as Map<String, dynamic>?;
        if (contact != null) {
          _adminEmail = contact['email']?.toString() ?? _adminEmail;
          _adminPhone = contact['phone']?.toString() ?? _adminPhone;
          _institutionWebsite = contact['website']?.toString() ?? _institutionWebsite;
        }

        // Update description
        if (institutionData['description'] != null) {
          _institutionDescription = institutionData['description'].toString();
        }

        _isLoadingFreshData = false;
      });

      print('✅ Successfully updated dashboard with fresh data');
    } catch (e) {
      print('❌ Unexpected error in _fetchFreshData: $e');
      if (mounted) {
        setState(() => _isLoadingFreshData = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _fetchFreshData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
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
                  // Loading indicator for fresh data
                  if (_isLoadingFreshData)
                    Positioned(
                      top: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
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
                              if (_institutionDescription.isNotEmpty)
                                Text(
                                  _institutionDescription,
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
