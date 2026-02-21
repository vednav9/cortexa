import 'dart:convert';
import 'dart:typed_data';
import 'package:google_generative_ai/google_generative_ai.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../models/personal_conversation.dart';
import '../models/personal_message.dart';

/// Manages Gemini-powered personal AI chat for one user × one conversation.
/// History is persisted to Hive keyed by [userId] + [conversationId].
class PersonalChatRepository {
  final String userId;
  final String conversationId;
  final String systemPrompt;
  final HiveStorageService _storage;

  late final GenerativeModel _model;
  ChatSession? _chatSession;

  static const int _maxStoredMessages = 50;

  PersonalChatRepository({
    required this.userId,
    required this.conversationId,
    required this.systemPrompt,
    required HiveStorageService storage,
  }) : _storage = storage {
    _model = GenerativeModel(
      model: 'gemini-2.5-flash',
      apiKey: ApiConfig.geminiApiKey,
      systemInstruction: Content.system(systemPrompt),
    );
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /// Returns stored messages for this conversation, oldest first.
  List<PersonalMessage> loadHistory() {
    final raw = _storage.getConvChatHistory(userId, conversationId);
    return raw.map((e) => PersonalMessage.fromMap(e as Map)).toList();
  }

  /// Sends [text] (and optional attachment bytes) to Gemini and streams
  /// response chunks. Both the user message and the completed AI reply are
  /// persisted to Hive and the parent [PersonalConversation] is updated.
  Stream<String> sendMessage(
    String text, {
    Uint8List? attachmentBytes,
    String? attachmentMimeType,
    String? attachmentName,
  }) async* {
    _chatSession ??= _initSession();

    // Build user content parts.
    final List<Part> parts = [];
    if (attachmentBytes != null && attachmentMimeType != null) {
      if (attachmentMimeType == 'text/plain') {
        // Decode plain-text files inline so the model reads the actual
        // file content as text — more reliable than sending as DataPart.
        final decoded = utf8.decode(attachmentBytes, allowMalformed: true);
        final header = '--- Contents of ${attachmentName ?? 'file'} ---\n';
        const footer = '\n--- End of file ---';
        parts.add(TextPart('$header$decoded$footer'));
      } else {
        // Images and PDFs are sent as inline binary data.
        parts.add(DataPart(attachmentMimeType, attachmentBytes));
      }
    }
    if (text.isNotEmpty) {
      parts.add(TextPart(text));
    } else if (parts.isEmpty) {
      return;
    }

    // Persist user message.
    final userMsg = PersonalMessage(
      id: '${DateTime.now().millisecondsSinceEpoch}_u',
      text: text,
      isUser: true,
      timestamp: DateTime.now(),
      attachmentName: attachmentName,
      attachmentType: attachmentMimeType != null
          ? (attachmentMimeType.startsWith('image') ? 'image' : 'document')
          : null,
    );
    await _storage.addConvChatMessage(userId, conversationId, userMsg.toMap());

    // Always use Content.multi when there is a DataPart (binary attachment),
    // so the bytes are never silently dropped.  For text-only messages a
    // single TextPart can use the lighter Content.text() shorthand.
    final bool hasDataPart = parts.any((p) => p is DataPart);
    final Content outgoing = hasDataPart
        ? Content.multi(parts)
        : (parts.length == 1 ? Content.text(text) : Content.multi(parts));

    // Stream the AI response.
    final buffer = StringBuffer();
    final stream = _chatSession!.sendMessageStream(outgoing);

    await for (final chunk in stream) {
      final part = chunk.text ?? '';
      if (part.isNotEmpty) {
        buffer.write(part);
        yield part;
      }
    }

    // Persist AI response.
    final aiMsg = PersonalMessage(
      id: '${DateTime.now().millisecondsSinceEpoch}_a',
      text: buffer.toString(),
      isUser: false,
      timestamp: DateTime.now(),
    );
    await _storage.addConvChatMessage(userId, conversationId, aiMsg.toMap());

    // Update conversation metadata.
    await _updateConversation(userMsg.text, buffer.toString());
    await _trimIfNeeded();
  }

  /// Clears all messages for this conversation and resets the in-memory session.
  Future<void> clearHistory() async {
    await _storage.clearConvChatHistory(userId, conversationId);
    _chatSession = null;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  ChatSession _initSession() {
    final history = loadHistory();
    final contents = <Content>[];
    for (final msg in history) {
      if (msg.isUser) {
        contents.add(Content.text(msg.text.isEmpty ? '(attachment)' : msg.text));
      } else {
        contents.add(Content.model([TextPart(msg.text)]));
      }
    }
    return _model.startChat(history: contents);
  }

  Future<void> _updateConversation(String userText, String aiText) async {
    final existing = _storage
        .getPersonalConversations(userId)
        .firstWhere((c) => c.id == conversationId, orElse: () {
      return PersonalConversation(
        id: conversationId,
        title: _titleFromText(userText),
        createdAt: DateTime.now(),
        lastUpdatedAt: DateTime.now(),
      );
    });

    // Auto-generate title from first user message if still untitled.
    final shouldUpdateTitle =
        existing.title == 'New Chat' || existing.title.isEmpty;
    final newTitle =
        shouldUpdateTitle ? _titleFromText(userText) : existing.title;

    final preview = aiText.length > 80 ? '${aiText.substring(0, 80)}…' : aiText;

    await _storage.savePersonalConversation(
      userId,
      existing.copyWith(
        title: newTitle,
        lastUpdatedAt: DateTime.now(),
        lastMessagePreview: preview,
      ),
    );
  }

  String _titleFromText(String text) {
    final clean = text.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (clean.isEmpty) return 'New Chat';
    return clean.length > 40 ? '${clean.substring(0, 40)}…' : clean;
  }

  Future<void> _trimIfNeeded() async {
    final raw = _storage.getConvChatHistory(userId, conversationId);
    if (raw.length > _maxStoredMessages) {
      final trimmed = raw.sublist(raw.length - _maxStoredMessages);
      await _storage.setConvChatHistory(userId, conversationId, trimmed);
      _chatSession = null;
    }
  }
}
