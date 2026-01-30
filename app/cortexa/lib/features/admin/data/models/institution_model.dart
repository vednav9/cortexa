import 'package:equatable/equatable.dart';

/// Institution model for registration
class InstitutionModel extends Equatable {
  // Admin Details (Step 1)
  final String adminFullName;
  final String adminUsername;
  final String adminEmail;
  final String adminPassword;
  final String adminJobTitle; // Principal, Dean, Co-worker
  final String adminPhoneNumber;
  
  // Institution Details (Step 2)
  final String institutionName;
  final String institutionType; // Institute, College, School, Training Center
  final String institutionWebsite;
  final String addressLine1;
  final String city;
  final String stateProvince;
  final String country;
  final String postalCode;
  final String shortDescription;
  
  // Branding (Step 3)
  final String? logoPath;
  final String? bannerImagePath;
  final String customUrlSlug;
  final String primaryBrandColor;
  
  const InstitutionModel({
    // Admin Details
    required this.adminFullName,
    required this.adminUsername,
    required this.adminEmail,
    required this.adminPassword,
    required this.adminJobTitle,
    required this.adminPhoneNumber,
    
    // Institution Details
    required this.institutionName,
    required this.institutionType,
    required this.institutionWebsite,
    required this.addressLine1,
    required this.city,
    required this.stateProvince,
    required this.country,
    required this.postalCode,
    required this.shortDescription,
    
    // Branding
    this.logoPath,
    this.bannerImagePath,
    required this.customUrlSlug,
    required this.primaryBrandColor,
  });
  
  factory InstitutionModel.fromJson(Map<String, dynamic> json) {
    return InstitutionModel(
      adminFullName: json['admin_full_name'] ?? '',
      adminUsername: json['admin_username'] ?? '',
      adminEmail: json['admin_email'] ?? '',
      adminPassword: json['admin_password'] ?? '',
      adminJobTitle: json['admin_job_title'] ?? '',
      adminPhoneNumber: json['admin_phone_number'] ?? '',
      institutionName: json['institution_name'] ?? '',
      institutionType: json['institution_type'] ?? '',
      institutionWebsite: json['institution_website'] ?? '',
      addressLine1: json['address_line_1'] ?? '',
      city: json['city'] ?? '',
      stateProvince: json['state_province'] ?? '',
      country: json['country'] ?? '',
      postalCode: json['postal_code'] ?? '',
      shortDescription: json['short_description'] ?? '',
      logoPath: json['logo_path'],
      bannerImagePath: json['banner_image_path'],
      customUrlSlug: json['custom_url_slug'] ?? '',
      primaryBrandColor: json['primary_brand_color'] ?? '#34d399',
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'admin_full_name': adminFullName,
      'admin_username': adminUsername,
      'admin_email': adminEmail,
      'admin_password': adminPassword,
      'admin_job_title': adminJobTitle,
      'admin_phone_number': adminPhoneNumber,
      'institution_name': institutionName,
      'institution_type': institutionType,
      'institution_website': institutionWebsite,
      'address_line_1': addressLine1,
      'city': city,
      'state_province': stateProvince,
      'country': country,
      'postal_code': postalCode,
      'short_description': shortDescription,
      'logo_path': logoPath,
      'banner_image_path': bannerImagePath,
      'custom_url_slug': customUrlSlug,
      'primary_brand_color': primaryBrandColor,
    };
  }
  
  InstitutionModel copyWith({
    String? adminFullName,
    String? adminUsername,
    String? adminEmail,
    String? adminPassword,
    String? adminJobTitle,
    String? adminPhoneNumber,
    String? institutionName,
    String? institutionType,
    String? institutionWebsite,
    String? addressLine1,
    String? city,
    String? stateProvince,
    String? country,
    String? postalCode,
    String? shortDescription,
    String? logoPath,
    String? bannerImagePath,
    String? customUrlSlug,
    String? primaryBrandColor,
  }) {
    return InstitutionModel(
      adminFullName: adminFullName ?? this.adminFullName,
      adminUsername: adminUsername ?? this.adminUsername,
      adminEmail: adminEmail ?? this.adminEmail,
      adminPassword: adminPassword ?? this.adminPassword,
      adminJobTitle: adminJobTitle ?? this.adminJobTitle,
      adminPhoneNumber: adminPhoneNumber ?? this.adminPhoneNumber,
      institutionName: institutionName ?? this.institutionName,
      institutionType: institutionType ?? this.institutionType,
      institutionWebsite: institutionWebsite ?? this.institutionWebsite,
      addressLine1: addressLine1 ?? this.addressLine1,
      city: city ?? this.city,
      stateProvince: stateProvince ?? this.stateProvince,
      country: country ?? this.country,
      postalCode: postalCode ?? this.postalCode,
      shortDescription: shortDescription ?? this.shortDescription,
      logoPath: logoPath ?? this.logoPath,
      bannerImagePath: bannerImagePath ?? this.bannerImagePath,
      customUrlSlug: customUrlSlug ?? this.customUrlSlug,
      primaryBrandColor: primaryBrandColor ?? this.primaryBrandColor,
    );
  }
  
  @override
  List<Object?> get props => [
    adminFullName,
    adminUsername,
    adminEmail,
    adminPassword,
    adminJobTitle,
    adminPhoneNumber,
    institutionName,
    institutionType,
    institutionWebsite,
    addressLine1,
    city,
    stateProvince,
    country,
    postalCode,
    shortDescription,
    logoPath,
    bannerImagePath,
    customUrlSlug,
    primaryBrandColor,
  ];
}
