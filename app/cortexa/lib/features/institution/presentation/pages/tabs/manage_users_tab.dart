import 'package:flutter/material.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/services/terminology_service.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../data/repositories/department_repository.dart';
import '../../../data/repositories/semester_repository.dart';
import '../../../data/repositories/institution_admin_repository.dart';

class ManageUsersTab extends StatefulWidget {
  const ManageUsersTab({super.key});

  @override
  State<ManageUsersTab> createState() => _ManageUsersTabState();
}

class _ManageUsersTabState extends State<ManageUsersTab> {
  final _storage = getIt<HiveStorageService>();
  final _departmentRepository = getIt<DepartmentRepository>();
  final _semesterRepository = getIt<SemesterRepository>();
  final _adminRepository = getIt<InstitutionAdminRepository>();
  final _searchController = TextEditingController();
  List<Map<String, dynamic>> _users = []; // Filtered users for display
  List<Map<String, dynamic>> _allUsers = []; // Original unfiltered users for stats
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _semesters = [];
  String _selectedRole = 'All Roles';
  String _selectedStatus = 'All Status';
  String _selectedDepartment = '';
  bool _isLoading = true;
  String? _error;
  
  // Stats variables (always calculated from _allUsers)
  int _totalUsers = 0;
  int _studentsCount = 0;
  int _teachersCount = 0;
  int _activeCount = 0;
  int _inactiveCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    try {
      // Only show full-screen loader on first load
      setState(() {
        if (_users.isEmpty) {
          _isLoading = true;
        }
        _error = null;
      });

      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;
      
      if (institutionId == null) {
        setState(() {
          _users = [];
          _allUsers = [];
          _isLoading = false;
          _error = 'No institution ID found';
        });
        return;
      }

      // Check if we need to load original data for stats
      final isFilterActive = _selectedRole != 'All Roles' || 
                              _selectedStatus != 'All Status' || 
                              (_selectedDepartment.isNotEmpty && !_selectedDepartment.startsWith('All ')) ||
                              _searchController.text.trim().isNotEmpty;
      
      // Fetch ALL users for stats if not already loaded or no filters active
      if (_allUsers.isEmpty || !isFilterActive) {
        final allUsers = await _adminRepository.getUsers(
          institutionId,
          role: 'all',
          status: null,
          department: null,
          search: null,
        );
        
        if (!mounted) return;
        setState(() {
          _allUsers = allUsers;
          // Calculate stats from ALL users
          _totalUsers = _allUsers.length;
          _studentsCount = _allUsers.where((u) => u['role']?.toString().toLowerCase() == 'student').length;
          _teachersCount = _allUsers.where((u) => u['role']?.toString().toLowerCase() == 'teacher').length;
          _activeCount = _allUsers.where((u) => u['status']?.toString().toLowerCase() == 'active').length;
          _inactiveCount = _allUsers.where((u) => u['status']?.toString().toLowerCase() == 'inactive').length;
        });
      }

      // Fetch filtered users for display
      final role = _selectedRole == 'All Roles' ? 'all' : _selectedRole.toLowerCase();
      final status = _selectedStatus == 'All Status' ? null : _selectedStatus.toLowerCase();
      final search = _searchController.text.trim().isEmpty ? null : _searchController.text.trim();
      final department = (_selectedDepartment.isEmpty || _selectedDepartment.startsWith('All ')) 
          ? null 
          : _selectedDepartment;

      final users = await _adminRepository.getUsers(
        institutionId,
        role: role,
        status: status,
        department: department,
        search: search,
      );

      // Fetch departments for fallback
      try {
        final deptResponse = await _departmentRepository.getDepartments(institutionId);
        final deptsList = (deptResponse['data'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ?? [];
        setState(() {
          _departments = deptsList;
        });
      } catch (e) {
        print('⚠️ Failed to load departments: $e');
        // Continue even if departments fail
      }

      // Fetch semesters
      try {
        final semResponse = await _semesterRepository.getSemesters(institutionId);
        final semList = (semResponse['data'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ?? [];
        setState(() {
          _semesters = semList;
        });
      } catch (e) {
        print('⚠️ Failed to load semesters: $e');
        // Continue even if semesters fail
      }

      if (!mounted) return;
      
      setState(() {
        _users = users;
        _isLoading = false;
      });

      print('✅ Loaded ${users.length} filtered users successfully');
    } catch (e) {
      print('❌ Error loading users: $e');
      
      if (!mounted) return;
      
      // Fallback: Try to load from cache/invitations
      try {
        final currentUser = _storage.getCurrentUser();
        final institutionId = currentUser?.institutionId;
        
        if (institutionId != null) {
          final allInvitations = _storage.getAllInvitations();
          final acceptedInvitations = allInvitations.where((inv) => 
            inv['institution_id'] == institutionId && 
            inv['status']?.toString().toLowerCase() == 'accepted'
          ).toList();
          
          final cachedUsers = acceptedInvitations.map((inv) => {
            '_id': inv['id'],
            'fullName': inv['invited_user_full_name']?.toString() ?? 
                    inv['invited_user_username']?.toString() ?? 
                    inv['invited_user_email']?.toString().split('@').first ?? 
                    'Unknown',
            'email': inv['invited_user_email']?.toString() ?? 'No email',
            'role': (inv['role']?.toString() ?? 'student'),
            'status': 'active',
            'department': null,
          }).toList();
          
          setState(() {
            _users = cachedUsers;
            _allUsers = cachedUsers;
            _isLoading = false;
            _error = 'Showing cached data (offline mode)';
            
            // Calculate stats from cached data
            _totalUsers = _allUsers.length;
            _studentsCount = _allUsers.where((u) => u['role']?.toString().toLowerCase() == 'student').length;
            _teachersCount = _allUsers.where((u) => u['role']?.toString().toLowerCase() == 'teacher').length;
            _activeCount = _allUsers.where((u) => u['status']?.toString().toLowerCase() == 'active').length;
            _inactiveCount = _allUsers.where((u) => u['status']?.toString().toLowerCase() == 'inactive').length;
          });
        } else {
          setState(() {
            _users = [];
            _allUsers = [];
            _isLoading = false;
            _error = e.toString();
          });
        }
      } catch (fallbackError) {
        setState(() {
          _users = [];
          _allUsers = [];
          _isLoading = false;
          _error = 'Failed to load users: $e';
        });
      }
    }
  }

  // Roles list - will be updated dynamically
  List<String> _getRoles(BuildContext context) => [
    'All Roles',
    'Student',
    TerminologyService.getInstructorLabel(context),
  ];
  
  final List<String> _statuses = ['All Status', 'Active', 'Inactive'];
  
  List<String> _getDepartments(BuildContext context) {
    if (_departments.isEmpty) {
      return ['All ${TerminologyService.getOrganizationalUnitLabel(context, plural: true)}'];
    }
    final deptNames = _departments.map((d) => d['name']?.toString() ?? 'Unknown').toList();
    return [
      'All ${TerminologyService.getOrganizationalUnitLabel(context, plural: true)}',
      ...deptNames,
    ];
  }

  // Helper to get user full name
  String _getUserName(Map<String, dynamic> user) {
    return user['fullName']?.toString() ?? 
           user['name']?.toString() ?? 
           'Unknown User';
  }

  // Helper to get department name
  String _getDepartmentName(Map<String, dynamic> user) {
    final dept = user['department'];
    if (dept == null) return 'Not assigned';
    if (dept is Map<String, dynamic>) {
      return dept['name']?.toString() ?? 'Unknown';
    }
    return dept.toString();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get filteredUsers {
    // Since filtering is done on backend, return all users
    // But client-side search filter for immediate feedback
    return _users.where((user) {
      // Exclude admin users - only show students and teachers
      final role = user['role']?.toString().toLowerCase() ?? '';
      if (role == 'admin') {
        return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _users.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await Future.delayed(const Duration(milliseconds: 300));
        _loadUsers();
      },
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Error banner
            if (_error != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _error!.contains('cached') 
                      ? Colors.orange.withValues(alpha: 0.1)
                      : AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _error!.contains('cached')
                        ? Colors.orange.withValues(alpha: 0.3)
                        : AppColors.error.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _error!.contains('cached') ? Icons.wifi_off : Icons.error_outline,
                      color: _error!.contains('cached') ? Colors.orange : AppColors.error,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _error!,
                        style: TextStyle(
                          fontSize: 13,
                          color: _error!.contains('cached') 
                              ? Colors.orange.withValues(alpha: 0.9)
                              : AppColors.error.withValues(alpha: 0.9),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Page title section with gradient background
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.1),
                  AppColors.primary.withValues(alpha: 0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.people_alt_outlined,
                    size: 32,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Manage Users',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'View, edit, and manage all users in your institution',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Stats Section - 2x3 Grid (Total Users, Students, Teachers, Active, Inactive)
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total Users',
                  _totalUsers.toString(),
                  Icons.people_outline,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Students',
                  _studentsCount.toString(),
                  Icons.school_outlined,
                  Colors.purple,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Teachers',
                  _teachersCount.toString(),
                  Icons.person_outline,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Active',
                  _activeCount.toString(),
                  Icons.check_circle_outline,
                  Colors.cyan,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                flex: 1,
                child: _buildStatCard(
                  'Inactive',
                  _inactiveCount.toString(),
                  Icons.cancel_outlined,
                  Colors.red,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(flex: 1, child: SizedBox()),
            ],
          ),
          const SizedBox(height: 24),

          // Users List Section Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'User Directory',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getFilterStatusText(),
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
              Material(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: _showSearchFilterModal,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.search,
                          size: 20,
                          color: Colors.white,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Search',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Users list or empty state
          filteredUsers.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: filteredUsers.map((user) => _buildUserRow(user)).toList(),
                ),
          ],
        ),
      ),
    );
  }

  String _getFilterStatusText() {
    final allDepartmentsLabel = 'All ${TerminologyService.getOrganizationalUnitLabel(context, plural: true)}';
    final hasFilters = _selectedRole != 'All Roles' ||
        _selectedStatus != 'All Status' ||
        (_selectedDepartment.isNotEmpty && _selectedDepartment != allDepartmentsLabel) ||
        _searchController.text.isNotEmpty;

    if (hasFilters) {
      return 'Filtered: ${filteredUsers.length} user${filteredUsers.length != 1 ? 's' : ''}';
    }
    return 'All users in your institution';
  }

  void _showSearchFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            height: MediaQuery.of(context).size.height * 0.75,
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Column(
              children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textTertiary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Search & Filter Users',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Search Bar
                    const Text(
                      'Search',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _searchController,
                      enableInteractiveSelection: true,
                      onChanged: (value) => setState(() {}),
                      decoration: InputDecoration(
                        hintText: 'Search by name or email...',
                        hintStyle: TextStyle(
                          fontSize: 14,
                          color: AppColors.textTertiary.withValues(alpha: 0.5),
                        ),
                        prefixIcon: Icon(
                          Icons.search,
                          color: AppColors.textSecondary.withValues(alpha: 0.6),
                        ),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 20),
                                onPressed: () {
                                  setState(() => _searchController.clear());
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: AppColors.background,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Filters Section
                    const Text(
                      'Filters',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Role Filter
                    _buildModalFilterDropdown(
                      label: 'Role',
                      value: _selectedRole,
                      items: _getRoles(context),
                      icon: Icons.person_outline,
                      onChanged: (value) => setState(() => _selectedRole = value!),
                    ),
                    const SizedBox(height: 12),
                    // Status Filter
                    _buildModalFilterDropdown(
                      label: 'Status',
                      value: _selectedStatus,
                      items: _statuses,
                      icon: Icons.circle_outlined,
                      onChanged: (value) => setState(() => _selectedStatus = value!),
                    ),
                    const SizedBox(height: 12),
                    // Department Filter
                    _buildModalFilterDropdown(
                      label: TerminologyService.getOrganizationalUnitLabel(context),
                      value: _selectedDepartment.isEmpty ? _getDepartments(context)[0] : _selectedDepartment,
                      items: _getDepartments(context),
                      icon: Icons.business_outlined,
                      onChanged: (value) => setState(() => _selectedDepartment = value!),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Actions
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _searchController.clear();
                          _selectedRole = 'All Roles';
                          _selectedStatus = 'All Status';
                          _selectedDepartment = '';
                        });
                        _loadUsers();
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(
                          color: AppColors.borderDark.withValues(alpha: 0.3),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Clear All',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _loadUsers();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Apply Filters',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
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
      ),
    );
  }

  Widget _buildStatCard(String label, String count, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withValues(alpha: 0.2),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          // Icon and Label on top
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Value below
          Text(
            count,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModalFilterDropdown({
    required String label,
    required String value,
    required List<String> items,
    required IconData icon,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary.withValues(alpha: 0.9),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.borderDark.withValues(alpha: 0.2),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              icon: Icon(
                Icons.arrow_drop_down,
                color: AppColors.textSecondary,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              ),
              items: items.map((item) {
                return DropdownMenuItem(
                  value: item,
                  child: Row(
                    children: [
                      Icon(
                        icon,
                        size: 18,
                        color: AppColors.textSecondary.withValues(alpha: 0.7),
                      ),
                      const SizedBox(width: 10),
                      Text(item),
                    ],
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_outline,
              size: 80,
              color: AppColors.textTertiary.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No users found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your filters',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textTertiary.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserRow(Map<String, dynamic> user) {
    final userName = _getUserName(user);
    final status = user['status']?.toString().toLowerCase() ?? 'inactive';
    final isActive = status == 'active';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _showUserDetailsModal(user),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // User Photo/Avatar
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary.withValues(alpha: 0.15),
                        AppColors.primary.withValues(alpha: 0.08),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: Text(
                      userName.substring(0, 1).toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                // Name and Role
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userName,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      // Role Badge
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getRoleIcon(user['role'] as String),
                            size: 13,
                            color: AppColors.textSecondary.withValues(alpha: 0.7),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            user['role'] as String,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSecondary.withValues(alpha: 0.85),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Status Indicator
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.success : AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isActive ? 'Active' : 'Inactive',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isActive
                            ? AppColors.success.withValues(alpha: 0.9)
                            : AppColors.error.withValues(alpha: 0.9),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showUserDetailsModal(Map<String, dynamic> user) {
    final userName = _getUserName(user);
    final deptName = _getDepartmentName(user);
    final status = user['status']?.toString().toLowerCase() ?? 'inactive';
    final isActive = status == 'active';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: Container(
            height: MediaQuery.of(context).size.height * 0.7,
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Column(
              children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textTertiary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  const Text(
                    'User Details',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // User Avatar and Name
                    Center(
                      child: Column(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.primary.withValues(alpha: 0.15),
                                  AppColors.primary.withValues(alpha: 0.08),
                                ],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Center(
                              child: Text(
                                userName.substring(0, 1).toUpperCase(),
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 32,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            userName,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _getRoleIcon(user['role'] as String),
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  user['role'] as String,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
                    // User Information
                    const Text(
                      'Information',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      value: user['email']?.toString() ?? 'N/A',
                    ),
                    if (user['phone'] != null) ...[
                      const SizedBox(height: 12),
                      _buildInfoRow(
                        icon: Icons.phone_outlined,
                        label: 'Phone',
                        value: user['phone'].toString(),
                      ),
                    ],
                    const SizedBox(height: 12),
                    _buildInfoRow(
                      icon: Icons.business_outlined,
                      label: 'Department',
                      value: deptName,
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow(
                      icon: Icons.circle_outlined,
                      label: 'Status',
                      value: isActive ? 'Active' : 'Inactive',
                      valueColor: isActive ? AppColors.success : AppColors.error,
                    ),
                    const SizedBox(height: 32),
                    // Actions
                    const Text(
                      'Actions',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Update Button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _showUpdateUserDialog(user);
                        },
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Update User'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: BorderSide(
                            color: AppColors.primary.withValues(alpha: 0.5),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Delete Button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _showDeleteUserDialog(user);
                        },
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Delete User'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: BorderSide(
                            color: AppColors.error.withValues(alpha: 0.5),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ),
    ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.borderDark.withValues(alpha: 0.1),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 20,
              color: AppColors.primary,
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
                    fontSize: 12,
                    color: AppColors.textSecondary.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: valueColor ?? AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showUpdateUserDialog(Map<String, dynamic> user) {
    final nameController = TextEditingController(
      text: _getUserName(user),
    );
    final emailController = TextEditingController(
      text: user['email']?.toString() ?? '',
    );
    final phoneController = TextEditingController(
      text: user['phone']?.toString() ?? '',
    );
    
    String selectedDepartment = '';
    if (user['department'] != null) {
      if (user['department'] is Map) {
        selectedDepartment = user['department']['_id']?.toString() ?? '';
      }
    }
    
    String selectedSemester = '';
    if (user['semester'] != null) {
      if (user['semester'] is Map) {
        selectedSemester = user['semester']['_id']?.toString() ?? '';
      } else {
        selectedSemester = user['semester'].toString();
      }
    }
    
    final status = user['status']?.toString().toLowerCase() ?? 'inactive';
    String selectedStatus = status == 'active' ? 'Active' : 'Inactive';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: StatefulBuilder(
            builder: (context, setModalState) => Container(
              decoration: const BoxDecoration(
                color: AppColors.cardBackground,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Edit User',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                      color: AppColors.textSecondary,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Form Fields
                // Full Name
                RichText(
                  text: const TextSpan(
                    text: 'Full Name ',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                    children: [
                      TextSpan(
                        text: '*',
                        style: TextStyle(color: AppColors.error),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    hintText: 'Enter full name',
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Email
                RichText(
                  text: const TextSpan(
                    text: 'Email ',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                    children: [
                      TextSpan(
                        text: '*',
                        style: TextStyle(color: AppColors.error),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: emailController,
                  decoration: InputDecoration(
                    hintText: 'Enter email',
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Phone
                const Text(
                  'Phone',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: phoneController,
                  decoration: InputDecoration(
                    hintText: 'Enter phone number',
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Department
                const Text(
                  'Department',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: selectedDepartment.isEmpty || 
                         !_departments.any((d) => d['_id'].toString() == selectedDepartment)
                      ? null 
                      : selectedDepartment,
                  hint: const Text('Select department'),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                  isExpanded: true,
                  items: _departments.map((dept) {
                    return DropdownMenuItem<String>(
                      value: dept['_id'].toString(),
                      child: Text(
                        dept['name'].toString(),
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setModalState(() {
                      selectedDepartment = value ?? '';
                    });
                  },
                ),
                const SizedBox(height: 16),
                
                // Semester
                const Text(
                  'Semester',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: selectedSemester.isEmpty || 
                         !_semesters.any((s) => s['_id'].toString() == selectedSemester)
                      ? null 
                      : selectedSemester,
                  hint: const Text('Select semester'),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                  isExpanded: true,
                  items: _semesters.map((sem) {
                    return DropdownMenuItem<String>(
                      value: sem['_id'].toString(),
                      child: Text(
                        sem['name'].toString(),
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setModalState(() {
                      selectedSemester = value ?? '';
                    });
                  },
                ),
                const SizedBox(height: 16),
                
                // Status
                const Text(
                  'Status',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: selectedStatus,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                  isExpanded: true,
                  items: ['Active', 'Inactive'].map((status) {
                    return DropdownMenuItem<String>(
                      value: status,
                      child: Text(status),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setModalState(() {
                      selectedStatus = value ?? 'Inactive';
                    });
                  },
                ),
                const SizedBox(height: 32),
                
                // Action Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 14,
                        ),
                        side: BorderSide(
                          color: AppColors.textSecondary.withValues(alpha: 0.3),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(
                          fontSize: 15,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      onPressed: () async {
                        if (nameController.text.trim().isEmpty || 
                            emailController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Name and Email are required'),
                              backgroundColor: AppColors.error,
                            ),
                          );
                          return;
                        }

                        // Close the bottom sheet first
                        Navigator.pop(context);

                        // Show loading indicator
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (context) => const Center(
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                            ),
                          ),
                        );

                        // Store Navigator and ScaffoldMessenger references before async operations
                        final navigator = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);

                        try {
                          final userId = user['_id'] as String;
                          final userRole = user['role']?.toString().toLowerCase() ?? 'student';
                          
                          final updateData = {
                            'role': userRole,
                            'fullName': nameController.text.trim(),
                            'email': emailController.text.trim(),
                            if (phoneController.text.trim().isNotEmpty)
                              'phone': phoneController.text.trim(),
                            if (selectedDepartment.isNotEmpty)
                              'department': selectedDepartment,
                            if (selectedSemester.isNotEmpty)
                              'semester': selectedSemester,
                            'status': selectedStatus.toLowerCase(),
                          };

                          final response = await _adminRepository.updateUser(userId, updateData);
                          
                          // Reload users to get updated data
                          await _loadUsers();
                          
                          // Close loading dialog using stored navigator reference
                          navigator.pop();
                          
                          // Show success message from backend
                          final message = response['message']?.toString() ?? 'User updated successfully';
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(message),
                              backgroundColor: AppColors.success,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          );
                        } catch (e) {
                          // Close loading dialog using stored navigator reference
                          navigator.pop();
                          
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text('Failed to update user: ${e.toString()}'),
                              backgroundColor: AppColors.error,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.save, size: 18),
                      label: const Text(
                        'Save Changes',
                        style: TextStyle(fontSize: 15),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 14,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ),
    ),
    );
  }

  void _showDeleteUserDialog(Map<String, dynamic> user) {
    final userName = _getUserName(user);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        title: const Text('Delete User'),
        content: Text(
          'Are you sure you want to delete $userName? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              
              // Show loading indicator
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (context) => const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                  ),
                ),
              );
              
              // Store Navigator and ScaffoldMessenger references before async operations
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              
              try {
                final userId = user['_id'] as String;
                final role = user['role']?.toString().toLowerCase() ?? 'student';
                
                final response = await _adminRepository.deleteUser(userId, role);
                
                // Reload users
                await _loadUsers();
                
                // Close loading dialog using stored navigator reference
                navigator.pop();
                
                // Show success message from backend
                final message = response['message']?.toString() ?? '$userName has been removed';
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(message),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                );
              } catch (e) {
                // Close loading dialog using stored navigator reference
                navigator.pop();
                
                messenger.showSnackBar(
                  SnackBar(
                    content: Text('Failed to delete user: ${e.toString()}'),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                );
              }
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getRoleIcon(String role) {
    switch (role.toLowerCase()) {
      case 'student':
        return Icons.school;
      case 'teacher':
        return Icons.person;
      case 'admin':
        return Icons.admin_panel_settings;
      case 'staff':
        return Icons.work_outline;
      default:
        return Icons.person_outline;
    }
  }
}

extension StringExtension on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1).toLowerCase()}';
  }
}
