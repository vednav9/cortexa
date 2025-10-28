import 'package:dio/dio.dart';
import '../errors/exceptions.dart';

/// Service for sending emails
/// This is a mock implementation. In production, you should use a backend API
/// that handles email sending via services like SendGrid, AWS SES, Mailgun, etc.
class EmailService {
  final Dio _dio;
  
  // In production, replace this with your actual email API endpoint
  static const String _emailApiEndpoint = 'https://your-backend-api.com/api/email';
  
  EmailService(this._dio);
  
  // Debug helper to avoid unused warnings in mock mode
  void _debugPrintConfig() {
    assert(() {
      // ignore: avoid_print
      print('📧 [EmailService] Using base endpoint: ' + _emailApiEndpoint);
      // ignore: avoid_print
      final ct = _dio.options.connectTimeout;
      print('🌐 [EmailService] Dio connectTimeout: ' + (ct?.inSeconds.toString() ?? 'n/a') + 's');
      return true;
    }());
  }
  
  /// Send password reset email
  /// 
  /// In production, this should call your backend API which then:
  /// 1. Generates a secure reset token
  /// 2. Stores the token with expiration (e.g., 1 hour)
  /// 3. Sends the email via email service provider
  /// 
  /// Example backend endpoint: POST /api/email/reset-password
  /// Body: { "email": "user@example.com" }
  /// Response: { "success": true, "message": "Email sent" }
  Future<String> sendPasswordResetEmail(String email) async {
    try {
      _debugPrintConfig();
      // Mock implementation - simulating API call
      await Future.delayed(const Duration(seconds: 2));
      
      // In production, uncomment and implement:
      /*
      final response = await _dio.post(
        '$_emailApiEndpoint/reset-password',
        data: {'email': email},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        return response.data['message'] ?? 'Password reset email sent successfully';
      } else {
        throw ServerException(
          message: response.data['error'] ?? 'Failed to send email',
          statusCode: response.statusCode ?? 500,
        );
      }
      */
      
      // Mock success response
      print('📧 [EmailService] Password reset email sent to: $email');
      print('🔗 [EmailService] Reset link: https://cortexa.com/reset-password?token=mock_token_123');
      
      return 'Password reset link has been sent to $email. Please check your inbox.';
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw NetworkException(
          'Connection timeout. Please check your internet connection.',
        );
      } else if (e.type == DioExceptionType.connectionError) {
        throw NetworkException(
          'No internet connection. Please check your network settings.',
        );
      } else {
        throw ServerException(
          message: e.response?.data['message'] ?? 'Failed to send email',
          statusCode: e.response?.statusCode ?? 500,
        );
      }
    } catch (e) {
      throw ServerException(
        message: 'An unexpected error occurred while sending email: $e',
        statusCode: 500,
      );
    }
  }
  
  /// Send email verification email
  /// 
  /// In production, this should call your backend API which then:
  /// 1. Generates a secure verification token
  /// 2. Stores the token with expiration
  /// 3. Sends the email with verification link
  /// 
  /// Example backend endpoint: POST /api/email/verify-email
  /// Body: { "email": "user@example.com", "userId": "123" }
  Future<String> sendEmailVerificationEmail({
    required String email,
    required String userId,
  }) async {
    try {
      _debugPrintConfig();
      // Mock implementation - simulating API call
      await Future.delayed(const Duration(seconds: 2));
      
      // In production, uncomment and implement:
      /*
      final response = await _dio.post(
        '$_emailApiEndpoint/verify-email',
        data: {
          'email': email,
          'user_id': userId,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        return response.data['message'] ?? 'Verification email sent successfully';
      } else {
        throw ServerException(
          message: response.data['error'] ?? 'Failed to send verification email',
          statusCode: response.statusCode ?? 500,
        );
      }
      */
      
      // Mock success response
      print('📧 [EmailService] Verification email sent to: $email');
      print('🔗 [EmailService] Verification link: https://cortexa.com/verify-email?token=mock_verification_token_$userId');
      
      return 'Verification email has been sent to $email. Please check your inbox.';
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        throw NetworkException(
          'Connection timeout. Please check your internet connection.',
        );
      } else if (e.type == DioExceptionType.connectionError) {
        throw NetworkException(
          'No internet connection. Please check your network settings.',
        );
      } else {
        throw ServerException(
          message: e.response?.data['message'] ?? 'Failed to send verification email',
          statusCode: e.response?.statusCode ?? 500,
        );
      }
    } catch (e) {
      throw ServerException(
        message: 'An unexpected error occurred while sending verification email: $e',
        statusCode: 500,
      );
    }
  }
  
  /// Resend email verification email
  Future<String> resendVerificationEmail({
    required String email,
    required String userId,
  }) async {
    return sendEmailVerificationEmail(email: email, userId: userId);
  }
}
