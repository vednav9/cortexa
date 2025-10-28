import 'package:equatable/equatable.dart';

/// Base class for all failures in the app
abstract class Failure extends Equatable {
  final String message;
  
  const Failure(this.message);
  
  @override
  List<Object?> get props => [message];
}

/// Server-related failures (API errors)
class ServerFailure extends Failure {
  const ServerFailure([String message = 'Server error occurred']) : super(message);
}

/// Network connection failures
class NetworkFailure extends Failure {
  const NetworkFailure([String message = 'No internet connection']) : super(message);
}

/// Authentication failures
class AuthenticationFailure extends Failure {
  const AuthenticationFailure([String message = 'Authentication failed']) : super(message);
}

/// Validation failures (form validation)
class ValidationFailure extends Failure {
  const ValidationFailure([String message = 'Validation failed']) : super(message);
}

/// Cache failures (local storage errors)
class CacheFailure extends Failure {
  const CacheFailure([String message = 'Cache error occurred']) : super(message);
}

/// Unauthorized access
class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure([String message = 'Unauthorized access']) : super(message);
}

/// Generic failure
class GenericFailure extends Failure {
  const GenericFailure([String message = 'An error occurred']) : super(message);
}
