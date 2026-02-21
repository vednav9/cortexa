import 'course_model.dart';

/// Model for Student data from backend
class StudentModel {
  final String id;
  final String fullName;
  final String email;
  final String username;
  final String? phone;
  final DepartmentModel? department;
  final SemesterModel? semester;
  final List<CourseModel> enrolledCourses;
  final String status;

  const StudentModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.username,
    this.phone,
    this.department,
    this.semester,
    this.enrolledCourses = const [],
    this.status = 'active',
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    return StudentModel(
      id: json['_id'] ?? json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      phone: json['phone'],
      department: json['department'] != null
          ? DepartmentModel.fromJson(json['department'])
          : null,
      semester: json['semester'] != null
          ? SemesterModel.fromJson(json['semester'])
          : null,
      enrolledCourses: json['enrolledCourses'] != null
          ? (json['enrolledCourses'] as List)
              .map((course) => CourseModel.fromJson(course))
              .toList()
          : [],
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'fullName': fullName,
      'email': email,
      'username': username,
      'phone': phone,
      'department': department?.toJson(),
      'semester': semester?.toJson(),
      'enrolledCourses': enrolledCourses.map((c) => c.toJson()).toList(),
      'status': status,
    };
  }

  /// Get initials from full name
  String get initials {
    final names = fullName.trim().split(' ');
    if (names.isEmpty) return '?';
    if (names.length == 1) return names[0][0].toUpperCase();
    return '${names.first[0]}${names.last[0]}'.toUpperCase();
  }
}
