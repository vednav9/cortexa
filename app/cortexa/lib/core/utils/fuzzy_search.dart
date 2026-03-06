/// Lightweight fuzzy search utility — no external packages required.
///
/// Strategy (layered, in priority order):
///   1. Exact substring match  → always wins (score = 1.0)
///   2. All query words present as substrings (word match) → score = 0.9
///   3. Bigram similarity (Sørensen–Dice coefficient) ≥ [threshold]
///
/// This means "compter" matches "computer" (bigrams overlap strongly),
/// "CS Dept" matches "CSE Department" (word match), etc. while short 1-2 char
/// queries are handled correctly by the substring fast-path.
class FuzzySearch {
  /// Default similarity threshold (0.0–1.0). Raise to be stricter.
  static const double defaultThreshold = 0.35;

  /// Returns `true` when [query] fuzzy-matches [text].
  ///
  /// Both arguments are expected to already be lowercased and trimmed.
  static bool matches(
    String text,
    String query, {
    double threshold = defaultThreshold,
  }) {
    if (query.isEmpty) return true;
    if (text.isEmpty) return false;

    // 1. Fast path — exact substring
    if (text.contains(query)) return true;

    // 2. All individual words present
    final queryWords = query.split(RegExp(r'\s+'));
    if (queryWords.length > 1) {
      if (queryWords.every((w) => w.isEmpty || text.contains(w))) return true;
    }

    // 3. Bigram similarity — skip for very short queries to avoid false
    //    positives (e.g. "a" matching everything).
    if (query.length < 3) return false;

    return _bigramSimilarity(text, query) >= threshold;
  }

  /// Matches [query] against multiple [fields] — returns true if ANY field matches.
  static bool matchesAny(
    List<String> fields,
    String query, {
    double threshold = defaultThreshold,
  }) {
    final q = query.toLowerCase().trim();
    if (q.isEmpty) return true;
    return fields.any((f) => matches(f.toLowerCase(), q, threshold: threshold));
  }

  // ---------------------------------------------------------------------------
  // Sørensen–Dice bigram similarity
  // ---------------------------------------------------------------------------

  static Set<String> _bigrams(String s) {
    if (s.length < 2) return {};
    final result = <String>{};
    for (int i = 0; i < s.length - 1; i++) {
      result.add(s.substring(i, i + 2));
    }
    return result;
  }

  static double _bigramSimilarity(String a, String b) {
    final bigramsA = _bigrams(a);
    final bigramsB = _bigrams(b);

    if (bigramsA.isEmpty || bigramsB.isEmpty) return 0.0;

    final intersection = bigramsA.intersection(bigramsB).length;
    return (2.0 * intersection) / (bigramsA.length + bigramsB.length);
  }
}
