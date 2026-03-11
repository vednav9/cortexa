import '../constants/enums.dart';

/// Terminology configuration for different institution types
/// Maps abstract terms to institution-specific terminology
class TerminologyConfig {
  /// Get label for organizational unit (Department/Division/Batch)
  static String getOrganizationalUnitLabel(InstitutionType type, {bool plural = false}) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return plural ? 'Departments' : 'Department';
      case InstitutionType.school:
        return plural ? 'Divisions' : 'Division';
      case InstitutionType.trainingCenter:
        return plural ? 'Batches' : 'Batch';
    }
  }

  /// Get label for learning program (Course/Subject/Module)
  static String getLearningProgramLabel(InstitutionType type, {bool plural = false}) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return plural ? 'Courses' : 'Course';
      case InstitutionType.school:
        return plural ? 'Subjects' : 'Subject';
      case InstitutionType.trainingCenter:
        return plural ? 'Modules' : 'Module';
    }
  }

  /// Get label for time period (Semester/Grade/Course)
  static String getTimePeriodLabel(InstitutionType type, {bool plural = false}) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return plural ? 'Semesters' : 'Semester';
      case InstitutionType.school:
        return plural ? 'Grades' : 'Grade';
      case InstitutionType.trainingCenter:
        return plural ? 'Courses' : 'Course';
    }
  }

  /// Get label for instructor (Teacher/Teacher/Teacher)
  static String getInstructorLabel(InstitutionType type, {bool plural = false}) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
      case InstitutionType.school:
      case InstitutionType.trainingCenter:
        return plural ? 'Teachers' : 'Teacher';
    }
  }

  /// Get field configuration for organizational unit
  static OrganizationalUnitFields getOrganizationalUnitFields(InstitutionType type) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return OrganizationalUnitFields(
          nameLabel: 'Department Name',
          nameHint: 'e.g., Computer Science',
          codeLabel: 'Department Code',
          codeHint: 'e.g., CS',
          descriptionLabel: 'Description',
          descriptionHint: 'Brief description of the department',
          showCode: true,
          showDescription: true,
        );
      case InstitutionType.school:
        return OrganizationalUnitFields(
          nameLabel: 'Division Name',
          nameHint: 'e.g., A, B, C',
          codeLabel: 'Division Code',
          codeHint: 'e.g., 10-A',
          descriptionLabel: 'Description',
          descriptionHint: 'Additional details',
          showCode: true,
          showDescription: true,
          additionalLabel1: 'Class Teacher',
          additionalHint1: 'e.g., Mrs. Smith',
        );
      case InstitutionType.trainingCenter:
        return OrganizationalUnitFields(
          nameLabel: 'Batch Name',
          nameHint: 'e.g., Web Development - Jan 2026',
          codeLabel: 'Batch Code',
          codeHint: 'e.g., WD-01',
          descriptionLabel: 'Description',
          descriptionHint: 'Brief description of the batch',
          showCode: true,
          showDescription: true,
          additionalLabel1: 'Start Date',
          additionalHint1: 'When does this batch start?',
        );
    }
  }

  /// Get field configuration for learning program
  static LearningProgramFields getLearningProgramFields(InstitutionType type) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return LearningProgramFields(
          codeLabel: 'Subject Code',
          codeHint: 'e.g., CS101',
          nameLabel: 'Subject Name',
          nameHint: 'e.g., Introduction to Programming',
          creditsLabel: 'Credits',
          creditsHint: 'e.g., 3',
          descriptionLabel: 'Description',
          departmentLabel: 'Department',
          maxCapacityLabel: 'Max Capacity',
          showCredits: true,
          showDepartment: true,
          showMaxCapacity: true,
        );
      case InstitutionType.school:
        return LearningProgramFields(
          codeLabel: 'Subject Code',
          codeHint: 'e.g., MATH10',
          nameLabel: 'Subject Name',
          nameHint: 'e.g., Mathematics',
          creditsLabel: 'Total Hours',
          creditsHint: 'e.g., 120',
          descriptionLabel: 'Description',
          departmentLabel: 'Class',
          maxCapacityLabel: 'Max Students',
          showCredits: true,
          showDepartment: true,
          showMaxCapacity: true,
        );
      case InstitutionType.trainingCenter:
        return LearningProgramFields(
          codeLabel: 'Module Code',
          codeHint: 'e.g., WD-M01',
          nameLabel: 'Module Name',
          nameHint: 'e.g., HTML & CSS Fundamentals',
          creditsLabel: 'Duration (Hours)',
          creditsHint: 'e.g., 40',
          descriptionLabel: 'Description',
          departmentLabel: 'Batch',
          maxCapacityLabel: 'Max Participants',
          showCredits: true,
          showDepartment: true,
          showMaxCapacity: true,
        );
    }
  }

  /// Get field configuration for time period
  static TimePeriodFields getTimePeriodFields(InstitutionType type) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return TimePeriodFields(
          nameLabel: 'Semester Name',
          nameHint: 'e.g., Fall 2026',
          yearLabel: 'Academic Year',
          yearHint: 'e.g., 2026-2027',
          startDateLabel: 'Start Date',
          endDateLabel: 'End Date',
          activeLabel: 'Mark as active semester',
          showYear: true,
          showDates: true,
          showActive: true,
        );
      case InstitutionType.school:
        return TimePeriodFields(
          nameLabel: 'Grade/Standard',
          nameHint: 'e.g., 10th Standard',
          yearLabel: 'Academic Year',
          yearHint: 'e.g., 2026-2027',
          startDateLabel: 'Academic Calendar Start',
          endDateLabel: 'Academic Calendar End',
          activeLabel: 'Mark as current grade',
          showYear: true,
          showDates: true,
          showActive: true,
        );
      case InstitutionType.trainingCenter:
        return TimePeriodFields(
          nameLabel: 'Course Name',
          nameHint: 'e.g., Full Stack Development',
          yearLabel: 'Year',
          yearHint: 'e.g., 2026',
          startDateLabel: 'Academic Calendar Start',
          endDateLabel: 'Academic Calendar End',
          activeLabel: 'Mark as active course',
          showYear: true,
          showDates: true,
          showActive: true,
        );
    }
  }

  /// Get description for organizational unit tab
  static String getOrganizationalUnitDescription(InstitutionType type) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return 'Organize and manage academic departments';
      case InstitutionType.school:
        return 'Manage divisions and sections';
      case InstitutionType.trainingCenter:
        return 'Organize training batches and groups';
    }
  }

  /// Get description for learning program tab
  static String getLearningProgramDescription(InstitutionType type) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return 'Manage courses and curricula';
      case InstitutionType.school:
        return 'Manage subjects and syllabus';
      case InstitutionType.trainingCenter:
        return 'Manage training modules and content';
    }
  }

  /// Get description for time period tab
  static String getTimePeriodDescription(InstitutionType type) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return 'Manage academic semesters and terms';
      case InstitutionType.school:
        return 'Manage grades and standards';
      case InstitutionType.trainingCenter:
        return 'Manage courses and academic calendar';
    }
  }

  /// Get description for instructor tab
  static String getInstructorDescription(InstitutionType type) {
    switch (type) {
      case InstitutionType.college:
      case InstitutionType.institute:
        return 'Manage teaching staff and their departments';
      case InstitutionType.school:
        return 'Manage teaching staff and their divisions';
      case InstitutionType.trainingCenter:
        return 'Manage teaching staff and their batches';
    }
  }
}

