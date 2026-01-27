import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/repositories/auth_repository.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/providers/app_state_provider.dart';
import 'auth_event.dart';
import 'auth_state.dart';

/// AuthBloc handles all authentication logic
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;
  final HiveStorageService storage;
  final AppStateProvider appStateProvider;

  AuthBloc({
    required this.authRepository,
    required this.storage,
    required this.appStateProvider,
  }) : super(const AuthInitial()) {
    // Register event handlers
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<LoginRequested>(_onLoginRequested);
    on<SignupRequested>(_onSignupRequested);
    on<LogoutRequested>(_onLogoutRequested);
    on<PasswordResetRequested>(_onPasswordResetRequested);
    on<UserUpdated>(_onUserUpdated);
  }

  /// Check if user is already logged in (on app start)
  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    print('🔍 [AuthBloc] Checking auth status...');
    print(
      '🔍 [AuthBloc] AppState initialized: ${appStateProvider.isInitialized}',
    );

    if (!appStateProvider.isInitialized) {
      emit(const AuthLoading());
      appStateProvider.setLoading(true);
    }

    try {
      await Future.delayed(const Duration(milliseconds: 300));

      final isLoggedIn = authRepository.isLoggedIn();
      final user = authRepository.getCurrentUser();
      final token = authRepository.getToken();

      if (isLoggedIn && user != null && token != null) {
        print('✅ [AuthBloc] User authenticated: ${user.username}');

        appStateProvider.setUser(user, token);
        appStateProvider.setInitialized(true);
        appStateProvider.setLoading(false);

        emit(
          AuthAuthenticated(
            user: user,
            accessToken: token,
          ),
        );
      } else {
        print('❌ [AuthBloc] No user found');

        appStateProvider.clearUser();
        appStateProvider.setInitialized(true);
        appStateProvider.setLoading(false);

        emit(const AuthUnauthenticated());
      }
    } catch (e, stackTrace) {
      print('⚠️ [AuthBloc] Error: $e');
      print('⚠️ [AuthBloc] StackTrace: $stackTrace');

      appStateProvider.clearUser();
      appStateProvider.setInitialized(true);
      appStateProvider.setLoading(false);

      emit(const AuthUnauthenticated());
    }
  }

  /// Handle login request
  Future<void> _onLoginRequested(
    LoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    appStateProvider.setLoading(true);

    try {
      final result = await authRepository.login(
        usernameOrEmail: event.usernameOrEmail,
        password: event.password,
        role: event.role,
      );

      // Update global state
      appStateProvider.setUser(result['user'], result['token']);
      appStateProvider.setLoading(false);

      emit(
        AuthAuthenticated(
          user: result['user'],
          accessToken: result['token'],
        ),
      );
    } on ServerException catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: e.message));
    } on NetworkException catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: e.message));
    } catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: 'An unexpected error occurred: ${e.toString()}'));
    }
  }

  /// Handle signup request
  Future<void> _onSignupRequested(
    SignupRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    appStateProvider.setLoading(true);

    try {
      final result = await authRepository.signup(
        username: event.username,
        email: event.email,
        password: event.password,
        fullName: event.fullName,
        role: event.role,
      );

      // Update global state
      appStateProvider.setUser(result['user'], result['token']);
      appStateProvider.setLoading(false);

      // After successful signup, auto-login
      emit(
        AuthAuthenticated(
          user: result['user'],
          accessToken: result['token'],
        ),
      );
    } on ServerException catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: e.message));
    } on NetworkException catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: e.message));
    } catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: 'An unexpected error occurred: ${e.toString()}'));
    }
  }

  /// Handle logout request
  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    appStateProvider.setLoading(true);

    try {
      await authRepository.logout();

      // Clear global state
      appStateProvider.clearUser();
      appStateProvider.setLoading(false);

      emit(const AuthUnauthenticated());
    } catch (e) {
      appStateProvider.clearUser();
      appStateProvider.setLoading(false);
      emit(const AuthUnauthenticated());
    }
  }

  /// Handle password reset request
  Future<void> _onPasswordResetRequested(
    PasswordResetRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    appStateProvider.setLoading(true);

    try {
      // Password reset not implemented in backend yet
      appStateProvider.setLoading(false);
      emit(const PasswordResetEmailSent(message: 'Password reset feature coming soon'));
    } on ServerException catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: e.message));
    } catch (e) {
      appStateProvider.setLoading(false);
      emit(AuthError(message: 'Failed to send reset email'));
    }
  }

  /// Handle user data update (e.g., when joining an institution)
  Future<void> _onUserUpdated(
    UserUpdated event,
    Emitter<AuthState> emit,
  ) async {
    try {
      // Get current token
      final token = storage.getToken();
      
      // Update app state provider with new user data
      appStateProvider.setUser(event.user, token ?? '');
      
      // Emit authenticated state with updated user
      emit(AuthAuthenticated(user: event.user, accessToken: token ?? ''));
    } catch (e) {
      emit(AuthError(message: 'Failed to update user: $e'));
    }
  }
}