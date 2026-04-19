import '../../../../core/network/api_client.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/errors/exceptions.dart';
import '../models/rag_response_model.dart';
import '../models/mcq_model.dart';
import '../models/chat_message_model.dart';

/// Repository for AI-powered features (RAG, MCQ, Hybrid Assistant)
class AiRepository {
  final ApiClient _apiClient;
  final HiveStorageService _storage;

  AiRepository(this._apiClient, this._storage);

  // ──────────────────────────────────────────────────────────────
  //  RAG QUERY  (Node backend → MongoDB chunks → HF LLM / Web)
  // ──────────────────────────────────────────────────────────────

  /// Query the Node-backend RAG pipeline.
  ///
  /// Flow:
  ///  1. Node embeds query  via HF Space /embed  (sentence-transformer)
  ///  2. Cosine similarity  against MongoDB DocumentChunk collection
  ///  3a. Good hits  → HF /generate with chunk context
  ///  3b. No hits    → DuckDuckGo web search, then HF /generate
  ///
  /// Endpoint: POST /api/student/rag/query  (auth required)
  Future<RagResponse> queryRag({
    required String query,
    String? institutionId,
    String? courseId,
    List<String>? documentIds,
    int topK = 5,
  }) async {
    try {
      print('🤖 Querying RAG pipeline: "$query"');

      final response = await _apiClient.post(
        '/student/rag/query',
        body: {
          'query': query,
          if (institutionId != null) 'institutionId': institutionId,
          if (courseId != null && courseId.isNotEmpty) 'courseId': courseId,
          if (documentIds != null) 'documentIds': documentIds,
        },
        requiresAuth: true,
      );

      final ragResponse = RagResponse.fromJson(response);
      print(
        '✅ RAG [${ragResponse.searchMethod}]: ${ragResponse.answer.length} chars',
      );

      await _cacheMessages(query, ragResponse);
      return ragResponse;
    } on ApiException catch (e) {
      throw ServerException(
        message: e.message,
        statusCode: e.statusCode ?? 400,
      );
    } catch (e) {
      throw ServerException(
        message:
            'Could not get an answer. Please check your connection and try again.',
        statusCode: 500,
      );
    }
  }

  /// Backward-compat alias — delegates to queryRag.
  Future<RagResponse> queryHybridAssistant({
    required String query,
    bool useWebFallback = true,
  }) => queryRag(query: query);

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

      print(
        '✅ Score: ${response['score']}/${response['total']} (${response['percentage']}%)',
      );
      return response;
    } catch (e) {
      print('❌ MCQ scoring error: $e');
      rethrow;
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  Chat history (Hive local cache)
  // ──────────────────────────────────────────────────────────────

  /// Get chat history from Hive cache
  Future<List<ChatMessage>> getChatHistory() async {
    try {
      final history = _storage.getRagChatHistory();
      return history
          .map(
            (msg) =>
                ChatMessage.fromJson(Map<String, dynamic>.from(msg as Map)),
          )
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

  // ──────────────────────────────────────────────────────────────
  //  Private helpers
  // ──────────────────────────────────────────────────────────────

  Future<void> _cacheMessages(String query, RagResponse response) async {
    await _saveChatMessage(
      ChatMessage(
        id: '${DateTime.now().millisecondsSinceEpoch}_q',
        message: query,
        isUser: true,
        timestamp: DateTime.now(),
      ),
    );

    await _saveChatMessage(
      ChatMessage(
        id: '${DateTime.now().millisecondsSinceEpoch}_a',
        message: response.answer,
        isUser: false,
        timestamp: DateTime.now(),
        sources: response.sources.map((s) => s.documentName).toList(),
        richSources: response.sources,
        isWebFallback: response.usedWebSearch,
        searchMethod: response.searchMethod,
      ),
    );
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
