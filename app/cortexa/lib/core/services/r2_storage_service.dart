import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;

/// Cloudflare R2 storage service using the S3-compatible REST API with
/// AWS Signature Version 4 authentication.
class R2StorageService {
  final String accountId;
  final String accessKeyId;
  final String secretAccessKey;
  final String bucketName;

  static const String _service = 's3';
  static const String _region = 'auto';

  R2StorageService({
    required this.accountId,
    required this.accessKeyId,
    required this.secretAccessKey,
    required this.bucketName,
  });

  bool get isConfigured =>
      accountId.isNotEmpty &&
      accessKeyId.isNotEmpty &&
      secretAccessKey.isNotEmpty &&
      bucketName.isNotEmpty;

  String get _host => '$accountId.r2.cloudflarestorage.com';

  static String _amzDateTime(DateTime t) {
    String p(int v, [int w = 2]) => v.toString().padLeft(w, '0');
    return '${p(t.year, 4)}${p(t.month)}${p(t.day)}T${p(t.hour)}${p(t.minute)}${p(t.second)}Z';
  }

  static String _amzDate(DateTime t) => _amzDateTime(t).substring(0, 8);

  static List<int> _hmac(List<int> key, String data) =>
      Hmac(sha256, key).convert(utf8.encode(data)).bytes;

  static String _hexHash(List<int> data) => sha256.convert(data).toString();

  List<int> _signingKey(DateTime t) {
    final k1 = _hmac(utf8.encode('AWS4$secretAccessKey'), _amzDate(t));
    final k2 = _hmac(k1, _region);
    final k3 = _hmac(k2, _service);
    return _hmac(k3, 'aws4_request');
  }

  /// URI-encode each path segment, preserving `/` separators.
  String _encodePath(String key) =>
      key.split('/').map(Uri.encodeComponent).join('/');

  Map<String, String> _authHeaders({
    required String method,
    required String objectKey,
    required List<int> payload,
    String contentType = '',
  }) {
    final now = DateTime.now().toUtc();
    final amzDate = _amzDateTime(now);
    final dateStamp = _amzDate(now);
    final path = '/$bucketName/${_encodePath(objectKey)}';
    final payloadHash = _hexHash(payload);

    // Build canonical headers (must be sorted alphabetically)
    final rawHeaders = <String, String>{
      'host': _host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };
    if (contentType.isNotEmpty) rawHeaders['content-type'] = contentType;

    final sortedKeys = rawHeaders.keys.toList()..sort();
    // Each header line ends with \n; the whole block ends with \n for the
    // blank line that SigV4 requires before the SignedHeaders element.
    final canonicalHeaders =
        sortedKeys.map((k) => '$k:${rawHeaders[k]}').join('\n') + '\n';
    final signedHeaders = sortedKeys.join(';');

    final canonicalRequest = [
      method,
      path,
      '', // empty query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    final scope = '$dateStamp/$_region/$_service/aws4_request';
    final stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      _hexHash(utf8.encode(canonicalRequest)),
    ].join('\n');

    final sigHex = _hmac(_signingKey(now), stringToSign)
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();

    final result = <String, String>{
      'Authorization':
          'AWS4-HMAC-SHA256 Credential=$accessKeyId/$scope, SignedHeaders=$signedHeaders, Signature=$sigHex',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };
    if (contentType.isNotEmpty) result['Content-Type'] = contentType;
    return result;
  }

  /// Upload a WAV audio file to R2.
  /// Returns the object key on success, null on failure.
  Future<String?> uploadAudio(File audioFile, String objectKey) async {
    if (!isConfigured) return null;
    try {
      if (!await audioFile.exists()) return null;
      final bytes = await audioFile.readAsBytes();
      final headers = _authHeaders(
        method: 'PUT',
        objectKey: objectKey,
        payload: bytes,
        contentType: 'audio/wav',
      );
      final url = Uri.https(
        _host,
        '/$bucketName/${_encodePath(objectKey)}',
      );
      final response =
          await http.put(url, headers: headers, body: bytes).timeout(
                const Duration(minutes: 5),
              );
      return (response.statusCode == 200 ||
              response.statusCode == 201 ||
              response.statusCode == 204)
          ? objectKey
          : null;
    } catch (_) {
      return null;
    }
  }

  /// Delete an object from R2.
  /// Returns true if deleted, already absent (404), or on any 2xx.
  Future<bool> deleteObject(String objectKey) async {
    if (!isConfigured) return false;
    try {
      final headers = _authHeaders(
        method: 'DELETE',
        objectKey: objectKey,
        payload: const [],
      );
      final url = Uri.https(
        _host,
        '/$bucketName/${_encodePath(objectKey)}',
      );
      final response =
          await http.delete(url, headers: headers).timeout(
                const Duration(seconds: 30),
              );
      return response.statusCode == 204 ||
          response.statusCode == 200 ||
          response.statusCode == 404;
    } catch (_) {
      return false;
    }
  }
}
