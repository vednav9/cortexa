import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/bloc/terminology/terminology_bloc.dart';
import '../../../../core/bloc/terminology/terminology_event.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../data/models/institution_display_model.dart';
import '../../data/repositories/mock_dashboard_repository.dart';
import '../widgets/dashboard_drawer.dart';
import '../widgets/institution_tab_view.dart';
import '../widgets/search_filter_modal.dart';
import 'notifications_page.dart';
import 'query_desk_page.dart';
import '../../../institution/presentation/pages/institution_admin_dashboard_page.dart';

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
  String? _selectedState;
  String? _selectedAffiliation;
  String? _selectedBoard;
  String? _selectedStrength;
  
  DashboardTab _currentTab = DashboardTab.dashboard;

  @override
  void initState() {
    super.initState();
    // Load terminology immediately when dashboard loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TerminologyBloc>().add(LoadInstitutionType());
    });
    _loadInstitutions();
  }

  Future<void> _loadMyInstitutions() async {
    final storage = getIt<HiveStorageService>();
    final currentUser = storage.getCurrentUser();
    
    if (currentUser?.institutionId != null && currentUser!.institutionId!.isNotEmpty) {
      var userInstitution = _institutions
          .where((i) => i.id == currentUser.institutionId)
          .toList();
      
      if (userInstitution.isEmpty) {
        final institutionData = storage.findInstitutionById(currentUser.institutionId!);
        if (institutionData != null) {
          try {
            final institution = InstitutionDisplayModel(
              id: (institutionData['id'] as String?) ?? '',
              name: (institutionData['institution_name'] as String?) ?? 'Unknown Institution',
              description: (institutionData['short_description'] as String?) ?? '',
              logoUrl: institutionData['logo_path'] as String?,
              bannerImageUrl: institutionData['banner_image_path'] as String?,
              type: (institutionData['institution_type'] as String?) ?? 'Institute',
              city: (institutionData['city'] as String?) ?? 'Unknown',
              country: (institutionData['country'] as String?) ?? 'Unknown',
              studentCount: 0,
              customUrlSlug: (institutionData['custom_url_slug'] as String?) ?? 'institution',
              primaryBrandColor: (institutionData['primary_brand_color'] as String?) ?? '#34d399',
              createdAt: DateTime.now(),
              isOwnInstitution: true,
            );
            userInstitution = [institution];
            print('✅ [ADMIN] Loaded institution: ${institution.name}');
          } catch (e) {
            print('❌ [ADMIN] Error loading institution: $e');
          }
        }
      }
      
      setState(() {
        _myInstitutions = userInstitution;
      });
    } else {
      setState(() {
        _myInstitutions = [];
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInstitutions() async {
    setState(() => _isLoading = true);
    try {
      // Load institutions from mock repository
      final mockInstitutions = await _repository.getInstitutions();
      
      // Load institutions from Hive storage
      final storage = getIt<HiveStorageService>();
      final storedInstitutions = storage.getAllInstitutions();
      
      // Convert stored institutions to InstitutionDisplayModel
      final savedInstitutions = <InstitutionDisplayModel>[];
      for (var data in storedInstitutions) {
        try {
          final institution = InstitutionDisplayModel(
            id: (data['id'] as String?) ?? '',
            name: (data['institution_name'] as String?) ?? 'Unknown Institution',
            description: (data['short_description'] as String?) ?? '',
            logoUrl: data['logo_path'] as String?,
            bannerImageUrl: data['banner_image_path'] as String?,
            type: (data['institution_type'] as String?) ?? 'Institute',
            city: (data['city'] as String?) ?? 'Unknown',
            country: (data['country'] as String?) ?? 'Unknown',
            studentCount: 0,
            customUrlSlug: (data['custom_url_slug'] as String?) ?? 'institution',
            primaryBrandColor: (data['primary_brand_color'] as String?) ?? '#34d399',
            createdAt: DateTime.now(),
          );
          savedInstitutions.add(institution);
        } catch (e) {
          print('⚠️ Error converting institution data: $e');
          print('📋 Data that caused error: $data');
        }
      }
      
      // Combine mock and saved institutions (avoid duplicates by ID)
      final allInstitutions = <String, InstitutionDisplayModel>{};
      for (final inst in mockInstitutions) {
        allInstitutions[inst.id] = inst;
      }
      for (final inst in savedInstitutions) {
        allInstitutions[inst.id] = inst; // Saved institutions override mock ones
      }
      
      setState(() {
        _institutions = allInstitutions.values.toList();
        _filteredInstitutions = _institutions;
        _isLoading = false;
      });
      
      // Load admin's institutions after main institutions are loaded
      await _loadMyInstitutions();
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
                              (_selectedAffiliation == 'Autonomous' && institution.studentCount > 8000) ||
                              (_selectedAffiliation == 'Aided' && institution.studentCount > 2000 && institution.studentCount <= 4000) ||
                              (_selectedAffiliation == 'Unaided' && institution.studentCount <= 2000);
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

  void _clearFilters() {
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
        onClearFilters: _clearFilters,
        onApplyFilters: _applyFilters,
      ),
    );
  }

  void _navigateToInstitutionDetail(InstitutionDisplayModel institution, bool isFromMyInstitutionsTab) {
    // Only navigate to admin dashboard if:
    // 1. It's the admin's own institution AND
    // 2. Clicked from "My Institutions" tab (not from "Browse Institutions")
    final storage = getIt<HiveStorageService>();
    final currentUser = storage.getCurrentUser();
    final isOwnInstitution = currentUser?.institutionId == institution.id;

    if (isOwnInstitution && isFromMyInstitutionsTab) {
      // Navigate to Institution Admin Dashboard (full environment)
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => InstitutionAdminDashboardPage(
            institution: institution,
          ),
        ),
      );
    } else {
      // Navigate to regular institution detail view (public info only)
      context.pushNamed(
        'institution-detail',
        pathParameters: {'id': institution.id},
        extra: institution,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) {
          context.go('/login');
        } else if (state is AuthAuthenticated) {
          // Reload institutions when user data is updated
          _loadMyInstitutions();
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
            drawer: DashboardDrawer(
              currentTab: _currentTab,
              isAdmin: true,
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
              userEmail: state is AuthAuthenticated ? state.user.email : '',
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
      case DashboardTab.queryDesk:
        return const QueryDeskPage();
    }
  }

  Widget _buildDashboardContent() {
    return InstitutionTabView(
      allInstitutions: _filteredInstitutions,
      myInstitutions: _myInstitutions,
      isLoading: _isLoading,
      onRefresh: _loadInstitutions,
      onInstitutionTap: _navigateToInstitutionDetail,
      userRole: 'admin',
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
