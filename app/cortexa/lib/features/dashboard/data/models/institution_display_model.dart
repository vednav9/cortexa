import 'package:equatable/equatable.dart';

/// Simplified institution model for dashboard display
/// This is different from InstitutionModel which is used for registration
class InstitutionDisplayModel extends Equatable {
  final String id;
  final String name;
  final String type; // Institute, College, School, Training Center
  final String? logoUrl;
  final String city;
  final String country;
  final String description;
  final String customUrlSlug; // e.g., "mit.cortexa.com"
  final String primaryBrandColor;
  final bool isOwnInstitution; // True if current user is admin of this institution
  final int studentCount;
  final int teacherCount;
  final DateTime createdAt;

  const InstitutionDisplayModel({
    required this.id,
    required this.name,
    required this.type,
    this.logoUrl,
    required this.city,
    required this.country,
    required this.description,
    required this.customUrlSlug,
    required this.primaryBrandColor,
    this.isOwnInstitution = false,
    this.studentCount = 0,
    this.teacherCount = 0,
    required this.createdAt,
  });

  factory InstitutionDisplayModel.fromJson(Map<String, dynamic> json) {
    return InstitutionDisplayModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'Institute',
      logoUrl: json['logo_url'],
      city: json['city'] ?? '',
      country: json['country'] ?? '',
      description: json['description'] ?? '',
      customUrlSlug: json['custom_url_slug'] ?? '',
      primaryBrandColor: json['primary_brand_color'] ?? '#34d399',
      isOwnInstitution: json['is_own_institution'] ?? false,
      studentCount: json['student_count'] ?? 0,
      teacherCount: json['teacher_count'] ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'logo_url': logoUrl,
      'city': city,
      'country': country,
      'description': description,
      'custom_url_slug': customUrlSlug,
      'primary_brand_color': primaryBrandColor,
      'is_own_institution': isOwnInstitution,
      'student_count': studentCount,
      'teacher_count': teacherCount,
      'created_at': createdAt.toIso8601String(),
    };
  }

  InstitutionDisplayModel copyWith({
    String? id,
    String? name,
    String? type,
    String? logoUrl,
    String? city,
    String? country,
    String? description,
    String? customUrlSlug,
    String? primaryBrandColor,
    bool? isOwnInstitution,
    int? studentCount,
    int? teacherCount,
    DateTime? createdAt,
  }) {
    return InstitutionDisplayModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      logoUrl: logoUrl ?? this.logoUrl,
      city: city ?? this.city,
      country: country ?? this.country,
      description: description ?? this.description,
      customUrlSlug: customUrlSlug ?? this.customUrlSlug,
      primaryBrandColor: primaryBrandColor ?? this.primaryBrandColor,
      isOwnInstitution: isOwnInstitution ?? this.isOwnInstitution,
      studentCount: studentCount ?? this.studentCount,
      teacherCount: teacherCount ?? this.teacherCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  String get fullLocation => '$city, $country';

  @override
  List<Object?> get props => [
        id,
        name,
        type,
        logoUrl,
        city,
        country,
        description,
        customUrlSlug,
        primaryBrandColor,
        isOwnInstitution,
        studentCount,
        teacherCount,
        createdAt,
      ];
}
