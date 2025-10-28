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
  
  const UserHiveModel({
    required this.id,
    required this.username,
    required this.email,
    this.fullName,
    this.profileImage,
    required this.createdAt,
    this.updatedAt,
    this.role = 'student', // Default role
  });
  
  // Convert to/from JSON for easy testing
  factory UserHiveModel.fromJson(Map<String, dynamic> json) {
    return UserHiveModel(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
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
    String? role,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserHiveModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      profileImage: profileImage ?? this.profileImage,
      role: role ?? this.role,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
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
  ];
}
