import 'package:flutter/material.dart';
import '../../../../../../core/utils/fuzzy_search.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../data/repositories/department_repository.dart';
import '../../../data/repositories/faculty_repository.dart';

class FacultyTab extends StatefulWidget {
  final bool readOnly;

  const FacultyTab({super.key, this.readOnly = false});

  @override
  State<FacultyTab> createState() => _FacultyTabState();
}

class _FacultyTabState extends State<FacultyTab> {
  final TextEditingController _searchController = TextEditingController();
  final _storage = getIt<HiveStorageService>();
  final _departmentRepository = getIt<DepartmentRepository>();
  final _facultyRepository = getIt<FacultyRepository>();

  List<Map<String, dynamic>> _faculty = [];
  List<Map<String, dynamic>> _departments = [];
  bool _isLoading = true;
  String _selectedDepartmentId = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {});
    });
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null) {
        setState(() {
          _faculty = [];
          _departments = [];
          _isLoading = false;
        });
        return;
      }

      // Fetch departments and faculty in parallel
      final results = await Future.wait([
        _departmentRepository.getDepartments(institutionId),
        _facultyRepository.getFaculty(institutionId: institutionId),
      ]);

      if (!mounted) return;

      final deptsResponse = results[0];
      final facultyResponse = results[1];

      // Parse departments
      final deptsList =
          (deptsResponse['data'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [];

      // Parse faculty - backend returns { success, count, faculty: [...] }
      final facultyList =
          (facultyResponse['faculty'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [];

      setState(() {
        _departments = deptsList;
        _faculty = facultyList;
        _isLoading = false;
      });

      print(
        '✅ Loaded ${facultyList.length} faculty members and ${deptsList.length} departments',
      );
    } catch (e) {
      print('❌ Error loading faculty data: $e');
      setState(() {
        _faculty = [];
        _departments = [];
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading faculty: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> get _filteredFaculty {
    final query = _searchController.text.trim();
    var filtered = _faculty;

    // Filter by department
    if (_selectedDepartmentId.isNotEmpty) {
      filtered = filtered.where((member) {
        final dept = member['department'];
        if (dept is Map<String, dynamic>) {
          return dept['_id'] == _selectedDepartmentId;
        }
        return false;
      }).toList();
    }

    // Filter by search query
    if (query.isNotEmpty) {
      filtered = filtered.where((member) {
        return FuzzySearch.matchesAny([
          (member['fullName'] ?? '').toString(),
          (member['email'] ?? '').toString(),
        ], query);
      }).toList();
    }

    return filtered;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              color: AppColors.primary,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Section
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.primary.withValues(alpha: 0.15),
                            AppColors.primaryLight.withValues(alpha: 0.08),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.2),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              Icons.people,
                              color: AppColors.primary.withValues(alpha: 0.9),
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 18),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Faculty',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'View faculty members and their assignments',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary.withValues(
                                      alpha: 0.8,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Search Bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.cardBackground,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.05),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Search faculty members...',
                            hintStyle: TextStyle(
                              color: AppColors.textTertiary.withValues(
                                alpha: 0.5,
                              ),
                              fontSize: 15,
                            ),
                            prefixIcon: Icon(
                              Icons.search_rounded,
                              color: AppColors.primary.withValues(alpha: 0.7),
                              size: 22,
                            ),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: Icon(
                                      Icons.clear_rounded,
                                      color: AppColors.textTertiary.withValues(
                                        alpha: 0.6,
                                      ),
                                      size: 20,
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _searchController.clear();
                                      });
                                    },
                                  )
                                : null,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: AppColors.primary.withValues(
                                  alpha: 0.15,
                                ),
                                width: 1,
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: AppColors.primary.withValues(
                                  alpha: 0.15,
                                ),
                                width: 1,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: AppColors.primary.withValues(alpha: 0.3),
                                width: 1.5,
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 16,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Department Filter
                    if (_departments.isNotEmpty)
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.cardBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.borderDark.withValues(alpha: 0.3),
                          ),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedDepartmentId.isEmpty
                                ? null
                                : _selectedDepartmentId,
                            hint: Row(
                              children: [
                                Icon(
                                  Icons.filter_list,
                                  size: 18,
                                  color: AppColors.primary.withValues(
                                    alpha: 0.7,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Text(
                                    'All Departments',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            isExpanded: true,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 4,
                            ),
                            borderRadius: BorderRadius.circular(12),
                            dropdownColor: AppColors.cardBackground,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                            ),
                            icon: Icon(
                              Icons.arrow_drop_down,
                              color: AppColors.textTertiary.withValues(
                                alpha: 0.7,
                              ),
                            ),
                            items: [
                              DropdownMenuItem<String>(
                                value: '',
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.filter_list,
                                      size: 18,
                                      color: AppColors.primary.withValues(
                                        alpha: 0.7,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    const Expanded(
                                      child: Text(
                                        'All Departments',
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ..._departments.map((dept) {
                                return DropdownMenuItem<String>(
                                  value: dept['_id'],
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.apartment,
                                        size: 18,
                                        color: AppColors.primary.withValues(
                                          alpha: 0.7,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          dept['name'] ?? 'Unknown',
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _selectedDepartmentId = value ?? '';
                              });
                            },
                          ),
                        ),
                      ),
                    const SizedBox(height: 24),

                    // Content
                    Expanded(
                      child: _faculty.isEmpty
                          ? _buildEmptyState()
                          : _buildFacultyList(),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 60),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(60),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  width: 2,
                ),
              ),
              child: Icon(
                Icons.people_outline,
                size: 60,
                color: AppColors.primary.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'No Faculty Members',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Container(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(
                'Faculty members will appear here once they are added to your institution',
                style: TextStyle(
                  fontSize: 15,
                  color: AppColors.textSecondary.withValues(alpha: 0.8),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFacultyList() {
    final filteredFaculty = _filteredFaculty;

    if (filteredFaculty.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: AppColors.textTertiary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'No faculty members found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filters',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textTertiary.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: filteredFaculty.length,
      itemBuilder: (context, index) {
        final member = filteredFaculty[index];
        return _buildFacultyCard(member);
      },
    );
  }

  Widget _buildFacultyCard(Map<String, dynamic> member) {
    final fullName = member['fullName'] ?? 'Unknown';
    final jobTitle = member['jobTitle'] ?? '';

    final department = member['department'];
    final deptName = department is Map<String, dynamic>
        ? (department['name'] ?? 'No Department')
        : 'No Department';

    final authorizedCourses =
        member['authorizedCourses'] as List<dynamic>? ?? [];

    final initials = fullName
        .split(' ')
        .take(2)
        .map((word) => word.isNotEmpty ? word[0].toUpperCase() : '')
        .join();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _showFacultyDetails(member),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppColors.borderDark.withValues(alpha: 0.3),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 8),
              // Circular avatar
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.2),
                      AppColors.primaryLight.withValues(alpha: 0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
                child: Center(
                  child: Text(
                    initials,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Name
              Text(
                fullName,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              if (jobTitle.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  jobTitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.primary.withValues(alpha: 0.8),
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              const SizedBox(height: 8),

              // Department
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  deptName,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textTertiary.withValues(alpha: 0.9),
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),

              // Courses indicator
              if (authorizedCourses.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.book,
                      size: 14,
                      color: AppColors.textTertiary.withValues(alpha: 0.6),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${authorizedCourses.length} course${authorizedCourses.length == 1 ? '' : 's'}',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textTertiary.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showFacultyDetails(Map<String, dynamic> member) {
    final fullName = member['fullName'] ?? 'Unknown';
    final email = member['email'] ?? 'N/A';
    final phone = member['phone'] ?? 'N/A';
    final jobTitle = member['jobTitle'] ?? 'N/A';
    final qualifications = member['qualifications'] ?? 'N/A';
    final specialization = member['specialization'] ?? 'N/A';

    final department = member['department'];
    final deptName = department is Map<String, dynamic>
        ? (department['name'] ?? 'No Department')
        : 'No Department';

    final authorizedCourses =
        member['authorizedCourses'] as List<dynamic>? ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.9,
            builder: (context, scrollController) => Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 45,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.borderDark.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(28, 0, 28, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.primary.withValues(alpha: 0.2),
                                  AppColors.primaryLight.withValues(alpha: 0.1),
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.primary.withValues(alpha: 0.3),
                                width: 2,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                fullName
                                    .split(' ')
                                    .take(2)
                                    .map(
                                      (word) => word.isNotEmpty
                                          ? word[0].toUpperCase()
                                          : '',
                                    )
                                    .join(),
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primary,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  fullName,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                if (jobTitle != 'N/A') ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    jobTitle,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppColors.primary.withValues(
                                        alpha: 0.8,
                                      ),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Contact Information
                      _buildDetailSection('Contact Information', [
                        _buildDetailRow(Icons.email, 'Email', email),
                        _buildDetailRow(Icons.phone, 'Phone', phone),
                      ]),

                      // Academic Information
                      _buildDetailSection('Academic Information', [
                        _buildDetailRow(
                          Icons.apartment,
                          'Department',
                          deptName,
                        ),
                        if (qualifications != 'N/A')
                          _buildDetailRow(
                            Icons.school,
                            'Qualifications',
                            qualifications,
                          ),
                        if (specialization != 'N/A')
                          _buildDetailRow(
                            Icons.star,
                            'Specialization',
                            specialization,
                          ),
                      ]),

                      // Authorized Courses
                      if (authorizedCourses.isNotEmpty) ...[
                        const Text(
                          'Teaching Courses',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...authorizedCourses.map((course) {
                          final courseName = course is Map<String, dynamic>
                              ? (course['name'] ?? 'Unknown Course')
                              : 'Unknown Course';
                          final courseCode = course is Map<String, dynamic>
                              ? (course['code'] ?? '')
                              : '';

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: AppColors.primary.withValues(alpha: 0.1),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.book,
                                  size: 20,
                                  color: AppColors.primary.withValues(
                                    alpha: 0.7,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    courseCode.isNotEmpty
                                        ? '$courseCode - $courseName'
                                        : courseName,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),    ),    );
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        ...children,
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppColors.primary.withValues(alpha: 0.7)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textTertiary.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
