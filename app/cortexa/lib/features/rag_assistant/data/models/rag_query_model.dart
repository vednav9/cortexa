class RagQueryRequest {
  final String query;
  final int topK;
  final String? institutionId;
  final bool useWebFallback;

  RagQueryRequest({
    required this.query,
    this.topK = 5,
    this.institutionId,
    this.useWebFallback = true,
  });

  Map<String, dynamic> toJson() => {
        'query': query,
        'top_k': topK,
        if (institutionId != null) 'institution_id': institutionId,
        'use_web_fallback': useWebFallback,
      };
}