/// Field configuration for organizational unit (Department/Class/Batch)
class OrganizationalUnitFields {
  final String nameLabel;
  final String nameHint;
  final String codeLabel;
  final String codeHint;
  final String descriptionLabel;
  final String descriptionHint;
  final bool showCode;
  final bool showDescription;
  final String? additionalLabel1;
  final String? additionalHint1;

  OrganizationalUnitFields({
    required this.nameLabel,
    required this.nameHint,
    required this.codeLabel,
    required this.codeHint,
    required this.descriptionLabel,
    required this.descriptionHint,
    this.showCode = true,
    this.showDescription = true,
    this.additionalLabel1,
    this.additionalHint1,
  });
}

/// Field configuration for learning program (Course/Subject/Program)
class LearningProgramFields {
  final String codeLabel;
  final String codeHint;
  final String nameLabel;
  final String nameHint;
  final String creditsLabel;
  final String creditsHint;
  final String descriptionLabel;
  final String departmentLabel;
  final String maxCapacityLabel;
  final bool showCredits;
  final bool showDepartment;
  final bool showMaxCapacity;

  LearningProgramFields({
    required this.codeLabel,
    required this.codeHint,
    required this.nameLabel,
    required this.nameHint,
    required this.creditsLabel,
    required this.creditsHint,
    required this.descriptionLabel,
    required this.departmentLabel,
    required this.maxCapacityLabel,
    this.showCredits = true,
    this.showDepartment = true,
    this.showMaxCapacity = true,
  });
}

/// Field configuration for time period (Semester/Year/Session)
class TimePeriodFields {
  final String nameLabel;
  final String nameHint;
  final String yearLabel;
  final String yearHint;
  final String startDateLabel;
  final String endDateLabel;
  final String activeLabel;
  final bool showYear;
  final bool showDates;
  final bool showActive;

  TimePeriodFields({
    required this.nameLabel,
    required this.nameHint,
    required this.yearLabel,
    required this.yearHint,
    required this.startDateLabel,
    required this.endDateLabel,
    required this.activeLabel,
    this.showYear = true,
    this.showDates = true,
    this.showActive = true,
  });
}
