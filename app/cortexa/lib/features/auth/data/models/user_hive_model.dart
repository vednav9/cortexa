import 'package:hive/hive.dart';
import 'package:equatable/equatable.dart';

part 'user_hive_model.g.dart'; // Generated file

@HiveType(typeId: 0)
class UserHiveModel extends Equatable {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final String username;
  
  @HiveField(2)
  final String email;
  
  @HiveField(3)
  final String? fullName;
  
  @HiveField(4)
  final String? profileImage;
  
  @HiveField(5)
  final DateTime createdAt;
  
  @HiveField(6)
  final DateTime? updatedAt;
  
  @HiveField(7)
  final String role; // Store as string for Hive compatibility
  
  @HiveField(8)
  final String? institutionId; // Institution the user belongs to
  
  @HiveField(9)
  final String? institutionRole; // Role within institution (student/teacher)
  
  @HiveField(10)
  final DateTime? institutionJoinedAt; // When user joined the institution
  
  const UserHiveModel({
    required this.id,
    required this.username,
    required this.email,
    this.fullName,
    this.profileImage,
    required this.createdAt,
    this.updatedAt,
    this.role = 'student', // Default role
    this.institutionId,
    this.institutionRole,
    this.institutionJoinedAt,
  });
  
  // Convert to/from JSON for easy testing
  factory UserHiveModel.fromJson(Map<String, dynamic> json) {
    return UserHiveModel(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      institutionId: json['institution_id'],
      institutionRole: json['institution_role'],
      institutionJoinedAt: json['institution_joined_at'] != null
          ? DateTime.parse(json['institution_joined_at'])
          : null,
      fullName: json['full_name'],
      profileImage: json['profile_image'],
      role: json['role'] ?? 'student',
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null 
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'institution_id': institutionId,
      'institution_role': institutionRole,
      'institution_joined_at': institutionJoinedAt?.toIso8601String(),
      'username': username,
      'email': email,
      'full_name': fullName,
      'profile_image': profileImage,
      'role': role,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
  
  UserHiveModel copyWith({
    String? id,
    String? username,
    String? email,
    String? fullName,
    String? profileImage,
    String? institutionId,
    String? institutionRole,
    DateTime? institutionJoinedAt,
  }) {
    return UserHiveModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      profileImage: profileImage ?? this.profileImage,
      institutionId: institutionId ?? this.institutionId,
      institutionRole: institutionRole ?? this.institutionRole,
      institutionJoinedAt: institutionJoinedAt ?? this.institutionJoinedAt,
      role: role,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
  
  @override
  List<Object?> get props => [
    id,
    username,
    email,
    fullName,
    profileImage,
    role,
    createdAt,
    updatedAt,
    institutionId,
    institutionRole,
    institutionJoinedAt,
  ];
}
