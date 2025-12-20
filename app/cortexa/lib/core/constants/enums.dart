/// User roles in the system
enum UserRole {
  student('Student'),
  teacher('Teacher'),
  admin('Admin');

  final String displayName;
  const UserRole(this.displayName);

  static UserRole fromString(String role) {
    switch (role.toLowerCase()) {
      case 'student':
        return UserRole.student;
      case 'teacher':
        return UserRole.teacher;
      case 'admin':
        return UserRole.admin;
      default:
        return UserRole.student;
    }
  }
}

/// Job titles for institution admins
enum JobTitle {
  principal('Principal'),
  dean('Dean'),
  director('Director'),
  administrator('Administrator'),
  registrar('Registrar');

  final String displayName;
  const JobTitle(this.displayName);

  static JobTitle fromString(String title) {
    switch (title.toLowerCase()) {
      case 'principal':
        return JobTitle.principal;
      case 'dean':
        return JobTitle.dean;
      case 'director':
        return JobTitle.director;
      case 'administrator':
        return JobTitle.administrator;
      case 'registrar':
        return JobTitle.registrar;
      default:
        return JobTitle.principal;
    }
  }
}

/// Types of educational institutions
enum InstitutionType {
  institute('Institute'),
  college('College'),
  school('School'),
  trainingCenter('Training Center');

  final String displayName;
  const InstitutionType(this.displayName);

  static InstitutionType fromString(String type) {
    switch (type.toLowerCase()) {
      case 'institute':
        return InstitutionType.institute;
      case 'college':
        return InstitutionType.college;
      case 'school':
        return InstitutionType.school;
      case 'training center':
      case 'trainingcenter':
        return InstitutionType.trainingCenter;
      default:
        return InstitutionType.institute;
    }
  }
}
