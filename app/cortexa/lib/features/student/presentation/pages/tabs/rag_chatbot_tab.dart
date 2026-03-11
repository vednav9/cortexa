import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../rag_assistant/data/models/chat_message_model.dart';
import '../../../../rag_assistant/data/repositories/ai_repository.dart';
import '../../../../rag_assistant/presentation/bloc/rag_chat_bloc.dart';
import '../../../../rag_assistant/presentation/bloc/rag_chat_event.dart';

class RAGChatbotTab extends StatefulWidget {
  const RAGChatbotTab({super.key});

  @override
  State<RAGChatbotTab> createState() => _RAGChatbotTabState();
}

class _RAGChatbotTabState extends State<RAGChatbotTab> {
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  late final RagChatBloc _bloc;
  String _institutionId = '';
  String _userName = '';

  static const _suggestions = [
    'What is Big Data Analytics?',
    'Explain MapReduce',
    'Summarise my uploaded notes',
    'Latest AI trends',
  ];

  @override
  void initState() {
    super.initState();
    _bloc = RagChatBloc(getIt<AiRepository>());
    _bloc.add(LoadChatHistory());
    final storage = getIt<HiveStorageService>();
    final user = storage.getCurrentUser();
    final institution = storage.getCurrentInstitution();
    _userName = user?.fullName ?? user?.username ?? 'Student';
    _institutionId =
        institution?['_id'] as String? ?? institution?['id'] as String? ?? '';
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    _bloc.close();
    super.dispose();
  }

  void _sendMessage([String? preset]) {
    final text = (preset ?? _inputCtrl.text).trim();
    if (text.isEmpty) return;
    _bloc.add(SendRagQuery(
      query: text,
      institutionId: _institutionId.isNotEmpty ? _institutionId : null,
      useHybrid: true,
    ));
    _inputCtrl.clear();
    _scrollToBottom();
  }

