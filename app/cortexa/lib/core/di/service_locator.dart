import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;
import '../services/hive_storage_service.dart';
import '../services/settings_service.dart';
import '../services/email_service.dart';
import '../providers/app_state_provider.dart';
import '../network/api_client.dart';
import '../../features/auth/data/repositories/mock_auth_repository.dart';
import '../../features/auth/data/repositories/auth_repository.dart';
import '../../features/dashboard/data/repositories/dashboard_repository.dart';
import '../../features/institution/data/repositories/institution_admin_repository.dart';
import '../../features/rag_assistant/data/repositories/ai_repository.dart';
import '../../features/teacher/data/repositories/teacher_ai_repository.dart';

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
  
  // HTTP Client
  print('🌐 Creating HTTP Client...');
  final httpClient = http.Client();
  getIt.registerSingleton<http.Client>(httpClient);
  print('✅ HTTP Client registered');
  
  // Dio (HTTP Client - legacy)
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
  
  
  // API Client
  print('🔌 Creating ApiClient...');
  getIt.registerSingleton<ApiClient>(
    ApiClient(
      client: getIt<http.Client>(),
      storage: getIt<HiveStorageService>(),
    ),
  );
  print('✅ ApiClient registered');
  // Email Service
  print('📧 Creating EmailService...');
  getIt.registerSingleton<EmailService>(
    EmailService(getIt<Dio>()),
  );
  print('✅ EmailService registered');
  
  // Real Auth Repository (with backend API)
  print('🔐 Creating AuthRepository...');
  getIt.registerSingleton<AuthRepository>(
    AuthRepository(
      getIt<HiveStorageService>(),
      getIt<ApiClient>(),
    ),
  );
  print('✅ AuthRepository registered');
  
  // Mock Auth Repository (for fallback/testing) =====
  
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
  
  // Dashboard Repository
  print('📊 Creating DashboardRepository...');
  getIt.registerSingleton<DashboardRepository>(
    DashboardRepository(
      getIt<ApiClient>(),
      getIt<HiveStorageService>(),
    ),
  );
  print('✅ DashboardRepository registered');
  
  // Institution Admin Repository
  print('🏛️ Creating InstitutionAdminRepository...');
  getIt.registerSingleton<InstitutionAdminRepository>(
    InstitutionAdminRepository(
      getIt<ApiClient>(),
      getIt<HiveStorageService>(),
    ),
  );
  print('✅ InstitutionAdminRepository registered');
  
  // AI Repository
  print('🤖 Creating AiRepository...');
  getIt.registerSingleton<AiRepository>(
    AiRepository(
      getIt<ApiClient>(),
      getIt<HiveStorageService>(),
    ),
  );
  print('✅ AiRepository registered');
  
  // Teacher AI Repository
  print('👨‍🏫 Creating TeacherAiRepository...');
  getIt.registerSingleton<TeacherAiRepository>(
    TeacherAiRepository(
      getIt<ApiClient>(),
    ),
  );
  print('✅ TeacherAiRepository registered');
  
  print('🎉 Service locator setup complete!');
}
