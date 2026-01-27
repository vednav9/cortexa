import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flex_color_picker/flex_color_picker.dart';
import 'dart:io';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/di/service_locator.dart';
import '../../../admin/data/models/institution_model.dart';
import '../../../dashboard/data/models/institution_display_model.dart';
import '../../../dashboard/presentation/widgets/institution_card.dart';
import '../../data/models/auth_models.dart';
import '../../data/repositories/auth_repository.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_state.dart';

class InstituteSignupStep3Page extends StatefulWidget {
  final InstitutionModel previousData;
  
  const InstituteSignupStep3Page({super.key, required this.previousData});
  
  @override
  State<InstituteSignupStep3Page> createState() => _InstituteSignupStep3PageState();
}

class _InstituteSignupStep3PageState extends State<InstituteSignupStep3Page> {
  final _formKey = GlobalKey<FormState>();
  final _urlSlugController = TextEditingController();
  Color _brandColor = const Color(0xFF34d399);
  String? _logoPath;
  File? _logoFile;
  String? _bannerImagePath;
  File? _bannerImageFile;
  
  @override
  void initState() {
    super.initState();
    if (widget.previousData.customUrlSlug.isNotEmpty) {
      _urlSlugController.text = widget.previousData.customUrlSlug;
      _brandColor = Color(int.parse(widget.previousData.primaryBrandColor.replaceFirst('#', '0xff')));
    }
  }
  
  @override
  void dispose() {
    _urlSlugController.dispose();
    super.dispose();
  }

  InstitutionDisplayModel _buildPreviewModel() {
    final brandHex = (_brandColor.toARGB32() & 0x00FFFFFF)
        .toRadixString(16)
        .padLeft(6, '0');
    return InstitutionDisplayModel(
      id: 'preview',
      name: widget.previousData.institutionName.isEmpty 
          ? 'Your Institution' 
          : widget.previousData.institutionName,
      type: widget.previousData.institutionType,
      logoUrl: _logoFile?.path,
      bannerImageUrl: _bannerImageFile?.path,
      city: widget.previousData.city,
      country: widget.previousData.country,
      description: widget.previousData.shortDescription.isEmpty
          ? 'Your institution description will appear here'
          : widget.previousData.shortDescription,
      customUrlSlug: _urlSlugController.text.isEmpty 
          ? 'your-institution' 
          : _urlSlugController.text,
      primaryBrandColor: '#$brandHex',
      isOwnInstitution: true,
      studentCount: 0,
      teacherCount: 0,
      createdAt: DateTime.now(),
    );
  }
  
  Future<void> _pickColor() async {
    final Color colorBeforeDialog = _brandColor;
    
    if (!mounted) return;
    
    final Color newColor = await showColorPickerDialog(
      context,
      _brandColor,
      title: Text(
        'Pick a Brand Color',
        style: Theme.of(context).textTheme.titleLarge,
      ),
      width: 40,
      height: 40,
      spacing: 0,
      runSpacing: 0,
      borderRadius: 8,
      wheelDiameter: 165,
      enableOpacity: false,
      showColorCode: true,
      colorCodeHasColor: true,
      pickersEnabled: <ColorPickerType, bool>{
        ColorPickerType.both: false,
        ColorPickerType.primary: true,
        ColorPickerType.accent: true,
        ColorPickerType.wheel: true,
      },
      actionButtons: const ColorPickerActionButtons(
        dialogActionButtons: true,
      ),
      copyPasteBehavior: const ColorPickerCopyPasteBehavior(
        parseShortHexCode: true,
      ),
      backgroundColor: AppColors.cardBackground,
      constraints: const BoxConstraints(
        minHeight: 480,
        minWidth: 300,
        maxWidth: 320,
      ),
    );
    
    if (newColor != colorBeforeDialog) {
      setState(() => _brandColor = newColor);
    }
  }
  
