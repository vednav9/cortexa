import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import '../services/hive_storage_service.dart';
import '../services/settings_service.dart';
import '../services/email_service.dart';
import '../providers/app_state_provider.dart';
import '../../features/auth/data/repositories/mock_auth_repository.dart';

final getIt = GetIt.instance;

/// Setup all dependencies - called ONCE at app startup
Future<void> setupServiceLocator() async {
  print('🚀 Setting up service locator...');
  
  // ✅ Reset GetIt if already initialized (for hot reload support)
  if (getIt.isRegistered<AppStateProvider>()) {
    print('⚠️ GetIt already initialized - resetting...');
    await getIt.reset();
  }
  
  // ===== Core Services =====
  
  // Dio (HTTP Client)
  print('🌐 Creating Dio instance...');
  final dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    sendTimeout: const Duration(seconds: 30),
  ));
  getIt.registerSingleton<Dio>(dio);
  print('✅ Dio registered');
  
  // Hive Storage
  print('💾 Initializing HiveStorageService...');
  final hiveStorage = HiveStorageService();
  await hiveStorage.init();
  getIt.registerSingleton<HiveStorageService>(hiveStorage);
  print('✅ HiveStorageService registered');
  
  // Settings Service
  print('⚙️ Initializing SettingsService...');
  final settingsService = SettingsService();
  await settingsService.init();
  getIt.registerSingleton<SettingsService>(settingsService);
  print('✅ SettingsService registered');
  
  // Email Service
  print('📧 Creating EmailService...');
  getIt.registerSingleton<EmailService>(
    EmailService(getIt<Dio>()),
  );
  print('✅ EmailService registered');
  
  // ===== Providers =====
  
  // App State Provider
  print('🌐 Creating AppStateProvider...');
  getIt.registerSingleton<AppStateProvider>(AppStateProvider());
  print('✅ AppStateProvider registered');
  print('   IsRegistered: ${getIt.isRegistered<AppStateProvider>()}');
  
  // ===== Repositories =====
  
  // Auth Repository
  print('🔐 Creating MockAuthRepository...');
  getIt.registerSingleton<MockAuthRepository>(
    MockAuthRepository(
      getIt<HiveStorageService>(),
      getIt<EmailService>(),
    ),
  );
  print('✅ MockAuthRepository registered');
  
  print('🎉 Service locator setup complete!');
}
