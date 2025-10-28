import 'package:equatable/equatable.dart';

/// Base class for all authentication events
abstract class AuthEvent extends Equatable {
  const AuthEvent();
  
  @override
  List<Object?> get props => [];
}

/// Event when user attempts to login
class LoginRequested extends AuthEvent {
  final String usernameOrEmail;
  final String password;
  final String role;
  
  const LoginRequested({
    required this.usernameOrEmail,
    required this.password,
    required this.role,
  });
  
  @override
  List<Object?> get props => [usernameOrEmail, password, role];
}

/// Event when user attempts to sign up
class SignupRequested extends AuthEvent {
  final String username;
  final String email;
  final String password;
  final String fullName;
  final String role;
  
  const SignupRequested({
    required this.username,
    required this.email,
    required this.password,
    required this.fullName,
    required this.role,
  });
  
  @override
  List<Object?> get props => [username, email, password, fullName, role];
}

/// Event when user logs out
class LogoutRequested extends AuthEvent {
  const LogoutRequested();
}

/// Event to check if user is already logged in (on app start)
class CheckAuthStatus extends AuthEvent {
  const CheckAuthStatus();
}

/// Event when token needs to be refreshed
class RefreshTokenRequested extends AuthEvent {
  const RefreshTokenRequested();
}

/// Event when password reset is requested
class PasswordResetRequested extends AuthEvent {
  final String email;
  
  const PasswordResetRequested({required this.email});
  
  @override
  List<Object?> get props => [email];
}
