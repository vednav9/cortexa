/// Model for Course data from backend
class CourseModel {
  final String id;
  final String name;
  final String code;
  final String? description;
  final DepartmentModel? department;
  final SemesterModel? semesterAvailable;
  final int? credits;
  final bool isActive;

  const CourseModel({
    required this.id,
    required this.name,
    required this.code,
    this.description,
    this.department,
    this.semesterAvailable,
    this.credits,
    this.isActive = true,
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    return CourseModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'],
      department: json['department'] != null
          ? DepartmentModel.fromJson(json['department'])
          : null,
      semesterAvailable: json['semesterAvailable'] != null
          ? SemesterModel.fromJson(json['semesterAvailable'])
          : null,
      credits: json['credits'],
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'code': code,
      'description': description,
      'department': department?.toJson(),
      'semesterAvailable': semesterAvailable?.toJson(),
      'credits': credits,
      'isActive': isActive,
    };
  }
}

/// Model for Department data
class DepartmentModel {
  final String id;
  final String name;
  final String? code;

  const DepartmentModel({
    required this.id,
    required this.name,
    this.code,
  });

  factory DepartmentModel.fromJson(Map<String, dynamic> json) {
    return DepartmentModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'code': code,
    };
  }
}

/// Model for Semester data
class SemesterModel {
  final String id;
  final String name;
  final String? academicYear;

  const SemesterModel({
    required this.id,
    required this.name,
    this.academicYear,
  });

  factory SemesterModel.fromJson(Map<String, dynamic> json) {
    return SemesterModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      academicYear: json['academicYear'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'academicYear': academicYear,
    };
  }
}
