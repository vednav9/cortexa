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

class UserDashboardPage extends StatefulWidget {
  const UserDashboardPage({super.key});

  @override
  State<UserDashboardPage> createState() => _UserDashboardPageState();
}

class _UserDashboardPageState extends State<UserDashboardPage> {
  final _repository = MockDashboardRepository();
  final _searchController = TextEditingController();

  List<InstitutionDisplayModel> _institutions = [];
  List<InstitutionDisplayModel> _filteredInstitutions = [];
  List<InstitutionDisplayModel> _myInstitutions = [];

  bool _isLoadingInstitutions = true;

  String? _selectedType;
  String? _selectedCountry;
  
  DashboardTab _currentTab = DashboardTab.dashboard;

  @override
  void initState() {
    super.initState();
    _loadInstitutions();
    _loadMyInstitutions();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMyInstitutions() async {
    // TODO: Load user's registered/accepted institutions from API
    // For now, using empty list
    setState(() {
      _myInstitutions = [];
    });
  }

  Future<void> _loadInstitutions() async {
    setState(() => _isLoadingInstitutions = true);
    try {
      final institutions = await _repository.getInstitutions();
      setState(() {
        _institutions = institutions;
        _filteredInstitutions = institutions;
        _isLoadingInstitutions = false;
      });
    } catch (e) {
      setState(() => _isLoadingInstitutions = false);
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

  void _applyInstitutionFilters() {
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

  void _clearInstitutionFilters() {
    setState(() {
      _searchController.clear();
      _selectedType = null;
      _selectedCountry = null;
      _filteredInstitutions = _institutions;
    });
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
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        final userName = authState is AuthAuthenticated 
            ? (authState.user.fullName ?? authState.user.username)
            : '';
        final userRole = authState is AuthAuthenticated 
            ? authState.user.role 
            : '';

        return BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            if (state is AuthUnauthenticated) {
              context.go('/login');
            }
          },
          child: Scaffold(
            backgroundColor: AppColors.background,
            drawer: DashboardDrawer(
              isAdmin: false,
              currentTab: _currentTab,
              onTabSelected: (tab) {
                setState(() => _currentTab = tab);
              },
              onLogout: () => _showLogoutDialog(context),
              userName: userName,
              userRole: userRole,
            ),
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
            ),
        body: _buildCurrentTabContent(),
      ),
        );
      },
    );
  }

  Widget _buildCurrentTabContent() {
    switch (_currentTab) {
      case DashboardTab.dashboard:
        return _buildDashboardContent();
      case DashboardTab.notifications:
        return const NotificationsPage();
      default:
        return _buildDashboardContent();
    }
  }

  Widget _buildDashboardContent() {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        final userRole = authState is AuthAuthenticated 
            ? authState.user.role 
            : 'student';
        
        return InstitutionTabView(
          allInstitutions: _filteredInstitutions,
          myInstitutions: _myInstitutions,
          isLoading: _isLoadingInstitutions,
          onRefresh: _loadInstitutions,
          onInstitutionTap: _navigateToInstitutionDetail,
          searchAndFilters: _buildSearchAndFilters(),
          userRole: userRole,
        );
      },
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
                        _applyInstitutionFilters();
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
            onChanged: (value) => _applyInstitutionFilters(),
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
                    _applyInstitutionFilters();
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
                    _applyInstitutionFilters();
                  },
                ),
              ),
              if (_selectedType != null || _selectedCountry != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.clear_all, color: AppColors.error),
                  onPressed: _clearInstitutionFilters,
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
