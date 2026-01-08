import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/constants/enums.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/widgets/custom_text_field.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../admin/data/models/institution_model.dart';

class InstituteSignupStep2Page extends StatefulWidget {
  final InstitutionModel previousData;
  
  const InstituteSignupStep2Page({super.key, required this.previousData});
  
  @override
  State<InstituteSignupStep2Page> createState() => _InstituteSignupStep2PageState();
}

class _InstituteSignupStep2PageState extends State<InstituteSignupStep2Page> {
  final _formKey = GlobalKey<FormState>();
  final _institutionNameController = TextEditingController();
  final _websiteController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _countryController = TextEditingController();
  final _postalCodeController = TextEditingController();
  final _descriptionController = TextEditingController();
  InstitutionType _selectedType = InstitutionType.institute;
  
  @override
  void initState() {
    super.initState();
    if (widget.previousData.institutionName.isNotEmpty) {
      _institutionNameController.text = widget.previousData.institutionName;
      _websiteController.text = widget.previousData.institutionWebsite;
      _addressController.text = widget.previousData.addressLine1;
      _cityController.text = widget.previousData.city;
      _stateController.text = widget.previousData.stateProvince;
      _countryController.text = widget.previousData.country;
      _postalCodeController.text = widget.previousData.postalCode;
      _descriptionController.text = widget.previousData.shortDescription;
      _selectedType = InstitutionType.fromString(widget.previousData.institutionType);
    }
  }
  
  @override
  void dispose() {
    _institutionNameController.dispose();
    _websiteController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _postalCodeController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
  
  void _handleNext() {
    if (_formKey.currentState!.validate()) {
      final data = widget.previousData.copyWith(
        institutionName: _institutionNameController.text.trim(),
        institutionType: _selectedType.name,
        institutionWebsite: _websiteController.text.trim(),
        addressLine1: _addressController.text.trim(),
        city: _cityController.text.trim(),
        stateProvince: _stateController.text.trim(),
        country: _countryController.text.trim(),
        postalCode: _postalCodeController.text.trim(),
        shortDescription: _descriptionController.text.trim(),
      );
      
      context.push('/institute-signup/step3', extra: data);
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
          physics: const ClampingScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo
                Center(
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: const Icon(Icons.school_rounded, color: Colors.white, size: 30),
                  ),
                ),
                
                const SizedBox(height: 16),
                
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
                    Expanded(child: _buildStepLine(false)),
                    _buildStepIndicator(3, 'Branding', false),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Institution Name
                CustomTextField(
                  label: 'Institution Name',
                  hint: 'ABC University',
                  controller: _institutionNameController,
                  prefixIcon: const Icon(Icons.business_outlined, color: AppColors.primary),
                  validator: (value) => Validators.validateRequired(value, 'Institution name'),
                ),
                
                const SizedBox(height: 16),
                
                // Institution Type
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Institution Type', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.cardBackground,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderDark.withValues(alpha: 0.3)),
                      ),
                      child: DropdownButtonFormField<InstitutionType>(
                        initialValue: _selectedType,
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          border: InputBorder.none,
                          prefixIcon: Icon(Icons.category_outlined, color: AppColors.primary),
                        ),
                        dropdownColor: AppColors.cardBackground,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textPrimary),
                        items: InstitutionType.values.map((type) {
                          return DropdownMenuItem<InstitutionType>(value: type, child: Text(type.displayName));
                        }).toList(),
                        onChanged: (InstitutionType? newType) {
                          if (newType != null) setState(() => _selectedType = newType);
                        },
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Website
                CustomTextField(
                  label: 'Institution Website',
                  hint: 'https://institution.edu',
                  controller: _websiteController,
                  keyboardType: TextInputType.url,
                  prefixIcon: const Icon(Icons.language_outlined, color: AppColors.primary),
                  validator: (value) => Validators.validateRequired(value, 'Website'),
                ),
                
                const SizedBox(height: 16),
                
                // Address
                CustomTextField(
                  label: 'Address Line 1',
                  hint: '123 Education Street',
                  controller: _addressController,
                  prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.primary),
                  validator: (value) => Validators.validateRequired(value, 'Address'),
                ),
                
                const SizedBox(height: 16),
                
                // City and State
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        label: 'City',
                        hint: 'Mumbai',
                        controller: _cityController,
                        validator: (value) => Validators.validateRequired(value, 'City'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: CustomTextField(
                        label: 'State/Province',
                        hint: 'Maharashtra',
                        controller: _stateController,
                        validator: (value) => Validators.validateRequired(value, 'State'),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Country and Postal Code
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        label: 'Country',
                        hint: 'India',
                        controller: _countryController,
                        validator: (value) => Validators.validateRequired(value, 'Country'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: CustomTextField(
                        label: 'Postal Code',
                        hint: '00000',
                        controller: _postalCodeController,
                        keyboardType: TextInputType.number,
                        validator: (value) => Validators.validateRequired(value, 'Postal code'),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Short Description
                CustomTextField(
                  label: 'Short Description',
                  hint: 'Brief description of your institution...',
                  controller: _descriptionController,
                  maxLines: 4,
                  validator: (value) => Validators.validateRequired(value, 'Description'),
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
                    const SizedBox(width: 16),
                    Expanded(
                      flex: 2,
                      child: CustomButton(
                        text: 'Next: Branding',
                        onPressed: _handleNext,
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
            child: isActive && step == 1 
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
