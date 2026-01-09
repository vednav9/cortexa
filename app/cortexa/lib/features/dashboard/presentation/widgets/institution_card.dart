import 'package:flutter/material.dart';
import 'dart:io';
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
    final hasLoginButton = institution.isOwnInstitution && userRole == 'admin' && onLoginPressed != null;

    return GestureDetector(
      onTap: onCardTapped,
      child: Container(
        height: 180,
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.white,
            width: 0.5
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, 8),
              spreadRadius: 0,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Background Image (full width) - Using banner image
              Positioned.fill(
                child: institution.bannerImageUrl != null
                    ? _buildBackgroundImage(institution.bannerImageUrl!)
                    : _buildPlaceholderBackground(),
              ),
              // Gradient Overlay (transparent to black, right to left)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerRight,
                      end: Alignment.centerLeft,
                      stops: const [0.0, 0.2, 0.35, 0.5, 0.65, 0.8, 1.0],
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.0),
                        Colors.black.withValues(alpha: 0.25),
                        Colors.black.withValues(alpha: 0.4),
                        Colors.black.withValues(alpha: 0.58),
                        Colors.black.withValues(alpha: 0.75),
                        Colors.black.withValues(alpha: 0.98),
                      ],
                    ),
                  ),
                ),
              ),
              // Content on the left side
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                right: MediaQuery.of(context).size.width * 0.25,
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Institution Name (full name, no ellipsis)
                      Text(
                        institution.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 17,
                          letterSpacing: -0.3,
                          height: 1.2,
                          shadows: [
                            Shadow(
                              color: Colors.black54,
                              offset: Offset(0, 2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.visible,
                      ),
                      const SizedBox(height: 6),
                      // Location
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 18,
                            color: AppColors.primaryLight,
                          ),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              institution.fullLocation,
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                shadows: const [
                                  Shadow(
                                    color: Colors.black54,
                                    offset: Offset(0, 1),
                                    blurRadius: 3,
                                  ),
                                ],
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Description
                      Expanded(
                        child: Text(
                          institution.description,
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            height: 1.5,
                            fontSize: 12,
                            shadows: const [
                              Shadow(
                                color: Colors.black54,
                                offset: Offset(0, 1),
                                blurRadius: 3,
                              ),
                            ],
                          ),
                          maxLines: hasLoginButton ? 2 : 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // Login button (only for admin on own institution)
                      if (hasLoginButton) ...[
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 38,
                          child: ElevatedButton(
                            onPressed: onLoginPressed,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: brandColor,
                              foregroundColor: Colors.white,
                              elevation: 4,
                              shadowColor: brandColor.withValues(alpha: 0.5),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                              ),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.login_rounded, size: 18),
                                SizedBox(width: 8),
                                Text(
                                  'Login to Manage',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBackgroundImage(String imageUrl) {
    // Check if it's a file path (for preview) or network URL
    final isFilePath = imageUrl.startsWith('/') || 
                       imageUrl.contains('\\') || 
                       !imageUrl.startsWith('http');
    
    if (isFilePath) {
      // Local file preview
      final file = File(imageUrl);
      print('📷 Loading banner image from file: $imageUrl');
      print('📷 File exists: ${file.existsSync()}');
      
      if (!file.existsSync()) {
        print('⚠️ Banner image file does not exist, using placeholder');
        return _buildPlaceholderBackground();
      }
      
      return Image.file(
        file,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          print('❌ Error loading banner image file: $error');
          return _buildPlaceholderBackground();
        },
      );
    } else {
      // Network image
      print('📷 Loading banner image from network: $imageUrl');
      return Image.network(
        imageUrl,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            color: AppColors.cardBackground,
            child: Center(
              child: CircularProgressIndicator(
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                    : null,
                color: AppColors.primary,
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          print('❌ Error loading banner image from network: $error');
          return _buildPlaceholderBackground();
        },
      );
    }
  }

  Widget _buildPlaceholderBackground() {
    return Image.asset(
      'assets/images/placeholder_education.png',
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        // Fallback to gradient if asset fails to load
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF10B981),
                Color(0xFF0D1F1A),
                Color(0xFF0F2A1F),
              ],
            ),
          ),
          child: Center(
            child: Icon(
              Icons.school_rounded,
              color: AppColors.primary.withValues(alpha: 0.4),
              size: 80,
            ),
          ),
        );
      },
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
