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
import '../../../admin/data/models/institution_model.dart';
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
          _logoPath = result.files.single.name;
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
  
  void _handleSubmit() {
    if (_formKey.currentState!.validate()) {
      final institutionData = widget.previousData.copyWith(
        customUrlSlug: _urlSlugController.text.trim(),
        primaryBrandColor: '#${_brandColor.value.toRadixString(16).substring(2)}',
        logoPath: _logoPath,
      );
      
      // Create the Admin account in the mock auth repository so they can log in
      try {
        final repo = context.read<AuthBloc>().authRepository;
        repo.registerAdminUser(
          username: institutionData.adminUsername,
          email: institutionData.adminEmail,
          password: institutionData.adminPassword,
          fullName: institutionData.adminFullName,
        );
      } catch (e) {
        // Non-fatal in demo; proceed to success message
        // In production, handle and show proper error
        // ignore: avoid_print
        print('⚠️ Failed to pre-create admin user: $e');
      }

      // TODO: Submit institution data to backend
      // For now, just show success message
      print('Institution Registration Data: ${institutionData.toJson()}');
      if (_logoFile != null) {
        print('Logo file path: ${_logoFile!.path}');
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Institution registration successful! You can now sign in as Admin.'),
          backgroundColor: AppColors.success,
        ),
      );
      
      // Navigate to login
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) context.go('/login');
      });
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
                                    _logoPath ?? 'No file chosen', 
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
                                    '#${_brandColor.value.toRadixString(16).substring(2).toUpperCase()}',
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
                  
                  // Brand Preview
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.cardBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderDark.withValues(alpha: 0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Brand Preview', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: _brandColor,
                                borderRadius: BorderRadius.circular(10),
                                image: _logoFile != null
                                    ? DecorationImage(
                                        image: FileImage(_logoFile!),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: _logoFile == null 
                                  ? Center(
                                      child: Text(
                                        widget.previousData.institutionName.isNotEmpty 
                                          ? widget.previousData.institutionName[0].toUpperCase()
                                          : 'A',
                                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.previousData.institutionName.isEmpty ? 'Your Institution' : widget.previousData.institutionName,
                                    style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                  ),
                                  if (widget.previousData.shortDescription.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        widget.previousData.shortDescription,
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textPrimary),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'cortexa.com/${_urlSlugController.text.isEmpty ? "your-institution" : _urlSlugController.text}',
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
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