  void _clearHistory() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Clear Chat',
            style: TextStyle(
                color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
        content: const Text(
          'This will clear all messages in this session.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel',
                style: TextStyle(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              _bloc.add(ClearChatHistory());
              Navigator.pop(ctx);
            },
            child: const Text('Clear',
                style: TextStyle(
                    color: AppColors.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
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
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(0, 8, 20, 0),
                child: GestureDetector(
                  onTap: _clearHistory,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.error.withValues(alpha: 0.35)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.delete_outline_rounded,
                            color: AppColors.error, size: 15),
                        SizedBox(width: 5),
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
              ),
            ),
            Expanded(
              child: BlocConsumer<RagChatBloc, RagChatState>(
                listener: (context, state) {
                  if (state is RagChatLoaded || state is RagChatLoading) {
                    _scrollToBottom();
                  }
                },
                builder: (context, state) {
                  final msgs = _messagesFrom(state);
                  final isLoading = state is RagChatLoading;
                  if (msgs.isEmpty && !isLoading) {
                    return _buildWelcome();
                  }
                  return ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    itemCount: msgs.length + (isLoading ? 1 : 0),
                    itemBuilder: (ctx, i) {
                      if (isLoading && i == msgs.length) {
                        return _buildTyping();
                      }
                      return _buildBubble(msgs[i]);
                    },
                  );
                },
              ),
            ),
            BlocBuilder<RagChatBloc, RagChatState>(
              builder: (context, state) {
                if (state is RagChatError) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    color: AppColors.error.withValues(alpha: 0.12),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline,
                            color: AppColors.error, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            state.message,
                            style: const TextStyle(
                                color: AppColors.error, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
            _buildInputArea(),
          ],
        ),
      ),
    );
  }

  // ─── Header ─────────────────────────────────────────────────────────────────

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
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
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: AppColors.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI Assistant',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    letterSpacing: 0.3,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Powered by RAG + Web Search',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Welcome / empty ─────────────────────────────────────────────────────────

  Widget _buildWelcome() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 32),
          Text(
            'Hi $_userName!',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Ask me anything about your course materials.\nI can search your documents and the web for answers.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 28),
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
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.8,
            children: _suggestions
                .map((s) => _buildSuggestionChip(s))
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionChip(String text) {
    return GestureDetector(
      onTap: () => _sendMessage(text),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.25)),
        ),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  // ─── Bubble ───────────────────────────────────────────────────────────────────

  Widget _buildBubble(ChatMessage msg) {
    final isUser = msg.isUser;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
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
                      horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color:
                        isUser ? AppColors.primary : AppColors.surface,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      topLeft: isUser
                          ? const Radius.circular(16)
                          : Radius.zero,
                      topRight: isUser
                          ? Radius.zero
                          : const Radius.circular(16),
                    ),
                    border: isUser
                        ? null
                        : Border.all(
                            color: AppColors.borderDark
                                .withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        msg.message,
                        style: TextStyle(
                          color: isUser
                              ? Colors.white
                              : AppColors.textPrimary,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                      if (!isUser && msg.isWebFallback == true) ..._webBadge(),
                      if (!isUser &&
                          msg.sources != null &&
                          msg.sources!.isNotEmpty)
                        _buildSources(msg.sources!),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _fmtTime(msg.timestamp),
                  style: const TextStyle(
                      color: AppColors.textMuted, fontSize: 11),
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
          child: const Icon(Icons.auto_awesome_rounded,
              size: 17, color: AppColors.primary),
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
          child: const Icon(Icons.person_outline,
              size: 17, color: AppColors.primary),
        ),
      ];

  List<Widget> _webBadge() => [
        const SizedBox(height: 8),
        Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.2)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.language_rounded,
                  size: 12, color: AppColors.primary),
              SizedBox(width: 4),
              Text('Web search',
                  style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ];

  Widget _buildSources(List<String> sources) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.source_outlined,
                    size: 13, color: AppColors.textSecondary),
                const SizedBox(width: 5),
                const Text('Sources (rag):',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary)),
              ],
            ),
            const SizedBox(height: 6),
            ...sources.take(3).map(
                  (s) => Padding(
                    padding: const EdgeInsets.only(bottom: 3),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.description_outlined,
                            size: 12, color: AppColors.textMuted),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(s,
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary),
                              overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }

  // ─── Typing indicator ────────────────────────────────────────────────────────

  Widget _buildTyping() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ..._aiAvatar(),
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16)
                  .copyWith(topLeft: Radius.zero),
              border: Border.all(
                  color: AppColors.borderDark.withValues(alpha: 0.25)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dot(0),
                const SizedBox(width: 4),
                _dot(1),
                const SizedBox(width: 4),
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
      duration: const Duration(milliseconds: 600),
      builder: (_, v, __) {
        final a = ((v - index * 0.2) % 1.0).clamp(0.0, 1.0);
        final opacity = (a < 0.5 ? a * 2 : (1 - a) * 2).clamp(0.3, 1.0);
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

  // ─── Input area ──────────────────────────────────────────────────────────────

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(
          top: BorderSide(
              color: AppColors.borderDark.withValues(alpha: 0.2), width: 1),
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
                    constraints:
                        const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color:
                            AppColors.borderDark.withValues(alpha: 0.3),
                      ),
                    ),
                    child: TextField(
                      controller: _inputCtrl,
                      enabled: !isLoading,
                      decoration: const InputDecoration(
                        hintText: 'Ask about your courses...',
                        hintStyle: TextStyle(
                            color: AppColors.textTertiary,
                            fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 20, vertical: 12),
                      ),
                      maxLines: null,
                      textCapitalization:
                          TextCapitalization.sentences,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    gradient: isLoading
                        ? null
                        : const LinearGradient(
                            colors: [
                              AppColors.primary,
                              AppColors.primaryDark,
                            ],
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

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  List<ChatMessage> _messagesFrom(RagChatState state) {
    if (state is RagChatLoading) return state.messages;
    if (state is RagChatLoaded) return state.messages;
    if (state is RagChatError) return state.messages;
    return [];
  }

  String _fmtTime(DateTime t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
}
