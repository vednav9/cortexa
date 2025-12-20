import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/models/invitation_model.dart';
import '../../data/repositories/mock_dashboard_repository.dart';
import '../widgets/invitation_card.dart';

class NotificationsPage extends StatefulWidget {
  final bool isAdmin;

  const NotificationsPage({
    super.key,
    this.isAdmin = false,
  });

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final _repository = MockDashboardRepository();
  List<InvitationModel> _invitations = [];
  bool _isLoading = true;
  InvitationStatus? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadInvitations();
  }

  Future<void> _loadInvitations() async {
    setState(() => _isLoading = true);
    try {
      final invitations = await _repository.getInvitations();
      setState(() {
        _invitations = invitations;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load notifications: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  List<InvitationModel> get _filteredInvitations {
    if (_selectedStatus == null) return _invitations;
    return _invitations.where((inv) => inv.status == _selectedStatus).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filter chips
        _buildFilterChips(),
        const SizedBox(height: 16),

        // Invitations list
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _filteredInvitations.isEmpty
                  ? _buildEmptyState()
                  : _buildInvitationsList(),
        ),
      ],
    );
  }

  Widget _buildFilterChips() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          bottom: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.3),
          ),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip('All', null),
            const SizedBox(width: 8),
            _buildFilterChip('Pending', InvitationStatus.pending),
            const SizedBox(width: 8),
            _buildFilterChip('Accepted', InvitationStatus.accepted),
            const SizedBox(width: 8),
            _buildFilterChip('Rejected', InvitationStatus.rejected),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, InvitationStatus? status) {
    final isSelected = _selectedStatus == status;
    final count = status == null
        ? _invitations.length
        : _invitations.where((inv) => inv.status == status).length;

    return GestureDetector(
      onTap: () {
        setState(() => _selectedStatus = status);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : AppColors.primary.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.primary,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white.withValues(alpha: 0.2)
                    : AppColors.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: isSelected ? Colors.white : AppColors.primary,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvitationsList() {
    return RefreshIndicator(
      onRefresh: _loadInvitations,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _filteredInvitations.length,
        itemBuilder: (context, index) {
          final invitation = _filteredInvitations[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InvitationCard(
              invitation: invitation,
              onAccept: () => _handleAccept(invitation),
              onReject: () => _handleReject(invitation),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _selectedStatus == null
                ? Icons.notifications_none
                : Icons.inbox_outlined,
            size: 80,
            color: AppColors.textTertiary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            _selectedStatus == null
                ? 'No notifications yet'
                : 'No ${_selectedStatus!.name} invitations',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.isAdmin
                ? 'Sent invitation requests will appear here'
                : 'College invitations will appear here',
            style: TextStyle(
              color: AppColors.textTertiary.withValues(alpha: 0.7),
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _handleAccept(InvitationModel invitation) {
    // TODO: Implement accept logic
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Accepted invitation from ${invitation.institutionName}'),
        backgroundColor: AppColors.success,
      ),
    );
    _loadInvitations();
  }

  void _handleReject(InvitationModel invitation) {
    // TODO: Implement reject logic
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Rejected invitation from ${invitation.institutionName}'),
        backgroundColor: AppColors.error,
      ),
    );
    _loadInvitations();
  }
}
