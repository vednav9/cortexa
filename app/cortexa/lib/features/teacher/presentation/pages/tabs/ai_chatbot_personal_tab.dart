import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../../core/config/api_config.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../../../core/network/api_client.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../rag_assistant/data/models/chat_message_model.dart';
import '../../../../rag_assistant/data/models/rag_response_model.dart';
import '../../../../rag_assistant/data/repositories/ai_repository.dart';
import '../../../../rag_assistant/presentation/bloc/rag_chat_bloc.dart';
import '../../../../rag_assistant/presentation/bloc/rag_chat_event.dart';
import '../../../data/models/course_model.dart';
import '../../../data/models/document_model.dart';

class AIChatbotPersonalTab extends StatefulWidget {
  final bool studentMode;

  const AIChatbotPersonalTab({
    super.key,
    this.studentMode = false,
  });

  @override
  State<AIChatbotPersonalTab> createState() => _AIChatbotPersonalTabState();
}

class _AIChatbotPersonalTabState extends State<AIChatbotPersonalTab> {
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();

  late final RagChatBloc _bloc;
  final ApiClient _apiClient = getIt<ApiClient>();

  String _institutionId = '';
  String _institutionSlug = '';
  String _userName = 'Teacher';
  bool _isBootstrapping = true;

  bool _showDocumentsPanel = false;
  bool _isLoadingCourses = false;
  bool _isLoadingDocuments = false;
  String? _courseLoadError;
  String? _documentLoadError;

  List<CourseModel> _courses = [];
  String? _selectedCourseId;
  List<DocumentModel> _documents = [];
  Set<String> _selectedDocIds = <String>{};

  static const _suggestions = [
    'What are the key concepts in this subject?',
    'Summarize the uploaded documents',
    'Generate 5 MCQs for practice',
    'Explain the latest topics covered',
  ];

  @override
  void initState() {
    super.initState();
    _bloc = RagChatBloc(getIt<AiRepository>());
    _bloc.add(LoadChatHistory());
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final storage = getIt<HiveStorageService>();
    final user = storage.getCurrentUser();
    final institution = storage.getCurrentInstitution();

    setState(() {
      _userName = user?.fullName ?? user?.username ?? (widget.studentMode ? 'Student' : 'Teacher');
      _institutionId =
          institution?['_id'] as String? ??
          institution?['id'] as String? ??
          user?.institutionId ??
          '';
      _institutionSlug = _extractInstitutionSlug(institution);
    });

    if (_institutionSlug.isEmpty) {
      _institutionSlug = await _resolveInstitutionSlug();
    }

    await _loadCourses();

    if (!mounted) return;
    setState(() => _isBootstrapping = false);
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    _bloc.close();
    super.dispose();
  }

