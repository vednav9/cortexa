/// Maps technical API errors to user-friendly error messages
class ErrorMessageMapper {
  /// Convert backend error message to user-friendly message
  static String getUserFriendlyMessage(String technicalError) {
    final errorLower = technicalError.toLowerCase();
    
    // File upload errors
    if (errorLower.contains('mime') || 
        errorLower.contains('file type') || 
        errorLower.contains('file format')) {
      return 'File format not supported. Please use JPG, PNG, or PDF files.';
    }
    
    if (errorLower.contains('file size') || errorLower.contains('too large')) {
      return 'File is too large. Please choose a smaller file.';
    }
    
    // Authentication errors
    if (errorLower.contains('invalid credentials') || 
        errorLower.contains('invalid email or password')) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (errorLower.contains('unauthorized') || errorLower.contains('not authorized')) {
      return 'You are not authorized to perform this action.';
    }
    
    if (errorLower.contains('token') && errorLower.contains('expired')) {
      return 'Your session has expired. Please login again.';
    }
    
    if (errorLower.contains('token') && errorLower.contains('invalid')) {
      return 'Authentication failed. Please login again.';
    }
    
    // Validation errors
    if (errorLower.contains('email') && errorLower.contains('already')) {
      return 'This email is already registered. Please use a different email or try logging in.';
    }
    
    if (errorLower.contains('username') && errorLower.contains('already')) {
      return 'This username is already taken. Please choose a different username.';
    }
    
    if (errorLower.contains('email') && errorLower.contains('invalid')) {
      return 'Please enter a valid email address.';
    }
    
    if (errorLower.contains('password') && errorLower.contains('weak')) {
      return 'Password is too weak. Please use a stronger password with uppercase, lowercase, and numbers.';
    }
    
    if (errorLower.contains('required') || errorLower.contains('missing')) {
      return 'Please fill in all required fields.';
    }
    
    // Institution/Organization errors
    if (errorLower.contains('institution') && errorLower.contains('not found')) {
      return 'Institution not found. Please check your institution ID.';
    }
    
    if (errorLower.contains('institution') && errorLower.contains('already')) {
      return 'This institution is already registered.';
    }
    
    // Network errors
    if (errorLower.contains('network') || errorLower.contains('connection')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (errorLower.contains('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    if (errorLower.contains('server') && (errorLower.contains('error') || errorLower.contains('500'))) {
      return 'Server error. Please try again later.';
    }
    
    // Database errors
    if (errorLower.contains('database') || errorLower.contains('db')) {
      return 'A system error occurred. Please try again later.';
    }
    
    // Permission errors
    if (errorLower.contains('permission') || errorLower.contains('forbidden')) {
      return 'You do not have permission to access this resource.';
    }
    
    // Not found errors
    if (errorLower.contains('not found') || errorLower.contains('404')) {
      return 'Resource not found. Please try again.';
    }
    
    // Rate limiting
    if (errorLower.contains('too many requests') || errorLower.contains('rate limit')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    
    // Default fallback - return original if no match, but clean it up
    return _cleanErrorMessage(technicalError);
  }
  
  /// Clean up technical error messages
  static String _cleanErrorMessage(String error) {
    // Remove common technical prefixes
    error = error.replaceFirst(RegExp(r'^Error:\s*', caseSensitive: false), '');
    error = error.replaceFirst(RegExp(r'^Exception:\s*', caseSensitive: false), '');
    
    // Capitalize first letter
    if (error.isNotEmpty) {
      error = error[0].toUpperCase() + error.substring(1);
    }
    
    // Ensure it ends with a period
    if (error.isNotEmpty && !error.endsWith('.') && !error.endsWith('!') && !error.endsWith('?')) {
      error = '$error.';
    }
    
    return error;
  }
  
  /// Get user-friendly message for status codes
  static String getMessageForStatusCode(int statusCode, [String? defaultMessage]) {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please login to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 408:
        return 'Request timed out. Please try again.';
      case 409:
        return 'Conflict with existing data. Please check your input.';
      case 413:
        return 'File is too large. Please choose a smaller file.';
      case 422:
        return 'Invalid data provided. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable. Please try again later.';
      case 503:
        return 'Service is currently unavailable. Please try again later.';
      case 504:
        return 'Request timed out. Please try again.';
      default:
        return defaultMessage ?? 'An error occurred. Please try again.';
    }
  }
  
  /// Check if message is already user-friendly (not technical)
  static bool _isUserFriendlyMessage(String message) {
    final technical = message.toLowerCase();
    
    // Check if it's a technical/internal error message
    final isTechnical = technical.contains('exception') ||
                       technical.contains('stack trace') ||
                       technical.contains('null') ||
                       technical.contains('undefined') ||
                       technical.contains('error:') ||
                       technical.startsWith('failed to parse') ||
                       technical.startsWith('server returned');
    
    return !isTechnical && message.length > 10;
  }
  
  /// Combine status code and error message intelligently
  static String getCombinedMessage(int? statusCode, String? errorMessage) {
    // If we have a backend message and it's already user-friendly, use it as-is
    if (errorMessage != null && errorMessage.isNotEmpty) {
      // If the message is already user-friendly, return it directly
      if (_isUserFriendlyMessage(errorMessage)) {
        return errorMessage;
      }
      // Otherwise, try to convert it to user-friendly format
      return getUserFriendlyMessage(errorMessage);
    }
    
    // Fall back to status code message
    if (statusCode != null) {
      return getMessageForStatusCode(statusCode);
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
}
