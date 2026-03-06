import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/rag_query_model.dart';
import '../models/rag_response_model.dart';
import '../models/mcq_model.dart';
import '../models/chat_message_model.dart';

/// Repository for AI-powered features (RAG, MCQ, Hybrid Assistant)
class AiRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  AiRepository(this._apiClient, this._storage);

  /// Query RAG system with institution context
  Future<RagResponse> queryRag({
    required String query,
    String? institutionId,
    int topK = 5,
  }) async {
    try {
      print('🤖 Querying RAG: "$query"');
      
      final response = await _apiClient.aiPost(
        '/query',
        body: RagQueryRequest(
          query: query,
          topK: topK,
          institutionId: institutionId,
        ).toJson(),
      );

      final ragResponse = RagResponse.fromJson(response);
      print('✅ RAG response: ${ragResponse.answer.substring(0, 50)}...');
      
      // Cache chat message
      await _saveChatMessage(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        message: query,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      
      await _saveChatMessage(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        message: ragResponse.answer,
        isUser: false,
        timestamp: DateTime.now(),
        sources: ragResponse.sources.map((s) => s.documentName).toList(),
        context: ragResponse.context,
        isWebFallback: ragResponse.usedWebSearch,
      ));

      return ragResponse;
    } on ApiException catch (e) {
      throw ServerException(message: e.message, statusCode: e.statusCode ?? 400);
    } catch (e) {
      throw ServerException(
        message: 'RAG query failed: ${e.toString()}',
        statusCode: 500,
      );
    }
  }

  /// Query hybrid assistant (RAG + Web Search fallback)
  Future<RagResponse> queryHybridAssistant({
    required String query,
    bool useWebFallback = true,
  }) async {
    try {
      print('🌐 Querying Hybrid Assistant: "$query"');
      
      final response = await _apiClient.aiPost(
        '/assistant',
        body: {
          'query': query,
          'use_web_fallback': useWebFallback,
        },
      );

      final ragResponse = RagResponse.fromJson(response);
      print('✅ Hybrid response (web: ${ragResponse.usedWebSearch})');
      
      // Cache chat message
      await _saveChatMessage(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        message: query,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      
      await _saveChatMessage(ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        message: ragResponse.answer,
        isUser: false,
        timestamp: DateTime.now(),
        sources: ragResponse.sources.map((s) => s.documentName).toList(),
        isWebFallback: ragResponse.usedWebSearch,
      ));

      return ragResponse;
    } catch (e) {
      print('❌ Hybrid assistant error: $e');
      rethrow;
    }
  }

  /// Generate MCQs from text, document, or topic
  Future<List<McqQuestion>> generateMcqs({
    required String sourceType,
    required String source,
    int numQuestions = 5,
    String difficulty = 'medium',
  }) async {
    try {
      print('📝 Generating $numQuestions MCQs ($difficulty) from $sourceType');
      
      final response = await _apiClient.post(
        '/ai/mcq/generate',
        body: McqGenerateRequest(
          sourceType: sourceType,
          source: source,
          numQuestions: numQuestions,
          difficulty: difficulty,
        ).toJson(),
        requiresAuth: true,
      );

      final mcqs = (response['mcqs'] as List<dynamic>)
          .map((q) => McqQuestion.fromJson(q as Map<String, dynamic>))
          .toList();

      print('✅ Generated ${mcqs.length} MCQs');
      return mcqs;
    } catch (e) {
      print('❌ MCQ generation error: $e');
      rethrow;
    }
  }

  /// Score MCQ answers
  Future<Map<String, dynamic>> scoreMcqs({
    required List<McqQuestion> mcqs,
    required Map<int, String> userAnswers,
  }) async {
    try {
      print('📊 Scoring ${mcqs.length} MCQ answers');
      
      final response = await _apiClient.post(
        '/ai/mcq/score',
        body: {
          'mcqs': mcqs.map((q) => q.toJson()).toList(),
          'user_answers': userAnswers.map((k, v) => MapEntry(k.toString(), v)),
        },
        requiresAuth: true,
      );

      print('✅ Score: ${response['score']}/${response['total']} (${response['percentage']}%)');
      return response;
    } catch (e) {
      print('❌ MCQ scoring error: $e');
      rethrow;
    }
  }

  /// Upload document to RAG system
  Future<Map<String, dynamic>> uploadDocumentToRag({
    required String filePath,
    required String fileName,
    String? institutionId,
    String? courseId,
  }) async {
    try {
      print('📤 Uploading document: $fileName');
      
      final response = await _apiClient.uploadFile(
        '/ai/upload',
        filePath: filePath,
        fieldName: 'file',
        additionalFields: {
          if (institutionId != null) 'institution_id': institutionId,
          if (courseId != null) 'course_id': courseId,
        },
        requiresAuth: true,
      );

      print('✅ Document uploaded: ${response['chunks_added']} chunks added');
      return response;
    } catch (e) {
      print('❌ Document upload error: $e');
      rethrow;
    }
  }

  /// Get chat history from Hive cache
  Future<List<ChatMessage>> getChatHistory() async {
    try {
      final history = _storage.getRagChatHistory();
      return history
          .map((msg) => ChatMessage.fromJson(Map<String, dynamic>.from(msg as Map)))
          .toList();
    } catch (e) {
      print('❌ Error loading chat history: $e');
      return [];
    }
  }

  /// Clear chat history
  Future<void> clearChatHistory() async {
    await _storage.clearRagChatHistory();
  }

  /// Save chat message to Hive
  Future<void> _saveChatMessage(ChatMessage message) async {
    try {
      await _storage.addRagChatMessage(message.toJson());
    } catch (e) {
      print('❌ Error saving chat message: $e');
    }
  }
}
