import 'package:flutter/material.dart';
import 'dart:io';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/services/terminology_service.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../../../core/network/api_client.dart';
import '../../../../../core/config/api_config.dart';
import '../../../../dashboard/data/models/institution_display_model.dart';
import '../../../data/repositories/department_repository.dart';
import '../../../data/repositories/course_repository.dart';
import '../../../data/repositories/semester_repository.dart';
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
  final _apiClient = getIt<ApiClient>();
  final _departmentRepository = getIt<DepartmentRepository>();
  final _courseRepository = getIt<CourseRepository>();
  final _semesterRepository = getIt<SemesterRepository>();
  final _adminRepository = getIt<InstitutionAdminRepository>();
  final ScrollController _scrollController = ScrollController();
  
  int _departmentsCount = 0;
  int _coursesCount = 0;
  int _semestersCount = 0;
  int _studentsCount = 0;
  int _teachersCount = 0;
  String _adminEmail = 'Not available';
  String _adminPhone = 'Not available';
  String _institutionWebsite = 'Not available';
  bool _isLoadingFreshData = false;
  double _bottomNameOpacity = 1.0;

  @override
  void initState() {
    super.initState();
    _loadStats();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Calculate opacity based on scroll position
    // Start fading at 100px, complete fade at 200px
    const double fadeStart = 100.0;
    const double fadeEnd = 200.0;
    
    final offset = _scrollController.offset;
    final bottomOpacity = (1.0 - ((offset - fadeStart) / (fadeEnd - fadeStart))).clamp(0.0, 1.0);
    
    if (_bottomNameOpacity != bottomOpacity) {
      setState(() {
        _bottomNameOpacity = bottomOpacity;
      });
    }
  }

  /// Load stats - API-first approach with role-based endpoint selection
  Future<void> _loadStats() async {
    if (!mounted) return;
    
    setState(() => _isLoadingFreshData = true);

    try {
      final institutionId = widget.institution.id;
      final currentUser = _storage.getCurrentUser();
      final userRole = currentUser?.role.toLowerCase() ?? '';
      
      print('🔄 Fetching stats from backend API for institution: $institutionId (role: $userRole)');
      
      // Fetch from backend APIs first
      try {
        // STEP 1: Fetch common data (departments, courses, semesters) - works for all roles
        final commonDataFutures = [
          _departmentRepository.getDepartments(institutionId),
          _courseRepository.getCourses(institutionId),
          _semesterRepository.getSemesters(institutionId),
        ];
        
        // STEP 2: Fetch role-specific institution data with stats
        Future<Map<String, dynamic>> institutionDataFuture;
        
        if (userRole == 'admin') {
          // Admin: use admin-specific endpoint
          institutionDataFuture = _adminRepository.getMyInstitution();
        } else if (userRole == 'teacher') {
          // Teacher: use teacher-specific endpoint
          institutionDataFuture = _fetchTeacherInstitution();
        } else if (userRole == 'student') {
          // Student: use student-specific endpoint
          institutionDataFuture = _fetchStudentInstitution();
        } else {
          // Unknown role: return empty data
          institutionDataFuture = Future.value(<String, dynamic>{});
        }
        
        // Wait for all data to be fetched
        final results = await Future.wait([
          ...commonDataFutures,
          institutionDataFuture,
        ]);

        if (!mounted) return;

        final departmentsData = results[0];
        final coursesData = results[1];
        final semestersData = results[2];
        final institutionData = results[3];

        final departments = departmentsData['data'] as List<dynamic>? ?? [];
        final courses = coursesData['courses'] as List<dynamic>? ?? [];
        final semesters = semestersData['data'] as List<dynamic>? ?? [];

        setState(() {
          _departmentsCount = departments.length;
          _coursesCount = courses.length;
          _semestersCount = semesters.length;
          
          // Extract stats from institution data (backend returns stats object)
          final stats = institutionData['stats'] as Map<String, dynamic>?;
          if (stats != null) {
            _studentsCount = (stats['students'] as int?) ?? 
                            (stats['studentCount'] as int?) ?? 
                            0;
            _teachersCount = (stats['teachers'] as int?) ?? 
                            (stats['teacherCount'] as int?) ?? 
                            0;
          } else {
            // If no stats, try direct fields or fallback to 0
            _studentsCount = (institutionData['studentCount'] as int?) ?? 
                            (institutionData['students_count'] as int?) ?? 
                            0;
            _teachersCount = (institutionData['teacherCount'] as int?) ?? 
                            (institutionData['teachers_count'] as int?) ?? 
                            0;
          }
          
          // Extract contact information (works for all role responses)
          final contact = institutionData['contact'] as Map<String, dynamic>?;
          if (contact != null) {
            _adminEmail = contact['email']?.toString() ?? 'Not available';
            _adminPhone = contact['phone']?.toString() ?? 'Not available';
            _institutionWebsite = contact['website']?.toString() ?? 'Not available';
          } else {
            // Fallback to direct fields
            _adminEmail = institutionData['admin_email']?.toString() ?? 
                         institutionData['email']?.toString() ??
                         'Not available';
            _adminPhone = institutionData['admin_phone_number']?.toString() ?? 
                         institutionData['phone']?.toString() ??
                         'Not available';
            _institutionWebsite = institutionData['institution_website']?.toString() ?? 
                                 institutionData['website']?.toString() ??
                                 'Not available';
          }
          
          _isLoadingFreshData = false;
        });

        print('✅ Loaded fresh stats from API:');
        print('   Departments: $_departmentsCount');
        print('   Courses: $_coursesCount');
        print('   Semesters: $_semestersCount');
        print('   Students: $_studentsCount');
        print('   Teachers: $_teachersCount');
        print('   Contact - Email: $_adminEmail, Phone: $_adminPhone, Website: $_institutionWebsite');
      } catch (apiError) {
        print('⚠️ API fetch failed: $apiError');
        // Fall back to cache
        _loadFromCache(institutionId);
      }
    } catch (e) {
      print('❌ Error in _loadStats: $e');
      if (mounted) {
        setState(() => _isLoadingFreshData = false);
      }
    }
  }
  
  /// Fetch teacher's institution data using teacher endpoint
  Future<Map<String, dynamic>> _fetchTeacherInstitution() async {
    try {
      print('🌐 Fetching teacher institution details from ${ApiConfig.teacherMyInstitution}');
      
      final response = await _apiClient.get(
        ApiConfig.teacherMyInstitution,
        requiresAuth: true,
      );

      final institution = response['institution'] as Map<String, dynamic>?;
      if (institution != null) {
        print('✅ Fetched teacher institution: ${institution['name']}');
        return institution;
      } else {
        print('⚠️ No institution data in teacher response');
        return {};
      }
    } catch (e) {
      print('❌ Error fetching teacher institution: $e');
      return {};
    }
  }
  
  /// Fetch student's institution data using student endpoint
  Future<Map<String, dynamic>> _fetchStudentInstitution() async {
    try {
      print('🌐 Fetching student institution details from ${ApiConfig.studentMyInstitution}');
      
      final response = await _apiClient.get(
        ApiConfig.studentMyInstitution,
        requiresAuth: true,
      );

      final institution = response['institution'] as Map<String, dynamic>?;
      if (institution != null) {
        print('✅ Fetched student institution: ${institution['name']}');
        return institution;
      } else {
        print('⚠️ No institution data in student response');
        return {};
      }
    } catch (e) {
      print('❌ Error fetching student institution: $e');
      return {};
    }
  }

  /// Fallback: Load from cache when API fails
  void _loadFromCache(String institutionId) {
    try {
      final departments = _departmentRepository.getCachedDepartments(institutionId);
      final courses = _courseRepository.getCachedCourses(institutionId);
      final semesters = _semesterRepository.getCachedSemesters(institutionId);
      
      // For students and teachers, try to count from invitations as fallback
      final allInvitations = _storage.getAllInvitations();
      final institutionInvitations = allInvitations.where((inv) => 
        inv['institution_id'] == institutionId && 
        inv['status']?.toString().toLowerCase() == 'accepted'
      ).toList();
      
      final students = institutionInvitations.where((inv) => inv['role'] == 'student').length;
      final teachers = institutionInvitations.where((inv) => inv['role'] == 'teacher').length;

      // Load institution details from cache
      final institutionData = _storage.findInstitutionById(institutionId);
      
      if (mounted) {
        setState(() {
          _departmentsCount = departments.length;
          _coursesCount = courses.length;
          _semestersCount = semesters.length;
          _studentsCount = students;
          _teachersCount = teachers;
          
          // Set contact information from institution data (try multiple fields)
          if (institutionData != null) {
            _adminEmail = institutionData['admin_email']?.toString() ?? 
                         institutionData['contact']?['email']?.toString() ?? 
                         institutionData['email']?.toString() ??
                         'Not available';
            _adminPhone = institutionData['admin_phone_number']?.toString() ?? 
                         institutionData['contact']?['phone']?.toString() ?? 
                         institutionData['phone']?.toString() ??
                         'Not available';
            _institutionWebsite = institutionData['institution_website']?.toString() ?? 
                                 institutionData['contact']?['website']?.toString() ?? 
                                 institutionData['website']?.toString() ??
                                 'Not available';
          } else {
            _adminEmail = 'Not available';
            _adminPhone = 'Not available';
            _institutionWebsite = 'Not available';
          }
          
          _isLoadingFreshData = false;
        });
      }
      
      print('📦 Loaded stats from cache:');
      print('   Departments: $_departmentsCount');
      print('   Courses: $_coursesCount');
      print('   Semesters: $_semestersCount');
      print('   Students: $_studentsCount (from invitations)');
      print('   Teachers: $_teachersCount (from invitations)');
      print('   Contact - Email: $_adminEmail, Phone: $_adminPhone, Website: $_institutionWebsite');
    } catch (e) {
      print('❌ Error loading from cache: $e');
      if (mounted) {
        setState(() => _isLoadingFreshData = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final brandColor = Color(int.parse(
      '0xff${widget.institution.primaryBrandColor.replaceAll('#', '')}',
    ));

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Banner with scroll animation
          SliverAppBar(
            expandedHeight: 250,
            pinned: false,
            floating: false,
            backgroundColor: brandColor,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Banner Image Background
                  if (widget.institution.bannerImageUrl != null &&
                      widget.institution.bannerImageUrl!.isNotEmpty)
                    widget.institution.bannerImageUrl!.startsWith('http')
                        ? Image.network(
                            widget.institution.bannerImageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                _buildBannerPlaceholder(brandColor),
                          )
                        : Image.file(
                            File(widget.institution.bannerImageUrl!),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) =>
                                _buildBannerPlaceholder(brandColor),
                          )
                  else
                    _buildBannerPlaceholder(brandColor),

                  // Gradient Overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.3),
                          Colors.black.withValues(alpha: 0.7),
                        ],
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
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                      ),
                    ),

                  // Logo and Name Overlay
                  Positioned(
                    bottom: 20,
                    left: 20,
                    right: 20,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        // Institution Logo
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.3),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: widget.institution.logoUrl != null &&
                                  widget.institution.logoUrl!.isNotEmpty
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(14),
                                  child: widget.institution.logoUrl!
                                          .startsWith('http')
                                      ? Image.network(
                                          widget.institution.logoUrl!,
                                          fit: BoxFit.cover,
                                          errorBuilder:
                                              (_, __, ___) =>
                                                  _buildLogoPlaceholder(
                                                      brandColor),
                                        )
                                      : Image.file(
                                          File(widget.institution.logoUrl!),
                                          fit: BoxFit.cover,
                                          errorBuilder:
                                              (_, __, ___) =>
                                                  _buildLogoPlaceholder(
                                                      brandColor),
                                        ),
                                )
                              : _buildLogoPlaceholder(brandColor),
                        ),
                        const SizedBox(width: 16),
                        // Institution Name and Location
                        Expanded(
                          child: Opacity(
                            opacity: _bottomNameOpacity,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  widget.institution.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 28,
                                    fontWeight: FontWeight.bold,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black54,
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.location_on,
                                      color: Colors.white,
                                      size: 16,
                                    ),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        '${widget.institution.city}, ${widget.institution.country}',
                                        style: TextStyle(
                                          color: Colors.white
                                              .withValues(alpha: 0.9),
                                          fontSize: 14,
                                          shadows: const [
                                            Shadow(
                                              color: Colors.black38,
                                              blurRadius: 3,
                                            ),
                                          ],
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content sections
          SliverToBoxAdapter(
            child: Padding(
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
                  const SizedBox(height: 16),

                  // About Us Section
                  Container(
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
                  const SizedBox(height: 16),

                  // Contact Information Section
                  Container(
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
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
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
  Widget _buildBannerPlaceholder(Color brandColor) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            brandColor.withValues(alpha: 0.8),
            brandColor.withValues(alpha: 0.5),
          ],
        ),
      ),
      child: Opacity(
        opacity: 0.1,
        child: Image.asset(
          'assets/images/pattern.png',
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(),
        ),
      ),
    );
  }

  Widget _buildLogoPlaceholder(Color brandColor) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(
        Icons.school,
        color: brandColor,
        size: 40,
      ),
    );
  }}
