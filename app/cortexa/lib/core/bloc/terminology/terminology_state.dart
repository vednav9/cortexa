import '../../constants/enums.dart';

/// States for TerminologyBloc
abstract class TerminologyState {
  final InstitutionType institutionType;
  
  const TerminologyState(this.institutionType);
}

/// Initial state
class TerminologyInitial extends TerminologyState {
  const TerminologyInitial() : super(InstitutionType.institute);
}

/// Loading state
class TerminologyLoading extends TerminologyState {
  const TerminologyLoading(super.institutionType);
}

/// Loaded state with institution type
class TerminologyLoaded extends TerminologyState {
  const TerminologyLoaded(super.institutionType);
}

/// Error state
class TerminologyError extends TerminologyState {
  final String message;
  
  const TerminologyError(super.institutionType, this.message);
}
