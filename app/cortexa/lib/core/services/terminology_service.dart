import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/terminology/terminology_bloc.dart';
import '../bloc/terminology/terminology_state.dart';
import '../config/terminology_config.dart';
import '../constants/enums.dart';

/// Service for accessing terminology throughout the app
class TerminologyService {
  /// Get current institution type from Bloc
  static InstitutionType getInstitutionType(BuildContext context) {
    final state = context.read<TerminologyBloc>().state;
    return state.institutionType;
  }

  /// Get organizational unit label (Department/Class/Batch)
  static String getOrganizationalUnitLabel(BuildContext context, {bool plural = false}) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getOrganizationalUnitLabel(type, plural: plural);
  }

  /// Get learning program label (Course/Subject/Program)
  static String getLearningProgramLabel(BuildContext context, {bool plural = false}) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getLearningProgramLabel(type, plural: plural);
  }

  /// Get time period label (Semester/Academic Year/Session)
  static String getTimePeriodLabel(BuildContext context, {bool plural = false}) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getTimePeriodLabel(type, plural: plural);
  }

  /// Get instructor label (Faculty/Teacher/Trainer)
  static String getInstructorLabel(BuildContext context, {bool plural = false}) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getInstructorLabel(type, plural: plural);
  }

  /// Get organizational unit field configuration
  static OrganizationalUnitFields getOrganizationalUnitFields(BuildContext context) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getOrganizationalUnitFields(type);
  }

  /// Get learning program field configuration
  static LearningProgramFields getLearningProgramFields(BuildContext context) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getLearningProgramFields(type);
  }

  /// Get time period field configuration
  static TimePeriodFields getTimePeriodFields(BuildContext context) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getTimePeriodFields(type);
  }

  /// Get organizational unit description
  static String getOrganizationalUnitDescription(BuildContext context) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getOrganizationalUnitDescription(type);
  }

  /// Get learning program description
  static String getLearningProgramDescription(BuildContext context) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getLearningProgramDescription(type);
  }

  /// Get time period description
  static String getTimePeriodDescription(BuildContext context) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getTimePeriodDescription(type);
  }

  /// Get instructor description
  static String getInstructorDescription(BuildContext context) {
    final type = getInstitutionType(context);
    return TerminologyConfig.getInstructorDescription(type);
  }
}

/// Widget that rebuilds when institution type changes
class TerminologyBuilder extends StatelessWidget {
  final Widget Function(BuildContext context, InstitutionType type) builder;

  const TerminologyBuilder({
    super.key,
    required this.builder,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<TerminologyBloc, TerminologyState>(
      builder: (context, state) {
        return builder(context, state.institutionType);
      },
    );
  }
}
