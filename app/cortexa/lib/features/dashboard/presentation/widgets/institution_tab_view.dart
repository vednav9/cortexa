import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/models/institution_display_model.dart';
import '../widgets/institution_card.dart';

enum InstitutionTabType { allInstitutions, myInstitutions }

class InstitutionTabView extends StatefulWidget {
  final List<InstitutionDisplayModel> allInstitutions;
  final List<InstitutionDisplayModel> myInstitutions;
  final bool isLoading;
  final VoidCallback onRefresh;
  final Function(InstitutionDisplayModel) onInstitutionTap;
  final String userRole;

  const InstitutionTabView({
    super.key,
    required this.allInstitutions,
    required this.myInstitutions,
    required this.isLoading,
    required this.onRefresh,
    required this.onInstitutionTap,
    required this.userRole,
  });

  @override
  State<InstitutionTabView> createState() => _InstitutionTabViewState();
}

class _InstitutionTabViewState extends State<InstitutionTabView> {
  InstitutionTabType _selectedTab = InstitutionTabType.allInstitutions;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tab selector
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            border: Border(
              bottom: BorderSide(
                color: AppColors.borderDark.withValues(alpha: 0.3),
              ),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: _buildTab(
                  'All Institutions',
                  InstitutionTabType.allInstitutions,
                  widget.allInstitutions.length,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildTab(
                  'My Institutions',
                  InstitutionTabType.myInstitutions,
                  widget.myInstitutions.length,
                ),
              ),
            ],
          ),
        ),

        // Content
        Expanded(
          child: widget.isLoading
              ? const Center(child: CircularProgressIndicator())
              : _buildTabContent(),
        ),
      ],
    );
  }

  Widget _buildTab(String label, InstitutionTabType type, int count) {
    final isSelected = _selectedTab == type;

    return GestureDetector(
      onTap: () {
        setState(() => _selectedTab = type);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? AppColors.primary : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 16,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withValues(alpha: 0.2)
                    : AppColors.textTertiary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  color: isSelected
                      ? AppColors.primary
                      : AppColors.textTertiary,
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

  Widget _buildTabContent() {
    final institutions = _selectedTab == InstitutionTabType.allInstitutions
        ? widget.allInstitutions
        : widget.myInstitutions;

    if (institutions.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async => widget.onRefresh(),
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: institutions.length,
        itemBuilder: (context, index) {
          final institution = institutions[index];
          return InstitutionCard(
            institution: institution,
            userRole: widget.userRole,
            onCardTapped: () => widget.onInstitutionTap(institution),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    final isAllColleges = _selectedTab == InstitutionTabType.allInstitutions;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isAllColleges ? Icons.search_off : Icons.school_outlined,
            size: 80,
            color: AppColors.textTertiary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            isAllColleges ? 'No colleges found' : 'No registered institutes',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isAllColleges
                ? 'Try adjusting your search or filters'
                : 'Accept invitations to see your institutes here',
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
}
