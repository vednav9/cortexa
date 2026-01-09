import 'package:equatable/equatable.dart';

/// Model for displaying user search results
class UserSearchModel extends Equatable {
  final String id;
  final String username;
  final String email;
  final String fullName;
  final String? profileImage;
  final String role; // 'student', 'teacher', 'admin'
  final bool isSelected;

  const UserSearchModel({
    required this.id,
    required this.username,
    required this.email,
    required this.fullName,
    this.profileImage,
    required this.role,
    this.isSelected = false,
  });

  factory UserSearchModel.fromJson(Map<String, dynamic> json) {
    return UserSearchModel(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      profileImage: json['profile_image'],
      role: json['role'] ?? 'student',
      isSelected: json['is_selected'] ?? false,
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
      'is_selected': isSelected,
    };
  }

  UserSearchModel copyWith({
    String? id,
    String? username,
    String? email,
    String? fullName,
    String? profileImage,
    String? role,
    bool? isSelected,
  }) {
    return UserSearchModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      profileImage: profileImage ?? this.profileImage,
      role: role ?? this.role,
      isSelected: isSelected ?? this.isSelected,
    );
  }

  @override
  List<Object?> get props => [id, username, email, fullName, profileImage, role, isSelected];
}
