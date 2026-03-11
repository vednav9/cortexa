import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../data/models/personal_conversation.dart';
import 'personal_chat_widget.dart';

/// Top-level widget for the Personal AI Chat feature.
/// Displays a list of conversation sessions for [userId].
/// Tapping a conversation opens [PersonalChatWidget] for that session.
class PersonalChatHomeWidget extends StatefulWidget {
  final String userId;
  final String userName;
  final String role;

  const PersonalChatHomeWidget({
    super.key,
    required this.userId,
    required this.userName,
    required this.role,
  });

  @override
  State<PersonalChatHomeWidget> createState() => _PersonalChatHomeWidgetState();
}

class _PersonalChatHomeWidgetState extends State<PersonalChatHomeWidget> {
  late HiveStorageService _storage;
  List<PersonalConversation> _conversations = [];

  /// When non-null, the chat view for this conversation is shown.
  String? _openConvId;

  @override
  void initState() {
    super.initState();
    _storage = getIt<HiveStorageService>();
    _loadConversations();
  }

  void _loadConversations() {
    setState(() {
      _conversations = _storage.getPersonalConversations(widget.userId);
    });
  }

  // ─── New chat ───────────────────────────────────────────────────────────────

  void _startNewChat() {
    final convId = const Uuid().v4();
    final conv = PersonalConversation(
      id: convId,
      title: 'New Chat',
      createdAt: DateTime.now(),
      lastUpdatedAt: DateTime.now(),
    );
    _storage.savePersonalConversation(widget.userId, conv).then((_) {
      if (!mounted) return;
      _loadConversations();
      setState(() => _openConvId = convId);
    });
  }

  // ─── Delete conversation ────────────────────────────────────────────────────

  void _deleteConversation(String convId) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Chat',
          style: TextStyle(
              color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
        content: const Text(
          'This conversation and all its messages will be permanently deleted.',
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
              await _storage.deletePersonalConversation(
                  widget.userId, convId);
              if (!mounted) return;
              _loadConversations();
            },
            child: const Text('Delete',
                style: TextStyle(
                    color: AppColors.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  // ─── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    if (_openConvId != null) {
      return PersonalChatWidget(
        userId: widget.userId,
        userName: widget.userName,
        role: widget.role,
        conversationId: _openConvId!,
        onBack: () {
          setState(() => _openConvId = null);
          _loadConversations();
        },
      );
    }
    return _buildConversationList();
  }

  Widget _buildConversationList() {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async => _loadConversations(),
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildListHeader(),
              const SizedBox(height: 20),
              if (_conversations.isEmpty)
                _buildEmptyState()
              else
                _buildList(),
              // Extra bottom padding so FAB doesn't overlap last item
              const SizedBox(height: 88),
            ],
          ),
        ),
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: FloatingActionButton.extended(
          onPressed: _startNewChat,
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 4,
          icon: const Icon(Icons.add_rounded, size: 24),
          label: const Text(
            'New Chat',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
        ),
      ),
    );
  }

  // ─── List header ────────────────────────────────────────────────────────────

  Widget _buildListHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.10),
            AppColors.primary.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              size: 32,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Personal AI',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Hi ${widget.userName} · Your private AI chats',
                  style: TextStyle(
                    color: AppColors.textSecondary.withValues(alpha: 0.9),
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Conversation list ──────────────────────────────────────────────────────

  Widget _buildList() {
    return Column(
      children: _conversations
          .map((conv) => _buildConvTile(conv))
          .toList(),
    );
  }

  Widget _buildConvTile(PersonalConversation conv) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        onTap: () => setState(() => _openConvId = conv.id),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.chat_bubble_outline_rounded,
              color: AppColors.primary, size: 20),
        ),
        title: Text(
          conv.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        subtitle: conv.lastMessagePreview.isNotEmpty
            ? Text(
                conv.lastMessagePreview,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    color: AppColors.textMuted, fontSize: 12),
              )
            : const Text(
                'Start the conversation…',
                style:
                    TextStyle(color: AppColors.textMuted, fontSize: 12),
              ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _relativeTime(conv.lastUpdatedAt),
              style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 11),
            ),
            const SizedBox(width: 4),
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded,
                  color: AppColors.textMuted, size: 20),
              onPressed: () => _deleteConversation(conv.id),
              tooltip: 'Delete',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  // ─── Empty state ────────────────────────────────────────────────────────────

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.only(top: 60, left: 8, right: 8),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.3),
                    AppColors.primary.withValues(alpha: 0.12),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(50),
              ),
              child: Icon(
                Icons.auto_awesome_rounded,
                size: 48,
                color: AppColors.primary.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'No conversations yet',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Tap the "New Chat" button below to start\nyour first private AI conversation.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  String _relativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays == 1) return 'yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${(diff.inDays / 7).floor()}w';
  }
}
