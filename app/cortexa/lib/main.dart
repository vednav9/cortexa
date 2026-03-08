import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import 'core/config/api_config.dart';
import 'core/constants/app_theme.dart';
import 'core/di/service_locator.dart';
import 'core/providers/app_state_provider.dart';
import 'core/bloc/terminology/terminology_bloc.dart';
import 'core/bloc/terminology/terminology_event.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
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
    // Load secrets from android/local.properties (via BuildConfig MethodChannel)
    await ApiConfig.initialize();

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

class CortexaApp extends StatefulWidget {
  const CortexaApp({super.key});

  @override
  State<CortexaApp> createState() => _CortexaAppState();
}

class _CortexaAppState extends State<CortexaApp> with WidgetsBindingObserver {
  AuthBloc? _authBloc;

  @override
  void initState() {
    super.initState();
    // ✅ Register lifecycle observer
    WidgetsBinding.instance.addObserver(this);
    print('🔄 App lifecycle observer registered');
  }

  @override
  void dispose() {
    // ✅ Unregister lifecycle observer
    WidgetsBinding.instance.removeObserver(this);
    print('🔄 App lifecycle observer removed');
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    print('🔄 App lifecycle changed: $state');
    
    // Update AppStateProvider
    globalAppState.updateLifecycleState(state);
    
    // ✅ Check auth when app resumes from background
    if (state == AppLifecycleState.resumed) {
      print('✅ App resumed - checking auth status...');
      _authBloc?.add(const CheckAuthStatus());
    } else if (state == AppLifecycleState.paused) {
      print('⏸️ App paused - going to background');
    }
  }
  
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
          create: (_) {
            final bloc = AuthBloc(
              authRepository: globalAuthRepository,
              storage: globalHiveStorage,
              appStateProvider: globalAppState,
            );
            // ✅ Store reference for lifecycle callbacks
            _authBloc = bloc;
            // ✅ Check auth status immediately on app start
            bloc.add(const CheckAuthStatus());
            return bloc;
          },
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
