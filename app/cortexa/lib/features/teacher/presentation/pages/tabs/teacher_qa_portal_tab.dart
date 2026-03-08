import 'package:flutter/material.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/utils/fuzzy_search.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../data/models/qa_item_model.dart';
import '../../../data/repositories/qa_section_repository.dart';

class TeacherQAPortalTab extends StatefulWidget {
  const TeacherQAPortalTab({super.key});

  @override
  State<TeacherQAPortalTab> createState() => _TeacherQAPortalTabState();
}

class _TeacherQAPortalTabState extends State<TeacherQAPortalTab> {
  late final QASectionRepository _repo;
  late final HiveStorageService _storage;

  String? _institutionId;

  List<CourseOption> _courses = [];
  CourseOption? _selectedCourse;
  List<QAItem> _allQAs = [];
  final Set<String> _upvotedQAIds = {};
  QAStats _stats = const QAStats.empty();

  String _filterStatus = 'all';
  String _filterCategory = 'all';
  String _sortBy = '-createdAt';
  final _searchController = TextEditingController();

  bool _isLoadingCourses = true;
  bool _isLoadingQAs = false;

  static const _categories = [
    {'value': 'general', 'label': 'General'},
    {'value': 'technical', 'label': 'Technical'},
    {'value': 'academic', 'label': 'Academic'},
    {'value': 'assignment', 'label': 'Assignment'},
    {'value': 'exam', 'label': 'Exam'},
    {'value': 'other', 'label': 'Other'},
  ];

  static const _statuses = [
    {'value': 'all', 'label': 'All'},
    {'value': 'open', 'label': 'Open'},
    {'value': 'in-progress', 'label': 'In Progress'},
    {'value': 'resolved', 'label': 'Resolved'},
  ];

  @override
  void initState() {
    super.initState();
    _repo = QASectionRepository();
    _storage = getIt<HiveStorageService>();
    final user = _storage.getCurrentUser();
    _institutionId = user?.institutionId;
    _loadCourses();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCourses() async {
    if (_institutionId == null) {
      setState(() => _isLoadingCourses = false);
      return;
    }
    try {
      setState(() => _isLoadingCourses = true);
      final courses = await _repo.getCourses(_institutionId!);
      if (!mounted) return;
      setState(() {
        _courses = courses;
        _isLoadingCourses = false;
        if (courses.isNotEmpty) {
          _selectedCourse = courses.first;
        }
      });
      if (_selectedCourse != null) {
        await Future.wait([_loadQAs(), _loadStats()]);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoadingCourses = false);
      _showError('Failed to load courses: $e');
    }
  }

  Future<void> _loadQAs() async {
    if (_selectedCourse == null) return;
    try {
      setState(() => _isLoadingQAs = true);
      final qas = await _repo.getQAsByCourse(_selectedCourse!.id);
      if (!mounted) return;
      setState(() {
        _allQAs = qas;
        _isLoadingQAs = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoadingQAs = false);
      _showError('Failed to load questions: $e');
    }
  }

  Future<void> _loadStats() async {
    if (_selectedCourse == null) return;
    try {
      final stats = await _repo.getQAStats(_selectedCourse!.id);
      if (!mounted) return;
      setState(() => _stats = stats);
    } catch (_) {}
  }

  void _onCourseChanged(CourseOption? course) {
    if (course == null || course.id == _selectedCourse?.id) return;
    setState(() {
      _selectedCourse = course;
      _allQAs = [];
      _stats = const QAStats.empty();
    });
    Future.wait([_loadQAs(), _loadStats()]);
  }

  void _onFilterChanged() {
    setState(() {});
  }

  List<QAItem> get _filteredQAs {
    var result = List<QAItem>.from(_allQAs);
    // Status filter
    if (_filterStatus != 'all') {
      result = result.where((q) => q.status == _filterStatus).toList();
    }
    // Category filter
    if (_filterCategory != 'all') {
      result = result.where((q) => q.category == _filterCategory).toList();
    }
    // Fuzzy search
    final q = _searchController.text.trim();
    if (q.isNotEmpty) {
      result = result.where((qa) {
        return FuzzySearch.matchesAny(
            [qa.title, qa.description, qa.category, ...qa.tags], q);
      }).toList();
    }
    // Sort
    switch (_sortBy) {
      case '-createdAt':
        result.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case 'createdAt':
        result.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        break;
      case '-views':
        result.sort((a, b) => b.views.compareTo(a.views));
        break;
      case '-upvotes':
        result
            .sort((a, b) => b.upvotes.length.compareTo(a.upvotes.length));
        break;
    }
    return result;
  }

  Future<void> _upvoteQA(String qaId) async {
    // Optimistic toggle
    setState(() {
      if (_upvotedQAIds.contains(qaId)) {
        _upvotedQAIds.remove(qaId);
      } else {
        _upvotedQAIds.add(qaId);
      }
    });
    try {
      final (cnt, hasUpvoted) = await _repo.upvoteQA(qaId);
      if (!mounted) return;
      setState(() {
        // Sync with server truth
        if (hasUpvoted) {
          _upvotedQAIds.add(qaId);
        } else {
          _upvotedQAIds.remove(qaId);
        }
        _allQAs = _allQAs.map((q) {
          if (q.id == qaId) {
            return q.copyWith(
                upvotes: List.generate(cnt, (i) => i.toString()));
          }
          return q;
        }).toList();
      });
    } catch (_) {
      // Revert optimistic update on failure
      if (!mounted) return;
      setState(() {
        if (_upvotedQAIds.contains(qaId)) {
          _upvotedQAIds.remove(qaId);
        } else {
          _upvotedQAIds.add(qaId);
        }
      });
    }
  }

  void _showError(String msg, [BuildContext? modalCtx]) {
    if (!mounted) return;
    final c =
        (modalCtx != null && modalCtx.mounted) ? modalCtx : context;
    ScaffoldMessenger.of(c).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.error),
    );
  }

