import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_theme.dart';
import 'core/di/service_locator.dart';
import 'core/providers/app_state_provider.dart';
import 'core/bloc/terminology/terminology_bloc.dart';
import 'core/bloc/terminology/terminology_event.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/data/repositories/auth_repository.dart';
import 'core/services/hive_storage_service.dart';
import 'core/services/settings_service.dart';
import 'routes/app_router.dart';

// ✅ Global instances that persist across app lifecycle
late AppStateProvider globalAppState;
late HiveStorageService globalHiveStorage;
late AuthRepository globalAuthRepository;

void main() async {
  // Ensure Flutter binding is initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  
  try {
    // Initialize dependencies
    print('🔧 Initializing app dependencies...');
    await setupServiceLocator();
    
    // ✅ Verify all dependencies are registered
    print('🔍 Verifying dependencies...');
    print('  HiveStorageService: ${getIt.isRegistered<HiveStorageService>()}');
    print('  SettingsService: ${getIt.isRegistered<SettingsService>()}');
    print('  AppStateProvider: ${getIt.isRegistered<AppStateProvider>()}');
    print('  AuthRepository: ${getIt.isRegistered<AuthRepository>()}');
    
    // ✅ Create global instances ONCE - after setupServiceLocator completes
    globalAppState = getIt<AppStateProvider>();
    globalHiveStorage = getIt<HiveStorageService>();
    globalAuthRepository = getIt<AuthRepository>();
    
    print('✅ All dependencies initialized');
    print('  globalAppState: ${globalAppState.runtimeType}');
    print('  globalHiveStorage: ${globalHiveStorage.runtimeType}');
    print('  globalAuthRepository: ${globalAuthRepository.runtimeType}');
    
    runApp(const CortexaApp());
  } catch (e, stackTrace) {
    print('❌ Error initializing app: $e');
    print('StackTrace: $stackTrace');
    
    // Show error screen
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Text('Failed to initialize app: $e'),
          ),
        ),
      ),
    );
  }
}

class CortexaApp extends StatelessWidget {
  const CortexaApp({super.key});
  
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ✅ Use global instance directly (no GetIt lookup)
        ChangeNotifierProvider<AppStateProvider>.value(
          value: globalAppState,
        ),
        
        // ✅ Create AuthBloc with global dependencies
        BlocProvider<AuthBloc>(
          create: (_) => AuthBloc(
            authRepository: globalAuthRepository,
            storage: globalHiveStorage,
            appStateProvider: globalAppState,
          ),
        ),
        
        // ✅ Create TerminologyBloc with HiveStorageService
        BlocProvider<TerminologyBloc>(
          create: (_) => TerminologyBloc(storage: globalHiveStorage)
            ..add(LoadInstitutionType()),
        ),
      ],
      child: MaterialApp.router(
        title: 'Cortexa',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        routerConfig: AppRouter.router,
      ),
    );
  }
}
