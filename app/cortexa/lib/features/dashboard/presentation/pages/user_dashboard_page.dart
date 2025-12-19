import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../data/models/institution_display_model.dart';
import '../../data/models/invitation_model.dart';
import '../../data/repositories/mock_dashboard_repository.dart';
import '../widgets/institution_card.dart';
import '../widgets/invitation_card.dart';

class UserDashboardPage extends StatefulWidget {
  const UserDashboardPage({super.key});

  @override
  State<UserDashboardPage> createState() => _UserDashboardPageState();
}

class _UserDashboardPageState extends State<UserDashboardPage>
    with SingleTickerProviderStateMixin {
  final _repository = MockDashboardRepository();
  final _searchController = TextEditingController();

  late TabController _tabController;

  List<InstitutionDisplayModel> _institutions = [];
  List<InstitutionDisplayModel> _filteredInstitutions = [];
  List<InvitationModel> _invitations = [];
  List<InvitationModel> _filteredInvitations = [];

  bool _isLoadingInstitutions = true;
  bool _isLoadingInvitations = true;

  String? _selectedType;
  String? _selectedCountry;
  InvitationStatus? _selectedInvitationStatus;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadInstitutions();
    _loadInvitations();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    // Clear search when switching tabs
    _searchController.clear();
    if (_tabController.index == 0) {
      _applyInstitutionFilters();
    } else {
      _applyInvitationFilters();
    }
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

  Future<void> _loadInvitations() async {
    setState(() => _isLoadingInvitations = true);
    try {
      final invitations = await _repository.getInvitations();
      setState(() {
        _invitations = invitations;
        _filteredInvitations = invitations;
        _isLoadingInvitations = false;
      });
    } catch (e) {
      setState(() => _isLoadingInvitations = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load invitations: $e'),
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

  void _applyInvitationFilters() {
    setState(() {
      _filteredInvitations = _invitations.where((invitation) {
        final matchesSearch = _searchController.text.isEmpty ||
            invitation.institutionName
                .toLowerCase()
                .contains(_searchController.text.toLowerCase());

        final matchesStatus = _selectedInvitationStatus == null ||
            invitation.status == _selectedInvitationStatus;

        return matchesSearch && matchesStatus;
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

  void _clearInvitationFilters() {
    setState(() {
      _searchController.clear();
      _selectedInvitationStatus = null;
      _filteredInvitations = _invitations;
    });
  }

  Future<void> _handleAcceptInvitation(InvitationModel invitation) async {
    try {
      await _repository.acceptInvitation(invitation.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Accepted invitation from ${invitation.institutionName}'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadInvitations(); // Refresh the list
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to accept invitation: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _handleRejectInvitation(InvitationModel invitation) async {
    try {
      await _repository.rejectInvitation(invitation.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Rejected invitation from ${invitation.institutionName}'),
            backgroundColor: AppColors.warning,
          ),
        );
        _loadInvitations(); // Refresh the list
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to reject invitation: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
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
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Cortexa Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                if (_tabController.index == 0) {
                  _loadInstitutions();
                } else {
                  _loadInvitations();
                }
              },
              tooltip: 'Refresh',
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () => _showLogoutDialog(context),
              tooltip: 'Logout',
            ),
          ],
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            tabs: [
              Tab(
                icon: const Icon(Icons.school_outlined),
                text: 'Institutions',
              ),
              Tab(
                icon: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.mail_outline),
                    if (_invitations
                        .where((inv) => inv.status == InvitationStatus.pending)
                        .isNotEmpty) ...[
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppColors.error,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${_invitations.where((inv) => inv.status == InvitationStatus.pending).length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                text: 'Invitations',
              ),
            ],
          ),
        ),
        body: Column(
          children: [
            // User info banner
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                if (state is AuthAuthenticated) {
                  return _buildUserBanner(state);
                }
                return const SizedBox.shrink();
              },
            ),
            // Tab content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildInstitutionsTab(),
                  _buildInvitationsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
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

  Widget _buildInstitutionsTab() {
    return Column(
      children: [
        _buildInstitutionSearchAndFilters(),
        Expanded(
          child: _isLoadingInstitutions
              ? const Center(child: CircularProgressIndicator())
              : _filteredInstitutions.isEmpty
                  ? _buildEmptyState('No institutions found')
                  : _buildInstitutionList(),
        ),
      ],
    );
  }

  Widget _buildInvitationsTab() {
    return Column(
      children: [
        _buildInvitationSearchAndFilters(),
        Expanded(
          child: _isLoadingInvitations
              ? const Center(child: CircularProgressIndicator())
              : _filteredInvitations.isEmpty
                  ? _buildEmptyState('No invitations found')
                  : _buildInvitationList(),
        ),
      ],
    );
  }

  Widget _buildInstitutionSearchAndFilters() {
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
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search institutions...',
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

  Widget _buildInvitationSearchAndFilters() {
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
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search invitations...',
              prefixIcon: const Icon(Icons.search, color: AppColors.primary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 20),
                      onPressed: () {
                        _searchController.clear();
                        _applyInvitationFilters();
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
            onChanged: (value) => _applyInvitationFilters(),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildInvitationStatusDropdown(),
              ),
              if (_selectedInvitationStatus != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.clear_all, color: AppColors.error),
                  onPressed: _clearInvitationFilters,
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

  Widget _buildInvitationStatusDropdown() {
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
        child: DropdownButton<InvitationStatus>(
          value: _selectedInvitationStatus,
          hint: Text(
            'Status',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
          isExpanded: true,
          icon: const Icon(Icons.arrow_drop_down, color: AppColors.primary),
          dropdownColor: AppColors.cardBackground,
          items: InvitationStatus.values.map((status) {
            return DropdownMenuItem(
              value: status,
              child: Text(
                status.displayName,
                style: const TextStyle(color: AppColors.textPrimary),
              ),
            );
          }).toList(),
          onChanged: (value) {
            setState(() => _selectedInvitationStatus = value);
            _applyInvitationFilters();
          },
        ),
      ),
    );
  }

  Widget _buildInstitutionList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredInstitutions.length,
      itemBuilder: (context, index) {
        final institution = _filteredInstitutions[index];
        return InstitutionCard(
          institution: institution,
          userRole: 'student', // or 'teacher' based on actual user role
          onCardTapped: () => _navigateToInstitutionDetail(institution),
        );
      },
    );
  }

  Widget _buildInvitationList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredInvitations.length,
      itemBuilder: (context, index) {
        final invitation = _filteredInvitations[index];
        return InvitationCard(
          invitation: invitation,
          onAccept: () => _handleAcceptInvitation(invitation),
          onReject: () => _handleRejectInvitation(invitation),
        );
      },
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _tabController.index == 0
                  ? Icons.search_off
                  : Icons.mail_outline,
              size: 80,
              color: AppColors.textSecondary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              _tabController.index == 0
                  ? 'Try adjusting your search or filters'
                  : 'You have no pending invitations',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
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
