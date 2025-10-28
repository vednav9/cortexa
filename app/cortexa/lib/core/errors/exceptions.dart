/// Base exception class
class ServerException implements Exception {
  final String message;
  final int? statusCode;
  
  ServerException({
    this.message = 'Server error occurred',
    this.statusCode,
  });
  
  @override
  String toString() => 'ServerException: $message (Status: $statusCode)';
}

class NetworkException implements Exception {
  final String message;
  
  NetworkException([this.message = 'No internet connection']);
  
  @override
  String toString() => 'NetworkException: $message';
}

class CacheException implements Exception {
  final String message;
  
  CacheException([this.message = 'Cache error']);
  
  @override
  String toString() => 'CacheException: $message';
}

class UnauthorizedException implements Exception {
  final String message;
  
  UnauthorizedException([this.message = 'Unauthorized']);
  
  @override
  String toString() => 'UnauthorizedException: $message';
}

class ValidationException implements Exception {
  final String message;
  
  ValidationException([this.message = 'Validation failed']);
  
  @override
  String toString() => 'ValidationException: $message';
}
