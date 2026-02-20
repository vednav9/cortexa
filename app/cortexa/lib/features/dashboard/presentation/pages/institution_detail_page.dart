import 'package:flutter/material.dart';
import 'dart:io';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/di/service_locator.dart';
import '../../data/models/institution_display_model.dart';
import '../../data/repositories/dashboard_repository.dart';

class InstitutionDetailPage extends StatefulWidget {
  final InstitutionDisplayModel institution;

  const InstitutionDetailPage({
    super.key,
    required this.institution,
  });

  @override
  State<InstitutionDetailPage> createState() => _InstitutionDetailPageState();
}

class _InstitutionDetailPageState extends State<InstitutionDetailPage> {
  final _repository = getIt<DashboardRepository>();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;
  InstitutionDisplayModel? _institutionData;
  double _titleOpacity = 0.0;
  double _bottomNameOpacity = 1.0;

  @override
  void initState() {
    super.initState();
    _loadInstitutionData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Calculate opacity based on scroll position
    // Start fading at 100px, complete fade at 200px
    const double fadeStart = 100.0;
    const double fadeEnd = 200.0;
    
    final offset = _scrollController.offset;
    final titleOpacity = ((offset - fadeStart) / (fadeEnd - fadeStart)).clamp(0.0, 1.0);
    final bottomOpacity = (1.0 - ((offset - fadeStart) / (fadeEnd - fadeStart))).clamp(0.0, 1.0);
    
    if (_titleOpacity != titleOpacity || _bottomNameOpacity != bottomOpacity) {
      setState(() {
        _titleOpacity = titleOpacity;
        _bottomNameOpacity = bottomOpacity;
      });
    }
  }

  Future<void> _loadInstitutionData() async {
    // Start with passed data (from browse API)
    setState(() {
      _institutionData = widget.institution;
      _isLoading = false;
    });

    // Fetch fresh data using slug (like web frontend does)
    // This ensures we get the latest stats and contact info
    if (widget.institution.customUrlSlug.isNotEmpty) {
      _fetchFreshData();
    }
  }

  Future<void> _fetchFreshData() async {
    try {
      print('🔄 Fetching fresh institution data...');
      
      // Use slug-based API (public endpoint, like web frontend)
      final freshData = await _repository.getInstitutionBySlug(
        widget.institution.customUrlSlug,
        forceRefresh: true,
      );

      if (freshData != null && mounted) {
        print('✅ Updated with fresh data:');
        print('   Name: ${freshData.name}');
        print('   Students: ${freshData.studentCount}');
        print('   Teachers: ${freshData.teacherCount}');
        print('   Contact: ${freshData.contactEmail ?? "N/A"}');
        
        setState(() {
          _institutionData = freshData;
        });
      }
    } catch (e) {
      print('⚠️ Could not fetch fresh data: $e');
      // Continue with existing data from browse API
    }
  }

