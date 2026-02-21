import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../data/models/personal_message.dart';
import '../../data/repositories/personal_chat_repository.dart';

/// Personal AI chat widget backed by Gemini.
/// Each [userId] × [conversationId] gets isolated history stored on-device.
class PersonalChatWidget extends StatefulWidget {
  final String userId;
  final String userName;
  final String conversationId;

  /// 'teacher' or 'student' — controls system prompt and suggestion chips.
  final String role;

  /// Called when the user taps the back button (return to conversation list).
  final VoidCallback? onBack;

  const PersonalChatWidget({
    super.key,
    required this.userId,
    required this.userName,
    required this.conversationId,
    required this.role,
    this.onBack,
  });

  @override
  State<PersonalChatWidget> createState() => _PersonalChatWidgetState();
}

class _PersonalChatWidgetState extends State<PersonalChatWidget> {
  late final PersonalChatRepository _repo;
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  final FocusNode _focusNode = FocusNode();

  List<PersonalMessage> _messages = [];
  bool _isStreaming = false;
  String _streamingText = '';
  String? _errorText;

  // Attachment state
  Uint8List? _attachmentBytes;
  String? _attachmentMimeType;
  String? _attachmentName;

  // ─── Init / Dispose ────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _repo = PersonalChatRepository(
      userId: widget.userId,
      conversationId: widget.conversationId,
      systemPrompt: _buildSystemPrompt(),
      storage: getIt<HiveStorageService>(),
    );
    _loadHistory();
  }

  String _buildSystemPrompt() {
    if (widget.role == 'teacher') {
      return 'You are a helpful AI assistant for teachers on the Cortexa education '
          'platform. Help with lesson planning, course content creation, teaching '
          'strategies, student engagement, and educational best practices. '
          'Be concise, practical, and encouraging.';
    }
    return 'You are a helpful AI assistant for students on the Cortexa education '
        'platform. Help with understanding concepts, studying effectively, '
        'summarising topics, and answering academic questions. '
        'Be clear, supportive, and easy to understand.';
  }

  void _loadHistory() {
    setState(() {
      _messages = _repo.loadHistory();
    });
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  // ─── Attachment helpers ────────────────────────────────────────────────────

  void _showAttachmentPicker() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: AppColors.primary),
              title: const Text('Image from Gallery',
                  style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: AppColors.primary),
              title: const Text('Take a Photo',
                  style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.pop(ctx);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.attach_file_rounded, color: AppColors.primary),
              title: const Text('Pick File (PDF / Text)',
                  style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.pop(ctx);
                _pickFile();
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final xFile = await picker.pickImage(source: source, imageQuality: 85);
      if (xFile == null) return;
      final bytes = await xFile.readAsBytes();
      final ext = xFile.name.split('.').last.toLowerCase();
      final mime = ext == 'png' ? 'image/png' : 'image/jpeg';
      if (!mounted) return;
      setState(() {
        _attachmentBytes = bytes;
        _attachmentMimeType = mime;
        _attachmentName = xFile.name;
      });
    } catch (e) {
      // ignore: use_build_context_synchronously
      if (mounted) setState(() => _errorText = 'Could not pick image: $e');
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'txt', 'md'],
        withData: true,
      );
      if (result == null || result.files.isEmpty) return;
      final file = result.files.first;
      if (file.bytes == null) return;
      if (!mounted) return;
      setState(() {
        _attachmentBytes = file.bytes;
        _attachmentMimeType = file.extension == 'pdf' ? 'application/pdf' : 'text/plain';
        _attachmentName = file.name;
      });
    } catch (e) {
      if (mounted) setState(() => _errorText = 'Could not pick file: $e');
    }
  }

  void _clearAttachment() {
    setState(() {
      _attachmentBytes = null;
      _attachmentMimeType = null;
      _attachmentName = null;
    });
  }

  // ─── Messaging ─────────────────────────────────────────────────────────────

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    final hasAttachment = _attachmentBytes != null;
    if ((text.isEmpty && !hasAttachment) || _isStreaming) return;

    _inputCtrl.clear();
    _focusNode.requestFocus();

    // Capture attachment before clearing.
    final attBytes = _attachmentBytes;
    final attMime = _attachmentMimeType;
    final attName = _attachmentName;
    _clearAttachment();

    // Optimistically add the user message to the UI.
    final userMsg = PersonalMessage(
      id: '${DateTime.now().millisecondsSinceEpoch}_u',
      text: text,
      isUser: true,
      timestamp: DateTime.now(),
      attachmentName: attName,
      attachmentType: attMime != null
          ? (attMime.startsWith('image') ? 'image' : 'document')
          : null,
    );

    setState(() {
      _messages.add(userMsg);
      _isStreaming = true;
      _streamingText = '';
      _errorText = null;
    });
    _scrollToBottom();

    try {
      await for (final chunk in _repo.sendMessage(
        text,
        attachmentBytes: attBytes,
        attachmentMimeType: attMime,
        attachmentName: attName,
      )) {
        if (!mounted) break;
        setState(() => _streamingText += chunk);
        _scrollToBottom();
      }

      if (!mounted) return;
      // Streaming complete — commit the full AI message to the list.
      final aiMsg = PersonalMessage(
        id: '${DateTime.now().millisecondsSinceEpoch}_a',
        text: _streamingText,
        isUser: false,
        timestamp: DateTime.now(),
      );
      setState(() {
        _messages.add(aiMsg);
        _isStreaming = false;
        _streamingText = '';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isStreaming = false;
        _streamingText = '';
        _errorText = _friendlyError(e.toString());
      });
    }

    _scrollToBottom();
  }

  String _friendlyError(String raw) {
    final lower = raw.toLowerCase();
    // Invalid / missing API key
    if (lower.contains('api_key') ||
        lower.contains('api key') ||
        (lower.contains('invalid') && lower.contains('key')) ||
        lower.contains('api-key') ||
        lower.contains('credentials')) {
      return 'Invalid API key. Please check the Gemini API key in the app.';
    }
    // Quota / rate limit — match specific HTTP status and Gemini error codes
    if (lower.contains('429') ||
        lower.contains('resource_exhausted') ||
        lower.contains('resourceexhausted') ||
        lower.contains('quota exceeded') ||
        lower.contains('rate limit') ||
        lower.contains('ratelimit')) {
      return 'API rate limit reached. You may have exceeded the daily quota. Try again later or set up billing at aistudio.google.com.';
    }
    // Network errors
    if (lower.contains('socket') ||
        lower.contains('network') ||
        lower.contains('connection') ||
        lower.contains('unreachable') ||
        lower.contains('no route')) {
      return 'No internet connection. Please check your network and retry.';
    }
    // Unknown — surface the raw message so it can be diagnosed
    return 'Error: $raw';
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 80), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // ─── Clear history ─────────────────────────────────────────────────────────

  void _confirmClear() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Clear Chat History',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
        content: const Text(
          'All messages will be permanently deleted from this device. '
          'This cannot be undone.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await _repo.clearHistory();
              if (!mounted) return;
              setState(() {
                _messages.clear();
                _errorText = null;
              });
            },
            child: const Text('Clear',
                style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  // ─── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildHeader(),
        Expanded(child: _buildMessageList()),
        if (_errorText != null) _buildErrorBar(),
        _buildInput(),
      ],
    );
  }

  // ─── Header ─────────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    final isTeacher = widget.role == 'teacher';
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.12),
            AppColors.primary.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          if (widget.onBack != null)
            IconButton(
              icon: const Icon(Icons.arrow_back_ios_rounded,
                  color: AppColors.textSecondary, size: 18),
              onPressed: widget.onBack,
              tooltip: 'Back to chats',
            ),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.auto_awesome_rounded,
                color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Personal AI Assistant',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  isTeacher
                      ? 'Hi ${widget.userName} · Gemini'
                      : 'Hi ${widget.userName} · Ask me anything!',
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded,
                color: AppColors.textSecondary, size: 22),
            color: AppColors.surface,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            onSelected: (value) {
              if (value == 'clear') _confirmClear();
            },
            itemBuilder: (_) => [
              const PopupMenuItem(
                value: 'clear',
                child: Row(
                  children: [
                    Icon(Icons.delete_sweep_outlined,
                        color: AppColors.error, size: 18),
                    SizedBox(width: 10),
                    Text('Clear history',
                        style: TextStyle(color: AppColors.textPrimary)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Message list ───────────────────────────────────────────────────────────

  Widget _buildMessageList() {
    final showEmpty = _messages.isEmpty && !_isStreaming;

    if (showEmpty) return _buildEmptyState();

    return ListView.builder(
      controller: _scrollCtrl,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      itemCount: _messages.length + (_isStreaming ? 1 : 0),
      itemBuilder: (context, index) {
        if (_isStreaming && index == _messages.length) {
          // Show streaming bubble or typing indicator.
          return _streamingText.isEmpty
              ? _buildTypingIndicator()
              : _buildStreamingBubble(_streamingText);
        }
        return _buildBubble(_messages[index]);
      },
    );
  }

  // ─── Empty / welcome state ──────────────────────────────────────────────────

  Widget _buildEmptyState() {
    final isTeacher = widget.role == 'teacher';
    final suggestions = isTeacher
        ? [
            'Help me plan a lesson on machine learning',
            'Give quiz ideas for data structures',
            'How to improve student engagement?',
            'Explain neural networks simply',
          ]
        : [
            'Explain Big Data in simple terms',
            'Help me study for my exam',
            'Summarize the CAP theorem',
            'Give me practice MCQs on SQL',
          ];

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      child: Column(
        children: [
          const SizedBox(height: 16),
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withValues(alpha: 0.2),
                  AppColors.primary.withValues(alpha: 0.08),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome_rounded,
                color: AppColors.primary, size: 34),
          ),
          const SizedBox(height: 16),
          const Text(
            'How can I help you today?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Internet-connected · Private · Stored only on this device',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
          const SizedBox(height: 28),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            alignment: WrapAlignment.center,
            children: suggestions
                .map((s) => _buildSuggestionChip(s))
                .toList(),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildSuggestionChip(String text) {
    return GestureDetector(
      onTap: () {
        _inputCtrl.text = text;
        // Move cursor to end.
        _inputCtrl.selection = TextSelection.fromPosition(
          TextPosition(offset: text.length),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: const BoxConstraints(maxWidth: 280),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  // ─── Message bubbles ────────────────────────────────────────────────────────

  Widget _buildBubble(PersonalMessage msg) {
    final isUser = msg.isUser;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment:
                isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!isUser) ...[
                _aiAvatar(),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 11),
                  decoration: BoxDecoration(
                    color: isUser ? AppColors.primary : AppColors.surface,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isUser ? 18 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 18),
                    ),
                    border: isUser
                        ? null
                        : Border.all(
                            color:
                                AppColors.primary.withValues(alpha: 0.15)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Attachment badge
                      if (msg.attachmentName != null) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          margin: const EdgeInsets.only(bottom: 6),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                msg.attachmentType == 'image'
                                    ? Icons.image_rounded
                                    : Icons.attach_file_rounded,
                                size: 14,
                                color: Colors.white70,
                              ),
                              const SizedBox(width: 5),
                              Flexible(
                                child: Text(
                                  msg.attachmentName!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      color: Colors.white70, fontSize: 11),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      // Message text
                      if (msg.text.isNotEmpty)
                        isUser
                            // SelectableText with a sky-blue highlight that
                            // contrasts clearly against the green bubble.
                            ? Theme(
                                data: Theme.of(context).copyWith(
                                  textSelectionTheme:
                                      const TextSelectionThemeData(
                                    selectionColor: Color(0x554FC3F7),
                                  ),
                                ),
                                child: SelectableText(
                                  msg.text,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    height: 1.45,
                                  ),
                                ),
                              )
                            // SelectionArea lets the user drag a selection
                            // across the entire AI response (all blocks),
                            // which MarkdownBody(selectable:true) cannot do.
                            : Theme(
                                data: Theme.of(context).copyWith(
                                  textSelectionTheme:
                                      const TextSelectionThemeData(
                                    selectionColor: Color(0x554FC3F7),
                                  ),
                                ),
                                child: SelectionArea(
                                  child: MarkdownBody(
                                    data: msg.text,
                                    styleSheet: _markdownStyle(),
                                  ),
                                ),
                              ),
                    ],
                  ),
                ),
              ),
              if (isUser) ...[
                const SizedBox(width: 8),
                _userAvatar(),
              ],
            ],
          ),
          const SizedBox(height: 3),
          Padding(
            padding: EdgeInsets.only(
              left: isUser ? 0 : 40,
              right: isUser ? 40 : 0,
            ),
            child: Text(
              _formatTime(msg.timestamp),
              style: const TextStyle(
                  fontSize: 10, color: AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  MarkdownStyleSheet _markdownStyle() => MarkdownStyleSheet(
        p: const TextStyle(
            color: AppColors.textPrimary, fontSize: 14, height: 1.5),
        strong: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w700),
        em: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 14,
            fontStyle: FontStyle.italic),
        code: const TextStyle(
            color: AppColors.primaryLight,
            fontSize: 13,
            fontFamily: 'monospace'),
        codeblockDecoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.divider),
        ),
        blockquoteDecoration: BoxDecoration(
          border: Border(
              left: BorderSide(
                  color: AppColors.primary.withValues(alpha: 0.6), width: 3)),
        ),
        blockquotePadding: const EdgeInsets.only(left: 10),
        h1: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold),
        h2: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.bold),
        h3: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 15,
            fontWeight: FontWeight.w600),
        listBullet: const TextStyle(
            color: AppColors.primary, fontSize: 14),
        horizontalRuleDecoration: BoxDecoration(
          border: Border(
              bottom: BorderSide(color: AppColors.divider, width: 1)),
        ),
      );

  Widget _buildStreamingBubble(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _aiAvatar(),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(18),
                  topRight: Radius.circular(18),
                  bottomLeft: Radius.circular(4),
                  bottomRight: Radius.circular(18),
                ),
                border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.15)),
              ),
              // Use plain Text during streaming to avoid markdown flicker
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Flexible(
                    child: Text(
                      text,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 14,
                        height: 1.45,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  _buildBlinkingCursor(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlinkingCursor() {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 700),
      builder: (_, value, __) => Opacity(
        opacity: value < 0.5 ? value * 2 : (1.0 - value) * 2,
        child: Container(
          width: 2,
          height: 14,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(1),
          ),
        ),
      ),
      onEnd: () {
        if (mounted && _isStreaming) setState(() {});
      },
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          _aiAvatar(),
          const SizedBox(width: 8),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(18),
              ),
              border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.15)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dot(0),
                const SizedBox(width: 5),
                _dot(1),
                const SizedBox(width: 5),
                _dot(2),
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
      duration: const Duration(milliseconds: 900),
      builder: (_, value, __) {
        final delay = index * 0.22;
        final v = ((value - delay).clamp(0.0, 1.0));
        final opacity = v < 0.5 ? v * 2 : (1.0 - v) * 2;
        return Opacity(
          opacity: opacity.clamp(0.25, 1.0),
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
      onEnd: () {
        if (mounted && _isStreaming) setState(() {});
      },
    );
  }

  // ─── Avatars ────────────────────────────────────────────────────────────────

  Widget _aiAvatar() => CircleAvatar(
        radius: 15,
        backgroundColor: AppColors.primary.withValues(alpha: 0.15),
        child: const Icon(Icons.auto_awesome_rounded,
            size: 16, color: AppColors.primary),
      );

  Widget _userAvatar() => CircleAvatar(
        radius: 15,
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.person, size: 16, color: Colors.white),
      );

  // ─── Error bar ──────────────────────────────────────────────────────────────

  Widget _buildErrorBar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: AppColors.error.withValues(alpha: 0.12),
      child: Row(
        children: [
          Icon(Icons.error_outline_rounded,
              color: AppColors.error, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorText!,
              style: TextStyle(
                  color: AppColors.error, fontSize: 13),
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _errorText = null),
            child: Icon(Icons.close, color: AppColors.error, size: 18),
          ),
        ],
      ),
    );
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
            top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Attachment preview chip
          if (_attachmentName != null) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 6, left: 4),
              child: Chip(
                backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                avatar: Icon(
                  _attachmentMimeType != null &&
                          _attachmentMimeType!.startsWith('image')
                      ? Icons.image_rounded
                      : Icons.attach_file_rounded,
                  size: 16,
                  color: AppColors.primary,
                ),
                label: Text(
                  _attachmentName!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 12),
                ),
                deleteIcon:
                    const Icon(Icons.close, size: 16, color: AppColors.textMuted),
                onDeleted: _clearAttachment,
              ),
            ),
          ],
          // Input row
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Attachment button
              IconButton(
                icon: const Icon(Icons.attach_file_rounded,
                    color: AppColors.textSecondary, size: 22),
                onPressed: _isStreaming ? null : _showAttachmentPicker,
                tooltip: 'Attach file or image',
                padding: const EdgeInsets.all(8),
              ),
              Expanded(
                child: TextField(
                  controller: _inputCtrl,
                  focusNode: _focusNode,
                  enabled: !_isStreaming,
                  maxLines: 5,
                  minLines: 1,
                  textInputAction: TextInputAction.newline,
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: _isStreaming
                        ? 'Waiting for response…'
                        : 'Type a message…',
                    hintStyle: const TextStyle(
                        color: AppColors.textMuted, fontSize: 14),
                    filled: true,
                    fillColor: AppColors.background.withValues(alpha: 0.6),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: BorderSide(color: AppColors.divider),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide:
                          const BorderSide(color: AppColors.primary, width: 1.4),
                    ),
                    disabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(22),
                      borderSide: BorderSide(color: AppColors.divider),
                    ),
                  ),
                  onSubmitted: (_) => _send(),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: _isStreaming ? null : _send,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: _isStreaming
                        ? AppColors.disabled
                        : AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.send_rounded,
                      color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  String _formatTime(DateTime ts) {
    final diff = DateTime.now().difference(ts);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'yesterday';
    return '${diff.inDays}d ago';
  }
}
