import '../../constants/enums.dart';

/// Events for TerminologyBloc
abstract class TerminologyEvent {}

/// Load institution type from storage
class LoadInstitutionType extends TerminologyEvent {}

/// Update institution type
class UpdateInstitutionType extends TerminologyEvent {
  final InstitutionType type;
  
  UpdateInstitutionType(this.type);
}