  @override
  Widget build(BuildContext context) {
    final institution = _institutionData ?? widget.institution;
    final brandColor = _parseColor(institution.primaryBrandColor);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : CustomScrollView(
              controller: _scrollController,
              slivers: [
                // Banner with Logo and Name Overlay
                SliverAppBar(
                  expandedHeight: 250,
                  pinned: true,
                  backgroundColor: brandColor,
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  title: Opacity(
                    opacity: _titleOpacity,
                    child: Text(
                      institution.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  flexibleSpace: FlexibleSpaceBar(
                    background: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Banner Image Background
                        if (institution.bannerImageUrl != null &&
                            institution.bannerImageUrl!.isNotEmpty)
                          institution.bannerImageUrl!.startsWith('http')
                              ? Image.network(
                                  institution.bannerImageUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      _buildBannerPlaceholder(brandColor),
                                )
                              : Image.file(
                                  File(institution.bannerImageUrl!),
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) =>
                                      _buildBannerPlaceholder(brandColor),
                                )
                        else
                          _buildBannerPlaceholder(brandColor),

                        // Gradient Overlay
                        Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.3),
                                Colors.black.withValues(alpha: 0.7),
                              ],
                            ),
                          ),
                        ),

                        // Logo and Name Overlay
                        Positioned(
                          bottom: 20,
                          left: 20,
                          right: 20,
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              // Institution Logo
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.3),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: institution.logoUrl != null &&
                                        institution.logoUrl!.isNotEmpty
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(14),
                                        child: institution.logoUrl!
                                                .startsWith('http')
                                            ? Image.network(
                                                institution.logoUrl!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error,
                                                        stackTrace) =>
                                                    _buildLogoPlaceholder(
                                                        brandColor),
                                              )
                                            : Image.file(
                                                File(institution.logoUrl!),
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error,
                                                        stackTrace) =>
                                                    _buildLogoPlaceholder(
                                                        brandColor),
                                              ),
                                      )
                                    : _buildLogoPlaceholder(brandColor),
                              ),
                              const SizedBox(width: 16),
                              // Institution Name and Location
                              Expanded(
                                child: Opacity(
                                  opacity: _bottomNameOpacity,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        institution.name,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 28,
                                          fontWeight: FontWeight.bold,
                                          shadows: [
                                            Shadow(
                                              color: Colors.black54,
                                              blurRadius: 4,
                                            ),
                                          ],
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.location_on,
                                            color: Colors.white,
                                            size: 18,
                                          ),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              '${institution.city}, ${institution.country}',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 16,
                                                shadows: [
                                                  Shadow(
                                                    color: Colors.black54,
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
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Content
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Institution Description
                      if (institution.description.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                          child: Text(
                            institution.description,
                            style: const TextStyle(
                              fontSize: 15,
                              color: AppColors.textSecondary,
                              height: 1.6,
                              letterSpacing: 0.2,
                            ),
                            textAlign: TextAlign.justify,
                          ),
                        ),

                      const SizedBox(height: 32),

                      // Stats Section
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Overview',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.people_outline,
                                    iconColor: Colors.blue,
                                    count: institution.studentCount.toString(),
                                    label: 'Students',
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.person_outline,
                                    iconColor: Colors.green,
                                    count: institution.teacherCount.toString(),
                                    label: 'Teachers',
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.business_outlined,
                                    iconColor: Colors.purple,
                                    count: institution.departmentCount.toString(),
                                    label: 'Departments',
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.calendar_today_outlined,
                                    iconColor: Colors.orange,
                                    count: institution.semesterCount.toString(),
                                    label: 'Semesters',
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStatCard(
                                    icon: Icons.book_outlined,
                                    iconColor: Colors.teal,
                                    count: institution.courseCount.toString(),
                                    label: 'Courses',
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(child: Container()),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                        // About Us Section
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: brandColor.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        Icons.info_outline,
                                        color: brandColor,
                                        size: 26,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    const Text(
                                      'About Us',
                                      style: TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textPrimary,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                Row(
                                  children: [
                                    Expanded(
                                      child: _buildInfoCard(
                                        icon: Icons.account_balance,
                                        iconColor: Colors.blue,
                                        label: 'Type',
                                        value: institution.type,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: _buildInfoCard(
                                        icon: Icons.location_on,
                                        iconColor: Colors.red,
                                        label: 'Location',
                                        value: '${institution.city}, ${institution.country}',
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Contact Information Section
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: brandColor.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        Icons.contact_mail_outlined,
                                        color: brandColor,
                                        size: 26,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    const Text(
                                      'Contact Information',
                                      style: TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textPrimary,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                _buildContactItem(
                                  icon: Icons.email,
                                  iconColor: Colors.pink,
                                  label: 'Email',
                                  value: institution.contactEmail ?? 'contact@${institution.customUrlSlug}.edu',
                                ),
                                const SizedBox(height: 12),
                                _buildContactItem(
                                  icon: Icons.phone,
                                  iconColor: Colors.green,
                                  label: 'Phone',
                                  value: institution.contactPhone ?? 'Contact institution for details',
                                ),
                                const SizedBox(height: 12),
                                _buildContactItem(
                                  icon: Icons.language,
                                  iconColor: Colors.blue,
                                  label: 'Website',
                                  value: institution.contactWebsite ?? 'www.${institution.customUrlSlug}.edu',
                                ),
                              ],
                            ),
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

  Widget _buildBannerPlaceholder(Color brandColor) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            brandColor.withValues(alpha: 0.8),
            brandColor.withValues(alpha: 0.5),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoPlaceholder(Color brandColor) {
    return Center(
      child: Icon(
        Icons.school_rounded,
        color: brandColor,
        size: 40,
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconColor,
    required String count,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 24,
                color: iconColor,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: iconColor,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            count,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: iconColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.borderDark.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: iconColor,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary.withValues(alpha: 0.7),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildContactItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            size: 22,
            color: iconColor,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
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
