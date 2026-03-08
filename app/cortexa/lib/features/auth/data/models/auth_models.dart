class LoginRequest {
  final String email;
  final String password;
  final String? userType;

  LoginRequest({
    required this.email,
    required this.password,
    this.userType,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        if (userType != null && userType!.isNotEmpty) 'userType': userType,
      };
}

class SignupRequest {
  final String fullName;
  final String email;
  final String password;
  final String username;

  SignupRequest({
    required this.fullName,
    required this.email,
    required this.password,
    required this.username,
  });

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'email': email,
        'password': password,
        'username': username,
      };
}

class AdminRegisterRequest {
  final String fullName;
  final String email;
  final String password;
  final String username;
  final String jobTitle;
  final String phone;
  final String institutionName;
  final String institutionType;
  final String? website;
  final String address1;
  final String city;
  final String state;
  final String country;
  final String? postalCode;
  final String? description;
  final String? customURL;
  final String? brandColor;

  AdminRegisterRequest({
    required this.fullName,
    required this.email,
    required this.password,
    required this.username,
    required this.jobTitle,
    required this.phone,
    required this.institutionName,
    required this.institutionType,
    this.website,
    required this.address1,
    required this.city,
    required this.state,
    required this.country,
    this.postalCode,
    this.description,
    this.customURL,
    this.brandColor,
  });

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'email': email,
        'password': password,
        'username': username,
        'jobTitle': jobTitle,
        'phone': phone,
        'institutionName': institutionName,
        'institutionType': institutionType,
        if (website != null) 'website': website,
        'address1': address1,
        'city': city,
        'state': state,
        'country': country,
        if (postalCode != null) 'postalCode': postalCode,
        if (description != null) 'description': description,
        if (customURL != null) 'customURL': customURL,
        if (brandColor != null) 'brandColor': brandColor,
      };
}

class AuthResponse {
  final bool success;
  final String? message;
  final UserData? user;

  AuthResponse({
    required this.success,
    this.message,
    this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      success: json['success'] as bool? ?? false,
      message: json['message'] as String?,
      user: json['user'] != null
          ? UserData.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }
}

class UserData {
  final String id;
  final String name;
  final String email;
  final String role;

  UserData({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory UserData.fromJson(Map<String, dynamic> json) {
    return UserData(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
      };
}
