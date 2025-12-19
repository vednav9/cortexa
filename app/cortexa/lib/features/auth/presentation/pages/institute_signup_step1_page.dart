import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/enums.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../admin/data/models/institution_model.dart';

class InstituteSignupStep1Page extends StatefulWidget {
  final InstitutionModel? initialData;
  
  const InstituteSignupStep1Page({super.key, this.initialData});
  
  @override
  State<InstituteSignupStep1Page> createState() => _InstituteSignupStep1PageState();
}

class _InstituteSignupStep1PageState extends State<InstituteSignupStep1Page> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  JobTitle _selectedJobTitle = JobTitle.principal;
  bool _agreeToTerms = false;
  
  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _fullNameController.text = widget.initialData!.adminFullName;
      _usernameController.text = widget.initialData!.adminUsername;
      _emailController.text = widget.initialData!.adminEmail;
      _phoneController.text = widget.initialData!.adminPhoneNumber;
      _selectedJobTitle = JobTitle.fromString(widget.initialData!.adminJobTitle);
    }
  }
  
  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }
  
  void _handleNext() {
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please confirm you are authorized to register this institution'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    
    if (_formKey.currentState!.validate()) {
      final data = InstitutionModel(
        adminFullName: _fullNameController.text.trim(),
        adminUsername: _usernameController.text.trim(),
        adminEmail: _emailController.text.trim(),
        adminPassword: _passwordController.text,
        adminJobTitle: _selectedJobTitle.name,
        adminPhoneNumber: _phoneController.text.trim(),
        institutionName: widget.initialData?.institutionName ?? '',
        institutionType: widget.initialData?.institutionType ?? '',
        institutionWebsite: widget.initialData?.institutionWebsite ?? '',
        addressLine1: widget.initialData?.addressLine1 ?? '',
        city: widget.initialData?.city ?? '',
        stateProvince: widget.initialData?.stateProvince ?? '',
        country: widget.initialData?.country ?? '',
        postalCode: widget.initialData?.postalCode ?? '',
        shortDescription: widget.initialData?.shortDescription ?? '',
        customUrlSlug: widget.initialData?.customUrlSlug ?? '',
        primaryBrandColor: widget.initialData?.primaryBrandColor ?? '#34d399',
        logoPath: widget.initialData?.logoPath,
      );
      
      context.push('/institute-signup/step2', extra: data);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.school_rounded,
                      color: Colors.white,
                      size: 40,
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Title
                Center(
                  child: Text(
                    'Register Your Institution',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    'Join Cortexa as an educational institution',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Progress indicator
                Row(
                  children: [
                    _buildStepIndicator(1, 'Main', true),
                    Expanded(child: _buildStepLine(false)),
                    _buildStepIndicator(2, 'Details', false),
                    Expanded(child: _buildStepLine(false)),
                    _buildStepIndicator(3, 'Branding', false),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                // Full Name
                CustomTextField(
                  label: 'Full Name',
                  hint: 'John Doe',
                  controller: _fullNameController,
                  prefixIcon: const Icon(Icons.person_outline, color: AppColors.primary),
                  validator: Validators.validateName,
                ),
                
                const SizedBox(height: 16),
                
                // Username
                CustomTextField(
                  label: 'Username',
                  hint: 'johndoe',
                  controller: _usernameController,
                  prefixIcon: const Icon(Icons.alternate_email, color: AppColors.primary),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Username is required';
                    }
                    if (value.length < 3) {
                      return 'Username must be at least 3 characters';
                    }
                    if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value)) {
                      return 'Username can only contain letters, numbers, and underscores';
                    }
                    return null;
                  },
                ),
                
                const SizedBox(height: 16),
                
                // Email
                CustomTextField(
                  label: 'Email Address',
                  hint: 'you@institution.edu',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: const Icon(Icons.email_outlined, color: AppColors.primary),
                  validator: Validators.validateEmail,
                ),
                
                const SizedBox(height: 16),
                
                // Password
                CustomTextField(
                  label: 'Password',
                  hint: '••••••••',
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  prefixIcon: const Icon(Icons.lock_outline, color: AppColors.primary),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: AppColors.primary,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  validator: Validators.validatePassword,
                ),
                
                const SizedBox(height: 16),
                
                // Confirm Password
                CustomTextField(
                  label: 'Confirm Password',
                  hint: '••••••••',
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  prefixIcon: const Icon(Icons.lock_outline, color: AppColors.primary),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: AppColors.primary,
                    ),
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  ),
                  validator: (value) => Validators.validateConfirmPassword(value, _passwordController.text),
                ),
                
                const SizedBox(height: 16),
                
                // Job Title
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Job Title',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w500,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.cardBackground,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderDark.withValues(alpha: 0.3)),
                      ),
                      child: DropdownButtonFormField<JobTitle>(
                        value: _selectedJobTitle,
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          border: InputBorder.none,
                          prefixIcon: Icon(Icons.work_outline, color: AppColors.primary),
                        ),
                        dropdownColor: AppColors.cardBackground,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textPrimary),
                        items: JobTitle.values.map((title) {
                          return DropdownMenuItem<JobTitle>(
                            value: title,
                            child: Text(title.displayName),
                          );
                        }).toList(),
                        onChanged: (JobTitle? newTitle) {
                          if (newTitle != null) setState(() => _selectedJobTitle = newTitle);
                        },
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Phone Number
                CustomTextField(
                  label: 'Phone Number',
                  hint: '+1 (555) 000-0000',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.primary),
                  validator: (value) => Validators.validateRequired(value, 'Phone number'),
                ),
                
                const SizedBox(height: 20),
                
                // Authorization checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _agreeToTerms,
                      onChanged: (bool? value) => setState(() => _agreeToTerms = value ?? false),
                      activeColor: AppColors.primary,
                      checkColor: Colors.white,
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: GestureDetector(
                          onTap: () => setState(() => _agreeToTerms = !_agreeToTerms),
                          child: Text(
                            'I confirm I am an authorized representative of this institution and have the authority to register it on Cortexa.',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                
                // Next button
                CustomButton(
                  text: 'Next: Institution Details',
                  onPressed: _handleNext,
                ),
                
                const SizedBox(height: 16),
                
                // Sign in link
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
    );
  }
  
  Widget _buildStepIndicator(int step, String label, bool isActive) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : AppColors.cardBackground,
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive ? AppColors.primary : AppColors.borderDark,
              width: 2,
            ),
          ),
          child: Center(
            child: Text(
              '$step',
              style: TextStyle(
                color: isActive ? Colors.white : AppColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isActive ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
  
  Widget _buildStepLine(bool isActive) {
    return Container(
      height: 2,
      margin: const EdgeInsets.only(bottom: 20),
      color: isActive ? AppColors.primary : AppColors.borderDark,
    );
  }
}
