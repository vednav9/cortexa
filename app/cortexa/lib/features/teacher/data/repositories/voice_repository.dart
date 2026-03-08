import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../../core/config/api_config.dart';

class VoiceRepository {
  /// Transcribe audio and upload to AI knowledge base
  /// 
  /// Calls AI service directly at /speech/transcribe-and-upload
  /// Returns transcription with formatted text and metadata
  Future<Map<String, dynamic>> transcribeAndUpload({
    required String audioFilePath,
    required String lectureTitle,
    required String teacherId,
    required String institutionId,
    String? courseId,
  }) async {
    try {
      // For AI service, we need direct URL without /api prefix
      // Based on frontend: AI_URL is at port 8000, separate from backend
      // Remove the /api suffix from aiBaseUrl to get root AI service URL
      final aiBaseUrl = ApiConfig.aiBaseUrl;
      final aiServiceUrl = aiBaseUrl.endsWith('/api') 
          ? aiBaseUrl.substring(0, aiBaseUrl.length - 4)
          : aiBaseUrl;
      
      final url = Uri.parse('$aiServiceUrl/speech/transcribe-and-upload');
      
      final request = http.MultipartRequest('POST', url);
      
      // Add audio file
      final file = File(audioFilePath);
      if (!await file.exists()) {
        throw Exception('Audio file not found: $audioFilePath');
      }
      
      final audioBytes = await file.readAsBytes();
      final multipartFile = http.MultipartFile.fromBytes(
        'audio_file',
        audioBytes,
        filename: 'lecture_${DateTime.now().millisecondsSinceEpoch}.wav',
      );
      
      request.files.add(multipartFile);
      
      // Add metadata
      request.fields['lecture_title'] = lectureTitle;
      request.fields['teacher_id'] = teacherId;
      request.fields['institution_id'] = institutionId;
      if (courseId != null && courseId.isNotEmpty) {
        request.fields['course_id'] = courseId;
      }
      
      // Send request
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        try {
          final data = json.decode(response.body) as Map<String, dynamic>;
          return data;
        } on FormatException {
          throw Exception(
            'Server returned an unexpected response. Raw: ${response.body.length > 300 ? response.body.substring(0, 300) : response.body}',
          );
        }
      } else {
        String errorMessage = 'Transcription failed (HTTP ${response.statusCode})';
        try {
          final errorData = json.decode(response.body);
          errorMessage = (errorData['detail'] ?? errorData['message'] ?? errorMessage).toString();
        } on FormatException {
          if (response.body.trim().isNotEmpty) {
            errorMessage = response.body.length > 300
                ? response.body.substring(0, 300)
                : response.body;
          }
        }
        throw Exception(errorMessage);
      }
    } catch (e) {
      throw Exception('Failed to transcribe audio: ${e.toString()}');
    }
  }
  
  /// Push plain text (edited transcript) directly into the RAG knowledge base.
  ///
  /// Called fire-and-forget (`.ignore()`) — failure is non-fatal; the recording
  /// is still saved locally even if the RAG update fails.
  Future<Map<String, dynamic>> ingestTextToRag({
    required String text,
    required String lectureTitle,
    required String teacherId,
    required String institutionId,
    String? courseId,
    String? recordingId,
  }) async {
    try {
      final aiBaseUrl = ApiConfig.aiBaseUrl;
      final aiServiceUrl = aiBaseUrl.endsWith('/api')
          ? aiBaseUrl.substring(0, aiBaseUrl.length - 4)
          : aiBaseUrl;

      final request = http.MultipartRequest(
          'POST', Uri.parse('$aiServiceUrl/rag/ingest-text'));
      request.fields['text'] = text;
      request.fields['lecture_title'] = lectureTitle;
      request.fields['teacher_id'] = teacherId;
      request.fields['institution_id'] = institutionId;
      if (courseId != null) request.fields['course_id'] = courseId;
      if (recordingId != null) request.fields['recording_id'] = recordingId;

      final streamedResponse =
          await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return json.decode(response.body) as Map<String, dynamic>;
      }
      return {'status': 'skipped', 'reason': 'HTTP ${response.statusCode}'};
    } catch (_) {
      return {'status': 'skipped', 'reason': 'network error'};
    }
  }

  /// Download transcription as document
  Future<void> downloadTranscription(String downloadUrl) async {
    // This would trigger download in a real implementation
    // For now, just open the URL
    throw UnimplementedError('Download functionality coming soon');
  }
}
