// Singleton to store MCQs in memory across tab switches
class MCQStorage {
  static final MCQStorage _instance = MCQStorage._internal();
  factory MCQStorage() => _instance;
  MCQStorage._internal();

  final List<Map<String, dynamic>> _mcqs = [];

  List<Map<String, dynamic>> get mcqs => List.from(_mcqs);

  void addMCQ(Map<String, dynamic> mcq) {
    _mcqs.insert(0, mcq);
  }

  void clearAll() {
    _mcqs.clear();
  }
}
