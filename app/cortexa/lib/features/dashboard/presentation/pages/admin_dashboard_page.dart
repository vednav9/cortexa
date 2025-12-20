import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../data/models/institution_display_model.dart';
import '../../data/repositories/mock_dashboard_repository.dart';
import '../widgets/dashboard_drawer.dart';
import '../widgets/institution_tab_view.dart';
import 'notifications_page.dart';
import 'invite_people_page.dart';

class AdminDashboardPage extends StatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  final _repository = MockDashboardRepository();
  final _searchController = TextEditingController();

  List<InstitutionDisplayModel> _institutions = [];
  List<InstitutionDisplayModel> _filteredInstitutions = [];
  List<InstitutionDisplayModel> _myInstitutions = [];
  bool _isLoading = true;
  String? _selectedType;
  String? _selectedCountry;
  DashboardTab _currentTab = DashboardTab.dashboard;

  @override
  void initState() {
    super.initState();
    _loadInstitutions();
    _loadMyInstitutions();
  }

  Future<void> _loadMyInstitutions() async {
    // TODO: Load admin's registered/managed institutions from API
    // For now, using empty list
    setState(() {
      _myInstitutions = [];
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInstitutions() async {
    setState(() => _isLoading = true);
    try {
      final institutions = await _repository.getInstitutions();
      setState(() {
        _institutions = institutions;
        _filteredInstitutions = institutions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load institutions: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredInstitutions = _institutions.where((institution) {
        final matchesSearch = _searchController.text.isEmpty ||
            institution.name
                .toLowerCase()
                .contains(_searchController.text.toLowerCase()) ||
            institution.city
                .toLowerCase()
                .contains(_searchController.text.toLowerCase());

        final matchesType =
            _selectedType == null || institution.type == _selectedType;

        final matchesCountry =
            _selectedCountry == null || institution.country == _selectedCountry;

        return matchesSearch && matchesType && matchesCountry;
      }).toList();
    });
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _selectedType = null;
      _selectedCountry = null;
      _filteredInstitutions = _institutions;
    });
  }

  void _handleInstitutionLogin(InstitutionDisplayModel institution) {
    // Navigate to institution's admin environment
    // TODO: Implement institution environment navigation
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Logging into ${institution.name} admin dashboard...'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _navigateToInstitutionDetail(InstitutionDisplayModel institution) {
    context.pushNamed(
      'institution-detail',
      pathParameters: {'id': institution.id},
      extra: institution,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) {
          context.go('/login');
        }
      },
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          final userName = state is AuthAuthenticated
              ? (state.user.fullName ?? state.user.username)
              : 'Admin';
          final userRole = state is AuthAuthenticated
              ? state.user.role
              : 'Admin';

          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.surface,
              elevation: 0,
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF34D399)],
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'CORTEXA',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                if (_currentTab == DashboardTab.dashboard)
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: _loadInstitutions,
                    tooltip: 'Refresh',
                  ),
              ],
            ),
            drawer: DashboardDrawer(
              currentTab: _currentTab,
              isAdmin: true,
              onTabSelected: (tab) {
                setState(() => _currentTab = tab);
              },
              onLogout: () => _showLogoutDialog(context),
              userName: userName,
              userRole: userRole,
            ),
            body: _buildCurrentTabContent(),
          );
        },
      ),
    );
  }

  Widget _buildCurrentTabContent() {
    switch (_currentTab) {
      case DashboardTab.dashboard:
        return _buildDashboardContent();
      case DashboardTab.notifications:
        return const NotificationsPage(isAdmin: true);
      case DashboardTab.invitePeople:
        return const InvitePeoplePage();
    }
  }

  Widget _buildDashboardContent() {
    return InstitutionTabView(
      allInstitutions: _filteredInstitutions,
      myInstitutions: _myInstitutions,
      isLoading: _isLoading,
      onRefresh: _loadInstitutions,
      onInstitutionTap: _navigateToInstitutionDetail,
      searchAndFilters: _buildSearchAndFilters(),
      userRole: 'admin',
    );
  }

  Widget _buildUserBanner(AuthAuthenticated state) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.1),
            AppColors.primary.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border(
          bottom: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withValues(alpha: 0.2),
            child: Text(
              (state.user.fullName ?? state.user.username)
                  .substring(0, 1)
                  .toUpperCase(),
              style: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back, ${state.user.fullName ?? state.user.username}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        state.user.role.toUpperCase(),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                              fontSize: 10,
                            ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        state.user.email,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        border: Border(
          bottom: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Column(
        children: [
          // Search bar
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search institutions by name or city...',
              prefixIcon: const Icon(Icons.search, color: AppColors.primary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 20),
                      onPressed: () {
                        _searchController.clear();
                        _applyFilters();
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: AppColors.borderDark.withValues(alpha: 0.3),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: AppColors.borderDark.withValues(alpha: 0.3),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
              filled: true,
              fillColor: AppColors.background,
            ),
            onChanged: (value) => _applyFilters(),
          ),
          const SizedBox(height: 12),
          // Filter dropdowns
          Row(
            children: [
              Expanded(
                child: _buildFilterDropdown(
                  hint: 'Type',
                  value: _selectedType,
                  items: _repository.getInstitutionTypes(),
                  onChanged: (value) {
                    setState(() => _selectedType = value);
                    _applyFilters();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildFilterDropdown(
                  hint: 'Country',
                  value: _selectedCountry,
                  items: _repository.getCountries(),
                  onChanged: (value) {
                    setState(() => _selectedCountry = value);
                    _applyFilters();
                  },
                ),
              ),
              if (_selectedType != null || _selectedCountry != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.clear_all, color: AppColors.error),
                  onPressed: _clearFilters,
                  tooltip: 'Clear filters',
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterDropdown({
    required String hint,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: AppColors.borderDark.withValues(alpha: 0.3),
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          hint: Text(
            hint,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
          isExpanded: true,
          icon: const Icon(Icons.arrow_drop_down, color: AppColors.primary),
          dropdownColor: AppColors.cardBackground,
          items: items.map((item) {
            return DropdownMenuItem(
              value: item,
              child: Text(
                item,
                style: const TextStyle(color: AppColors.textPrimary),
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.cardBackground,
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              context.read<AuthBloc>().add(const LogoutRequested());
            },
            child: const Text(
              'Logout',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