  Future<void> _pickLogo() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );
      
      if (result != null && result.files.single.path != null) {
        setState(() {
          _logoPath = result.files.single.path;
          _logoFile = File(result.files.single.path!);
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Logo uploaded successfully!'),
              backgroundColor: AppColors.success,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking file: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _pickBannerImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );
      
      if (result != null && result.files.single.path != null) {
        setState(() {
          _bannerImagePath = result.files.single.path;
          _bannerImageFile = File(result.files.single.path!);
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Banner image uploaded successfully!'),
              backgroundColor: AppColors.success,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking file: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
  
  void _handleSubmit() async {
    if (_formKey.currentState!.validate()) {
      // Show loading indicator
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );

      final brandHex = (_brandColor.toARGB32() & 0x00FFFFFF)
          .toRadixString(16)
          .padLeft(6, '0');
      final institutionData = widget.previousData.copyWith(
        customUrlSlug: _urlSlugController.text.trim(),
        primaryBrandColor: '#$brandHex',
        logoPath: _logoPath,
        bannerImagePath: _bannerImagePath,
      );

      try {
        print('🏫 Starting admin registration...');
        print('📧 Email: ${institutionData.adminEmail}');
        print('🏢 Institution: ${institutionData.institutionName}');
        
        final authRepo = getIt<AuthRepository>();

        final adminRequest = AdminRegisterRequest(
          fullName: institutionData.adminFullName,
          email: institutionData.adminEmail,
          password: institutionData.adminPassword,
          jobTitle: institutionData.adminJobTitle,
          phone: institutionData.adminPhoneNumber,
          institutionName: institutionData.institutionName,
          institutionType: institutionData.institutionType,
          website: institutionData.institutionWebsite.isEmpty ? null : institutionData.institutionWebsite,
          address1: institutionData.addressLine1,
          city: institutionData.city,
          state: institutionData.stateProvince,
          country: institutionData.country,
          postalCode: institutionData.postalCode.isEmpty ? null : institutionData.postalCode,
          description: institutionData.shortDescription.isEmpty ? null : institutionData.shortDescription,
          customURL: institutionData.customUrlSlug.isEmpty ? null : institutionData.customUrlSlug,
          brandColor: institutionData.primaryBrandColor,
        );

        print('📤 Sending registration request...');
        final result = await authRepo.registerAdminWithInstitution(
          adminRequest,
          logoFile: _logoFile,
          bannerFile: _bannerImageFile,
          bannerImagePath: institutionData.bannerImagePath,
          username: institutionData.adminUsername,
        );

        print('✅ Registration successful!');
        print('👤 User: ${result['user']}');
        print('🔑 Token received: ${result['token']?.isNotEmpty ?? false}');

        // Close loading dialog
        if (!mounted) return;
        Navigator.of(context).pop();

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Institution registered successfully!'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 3),
          ),
        );

        // Navigate to admin dashboard
        await Future.delayed(const Duration(milliseconds: 500));
        if (!mounted) return;
        context.go('/admin-dashboard');
        
      } catch (e) {
        print('❌ Registration error: $e');
        
        // Close loading dialog
        if (mounted) {
          Navigator.of(context).pop();
          
          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Registration failed: ${e.toString()}'),
              backgroundColor: AppColors.error,
              duration: const Duration(seconds: 5),
            ),
          );
        }
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
            );
          }
        },
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            padding: EdgeInsets.all(screenWidth * 0.06),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Logo
                  Center(
                    child: Container(
                      width: screenWidth * 0.14,
                      height: screenWidth * 0.14,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Icon(Icons.school_rounded, color: Colors.white, size: screenWidth * 0.07),
                    ),
                  ),
                  
                  SizedBox(height: screenHeight * 0.016),
                  
                  // Title
                  Center(
                    child: Text(
                      'Register Your Institution',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      'Join Cortexa as an educational institution',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Progress indicator
                  Row(
                    children: [
                      _buildStepIndicator(1, 'Main', true),
                      Expanded(child: _buildStepLine(true)),
                      _buildStepIndicator(2, 'Details', true),
                      Expanded(child: _buildStepLine(true)),
                      _buildStepIndicator(3, 'Branding', true),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Institution Logo
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Institution Logo', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.cardBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.borderDark.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                                image: _logoFile != null
                                    ? DecorationImage(
                                        image: FileImage(_logoFile!),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: _logoFile == null 
                                  ? const Icon(Icons.image_outlined, color: AppColors.primary)
                                  : null,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _logoPath != null ? _logoPath!.split('\\').last.split('/').last : 'No file chosen', 
                                    style: const TextStyle(color: AppColors.textPrimary),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Recommended: 500x500px, PNG or JPG', 
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
                                  ),
                                ],
                              ),
                            ),
                            TextButton(
                              onPressed: _pickLogo,
                              child: const Text('Choose File', style: TextStyle(color: AppColors.primary)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Banner Background Image
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Banner Background Image', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.cardBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.borderDark.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 80,
                              height: 60,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                                image: _bannerImageFile != null
                                    ? DecorationImage(
                                        image: FileImage(_bannerImageFile!),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: _bannerImageFile == null 
                                  ? const Icon(Icons.panorama_outlined, color: AppColors.primary)
                                  : null,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _bannerImagePath != null ? _bannerImagePath!.split('\\').last.split('/').last : 'No file chosen', 
                                    style: const TextStyle(color: AppColors.textPrimary),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Recommended: 1200x400px, PNG or JPG', 
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
                                  ),
                                ],
                              ),
                            ),
                            TextButton(
                              onPressed: _pickBannerImage,
                              child: const Text('Choose File', style: TextStyle(color: AppColors.primary)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Custom URL Slug
                  CustomTextField(
                    label: 'Custom URL Slug',
                    hint: 'your-institution',
                    controller: _urlSlugController,
                    prefixIcon: const Icon(Icons.link_outlined, color: AppColors.primary),
                    validator: (value) => Validators.validateRequired(value, 'URL slug'),
                  ),
                  const SizedBox(height: 4),
                  Padding(
                    padding: const EdgeInsets.only(left: 16),
                    child: Text(
                      'This will be your institution\'s unique URL',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Primary Brand Color
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Primary Brand Color', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.cardBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.borderDark.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: _pickColor,
                              child: Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: _brandColor,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppColors.borderDark),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '#${((_brandColor.toARGB32() & 0x00FFFFFF).toRadixString(16).padLeft(6, '0')).toUpperCase()}',
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontFamily: 'monospace',
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Tap to change color',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          color: AppColors.textTertiary,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.only(left: 16),
                        child: Text(
                          'Choose a color that represents your institution\'s brand',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Live Card Preview
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.preview, color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Card Preview',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'This is how your institution will appear in the Browse Colleges list',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      InstitutionCard(
                        institution: _buildPreviewModel(),
                        userRole: 'admin',
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Buttons
                  Row(
                    children: [
                      Expanded(
                        child: CustomButton(
                          text: 'Back',
                          type: ButtonType.secondary,
                          onPressed: () => context.pop(),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: CustomButton(
                          text: 'Submit Registration',
                          onPressed: _handleSubmit,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Already registered? ',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: const Text(
                            'Sign In',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildStepIndicator(int step, String label, bool isActive) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : AppColors.cardBackground,
            shape: BoxShape.circle,
            border: Border.all(color: isActive ? AppColors.primary : AppColors.borderDark, width: 2),
          ),
          child: Center(
            child: step < 3
              ? const Icon(Icons.check, color: Colors.white, size: 18)
              : Text('$step', style: TextStyle(color: isActive ? Colors.white : AppColors.textSecondary, fontWeight: FontWeight.bold, fontSize: 14)),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 11, color: isActive ? AppColors.primary : AppColors.textSecondary)),
      ],
    );
  }
  
  Widget _buildStepLine(bool isActive) {
    return Container(height: 2, margin: const EdgeInsets.only(bottom: 16), color: isActive ? AppColors.primary : AppColors.borderDark);
  }
}
