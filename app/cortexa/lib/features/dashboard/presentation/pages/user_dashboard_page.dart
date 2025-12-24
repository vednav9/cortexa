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
import '../widgets/search_filter_modal.dart';
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
  String? _selectedState;
  String? _selectedAffiliation;
  String? _selectedBoard;
  String? _selectedStrength;

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
        final matchesSearch =
            _searchController.text.isEmpty ||
            institution.name.toLowerCase().contains(
              _searchController.text.toLowerCase(),
            ) ||
            institution.city.toLowerCase().contains(
              _searchController.text.toLowerCase(),
            );

        final matchesType =
            _selectedType == null || institution.type == _selectedType;

        // TODO: State filter will use institution.state when field is added to model
        final matchesState =
            _selectedState == null || institution.country == _selectedState;

        // Affiliation filter
        bool matchesAffiliation = true;
        if (_selectedAffiliation != null) {
          final isGovernment = institution.studentCount > 5000;
          matchesAffiliation = (_selectedAffiliation == 'Government' && isGovernment) ||
                              (_selectedAffiliation == 'Private' && !isGovernment) ||
                              (_selectedAffiliation == 'Semi-Government' && institution.studentCount > 3000 && institution.studentCount <= 5000) ||
                              (_selectedAffiliation == 'Autonomous' && institution.studentCount > 8000);
        }

        // Board filter (for schools and colleges)
        bool matchesBoard = true;
        if (_selectedBoard != null) {
          // In real app, this would come from institution.board field
          matchesBoard = institution.type == 'School' || institution.type == 'College';
        }

        // Student strength filter
        bool matchesStrength = true;
        if (_selectedStrength != null) {
          switch (_selectedStrength) {
            case 'Small (0-1000)':
              matchesStrength = institution.studentCount <= 1000;
              break;
            case 'Medium (1001-5000)':
              matchesStrength = institution.studentCount > 1000 && institution.studentCount <= 5000;
              break;
            case 'Large (5001-20000)':
              matchesStrength = institution.studentCount > 5000 && institution.studentCount <= 20000;
              break;
            case 'Very Large (20000+)':
              matchesStrength = institution.studentCount > 20000;
              break;
          }
        }

        return matchesSearch && matchesType && matchesState && matchesAffiliation && matchesBoard && matchesStrength;
      }).toList();
    });
  }

  void _clearInstitutionFilters() {
    setState(() {
      _searchController.clear();
      _selectedType = null;
      _selectedState = null;
      _selectedAffiliation = null;
      _selectedBoard = null;
      _selectedStrength = null;
      _filteredInstitutions = _institutions;
    });
  }

  void _showSearchFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SearchFilterModal(
        searchController: _searchController,
        selectedType: _selectedType,
        selectedState: _selectedState,
        selectedAffiliation: _selectedAffiliation,
        selectedBoard: _selectedBoard,
        selectedStrength: _selectedStrength,
        onTypeChanged: (value) {
          setState(() => _selectedType = value);
        },
        onStateChanged: (value) {
          setState(() => _selectedState = value);
        },
        onAffiliationChanged: (value) {
          setState(() => _selectedAffiliation = value);
        },
        onBoardChanged: (value) {
          setState(() => _selectedBoard = value);
        },
        onStrengthChanged: (value) {
          setState(() => _selectedStrength = value);
        },
        onClearFilters: _clearInstitutionFilters,
        onApplyFilters: _applyInstitutionFilters,
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
              onProfileTap: () {
                // TODO: Navigate to profile page
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Profile page coming soon'),
                    backgroundColor: AppColors.primary,
                  ),
                );
              },
              userName: userName,
              userRole: userRole,
            ),
            appBar: AppBar(
              backgroundColor: AppColors.surface,
              elevation: 0,
              leading: Builder(
                builder: (context) => IconButton(
                  icon: const Icon(Icons.menu, color: AppColors.primary),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                  padding: EdgeInsets.zero, // <-- This reduces the gap
                  visualDensity: VisualDensity
                      .compact, // Optional: makes icon more compact
                ),
              ),
              title: const Text(
                'CORTEXA',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              // Optionally, you can also adjust the titleSpacing property:
              titleSpacing:
                  0, // <-- This reduces the space between leading and title
              actions: [
                IconButton(
                  icon: const Icon(Icons.search, color: AppColors.primary),
                  onPressed: _showSearchFilterModal,
                  tooltip: 'Search & Filter',
                ),
                const SizedBox(width: 8),
              ],
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
          userRole: userRole,
        );
      },
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
