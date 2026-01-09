import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/models/institution_display_model.dart';

class InstitutionDetailPage extends StatelessWidget {
  final InstitutionDisplayModel institution;

  const InstitutionDetailPage({
    super.key,
    required this.institution,
  });

  @override
  Widget build(BuildContext context) {
    final brandColor = _parseColor(institution.primaryBrandColor);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App bar with institution header
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: brandColor,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.of(context).pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                institution.name,
                style: const TextStyle(
                  color: AppColors.black,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      brandColor,
                      brandColor.withValues(alpha: 0.8),
                    ],
                  ),
                ),
                child: Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.3),
                        width: 2,
                      ),
                    ),
                    child: institution.logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(18),
                            child: Image.network(
                              institution.logoUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  _buildLogoPlaceholder(),
                            ),
                          )
                        : _buildLogoPlaceholder(),
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Quick info section
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.cardBackground,
                    border: Border(
                      bottom: BorderSide(
                        color: AppColors.borderDark.withValues(alpha: 0.2),
                      ),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Type badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: brandColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          institution.type,
                          style: TextStyle(
                            color: brandColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Location
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            color: brandColor,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              institution.fullLocation,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyLarge
                                  ?.copyWith(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.w500,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Stats
                      Row(
                        children: [
                          _buildStatChip(
                            context,
                            Icons.school,
                            '${institution.studentCount}',
                            'Students',
                            brandColor,
                          ),
                          const SizedBox(width: 12),
                          _buildStatChip(
                            context,
                            Icons.person,
                            '${institution.teacherCount}',
                            'Teachers',
                            brandColor,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // About section
                _buildSection(
                  context,
                  'About',
                  Icons.info_outline,
                  brandColor,
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        institution.description,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: AppColors.textSecondary,
                              height: 1.6,
                            ),
                      ),
                    ],
                  ),
                ),

                // Details section
                _buildSection(
                  context,
                  'Details',
                  Icons.list_alt,
                  brandColor,
                  Column(
                    children: [
                      _buildDetailRow(
                        context,
                        'Institution ID',
                        institution.id,
                      ),
                      _buildDetailRow(
                        context,
                        'URL Slug',
                        institution.customUrlSlug,
                      ),
                      _buildDetailRow(
                        context,
                        'City',
                        institution.city,
                      ),
                      _buildDetailRow(
                        context,
                        'Country',
                        institution.country,
                      ),
                      _buildDetailRow(
                        context,
                        'Established',
                        _formatDate(institution.createdAt),
                      ),
                    ],
                  ),
                ),

                // Contact section (placeholder)
                _buildSection(
                  context,
                  'Contact Information',
                  Icons.contact_mail,
                  brandColor,
                  Column(
                    children: [
                      _buildDetailRow(
                        context,
                        'Website',
                        'www.${institution.customUrlSlug}.edu',
                      ),
                      _buildDetailRow(
                        context,
                        'Email',
                        'info@${institution.customUrlSlug}.edu',
                      ),
                      _buildDetailRow(
                        context,
                        'Phone',
                        '+1 (555) 000-0000',
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoPlaceholder() {
    return const Center(
      child: Icon(
        Icons.school_rounded,
        color: Colors.white,
        size: 50,
      ),
    );
  }

  Widget _buildStatChip(
    BuildContext context,
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                  ),
                  Text(
                    label,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    IconData icon,
    Color accentColor,
    Widget content,
  ) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        border: Border(
          bottom: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.2),
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
            child: Row(
              children: [
                Icon(icon, color: accentColor, size: 22),
                const SizedBox(width: 10),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: content,
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
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
