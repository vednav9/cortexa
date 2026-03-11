import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' as http_parser;
import '../config/api_config.dart';
import '../services/hive_storage_service.dart';
import '../di/service_locator.dart';
import '../utils/error_message_mapper.dart';

class ApiRawResponse {
  final Map<String, dynamic> data;
  final Map<String, String> headers;
  final int statusCode;

  ApiRawResponse({
    required this.data,
    required this.headers,
    required this.statusCode,
  });
}

class ApiClient {
  final http.Client _client;
  final HiveStorageService _storage;

  ApiClient({
    http.Client? client,
    HiveStorageService? storage,
  })  : _client = client ?? http.Client(),
        _storage = storage ?? getIt<HiveStorageService>();

  Future<Map<String, dynamic>> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);

    print('🌐 POST Request: $url');
    print('📦 Body: ${body != null ? jsonEncode(body) : "null"}');

    try {
      final response = await _client
          .post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      print('📡 Response Status: ${response.statusCode}');
      print('📄 Response Body (first 500 chars): ${response.body.substring(0, response.body.length > 500 ? 500 : response.body.length)}');

      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        technicalMessage: 'Request timed out after ${ApiConfig.connectionTimeout.inSeconds}s. Base URL: ${ApiConfig.baseUrl}',
      );
    } catch (e) {
      print('❌ Error in POST request: $e');
      if (e is ApiException) rethrow;
      throw ApiException(
        'Network error. Please check your internet connection and try again.',
        technicalMessage: 'Network error: $e',
      );
    }
  }

  /// Direct POST to the AI service (bypasses backend proxy).
  /// Uses [ApiConfig.aiBaseUrl] with no auth header and a 3-minute timeout
  /// to accommodate cold-starts on the Render free tier.
  Future<Map<String, dynamic>> aiPost(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    final url = Uri.parse('${ApiConfig.aiBaseUrl}$endpoint');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    print('🤖 AI POST Request: $url');
    print('📦 Body: ${body != null ? jsonEncode(body) : "null"}');

    try {
      final response = await _client
          .post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(minutes: 3));

      print('📡 AI Response Status: ${response.statusCode}');
      print('📄 AI Response Body (first 500 chars): ${response.body.substring(0, response.body.length > 500 ? 500 : response.body.length)}');

      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'AI request timed out. The AI service may be starting up — please try again in a moment.',
        statusCode: 408,
        technicalMessage: 'AI request timed out after 3 minutes. AI URL: ${ApiConfig.aiBaseUrl}',
      );
    } catch (e) {
      print('❌ Error in AI POST request: $e');
      if (e is ApiException) rethrow;
      throw ApiException(
        'Could not reach the AI service. Please check your connection and try again.',
        technicalMessage: 'AI network error: $e',
      );
    }
  }

  /// Like [post], but also returns response headers/status.
  /// Useful when the backend sets auth tokens in `Set-Cookie`.
  Future<ApiRawResponse> postRaw(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);

    try {
      final response = await _client
          .post(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      final data = _handleResponse(response);
      return ApiRawResponse(
        data: data,
        headers: response.headers,
        statusCode: response.statusCode,
      );
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        technicalMessage: 'Request timed out after ${ApiConfig.connectionTimeout.inSeconds}s. Base URL: ${ApiConfig.baseUrl}',
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        'Network error. Please check your internet connection and try again.',
        technicalMessage: 'Network error: $e',
      );
    }
  }

  /// Multipart POST helper for endpoints like admin registration.
  /// Backend expects a file field named `logo` (optional) and text fields.
  Future<ApiRawResponse> multipartPost(
    String endpoint, {
    required Map<String, String> fields,
    File? file,
    String fileFieldName = 'logo',
    Map<String, File?>? files,
    bool requiresAuth = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);

    final request = http.MultipartRequest('POST', url);
    request.fields.addAll(fields);

    print('🌐 Multipart POST to: $url');
    print('📋 Fields: ${fields.keys.join(", ")}');

    // IMPORTANT: MultipartRequest sets its own content-type; don't force JSON.
    final forwardedHeaders = Map<String, String>.from(headers)
      ..remove('Content-Type');
    request.headers.addAll(forwardedHeaders);

    if (files != null && files.isNotEmpty) {
      for (final entry in files.entries) {
        final f = entry.value;
        if (f == null) continue;
        
        // Detect MIME type from file extension
        final mimeType = _getMimeType(f.path);
        print('📎 Adding file: ${entry.key} = ${f.path.split('/').last} ($mimeType)');
        
        request.files.add(
          await http.MultipartFile.fromPath(
            entry.key,
            f.path,
            contentType: http_parser.MediaType.parse(mimeType),
          ),
        );
      }
    } else if (file != null) {
      final mimeType = _getMimeType(file.path);
      print('📎 Adding file: $fileFieldName = ${file.path.split('/').last} ($mimeType)');
      
      request.files.add(
        await http.MultipartFile.fromPath(
          fileFieldName,
          file.path,
          contentType: http_parser.MediaType.parse(mimeType),
        ),
      );
    }

    try {
      print('📤 Sending multipart request...');
      final streamed = await request.send().timeout(ApiConfig.multipartTimeout);
      final response = await http.Response.fromStream(streamed);

      print('📥 Response status: ${response.statusCode}');
      print('📄 Response body (first 200 chars): ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}');

      final data = _handleResponse(response);
      return ApiRawResponse(
        data: data,
        headers: response.headers,
        statusCode: response.statusCode,
      );
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        technicalMessage: 'Multipart request timed out after ${ApiConfig.multipartTimeout.inSeconds}s. Base URL: ${ApiConfig.baseUrl}',
      );
    } catch (e) {
      print('❌ Multipart request error: $e');
      if (e is ApiException) rethrow;
      throw ApiException(
        'Network error. Please check your internet connection and try again.',
        technicalMessage: 'Network error: $e',
      );
    }
  }

  /// Get MIME type from file extension
  String _getMimeType(String filePath) {
    final extension = filePath.toLowerCase().split('.').last;
    switch (extension) {
      // Images
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'bmp':
        return 'image/bmp';
      case 'svg':
        return 'image/svg+xml';
      
      // Documents
      case 'pdf':
        return 'application/pdf';
      case 'csv':
        return 'text/csv';
      
      // Default
      default:
        return 'application/octet-stream';
    }
  }

  Future<Map<String, dynamic>> get(
    String endpoint, {
    bool requiresAuth = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);

    try {
      final response = await _client
          .get(url, headers: headers)
          .timeout(ApiConfig.connectionTimeout);
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        technicalMessage: 'GET request timed out after ${ApiConfig.connectionTimeout.inSeconds}s. Base URL: ${ApiConfig.baseUrl}',
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        'Network error. Please check your internet connection and try again.',
        technicalMessage: 'Network error: $e',
      );
    }
  }

  Future<Map<String, dynamic>> put(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);

    try {
      final response = await _client
          .put(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        technicalMessage: 'PUT request timed out after ${ApiConfig.connectionTimeout.inSeconds}s. Base URL: ${ApiConfig.baseUrl}',
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        'Network error. Please check your internet connection and try again.',
        technicalMessage: 'Network error: $e',
      );
    }
  }

  Future<Map<String, dynamic>> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);

    try {
      final response = await _client
          .patch(
            url,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        technicalMessage: 'PATCH request timed out after ${ApiConfig.connectionTimeout.inSeconds}s. Base URL: ${ApiConfig.baseUrl}',
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        'Network error. Please check your internet connection and try again.',
        technicalMessage: 'Network error: $e',
      );
    }
  }

  Future<Map<String, dynamic>> delete(
    String endpoint, {
    bool requiresAuth = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);

    try {
      final response = await _client
          .delete(url, headers: headers)
          .timeout(ApiConfig.connectionTimeout);
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Please check your internet connection and try again.',
        statusCode: 408,
        technicalMessage: 'DELETE request timed out after ${ApiConfig.connectionTimeout.inSeconds}s. Base URL: ${ApiConfig.baseUrl}',
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        'Network error. Please check your internet connection and try again.',
        technicalMessage: 'Network error: $e',
      );
    }
  }

  Future<Map<String, String>> _buildHeaders(bool requiresAuth) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Skip ngrok browser warning only when using ngrok.
    if (ApiConfig.baseUrl.contains('ngrok')) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }

    if (requiresAuth) {
      final token = _storage.getToken();
      print('🔑 [ApiClient] Auth required - Token exists: ${token != null && token.isNotEmpty}');
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
        print('✅ [ApiClient] Authorization header added (${token.substring(0, 20)}...)');
      } else {
        print('⚠️ [ApiClient] No token available for authenticated request!');
      }
    }

    return headers;
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    final statusCode = response.statusCode;

    // Try to parse response body
    Map<String, dynamic> data;
    try {
      // Check if response is actually JSON
      final trimmed = response.body.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        final decoded = jsonDecode(trimmed);
        if (decoded is Map<String, dynamic>) {
          data = decoded;
        } else {
          // Keep method contract (Map) even if server returns a list.
          data = {'data': decoded};
        }
      } else {
        // Non-JSON response (likely HTML error page)
        data = {
          'message': 'Server returned non-JSON response',
          'statusCode': statusCode,
          'body': response.body.substring(0, response.body.length > 200 ? 200 : response.body.length),
        };
      }
    } catch (e) {
      data = {
        'message': 'Failed to parse server response: $e',
        'statusCode': statusCode,
      };
    }

    if (statusCode >= 200 && statusCode < 300) {
      return data;
    } else {
      // Get error message from response - backend messages are already user-friendly
      final backendMessage = data['message'] as String?;
      final userMessage = ErrorMessageMapper.getCombinedMessage(
        statusCode, 
        backendMessage,
      );
      
      print('❌ [ApiClient] Error Response:');
      print('   Status Code: $statusCode');
      print('   Backend Message: $backendMessage');
      print('   User Message: $userMessage');
      
      // Only clear auth data on 401 if it's actually an authentication error
      // Don't clear on "token missing" errors that might be temporary
      if (statusCode == 401 && backendMessage != null) {
        final shouldClearAuth = backendMessage.toLowerCase().contains('invalid') ||
                               backendMessage.toLowerCase().contains('expired') ||
                               backendMessage.toLowerCase().contains('unauthorized');
        
        if (shouldClearAuth) {
          print('⚠️ [ApiClient] Clearing auth data due to invalid/expired token');
          _storage.clearAuthData();
        } else {
          print('⚠️ [ApiClient] 401 error but not clearing auth - may be temporary issue');
        }
      }
      
      throw ApiException(
        userMessage,
        statusCode: statusCode,
        technicalMessage: backendMessage,
      );
    }
  }

  /// Upload file to backend
  Future<Map<String, dynamic>> uploadFile(
    String endpoint, {
    required String filePath,
    required String fieldName,
    Map<String, String>? additionalFields,
    bool requiresAuth = true,
    Duration timeout = const Duration(minutes: 5),
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);
    
    // Remove Content-Type from headers as multipart will set it
    headers.remove('Content-Type');

    print('📤 Upload File Request: $url');
    print('📁 File: $filePath');

    try {
      final request = http.MultipartRequest('POST', url);
      request.headers.addAll(headers);

      // Add file
      final file = File(filePath);
      if (!await file.exists()) {
        throw ApiException('File not found: $filePath');
      }

      final fileStream = http.ByteStream(file.openRead());
      final fileLength = await file.length();
      final fileName = filePath.split('/').last;

      // Determine content type based on file extension
      String mimeType = 'application/octet-stream';
      if (fileName.endsWith('.pdf')) {
        mimeType = 'application/pdf';
      } else if (fileName.endsWith('.docx')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileName.endsWith('.doc')) {
        mimeType = 'application/msword';
      } else if (fileName.endsWith('.txt')) {
        mimeType = 'text/plain';
      } else if (fileName.endsWith('.wav')) {
        mimeType = 'audio/wav';
      } else if (fileName.endsWith('.mp3')) {
        mimeType = 'audio/mpeg';
      }

      final multipartFile = http.MultipartFile(
        fieldName,
        fileStream,
        fileLength,
        filename: fileName,
        contentType: http_parser.MediaType.parse(mimeType),
      );

      request.files.add(multipartFile);

      // Add additional fields
      if (additionalFields != null) {
        request.fields.addAll(additionalFields);
      }

      print('🚀 Uploading $fileName ($fileLength bytes)...');
      final streamedResponse = await request.send().timeout(timeout);
      final response = await http.Response.fromStream(streamedResponse);

      print('📡 Upload Response Status: ${response.statusCode}');
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Upload timed out. Please try again.',
        statusCode: 408,
        technicalMessage: 'File upload timed out after ${timeout.inSeconds}s',
      );
    } catch (e) {
      print('❌ Error uploading file: $e');
      if (e is ApiException) rethrow;
      throw ApiException(
        'Failed to upload file. Please try again.',
        technicalMessage: 'Upload error: $e',
      );
    }
  }

  /// Upload raw bytes to [endpoint].
  ///
  /// Equivalent to [uploadFile] but works on Android/iOS when the picked file
  /// only has bytes available (no guaranteed local path).
  Future<Map<String, dynamic>> uploadFileBytes(
    String endpoint, {
    required Uint8List fileBytes,
    required String fileName,
    required String fieldName,
    required String mimeType,
    Map<String, String>? additionalFields,
    bool requiresAuth = true,
    Duration timeout = const Duration(minutes: 5),
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _buildHeaders(requiresAuth);
    headers.remove('Content-Type');

    final request = http.MultipartRequest('POST', url);
    request.headers.addAll(headers);
    request.files.add(http.MultipartFile.fromBytes(
      fieldName,
      fileBytes,
      filename: fileName,
      contentType: http_parser.MediaType.parse(mimeType),
    ));
    if (additionalFields != null) request.fields.addAll(additionalFields);

    print('📤 Upload Bytes Request: $url ($fileName, ${fileBytes.length} bytes)');

    try {
      final streamed = await request.send().timeout(timeout);
      final response = await http.Response.fromStream(streamed);
      print('📡 Upload Bytes Response Status: ${response.statusCode}');
      return _handleResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Upload timed out. Please try again.',
        statusCode: 408,
        technicalMessage: 'File bytes upload timed out after ${timeout.inSeconds}s',
      );
    } catch (e) {
      print('❌ Error uploading file bytes: $e');
      if (e is ApiException) rethrow;
      throw ApiException(
        'Failed to upload file. Please try again.',
        technicalMessage: 'Upload bytes error: $e',
      );
    }
  }

  void dispose() {
    _client.close();
  }
}

class ApiException implements Exception {
  final String message; // User-friendly message
  final int? statusCode;
  final String? technicalMessage; // Original technical message for debugging
  
  ApiException(
    this.message, {
    this.statusCode,
    this.technicalMessage,
  });

  @override
  String toString() => message;
}
