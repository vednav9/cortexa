class RagResponse {
  final String query;
  final String answer;
  final List<DocumentSource> sources;
  final String context;
  final bool? usedWebSearch;

  RagResponse({
    required this.query,
    required this.answer,
    required this.sources,
    required this.context,
    this.usedWebSearch,
  });

  factory RagResponse.fromJson(Map<String, dynamic> json) {
    return RagResponse(
      query: json['query'] as String,
      answer: json['answer'] as String,
      sources: (json['sources'] as List<dynamic>?)
              ?.map((s) => DocumentSource.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
      context: json['context'] as String? ?? '',
      usedWebSearch: json['used_web_search'] as bool?,
    );
  }

  Map<String, dynamic> toJson() => {
        'query': query,
        'answer': answer,
        'sources': sources.map((s) => s.toJson()).toList(),
        'context': context,
        'used_web_search': usedWebSearch,
      };
}

class DocumentSource {
  final String documentName;
  final String? chunkText;
  final double? similarityScore;
  final int? pageNumber;

  DocumentSource({
    required this.documentName,
    this.chunkText,
    this.similarityScore,
    this.pageNumber,
  });

  factory DocumentSource.fromJson(Map<String, dynamic> json) {
    return DocumentSource(
      documentName: json['document_name'] as String? ?? 
                    json['document'] as String? ?? 
                    'Unknown',
      chunkText: json['chunk_text'] as String? ?? json['text'] as String?,
      similarityScore: (json['similarity_score'] as num?)?.toDouble() ?? 
                      (json['score'] as num?)?.toDouble(),
      pageNumber: json['page_number'] as int? ?? json['page'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'document_name': documentName,
        'chunk_text': chunkText,
        'similarity_score': similarityScore,
        'page_number': pageNumber,
      };
}
