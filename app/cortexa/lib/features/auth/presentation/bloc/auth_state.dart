import 'package:equatable/equatable.dart';
import '../../data/models/user_hive_model.dart';  // ✅ FIXED: Changed import

/// Base class for all authentication states
abstract class AuthState extends Equatable {
  const AuthState();
  
  @override
  List<Object?> get props => [];
}

/// Initial state when app starts
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// State when authentication is in progress
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// State when user is successfully authenticated
class AuthAuthenticated extends AuthState {
  final UserHiveModel user;  // ✅ FIXED: Changed from UserModel to UserHiveModel
  final String accessToken;
  
  const AuthAuthenticated({
    required this.user,
    required this.accessToken,
  });
  
  @override
  List<Object?> get props => [user, accessToken];
}

/// State when user is not authenticated
class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

/// State when authentication fails
class AuthError extends AuthState {
  final String message;
  
  const AuthError({required this.message});
  
  @override
  List<Object?> get props => [message];
}

/// State when signup is successful but needs verification
class SignupSuccess extends AuthState {
  final String message;
  
  const SignupSuccess({
    this.message = 'Account created successfully. Please login.',
  });
  
  @override
  List<Object?> get props => [message];
}

/// State when password reset email is sent
class PasswordResetEmailSent extends AuthState {
  final String message;
  
  const PasswordResetEmailSent({
    this.message = 'Password reset link sent to your email',
  });
  
  @override
  List<Object?> get props => [message];
}
