import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/models/institution_display_model.dart';

class InstitutionCard extends StatelessWidget {
  final InstitutionDisplayModel institution;
  final String userRole; // 'admin', 'teacher', 'student'
  final VoidCallback? onLoginPressed; // Only for admin on own institution
  final VoidCallback? onCardTapped; // Optional: for viewing details

  const InstitutionCard({
    super.key,
    required this.institution,
    required this.userRole,
    this.onLoginPressed,
    this.onCardTapped,
  });

  @override
  Widget build(BuildContext context) {
    final brandColor = _parseColor(institution.primaryBrandColor);

    return GestureDetector(
      onTap: onCardTapped,
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: institution.isOwnInstitution && userRole == 'admin'
                ? brandColor.withValues(alpha: 0.5)
                : AppColors.borderDark.withValues(alpha: 0.2),
            width: institution.isOwnInstitution && userRole == 'admin' ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: institution.isOwnInstitution && userRole == 'admin'
                  ? brandColor.withValues(alpha: 0.2)
                  : Colors.black.withValues(alpha: 0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Logo placeholder
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: brandColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: brandColor.withValues(alpha: 0.3),
                    width: 2,
                  ),
                ),
                child: institution.logoUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(
                          institution.logoUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              _buildLogoPlaceholder(brandColor),
                        ),
                      )
                    : _buildLogoPlaceholder(brandColor),
              ),
              const SizedBox(width: 16),
              // Institution details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name with "Your Institution" badge
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            institution.name,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (institution.isOwnInstitution &&
                            userRole == 'admin') ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Yours',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 10,
                                  ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Type badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: brandColor.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        institution.type,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: brandColor,
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Location
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 14,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            institution.fullLocation,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppColors.textSecondary,
                                      fontSize: 12,
                                    ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Description
                    Text(
                      institution.description,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                            height: 1.3,
                            fontSize: 12,
                          ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    // Login button (only for admin on own institution)
                    if (institution.isOwnInstitution &&
                        userRole == 'admin' &&
                        onLoginPressed != null) ...[
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: onLoginPressed,
                          icon: const Icon(Icons.login, size: 16),
                          label: const Text('Login to Manage'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: brandColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(
                              vertical: 10,
                              horizontal: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 1,
                            textStyle: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogoPlaceholder(Color brandColor) {
    return Center(
      child: Icon(
        Icons.school_rounded,
        color: brandColor,
        size: 32,
      ),
    );
  }

  Color _parseColor(String hexColor) {
    try {
      final hex = hexColor.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (e) {
      return AppColors.primary;
    }
  }
}
