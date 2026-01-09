import 'package:flutter_bloc/flutter_bloc.dart';
import '../../constants/enums.dart';
import '../../services/hive_storage_service.dart';
import 'terminology_event.dart';
import 'terminology_state.dart';

/// Bloc for managing institution-specific terminology
class TerminologyBloc extends Bloc<TerminologyEvent, TerminologyState> {
  final HiveStorageService storage;

  TerminologyBloc({required this.storage}) : super(const TerminologyInitial()) {
    on<LoadInstitutionType>(_onLoadInstitutionType);
    on<UpdateInstitutionType>(_onUpdateInstitutionType);
  }

  /// Load institution type from storage
  Future<void> _onLoadInstitutionType(
    LoadInstitutionType event,
    Emitter<TerminologyState> emit,
  ) async {
    try {
      emit(TerminologyLoading(state.institutionType));

      // Get current user's institution data
      final currentUser = storage.getCurrentUser();
      
      print('🔍 [TerminologyBloc] Loading institution type...');
      print('🔍 [TerminologyBloc] Current user: ${currentUser?.username}');
      print('🔍 [TerminologyBloc] Institution ID: ${currentUser?.institutionId}');
      
      if (currentUser?.institutionId != null) {
        // Get institution data from storage
        final institutionData = storage.findInstitutionById(currentUser!.institutionId!);
        
        if (institutionData != null) {
          final typeString = institutionData['institution_type'] as String? ?? 'Institute';
          final institutionType = InstitutionType.fromString(typeString);
          
          print('✅ [TerminologyBloc] Found institution: ${institutionData['institution_name']}');
          print('✅ [TerminologyBloc] Institution type string: $typeString');
          print('✅ [TerminologyBloc] Parsed institution type: $institutionType');
          emit(TerminologyLoaded(institutionType));
          return;
        } else {
          print('⚠️ [TerminologyBloc] Institution data not found for ID: ${currentUser.institutionId}');
        }
      } else {
        print('⚠️ [TerminologyBloc] User has no institution ID');
      }

      // Default to institute if no institution found
      print('⚠️ [TerminologyBloc] Using default type: Institute');
      emit(const TerminologyLoaded(InstitutionType.institute));
    } catch (e) {
      print('❌ [TerminologyBloc] Error loading institution type: $e');
      emit(TerminologyError(state.institutionType, e.toString()));
    }
  }

  /// Update institution type
  Future<void> _onUpdateInstitutionType(
    UpdateInstitutionType event,
    Emitter<TerminologyState> emit,
  ) async {
    try {
      print('✅ Updated institution type: ${event.type}');
      emit(TerminologyLoaded(event.type));
    } catch (e) {
      print('❌ Error updating institution type: $e');
      emit(TerminologyError(state.institutionType, e.toString()));
    }
  }
}