  void _showSuccess(String msg, [BuildContext? modalCtx]) {
    if (!mounted) return;
    final c =
        (modalCtx != null && modalCtx.mounted) ? modalCtx : context;
    ScaffoldMessenger.of(c).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.success),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open':
        return Colors.orange;
      case 'in-progress':
        return AppColors.info;
      case 'resolved':
        return AppColors.success;
      case 'closed':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'urgent':
        return AppColors.error;
      case 'high':
        return Colors.orange;
      case 'normal':
        return AppColors.info;
      case 'low':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  Color _categoryColor(String category) {
    switch (category) {
      case 'technical':
        return Colors.purple;
      case 'academic':
        return AppColors.primary;
      case 'assignment':
        return Colors.orange;
      case 'exam':
        return AppColors.error;
      case 'other':
        return Colors.grey;
      default:
        return AppColors.info;
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  // ─────────────────────────────────────────────────────── ASK SHEET ──────

  void _showAskSheet() {
    if (_selectedCourse == null) {
      _showError('Please select a course first');
      return;
    }

    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final tagCtrl = TextEditingController();
    String category = 'general';
    String priority = 'normal';
    List<String> tags = [];
    bool isAnonymous = false;
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: DraggableScrollableSheet(
            initialChildSize: 0.92,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            builder: (_, scroll) => StatefulBuilder(
              builder: (ctx, setSheet) => Container(
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Drag handle
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderDark.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Sheet header
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 4, 12, 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Ask a Question',
                                style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary)),
                            const SizedBox(height: 4),
                            Text(
                              '${_selectedCourse!.code} - ${_selectedCourse!.name}',
                              style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close,
                            color: AppColors.textSecondary),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.divider),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scroll,
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Title
                        _label('Question Title *'),
                        const SizedBox(height: 8),
                        _inputField(
                          controller: titleCtrl,
                          hint: "What's your question?",
                        ),
                        const SizedBox(height: 16),
                        // Description
                        _label('Description *'),
                        const SizedBox(height: 8),
                        _inputField(
                          controller: descCtrl,
                          hint: 'Provide more details...',
                          maxLines: 4,
                        ),
                        const SizedBox(height: 16),
                        // Category + Priority
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _label('Category'),
                                  const SizedBox(height: 8),
                                  _dropdown(
                                    value: category,
                                    items: _categories.map((c) {
                                      return DropdownMenuItem(
                                        value: c['value'],
                                        child: Text(c['label']!),
                                      );
                                    }).toList(),
                                    onChanged: (v) =>
                                        setSheet(() => category = v ?? category),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _label('Priority'),
                                  const SizedBox(height: 8),
                                  _dropdown(
                                    value: priority,
                                    items: const [
                                      DropdownMenuItem(
                                          value: 'low', child: Text('Low')),
                                      DropdownMenuItem(
                                          value: 'normal',
                                          child: Text('Normal')),
                                      DropdownMenuItem(
                                          value: 'high', child: Text('High')),
                                      DropdownMenuItem(
                                          value: 'urgent',
                                          child: Text('Urgent')),
                                    ],
                                    onChanged: (v) =>
                                        setSheet(() => priority = v ?? priority),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Tags
                        _label('Tags'),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: _inputField(
                                controller: tagCtrl,
                                hint: 'Add tag and press +',
                              ),
                            ),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () {
                                final t = tagCtrl.text.trim();
                                if (t.isNotEmpty && !tags.contains(t)) {
                                  setSheet(() {
                                    tags = [...tags, t];
                                    tagCtrl.clear();
                                  });
                                }
                              },
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color:
                                      AppColors.primary.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.add,
                                    color: AppColors.primary, size: 20),
                              ),
                            ),
                          ],
                        ),
                        if (tags.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: tags
                                .map((t) => Chip(
                                      label: Text('#$t',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.primary)),
                                      backgroundColor:
                                          AppColors.primary.withValues(alpha: 0.12),
                                      deleteIcon: const Icon(Icons.close,
                                          size: 14,
                                          color: AppColors.textSecondary),
                                      onDeleted: () => setSheet(
                                          () => tags = tags
                                              .where((x) => x != t)
                                              .toList()),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 4),
                                      materialTapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                    ))
                                .toList(),
                          ),
                        ],
                        const SizedBox(height: 16),
                        // Anonymous
                        InkWell(
                          onTap: () =>
                              setSheet(() => isAnonymous = !isAnonymous),
                          borderRadius: BorderRadius.circular(8),
                          child: Row(
                            children: [
                              Checkbox(
                                value: isAnonymous,
                                onChanged: (v) =>
                                    setSheet(() => isAnonymous = v ?? false),
                                activeColor: AppColors.primary,
                                side: const BorderSide(
                                    color: AppColors.borderDark),
                              ),
                              const Text('Post anonymously',
                                  style: TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 14)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Submit bar
                Container(
                  padding: EdgeInsets.fromLTRB(
                      24, 16, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border: Border(
                        top: BorderSide(color: AppColors.divider)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.textSecondary,
                            side: const BorderSide(
                                color: AppColors.borderDark),
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton.icon(
                          onPressed: submitting
                              ? null
                              : () async {
                                  final t = titleCtrl.text.trim();
                                  final d = descCtrl.text.trim();
                                  if (t.isEmpty || d.isEmpty) {
                                    _showError(
                                        'Title and description are required',
                                        ctx);
                                    return;
                                  }
                                  setSheet(() => submitting = true);
                                  try {
                                    final qa = await _repo.createQA(
                                      _selectedCourse!.id,
                                      title: t,
                                      description: d,
                                      category: category,
                                      priority: priority,
                                      tags: tags,
                                      isAnonymous: isAnonymous,
                                    );
                                    if (ctx.mounted) Navigator.pop(ctx);
                                    setState(() => _allQAs = [qa, ..._allQAs]);
                                    _loadStats();
                                    // ignore: use_build_context_synchronously
                                    _showSuccess('Question posted successfully!', ctx);
                                  } catch (e) {
                                    setSheet(() => submitting = false);
                                    // ignore: use_build_context_synchronously
                                    _showError('Failed to post question: $e', ctx);
                                  }
                                },
                          icon: submitting
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white))
                              : const Icon(Icons.send, size: 18),
                          label: const Text('Post Question'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  ),
);
  }

  // ─────────────────────────────────────────────── QUESTION DETAIL SHEET ──

  void _showDetailSheet(QAItem qa) {
    QAItem current = qa;
    final answerCtrl = TextEditingController();
    bool submittingAnswer = false;
    bool updatingStatus = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: DraggableScrollableSheet(
            initialChildSize: 0.88,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            builder: (_, scroll) => StatefulBuilder(
              builder: (ctx, setSheet) => Container(
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderDark.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Question header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              current.title,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close,
                                color: AppColors.textSecondary),
                            onPressed: () => Navigator.pop(ctx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Badges row
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _badge(current.status, _statusColor(current.status)),
                          _badge(current.priority,
                              _priorityColor(current.priority)),
                          _badge(current.category,
                              _categoryColor(current.category)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Status change dropdown (teacher)
                      Row(
                        children: [
                          const Icon(Icons.tune,
                              size: 14, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          const Text('Update Status:',
                              style: TextStyle(
                                  fontSize: 12, color: AppColors.textMuted)),
                          const SizedBox(width: 8),
                          DropdownButton<String>(
                            value: current.status,
                            isDense: true,
                            underline: const SizedBox(),
                            dropdownColor: AppColors.backgroundDark,
                            style: TextStyle(
                              fontSize: 12,
                              color: _statusColor(current.status),
                              fontWeight: FontWeight.w600,
                            ),
                            items: const [
                              DropdownMenuItem(
                                  value: 'open', child: Text('Open')),
                              DropdownMenuItem(
                                  value: 'in-progress',
                                  child: Text('In Progress')),
                              DropdownMenuItem(
                                  value: 'resolved',
                                  child: Text('Resolved')),
                              DropdownMenuItem(
                                  value: 'closed', child: Text('Closed')),
                            ],
                            onChanged: updatingStatus
                                ? null
                                : (newStatus) async {
                                    if (newStatus == null ||
                                        newStatus == current.status) {
                                      return;
                                    }
                                    setSheet(() => updatingStatus = true);
                                    try {
                                      final updated =
                                          await _repo.updateStatus(
                                              current.id, newStatus);
                                      setSheet(() {
                                        current = updated;
                                        updatingStatus = false;
                                      });
                                      setState(() {
                                        _allQAs = _allQAs
                                            .map((q) =>
                                                q.id == current.id
                                                    ? updated
                                                    : q)
                                            .toList();
                                      });
                                      _loadStats();
                                      // ignore: use_build_context_synchronously
                                      _showSuccess('Status updated!', ctx);
                                    } catch (e) {
                                      setSheet(() => updatingStatus = false);
                                      // ignore: use_build_context_synchronously
                                      _showError('Failed to update status: $e', ctx);
                                    }
                                  },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.divider),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scroll,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Description
                        Text(current.description,
                            style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                                height: 1.6)),
                        // Tags
                        if (current.tags.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: current.tags
                                .map((t) => Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary
                                            .withValues(alpha: 0.12),
                                        borderRadius:
                                            BorderRadius.circular(20),
                                      ),
                                      child: Text('#$t',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.primary)),
                                    ))
                                .toList(),
                          ),
                        ],
                        const SizedBox(height: 12),
                        // Meta
                        Row(
                          children: [
                            const Icon(Icons.person_outline,
                                size: 14, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Text(
                              current.isAnonymous
                                  ? 'Anonymous'
                                  : current.askedBy.name,
                              style: const TextStyle(
                                  fontSize: 12, color: AppColors.textMuted),
                            ),
                            const SizedBox(width: 16),
                            const Icon(Icons.access_time,
                                size: 14, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Text(_timeAgo(current.createdAt),
                                style: const TextStyle(
                                    fontSize: 12, color: AppColors.textMuted)),
                            const SizedBox(width: 16),
                            const Icon(Icons.visibility_outlined,
                                size: 14, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Text('${current.views} views',
                                style: const TextStyle(
                                    fontSize: 12, color: AppColors.textMuted)),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Answers header
                        Text(
                          '${current.answers.length} Answer${current.answers.length != 1 ? 's' : ''}',
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 12),
                        // Answers list
                        if (current.answers.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Center(
                              child: Column(
                                children: [
                                  Icon(Icons.chat_bubble_outline,
                                      size: 40,
                                      color: AppColors.textMuted),
                                  SizedBox(height: 8),
                                  Text('No answers yet',
                                      style: TextStyle(
                                          color: AppColors.textMuted)),
                                  SizedBox(height: 4),
                                  Text('Be the first to answer!',
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textMuted)),
                                ],
                              ),
                            ),
                          )
                        else
                          ...current.answers.map(
                            (ans) => Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: ans.isAccepted
                                    ? AppColors.success.withValues(alpha: 0.08)
                                    : AppColors.background,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: ans.isAccepted
                                      ? AppColors.success
                                          .withValues(alpha: 0.3)
                                      : AppColors.borderDark
                                          .withValues(alpha: 0.3),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Answer text
                                  Text(ans.text,
                                      style: const TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textSecondary,
                                          height: 1.5)),
                                  const SizedBox(height: 10),
                                  // Answer meta
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 12,
                                        backgroundColor: AppColors.primary
                                            .withValues(alpha: 0.2),
                                        child: Text(
                                          ans.answeredBy.name.isNotEmpty
                                              ? ans.answeredBy.name[0]
                                                  .toUpperCase()
                                              : '?',
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(ans.answeredBy.name,
                                                style: const TextStyle(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600,
                                                    color:
                                                        AppColors.textPrimary)),
                                            Text(
                                              ans.answeredBy.userType,
                                              style: const TextStyle(
                                                  fontSize: 10,
                                                  color: AppColors.textMuted),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Text(_timeAgo(ans.answeredAt),
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.textMuted)),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  // Actions
                                  Row(
                                    children: [
                                      // Upvote
                                      _actionButton(
                                        icon: Icons.thumb_up_outlined,
                                        label: '${ans.upvotes.length}',
                                        onTap: () async {
                                          try {
                                            final cnt =
                                                await _repo.upvoteAnswer(
                                                    current.id, ans.id);
                                            final updated = current.copyWith(
                                              answers: current.answers
                                                  .map((a) => a.id == ans.id
                                                      ? QAAnswer(
                                                          id: a.id,
                                                          answeredBy:
                                                              a.answeredBy,
                                                          text: a.text,
                                                          isAccepted:
                                                              a.isAccepted,
                                                          upvotes: List.generate(
                                                              cnt,
                                                              (i) => i
                                                                  .toString()),
                                                          answeredAt:
                                                              a.answeredAt,
                                                        )
                                                      : a)
                                                  .toList(),
                                            );
                                            setSheet(() => current = updated);
                                          } catch (_) {}
                                        },
                                      ),
                                      const SizedBox(width: 8),
                                      // Accept answer
                                      if (!ans.isAccepted)
                                        _actionButton(
                                          icon: Icons.check_circle_outline,
                                          label: 'Accept',
                                          color: AppColors.success,
                                          onTap: () async {
                                            try {
                                              final updated =
                                                  await _repo.acceptAnswer(
                                                      current.id, ans.id);
                                              setSheet(
                                                  () => current = updated);
                                              setState(() {
                                                _allQAs = _allQAs
                                                    .map((q) =>
                                                        q.id == current.id
                                                            ? updated
                                                            : q)
                                                    .toList();
                                              });
                                              _loadStats();
                                              // ignore: use_build_context_synchronously
                                              _showSuccess('Answer accepted!', ctx);
                                            } catch (e) {
                                              // ignore: use_build_context_synchronously
                                              _showError('Failed to accept: $e', ctx);
                                            }
                                          },
                                        )
                                      else
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: const [
                                            Icon(Icons.check_circle,
                                                size: 14,
                                                color: AppColors.success),
                                            SizedBox(width: 4),
                                            Text('Accepted',
                                                style: TextStyle(
                                                    fontSize: 12,
                                                    color: AppColors.success,
                                                    fontWeight:
                                                        FontWeight.w600)),
                                          ],
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
                // Answer input bar
                Container(
                  padding: EdgeInsets.fromLTRB(
                      16, 12, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
                  decoration: const BoxDecoration(
                    color: AppColors.surface,
                    border:
                        Border(top: BorderSide(color: AppColors.divider)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: answerCtrl,
                          maxLines: 3,
                          minLines: 1,
                          style: const TextStyle(
                              fontSize: 14, color: AppColors.textPrimary),
                          decoration: InputDecoration(
                            hintText: 'Type your answer...',
                            hintStyle: const TextStyle(
                                color: AppColors.textMuted, fontSize: 13),
                            filled: true,
                            fillColor: AppColors.background,
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(
                                  color:
                                      AppColors.borderDark.withValues(alpha: 0.3)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                  color: AppColors.primary, width: 1.5),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      _sendButton(
                        loading: submittingAnswer,
                        onTap: () async {
                          final text = answerCtrl.text.trim();
                          if (text.isEmpty) return;
                          setSheet(() => submittingAnswer = true);
                          try {
                            final updated = await _repo.addAnswer(current.id, text);
                            setSheet(() {
                              current = updated;
                              submittingAnswer = false;
                              answerCtrl.clear();
                            });
                            setState(() {
                              _allQAs = _allQAs
                                  .map((q) =>
                                      q.id == current.id ? updated : q)
                                  .toList();
                            });
                            _loadStats();
                            // ignore: use_build_context_synchronously
                            _showSuccess('Answer posted!', ctx);
                          } catch (e) {
                            setSheet(() => submittingAnswer = false);
                            // ignore: use_build_context_synchronously
                            _showError('Failed to post answer: $e', ctx);
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  ),
);
  }

  // ───────────────────────────────────────────────────────── BUILD ──────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoadingCourses
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : _courses.isEmpty
              ? _buildNoCourses()
              : _buildContent(),
      floatingActionButton: (_selectedCourse != null && !_isLoadingCourses)
          ? FloatingActionButton.extended(
              onPressed: _showAskSheet,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_comment_outlined),
              label: const Text('Ask Question',
                  style: TextStyle(fontWeight: FontWeight.w600)),
            )
          : null,
    );
  }

  Widget _buildNoCourses() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.book_outlined,
                color: AppColors.error, size: 48),
          ),
          const SizedBox(height: 20),
          const Text('No Courses Available',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          const Text('Create courses in Academic Structure first.',
              style:
                  TextStyle(fontSize: 14, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        await Future.wait([_loadQAs(), _loadStats()]);
      },
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _buildHeader()),
          SliverToBoxAdapter(child: _buildCourseSelector()),
          if (_selectedCourse != null) ...[
            SliverToBoxAdapter(child: _buildStats()),
            SliverToBoxAdapter(child: _buildFilters()),
            if (_isLoadingQAs)
              const SliverToBoxAdapter(
                child: SizedBox(
                  height: 300,
                  child: Center(
                      child: CircularProgressIndicator(
                          color: AppColors.primary)),
                ),
              )
            else if (_filteredQAs.isEmpty)
              SliverToBoxAdapter(
                  child: SizedBox(height: 300, child: _buildEmptyState()))
            else
              SliverPadding(
                padding: const EdgeInsets.only(bottom: 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => _buildQACard(_filteredQAs[i]),
                    childCount: _filteredQAs.length,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.1),
            AppColors.primary.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border:
            Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.question_answer_outlined,
                color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Q&A Portal',
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary)),
                SizedBox(height: 3),
                Text(
                  'Answer student questions across courses',
                  style: TextStyle(
                      fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseSelector() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: AppColors.borderDark.withValues(alpha: 0.3)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<CourseOption>(
          value: _selectedCourse,
          isExpanded: true,
          dropdownColor: AppColors.backgroundDark,
          icon: const Icon(Icons.expand_more, color: AppColors.textSecondary),
          hint: const Text('Select a course',
              style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
          style:
              const TextStyle(color: AppColors.textPrimary, fontSize: 14),
          items: _courses
              .map((c) => DropdownMenuItem(
                    value: c,
                    child: Text(c.displayName),
                  ))
              .toList(),
          onChanged: _onCourseChanged,
        ),
      ),
    );
  }

  Widget _buildStats() {
    Widget statCard(String label, int value, IconData icon, Color color) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border:
                Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: color, size: 20),
                  const SizedBox(width: 5),
                  Text(
                    label,
                    style: const TextStyle(
                        fontSize: 15, color: AppColors.textMuted),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '$value',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color),
              ),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Column(
        children: [
          Row(
            children: [
              statCard('Total', _stats.total, Icons.forum_outlined,
                  AppColors.primary),
              const SizedBox(width: 8),
              statCard('Open', _stats.open, Icons.help_outline,
                  Colors.orange),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              statCard('In Progress', _stats.inProgress,
                  Icons.hourglass_empty, AppColors.info),
              const SizedBox(width: 8),
              statCard('Resolved', _stats.resolved,
                  Icons.check_circle_outline, AppColors.success),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: AppColors.borderDark.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search
          TextField(
            controller: _searchController,
            onChanged: (_) => _onFilterChanged(),
            style: const TextStyle(
                fontSize: 14, color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Search questions...',
              hintStyle: const TextStyle(
                  color: AppColors.textMuted, fontSize: 13),
              prefixIcon: const Icon(Icons.search,
                  color: AppColors.textMuted, size: 20),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear,
                          color: AppColors.textMuted, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        _onFilterChanged();
                      },
                    )
                  : null,
              filled: true,
              fillColor: AppColors.background,
              contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                    color: AppColors.borderDark.withValues(alpha: 0.2)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(
                    color: AppColors.primary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Status filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _statuses
                  .map((s) => _filterChip(
                        label: s['label']!,
                        selected: _filterStatus == s['value'],
                        onTap: () => setState(() {
                          _filterStatus = s['value']!;
                          _onFilterChanged();
                        }),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 8),
          // Category filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip(
                  label: 'All Categories',
                  selected: _filterCategory == 'all',
                  onTap: () => setState(() {
                    _filterCategory = 'all';
                    _onFilterChanged();
                  }),
                ),
                ..._categories.map((c) => _filterChip(
                      label: c['label']!,
                      selected: _filterCategory == c['value'],
                      onTap: () => setState(() {
                        _filterCategory = c['value']!;
                        _onFilterChanged();
                      }),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Sort
          Row(
            children: [
              const Text('Sort by: ',
                  style: TextStyle(
                      fontSize: 12, color: AppColors.textMuted)),
              DropdownButton<String>(
                value: _sortBy,
                isDense: true,
                underline: const SizedBox(),
                dropdownColor: AppColors.backgroundDark,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary),
                items: const [
                  DropdownMenuItem(
                      value: '-createdAt', child: Text('Newest First')),
                  DropdownMenuItem(
                      value: 'createdAt', child: Text('Oldest First')),
                  DropdownMenuItem(
                      value: '-views', child: Text('Most Viewed')),
                  DropdownMenuItem(
                      value: '-upvotes', child: Text('Most Upvoted')),
                ],
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _sortBy = v);
                    _onFilterChanged();
                  }
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.chat_bubble_outline,
                color: AppColors.primary, size: 48),
          ),
          const SizedBox(height: 20),
          const Text('No Questions Found',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          const Text('Be the first to ask a question!',
              style:
                  TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            onPressed: _showAskSheet,
            icon: const Icon(Icons.add_comment_outlined),
            label: const Text('Ask Question'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQACard(QAItem qa) {
    final hasAccepted = qa.answers.any((a) => a.isAccepted);
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: AppColors.borderDark.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badges
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _badge(qa.status, _statusColor(qa.status)),
              _badge(qa.priority, _priorityColor(qa.priority)),
              _badge(qa.category, _categoryColor(qa.category)),
              if (hasAccepted)
                _badge('✓ Accepted', AppColors.success,
                    icon: Icons.check_circle),
            ],
          ),
          const SizedBox(height: 10),
          // Title
          Text(qa.title,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 6),
          // Description
          Text(
            qa.description,
            style: const TextStyle(
                fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          // Tags
          if (qa.tags.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: qa.tags
                  .take(4)
                  .map((t) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('#$t',
                            style: const TextStyle(
                                fontSize: 11, color: AppColors.primary)),
                      ))
                  .toList(),
            ),
          ],
          const SizedBox(height: 12),
          // Meta row
          Row(
            children: [
              const Icon(Icons.person_outline,
                  size: 13, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  qa.isAnonymous ? 'Anonymous' : qa.askedBy.name,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 10),
              const Icon(Icons.access_time,
                  size: 13, color: AppColors.textMuted),
              const SizedBox(width: 3),
              Text(_timeAgo(qa.createdAt),
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(width: 10),
              const Icon(Icons.visibility_outlined,
                  size: 13, color: AppColors.textMuted),
              const SizedBox(width: 3),
              Text('${qa.views} views',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(width: 10),
              const Icon(Icons.thumb_up_outlined,
                  size: 13, color: AppColors.textMuted),
              const SizedBox(width: 3),
              Text('${qa.upvotes.length}',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(width: 10),
              const Icon(Icons.chat_bubble_outline,
                  size: 13, color: AppColors.textMuted),
              const SizedBox(width: 3),
              Text('${qa.answers.length}',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textMuted)),
            ],
          ),
          const SizedBox(height: 12),
          // Action buttons
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Upvote button (toggle)
                _UpvoteButton(
                  isUpvoted: _upvotedQAIds.contains(qa.id),
                  onTap: () => _upvoteQA(qa.id),
                ),
                const SizedBox(width: 10),
                // View button
                Expanded(
                  child: GestureDetector(
                    onTap: () => _showDetailSheet(qa),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: AppColors.borderDark
                                .withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                        const Icon(Icons.chat_bubble_outline,
                            size: 15, color: AppColors.textSecondary),
                        const SizedBox(width: 6),
                        Text('View (${qa.answers.length})',
                            style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────── HELPERS ─────────

  Widget _badge(String label, Color color, {IconData? icon}) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 11, color: color),
              const SizedBox(width: 4),
            ],
            Text(label,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: color)),
          ],
        ),
      );

  Widget _filterChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(right: 6),
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.primary
                : AppColors.background,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected
                  ? AppColors.primary
                  : AppColors.borderDark.withValues(alpha: 0.3),
            ),
          ),
          child: Text(label,
              style: TextStyle(
                  fontSize: 12,
                  color: selected
                      ? Colors.white
                      : AppColors.textSecondary,
                  fontWeight: selected
                      ? FontWeight.w600
                      : FontWeight.w400)),
        ),
      );

  Widget _label(String text) => Text(text,
      style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary));

  Widget _inputField({
    required TextEditingController controller,
    required String hint,
    int maxLines = 1,
  }) =>
      TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(
            fontSize: 14, color: AppColors.textPrimary),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
              color: AppColors.textMuted, fontSize: 13),
          filled: true,
          fillColor: AppColors.background,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(
                color: AppColors.borderDark.withValues(alpha: 0.2)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide:
                const BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
      );

  Widget _dropdown({
    required String value,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) =>
      DropdownButtonFormField<String>(
        initialValue: value,
        items: items,
        onChanged: onChanged,
        dropdownColor: AppColors.backgroundDark,
        style: const TextStyle(
            fontSize: 13, color: AppColors.textPrimary),
        decoration: InputDecoration(
          filled: true,
          fillColor: AppColors.background,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(
                color: AppColors.borderDark.withValues(alpha: 0.2)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide:
                const BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
      );

  Widget _actionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) =>
      GestureDetector(
        onTap: onTap,
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: (color ?? AppColors.textMuted).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: (color ?? AppColors.borderDark)
                    .withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  size: 14, color: color ?? AppColors.textSecondary),
              const SizedBox(width: 5),
              Text(label,
                  style: TextStyle(
                      fontSize: 12,
                      color: color ?? AppColors.textSecondary)),
            ],
          ),
        ),
      );

  Widget _sendButton({
    required VoidCallback onTap,
    required bool loading,
  }) =>
      GestureDetector(
        onTap: loading ? null : onTap,
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: loading
                ? AppColors.primary.withValues(alpha: 0.5)
                : AppColors.primary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: loading
              ? const Center(
                  child: SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  ),
                )
              : const Icon(Icons.send, color: Colors.white, size: 18),
        ),
      );
}

// ─── Simple toggle upvote button ──────────────────────────────────────────
class _UpvoteButton extends StatefulWidget {
  const _UpvoteButton({required this.isUpvoted, required this.onTap});
  final bool isUpvoted;
  final VoidCallback onTap;

  @override
  State<_UpvoteButton> createState() => _UpvoteButtonState();
}

class _UpvoteButtonState extends State<_UpvoteButton> {
  late bool _upvoted;

  @override
  void initState() {
    super.initState();
    _upvoted = widget.isUpvoted;
  }

  @override
  void didUpdateWidget(_UpvoteButton old) {
    super.didUpdateWidget(old);
    if (old.isUpvoted != widget.isUpvoted) {
      setState(() => _upvoted = widget.isUpvoted);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _upvoted = !_upvoted);
          widget.onTap();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: _upvoted
                ? AppColors.primary.withValues(alpha: 0.12)
                : AppColors.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: _upvoted
                  ? AppColors.primary.withValues(alpha: 0.55)
                  : AppColors.borderDark.withValues(alpha: 0.4),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.thumb_up_outlined,
                size: 15,
                color: _upvoted ? AppColors.primary : AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                _upvoted ? 'Upvoted' : 'Upvote',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color:
                      _upvoted ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