  Future<void> _loadCourses() async {
    if (!mounted) return;
    setState(() {
      _isLoadingCourses = true;
      _courseLoadError = null;
    });

    try {
      late final Map<String, dynamic> response;

      if (widget.studentMode) {
        var slug = _institutionSlug;
        if (slug.isEmpty) {
          slug = await _resolveInstitutionSlug();
          _institutionSlug = slug;
        }

        if (slug.isEmpty) {
          throw Exception('Institution slug is missing');
        }

        response = await _apiClient.get(
          '/institutions/slug/${Uri.encodeComponent(slug)}/courses',
          requiresAuth: true,
        );
      } else {
        response = await _apiClient.get(
          ApiConfig.teacherAuthorizedCourses,
          requiresAuth: true,
        );
      }

      if (response['success'] != true || response['courses'] is! List) {
        throw Exception(response['message'] ?? 'Failed to load courses');
      }

      final parsedCourses = <CourseModel>[];
      for (final raw in (response['courses'] as List)) {
        if (raw is! Map) continue;
        try {
          final normalized = _normalizeCourseJson(
            Map<String, dynamic>.from(raw),
          );
          final parsed = CourseModel.fromJson(normalized);
          if (parsed.id.isNotEmpty) {
            parsedCourses.add(parsed);
          }
        } catch (_) {
          // Skip malformed rows and keep valid courses.
        }
      }

      final hasCurrent = parsedCourses.any((c) => c.id == _selectedCourseId);
      final nextSelectedCourseId = parsedCourses.isEmpty
          ? null
          : hasCurrent
          ? _selectedCourseId
          : parsedCourses.first.id;

      if (!mounted) return;
      setState(() {
        _courses = parsedCourses;
        _selectedCourseId = nextSelectedCourseId;
      });

      if (nextSelectedCourseId != null) {
        await _loadDocuments(nextSelectedCourseId, autoSelectAll: true);
      } else if (mounted) {
        setState(() {
          _documents = [];
          _selectedDocIds = <String>{};
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _courseLoadError = widget.studentMode
            ? 'Failed to load courses for your institution.'
            : 'Failed to load authorized courses.';
        _courses = [];
        _selectedCourseId = null;
        _documents = [];
        _selectedDocIds = <String>{};
      });
    } finally {
      if (mounted) {
        setState(() => _isLoadingCourses = false);
      }
    }
  }

  Future<void> _loadDocuments(
    String courseId, {
    bool autoSelectAll = false,
  }) async {
    if (!mounted) return;
    setState(() {
      _isLoadingDocuments = true;
      _documentLoadError = null;
    });

    try {
      late final Map<String, dynamic> response;

      if (widget.studentMode) {
        CourseModel? selectedCourse;
        for (final course in _courses) {
          if (course.id == courseId) {
            selectedCourse = course;
            break;
          }
        }

        final courseCode = selectedCourse?.code.trim() ?? '';
        if (courseCode.isEmpty) {
          throw Exception('Selected course code is missing');
        }

        var slug = _institutionSlug;
        if (slug.isEmpty) {
          slug = await _resolveInstitutionSlug();
          _institutionSlug = slug;
        }

        if (slug.isEmpty) {
          throw Exception('Institution slug is missing');
        }

        response = await _apiClient.get(
          '/institutions/slug/${Uri.encodeComponent(slug)}/courses/${Uri.encodeComponent(courseCode.toUpperCase())}',
          requiresAuth: true,
        );
      } else {
        response = await _apiClient.get(
          '${ApiConfig.teacherGetDocuments}/$courseId',
          requiresAuth: true,
        );
      }

      if (response['success'] != true || response['documents'] is! List) {
        throw Exception(response['message'] ?? 'Failed to load documents');
      }

      final docs = <DocumentModel>[];
      for (final raw in (response['documents'] as List)) {
        if (raw is! Map) continue;
        try {
          final normalized = _normalizeDocumentJson(
            Map<String, dynamic>.from(raw),
            courseId: courseId,
          );
          docs.add(DocumentModel.fromJson(normalized));
        } catch (_) {
          // Skip malformed document rows and keep valid ones.
        }
      }

      final validIds = docs.map((d) => d.id).toSet();
      final nextSelected = autoSelectAll
          ? validIds
          : _selectedDocIds.intersection(validIds);

      if (!mounted) return;
      setState(() {
        _documents = docs;
        _selectedDocIds = nextSelected;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _documentLoadError = 'Failed to load documents for this course.';
        _documents = [];
        _selectedDocIds = <String>{};
      });
    } finally {
      if (mounted) {
        setState(() => _isLoadingDocuments = false);
      }
    }
  }

  String _extractInstitutionSlug(Map<String, dynamic>? institution) {
    if (institution == null) return '';

    final slug = institution['slug']?.toString().trim();
    if (slug != null && slug.isNotEmpty) {
      return slug;
    }

    final customSlug = institution['custom_url_slug']?.toString().trim();
    if (customSlug != null && customSlug.isNotEmpty) {
      return customSlug;
    }

    final code = institution['code']?.toString().trim();
    if (code != null && code.isNotEmpty) {
      return code;
    }

    return '';
  }

  Future<String> _resolveInstitutionSlug() async {
    final storage = getIt<HiveStorageService>();

    // First preference: already cached current institution data in Hive.
    final currentInstitution = storage.getCurrentInstitution();
    final fromCurrent = _extractInstitutionSlug(currentInstitution);
    if (fromCurrent.isNotEmpty) {
      return fromCurrent;
    }

    // Second preference: institution map in the global institutions cache.
    if (_institutionId.isNotEmpty) {
      final cachedInstitution = storage.findInstitutionById(_institutionId);
      final fromCached = _extractInstitutionSlug(cachedInstitution);
      if (fromCached.isNotEmpty) {
        return fromCached;
      }
    }

    // Final fallback: role-specific my-institution endpoints.
    final endpoint = widget.studentMode
        ? ApiConfig.studentMyInstitution
        : ApiConfig.teacherMyInstitution;

    try {
      final response = await _apiClient.get(
        endpoint,
        requiresAuth: true,
      );

      final institution = response['institution'];
      if (institution is Map<String, dynamic>) {
        final resolvedId =
            institution['_id']?.toString().trim() ??
            institution['id']?.toString().trim() ??
            '';
        if (_institutionId.isEmpty && resolvedId.isNotEmpty) {
          _institutionId = resolvedId;
        }

        final normalized = _extractInstitutionSlug(institution);
        if (normalized.isNotEmpty) {
          return normalized;
        }
      }
    } catch (_) {
      // Ignore and return empty value; caller will show a user-facing error.
    }

    return '';
  }

  Map<String, dynamic> _normalizeDocumentJson(
    Map<String, dynamic> raw, {
    required String courseId,
  }) {
    final uploadedBy = raw['uploadedBy'];
    final uploadedById = uploadedBy is Map
        ? (uploadedBy['_id']?.toString() ?? '')
        : (uploadedBy?.toString() ?? '');
    final uploadedByName = uploadedBy is Map
        ? (uploadedBy['name']?.toString() ?? uploadedBy['fullName']?.toString())
        : uploadedBy?.toString();

    return {
      '_id': raw['_id']?.toString() ?? raw['id']?.toString() ?? '',
      'fileName': raw['fileName']?.toString() ?? raw['originalName']?.toString() ?? 'Document',
      'originalName': raw['originalName']?.toString() ?? raw['fileName']?.toString() ?? 'Document',
      'fileUrl': raw['fileUrl']?.toString() ?? '',
      'fileType': raw['fileType']?.toString() ?? 'unknown',
      'fileSize': (raw['fileSize'] as num?)?.toInt() ?? 0,
      'course': raw['course']?.toString() ?? courseId,
      'institution': raw['institution']?.toString() ?? _institutionId,
      'uploadedBy': uploadedById,
      'uploadedByName': uploadedByName,
      'isProcessed': raw['isProcessed'] == true,
      'createdAt': raw['createdAt']?.toString() ?? DateTime.now().toIso8601String(),
    };
  }

  Map<String, dynamic> _normalizeCourseJson(Map<String, dynamic> raw) {
    final departmentRaw = raw['department'];
    Map<String, dynamic>? department;
    if (departmentRaw is Map<String, dynamic>) {
      department = departmentRaw;
    } else if (departmentRaw is String && departmentRaw.trim().isNotEmpty) {
      department = {
        'name': departmentRaw.trim(),
      };
    }

    final semesterAvailableRaw = raw['semesterAvailable'];
    Map<String, dynamic>? semesterAvailable;
    if (semesterAvailableRaw is Map<String, dynamic>) {
      semesterAvailable = semesterAvailableRaw;
    } else if (raw['semester'] != null) {
      semesterAvailable = {
        'name': raw['semester'].toString(),
      };
    }

    return {
      '_id': raw['_id']?.toString() ?? raw['id']?.toString() ?? '',
      'id': raw['id']?.toString() ?? raw['_id']?.toString() ?? '',
      'name': raw['name']?.toString() ?? '',
      'code': raw['code']?.toString() ?? '',
      'description': raw['description']?.toString() ?? '',
      'department': department,
      'semesterAvailable': semesterAvailable,
      'credits': raw['credits'],
      'isActive': raw['isActive'] != false,
    };
  }

  Future<void> _onCourseChanged(String? nextCourseId) async {
    if (nextCourseId == null || nextCourseId == _selectedCourseId) return;
    setState(() {
      _selectedCourseId = nextCourseId;
    });
    await _loadDocuments(nextCourseId, autoSelectAll: true);
  }

  void _toggleDocSelection(String docId) {
    setState(() {
      if (_selectedDocIds.contains(docId)) {
        _selectedDocIds.remove(docId);
      } else {
        _selectedDocIds.add(docId);
      }
    });
  }

  void _selectAllDocs() {
    setState(() {
      _selectedDocIds = _documents.map((d) => d.id).toSet();
    });
  }

  void _clearSelectedDocs() {
    setState(() {
      _selectedDocIds = <String>{};
    });
  }

  void _sendMessage([String? preset]) {
    final text = (preset ?? _inputCtrl.text).trim();
    if (text.isEmpty) return;
    if (_bloc.state is RagChatLoading) return;

    if (_selectedCourseId == null || _selectedCourseId!.isEmpty) {
      _showToast('Please select a course first.');
      return;
    }

    if (_documents.isNotEmpty && _selectedDocIds.isEmpty) {
      _showToast('Select at least one document from Available Docs.');
      return;
    }

    _bloc.add(
      SendRagQuery(
        query: text,
        institutionId: _institutionId.isNotEmpty ? _institutionId : null,
        courseId: _selectedCourseId,
        documentIds: _selectedDocIds.toList(),
        useHybrid: true,
      ),
    );

    _inputCtrl.clear();
    _scrollToBottom();
  }

  void _showToast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: AppColors.textPrimary,
        ),
      );
  }

  void _clearHistory() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Clear Chat',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
        content: const Text(
          'This will clear all messages in this session.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              _bloc.add(ClearChatHistory());
              Navigator.pop(ctx);
            },
            child: const Text(
              'Clear',
              style: TextStyle(
                color: AppColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 250), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  CourseModel? get _selectedCourse {
    if (_selectedCourseId == null) return null;
    for (final course in _courses) {
      if (course.id == _selectedCourseId) return course;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    if (_isBootstrapping) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF10B981)),
      );
    }

    return BlocProvider.value(
      value: _bloc,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: _buildHeader(),
            ),
            if (_courseLoadError != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                child: _buildInlineBanner(_courseLoadError!, isError: true),
              ),
            const SizedBox(height: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth >= 980;

                    if (isWide) {
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(child: _buildChatPanel()),
                          if (_showDocumentsPanel) const SizedBox(width: 14),
                          if (_showDocumentsPanel)
                            SizedBox(width: 320, child: _buildDocumentsPanel()),
                        ],
                      );
                    }

                    return Column(
                      children: [
                        Expanded(child: _buildChatPanel()),
                        if (_showDocumentsPanel) const SizedBox(height: 12),
                        if (_showDocumentsPanel)
                          SizedBox(height: 320, child: _buildDocumentsPanel()),
                      ],
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.1),
            AppColors.primary.withValues(alpha: 0.04),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: AppColors.primary,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AI Assistant',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Hi $_userName, ask from your selected course documents',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          InkWell(
            onTap: () {
              setState(() => _showDocumentsPanel = !_showDocumentsPanel);
            },
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _showDocumentsPanel
                    ? AppColors.primary.withValues(alpha: 0.1)
                    : AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _showDocumentsPanel
                      ? AppColors.primary.withValues(alpha: 0.5)
                      : AppColors.borderDark.withValues(alpha: 0.35),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 15,
                    color: _showDocumentsPanel
                        ? AppColors.primary
                        : AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    _showDocumentsPanel ? 'Hide Docs' : 'Available Docs',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _showDocumentsPanel
                          ? AppColors.primary
                          : AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatPanel() {
    final selectedCourse = _selectedCourse;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(18),
              ),
              gradient: LinearGradient(
                colors: [
                  AppColors.primary,
                  AppColors.primary.withValues(alpha: 0.25),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    selectedCourse == null
                        ? 'No course selected'
                        : '${selectedCourse.code} - ${selectedCourse.name}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: selectedCourse == null
                          ? AppColors.error
                          : AppColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                InkWell(
                  onTap: _clearHistory,
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.error.withValues(alpha: 0.35),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.delete_outline_rounded,
                          color: AppColors.error,
                          size: 15,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'Clear Chat',
                          style: TextStyle(
                            color: AppColors.error,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Divider(
            height: 1,
            thickness: 1,
            color: AppColors.borderDark.withValues(alpha: 0.2),
          ),
          Expanded(
            child: BlocConsumer<RagChatBloc, RagChatState>(
              listener: (context, state) {
                if (state is RagChatLoaded || state is RagChatLoading) {
                  _scrollToBottom();
                }
              },
              builder: (context, state) {
                final messages = _messagesFrom(state);
                final isLoading = state is RagChatLoading;

                if (messages.isEmpty && !isLoading) {
                  return _buildWelcome();
                }

                return ListView.builder(
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                  itemCount: messages.length + (isLoading ? 1 : 0),
                  itemBuilder: (ctx, index) {
                    if (isLoading && index == messages.length) {
                      return _buildTyping();
                    }
                    return _buildBubble(messages[index]);
                  },
                );
              },
            ),
          ),
          BlocBuilder<RagChatBloc, RagChatState>(
            builder: (context, state) {
              if (state is RagChatError) {
                return _buildInlineBanner(state.message, isError: true);
              }
              return const SizedBox.shrink();
            },
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildWelcome() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            'Hi $_userName!',
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Ask me anything from your selected course documents.\nI will use RAG and web fallback when needed.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 22),
          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Try asking:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.7,
            children: _suggestions.map((s) => _buildSuggestionChip(s)).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionChip(String text) {
    return InkWell(
      onTap: () => _sendMessage(text),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
        ),
        child: Text(
          text,
          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  Widget _buildBubble(ChatMessage message) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        children: [
          if (!isUser) ..._aiAvatar(),
          Flexible(
            child: Column(
              crossAxisAlignment: isUser
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 15,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    color: isUser ? AppColors.primary : AppColors.background,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      topLeft: isUser ? const Radius.circular(16) : Radius.zero,
                      topRight: isUser
                          ? Radius.zero
                          : const Radius.circular(16),
                    ),
                    border: isUser
                        ? null
                        : Border.all(
                            color: AppColors.borderDark.withValues(alpha: 0.25),
                          ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (isUser)
                        Theme(
                          data: Theme.of(context).copyWith(
                            textSelectionTheme: const TextSelectionThemeData(
                              selectionColor: Color(0x55FFFFFF),
                            ),
                          ),
                          child: SelectableText(
                            message.message,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              height: 1.5,
                            ),
                          ),
                        )
                      else
                        Theme(
                          data: Theme.of(context).copyWith(
                            textSelectionTheme: const TextSelectionThemeData(
                              selectionColor: Color(0x554FC3F7),
                            ),
                          ),
                          child: SelectionArea(
                            child: Text(
                              message.message,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                height: 1.5,
                              ),
                            ),
                          ),
                        ),
                      if (!isUser && message.searchMethod == 'web')
                        ..._webBadge(),
                      if (!isUser &&
                          message.richSources != null &&
                          message.richSources!.isNotEmpty)
                        _buildReferencesButton(message.richSources!),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatTime(message.timestamp),
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          if (isUser) ..._userAvatar(),
        ],
      ),
    );
  }

  List<Widget> _aiAvatar() => [
    Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(
        Icons.auto_awesome_rounded,
        size: 17,
        color: AppColors.primary,
      ),
    ),
    const SizedBox(width: 8),
  ];

  List<Widget> _userAvatar() => [
    const SizedBox(width: 8),
    Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(
        Icons.person_outline,
        size: 17,
        color: AppColors.primary,
      ),
    ),
  ];

  List<Widget> _webBadge() => [
    const SizedBox(height: 8),
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.language_rounded, size: 12, color: AppColors.primary),
          SizedBox(width: 4),
          Text(
            'Web search',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    ),
  ];

  Widget _buildReferencesButton(List<DocumentSource> sources) {
    final isWeb = sources.any((source) => source.isWeb);
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: InkWell(
        onTap: () {
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => _ReferencesBottomSheet(sources: sources),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isWeb ? Icons.language_rounded : Icons.source_outlined,
                size: 13,
                color: AppColors.primary,
              ),
              const SizedBox(width: 5),
              Text(
                '${sources.length} Reference${sources.length == 1 ? '' : 's'}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.keyboard_arrow_right_rounded,
                size: 14,
                color: AppColors.primary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTyping() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ..._aiAvatar(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(
                16,
              ).copyWith(topLeft: Radius.zero),
              border: Border.all(
                color: AppColors.borderDark.withValues(alpha: 0.25),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dot(0),
                const SizedBox(width: 4),
                _dot(1),
                const SizedBox(width: 4),
                _dot(2),
                const SizedBox(width: 10),
                const _AnimatedStatusText(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _dot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      builder: (_, value, __) {
        final phase = ((value - index * 0.2) % 1.0).clamp(0.0, 1.0);
        final opacity = (phase < 0.5 ? phase * 2 : (1 - phase) * 2).clamp(
          0.3,
          1.0,
        );
        return Opacity(
          opacity: opacity,
          child: Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
      onEnd: () {
        if (mounted) setState(() {});
      },
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.2),
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: BlocBuilder<RagChatBloc, RagChatState>(
          builder: (context, state) {
            final isLoading = state is RagChatLoading;

            return Row(
              children: [
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: AppColors.borderDark.withValues(alpha: 0.3),
                      ),
                    ),
                    child: TextField(
                      controller: _inputCtrl,
                      enabled: !isLoading,
                      decoration: const InputDecoration(
                        hintText: 'Ask about your selected course...',
                        hintStyle: TextStyle(
                          color: AppColors.textTertiary,
                          fontSize: 14,
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 12,
                        ),
                      ),
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  decoration: BoxDecoration(
                    gradient: isLoading
                        ? null
                        : const LinearGradient(
                            colors: [AppColors.primary, AppColors.primaryDark],
                          ),
                    color: isLoading ? AppColors.disabled : null,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: isLoading ? null : _sendMessage,
                      borderRadius: BorderRadius.circular(24),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(
                                Icons.send_rounded,
                                color: Colors.white,
                                size: 22,
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildDocumentsPanel() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Container(
            height: 3,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(18),
              ),
              gradient: LinearGradient(
                colors: [
                  AppColors.primary,
                  AppColors.primary.withValues(alpha: 0.25),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
            child: Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: const Icon(
                    Icons.description_outlined,
                    size: 17,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Available Docs',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Select course and documents',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
            child: _buildCourseDropdown(),
          ),
          if (_isLoadingDocuments)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 18),
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          else if (_documentLoadError != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 2, 14, 10),
              child: _buildInlineBanner(_documentLoadError!, isError: true),
            )
          else if (_documents.isEmpty)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.borderDark.withValues(alpha: 0.2),
                    ),
                  ),
                  child: const Text(
                    'No documents available for this course.',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            )
          else
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${_selectedDocIds.length} of ${_documents.length} selected',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: _selectAllDocs,
                          style: TextButton.styleFrom(
                            minimumSize: const Size(0, 28),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'Select all',
                            style: TextStyle(fontSize: 11),
                          ),
                        ),
                        TextButton(
                          onPressed: _clearSelectedDocs,
                          style: TextButton.styleFrom(
                            minimumSize: const Size(0, 28),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'Clear',
                            style: TextStyle(fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Expanded(
                      child: ListView.separated(
                        itemCount: _documents.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final doc = _documents[index];
                          final isSelected = _selectedDocIds.contains(doc.id);
                          return InkWell(
                            onTap: () => _toggleDocSelection(doc.id),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary.withValues(alpha: 0.08)
                                    : AppColors.background,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.primary.withValues(
                                          alpha: 0.45,
                                        )
                                      : AppColors.borderDark.withValues(
                                          alpha: 0.2,
                                        ),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Checkbox(
                                    value: isSelected,
                                    onChanged: (_) =>
                                        _toggleDocSelection(doc.id),
                                    activeColor: AppColors.primary,
                                    materialTapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  const SizedBox(width: 2),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          doc.fileName.isNotEmpty
                                              ? doc.fileName
                                              : doc.originalName,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textPrimary,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 3),
                                        Row(
                                          children: [
                                            Text(
                                              doc.formattedSize,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              width: 4,
                                              height: 4,
                                              decoration: const BoxDecoration(
                                                color: AppColors.textTertiary,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              doc.isProcessed
                                                  ? 'Processed'
                                                  : 'Processing',
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: doc.isProcessed
                                                    ? AppColors.success
                                                    : AppColors.warning,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCourseDropdown() {
    if (_isLoadingCourses) {
      return const Row(
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 8),
          Text(
            'Loading courses...',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      );
    }

    if (_courses.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: AppColors.borderDark.withValues(alpha: 0.3),
          ),
        ),
        child: const Text(
          'No courses assigned',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
      );
    }

    return DropdownButtonFormField<String>(
      initialValue: _selectedCourseId,
      onChanged: _onCourseChanged,
      decoration: InputDecoration(
        labelText: 'Select Course',
        labelStyle: const TextStyle(fontSize: 12),
        filled: true,
        fillColor: AppColors.background,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.3),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.3),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      ),
      items: _courses
          .map(
            (course) => DropdownMenuItem<String>(
              value: course.id,
              child: Text(
                '${course.code} - ${course.name}',
                style: const TextStyle(fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildInlineBanner(String message, {required bool isError}) {
    final color = isError ? AppColors.error : AppColors.primary;
    final icon = isError ? Icons.error_outline : Icons.info_outline;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message, style: TextStyle(color: color, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  List<ChatMessage> _messagesFrom(RagChatState state) {
    if (state is RagChatLoading) return state.messages;
    if (state is RagChatLoaded) return state.messages;
    if (state is RagChatError) return state.messages;
    return [];
  }

  String _formatTime(DateTime time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

class _AnimatedStatusText extends StatefulWidget {
  const _AnimatedStatusText();

  @override
  State<_AnimatedStatusText> createState() => _AnimatedStatusTextState();
}

class _AnimatedStatusTextState extends State<_AnimatedStatusText> {
  static const _steps = [
    'Searching selected docs...',
    'Checking web fallback...',
    'Generating answer...',
  ];

  int _stepIndex = 0;
  late final StreamSubscription<int> _sub;

  @override
  void initState() {
    super.initState();
    _sub = Stream<int>.periodic(const Duration(seconds: 3), (count) => count)
        .listen((_) {
          if (!mounted) return;
          setState(() {
            _stepIndex = (_stepIndex + 1) % _steps.length;
          });
        });
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      child: Text(
        _steps[_stepIndex],
        key: ValueKey(_stepIndex),
        style: const TextStyle(
          fontSize: 12,
          color: AppColors.textSecondary,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }
}

class _ReferencesBottomSheet extends StatelessWidget {
  final List<DocumentSource> sources;

  const _ReferencesBottomSheet({required this.sources});

  Future<void> _openWebUrl(String url) async {
    final uri = Uri.parse(url);
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      throw Exception('Could not open source URL');
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.58,
      minChildSize: 0.3,
      maxChildSize: 0.92,
      expand: false,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textTertiary.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 10),
              child: Row(
                children: [
                  const Icon(
                    Icons.source_outlined,
                    color: AppColors.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'References (${sources.length})',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                    color: AppColors.textSecondary,
                    splashRadius: 18,
                  ),
                ],
              ),
            ),
            Divider(
              height: 1,
              color: AppColors.borderDark.withValues(alpha: 0.2),
            ),
            Expanded(
              child: ListView.separated(
                controller: scrollCtrl,
                padding: const EdgeInsets.all(14),
                itemCount: sources.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final source = sources[index];
                  final isWeb = source.isWeb;
                  return InkWell(
                    onTap: isWeb && source.url != null
                        ? () async {
                            try {
                              await _openWebUrl(source.url!);
                            } catch (_) {
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Unable to open source link'),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                            }
                          }
                        : null,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.borderDark.withValues(alpha: 0.24),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                isWeb
                                    ? Icons.language_rounded
                                    : Icons.description_outlined,
                                size: 17,
                                color: isWeb
                                    ? AppColors.primary
                                    : AppColors.textSecondary,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  source.documentName,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ),
                              if (isWeb && source.url != null)
                                const Icon(
                                  Icons.open_in_new_rounded,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                            ],
                          ),
                          if (source.pageNumber != null) ...[
                            const SizedBox(height: 5),
                            Text(
                              'Page ${source.pageNumber}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                          if (source.chunkText != null &&
                              source.chunkText!.trim().isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              source.chunkText!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                                height: 1.45,
                              ),
                              maxLines: 4,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
