import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_player/video_player.dart';
import 'package:uuid/uuid.dart';
import '../../../../../../core/services/r2_storage_service.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/config/api_config.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../data/repositories/voice_repository.dart';

class VoiceToTextTab extends StatefulWidget {
  const VoiceToTextTab({super.key});

  @override
  State<VoiceToTextTab> createState() => _VoiceToTextTabState();
}

class _VoiceToTextTabState extends State<VoiceToTextTab>
    with SingleTickerProviderStateMixin {
  final _audioRecorder = AudioRecorder();
  final _voiceRepository = VoiceRepository();
  final _lectureTitleController = TextEditingController();
  final _courseIdController = TextEditingController();
  
  bool _isRecording = false;
  bool _isProcessing = false;
  bool _isTitleFilled = false;
  String? _audioFilePath;
  int _recordingDuration = 0;
  DateTime? _recordingStartTime;
  
  Map<String, dynamic>? _transcriptionResult;
  bool _isSaving = false;
  // Non-null when the user is replacing an existing recording's audio.
  // Save will update that record in-place instead of creating a new one.
  Map<String, dynamic>? _reRecordingTarget;

  final TextEditingController _previewController = TextEditingController();

  // Stored so we can removeListener before clear() / dispose() to prevent
  // a setState firing on a disposed controller (→ crashes).
  VoidCallback? _titleListener;

  // ── Saved recordings (persisted in Hive) ─────────────────────────────────
  List<Map<String, dynamic>> _savedRecordings = [];
  bool _isLoadingRecordings = true;

  // Audio playback
  VideoPlayerController? _videoPlayerController;
  bool _isPlayingAudio = false;
  Duration _audioPlaybackPosition = Duration.zero;
  Duration _audioPlaybackDuration = Duration.zero;

  void _onVideoPlayerStateChanged() {
    if (!mounted) return;
    final ctrl = _videoPlayerController;
    if (ctrl == null) return;
    final val = ctrl.value;
    setState(() {
      _isPlayingAudio = val.isPlaying;
      _audioPlaybackPosition = val.position;
      _audioPlaybackDuration = val.duration;
      if (!val.isPlaying &&
          val.duration.inMilliseconds > 0 &&
          val.position.inMilliseconds >= val.duration.inMilliseconds) {
        _audioPlaybackPosition = Duration.zero;
      }
    });
  }
  
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _titleListener = () {
      if (!mounted) return;
      final filled = _lectureTitleController.text.trim().isNotEmpty;
      if (filled != _isTitleFilled) {
        setState(() => _isTitleFilled = filled);
      }
    };
    _lectureTitleController.addListener(_titleListener!);
    _loadRecordings();
  }

  @override
  void dispose() {
    _audioRecorder.dispose();
    _videoPlayerController?.removeListener(_onVideoPlayerStateChanged);
    _videoPlayerController?.dispose();
    _pulseController.dispose();
    if (_titleListener != null) _lectureTitleController.removeListener(_titleListener!);
    _lectureTitleController.dispose();
    _courseIdController.dispose();
    _previewController.dispose();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  String _formatDurationObj(Duration d) {
    final mins = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final secs = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  void _showStatusSnackBar({
    required String message,
    required IconData icon,
    required Color color,
    int seconds = 3,
  }) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
        duration: Duration(seconds: seconds),
      ),
    );
  }

  Future<void> _initAudioPlayer() async {
    _videoPlayerController?.removeListener(_onVideoPlayerStateChanged);
    await _videoPlayerController?.pause();
    await _videoPlayerController?.dispose();
    _videoPlayerController = null;

    if (_audioFilePath == null) return;

    _videoPlayerController = VideoPlayerController.file(File(_audioFilePath!));
    await _videoPlayerController!.initialize();
    if (!mounted) {
      _videoPlayerController?.dispose();
      _videoPlayerController = null;
      return;
    }
    _videoPlayerController!.addListener(_onVideoPlayerStateChanged);
  }

  Future<void> _startRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final directory = await getTemporaryDirectory();
        final filePath = '${directory.path}/lecture_${DateTime.now().millisecondsSinceEpoch}.wav';
        
        await _audioRecorder.start(
          const RecordConfig(encoder: AudioEncoder.wav),
          path: filePath,
        );
        
        setState(() {
          _isRecording = true;
          _recordingStartTime = DateTime.now();
          _recordingDuration = 0;
          _audioFilePath = filePath;
        });
        
        // Update duration every second
        Future.doWhile(() async {
          await Future.delayed(const Duration(seconds: 1));
          if (_isRecording && mounted) {
            setState(() {
              _recordingDuration = DateTime.now().difference(_recordingStartTime!).inSeconds;
            });
            return true;
          }
          return false;
        });
        
        _showStatusSnackBar(
          message: 'Recording started',
          icon: Icons.mic,
          color: AppColors.primary,
          seconds: 2,
        );
      } else {
        _showStatusSnackBar(
          message: 'Microphone permission denied',
          icon: Icons.mic_off,
          color: Colors.red.shade600,
          seconds: 4,
        );
      }
    } catch (e) {
      _showStatusSnackBar(
        message: 'Failed to start recording: ${e.toString().replaceAll('Exception: ', '')}',
        icon: Icons.error_outline,
        color: Colors.red.shade600,
        seconds: 4,
      );
    }
  }

  Future<void> _stopRecording() async {
    try {
      await _audioRecorder.stop();
      setState(() {
        _isRecording = false;
      });
      await _initAudioPlayer();
      
      _showStatusSnackBar(
        message: 'Recording stopped',
        icon: Icons.check_circle_outline,
        color: Colors.green.shade600,
        seconds: 2,
      );
    } catch (e) {
      _showStatusSnackBar(
        message: 'Failed to stop recording: ${e.toString().replaceAll('Exception: ', '')}',
        icon: Icons.error_outline,
        color: Colors.red.shade600,
        seconds: 4,
      );
    }
  }

  Future<void> _transcribeAudio() async {
    if (_audioFilePath == null) {
      _showStatusSnackBar(
        message: 'No audio recording found',
        icon: Icons.warning_amber_rounded,
        color: Colors.orange.shade600,
        seconds: 3,
      );
      return;
    }

    if (_lectureTitleController.text.trim().isEmpty) {
      _showStatusSnackBar(
        message: 'Please enter a lecture title',
        icon: Icons.warning_amber_rounded,
        color: Colors.orange.shade600,
        seconds: 3,
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      final storage = getIt<HiveStorageService>();
      final currentUser = storage.getCurrentUser();
      
      if (currentUser == null || currentUser.institutionId == null) {
        throw Exception('User not found or not enrolled in institution');
      }

      final result = await _voiceRepository.transcribeAndUpload(
        audioFilePath: _audioFilePath!,
        lectureTitle: _lectureTitleController.text.trim(),
        teacherId: currentUser.id,
        institutionId: currentUser.institutionId!,
        courseId: _courseIdController.text.trim().isNotEmpty 
            ? _courseIdController.text.trim() 
            : null,
      );

      final formatted = result['transcription']?['formatted_text'] ?? '';
      setState(() {
        _transcriptionResult = result;
        _isProcessing = false;
      });
      _previewController.text = formatted;

      _showStatusSnackBar(
        message: 'Lecture transcribed successfully',
        icon: Icons.check_circle_outline,
        color: Colors.green.shade600,
      );
    } catch (e) {
      setState(() => _isProcessing = false);

      _showStatusSnackBar(
        message: 'Transcription failed: ${e.toString().replaceAll('Exception: ', '')}',
        icon: Icons.error_outline,
        color: Colors.red.shade600,
        seconds: 4,
      );
    }
  }

  void _copyToClipboard() {
    final text = _previewController.text;
    if (text.isEmpty) return;
    Clipboard.setData(ClipboardData(text: text));
    _showStatusSnackBar(
      message: 'Transcript copied to clipboard',
      icon: Icons.check_circle,
      color: AppColors.primary,
      seconds: 2,
    );
  }

  void _reset() {
    _videoPlayerController?.removeListener(_onVideoPlayerStateChanged);
    _videoPlayerController?.pause();
    _videoPlayerController?.dispose();
    _previewController.clear();
    // Remove the title listener before clear() so it cannot fire a setState
    // during the same synchronous call (leading to _dependents.isEmpty and
    // TextEditingController-used-after-disposed crashes).
    if (_titleListener != null) _lectureTitleController.removeListener(_titleListener!);
    _lectureTitleController.clear();
    _courseIdController.clear();
    if (!mounted) return;
    setState(() {
      _videoPlayerController = null;
      _isPlayingAudio = false;
      _audioPlaybackPosition = Duration.zero;
      _audioPlaybackDuration = Duration.zero;
      _audioFilePath = null;
      _transcriptionResult = null;
      _isSaving = false;
      _recordingDuration = 0;
      _isTitleFilled = false;
      _reRecordingTarget = null;
    });
    // Re-register so future text changes are tracked.
    if (_titleListener != null) _lectureTitleController.addListener(_titleListener!);
  }

  // ─── Recordings ────────────────────────────────────────────────────────────

  Future<void> _loadRecordings() async {
    final storage = getIt<HiveStorageService>();
    final currentUser = storage.getCurrentUser();
    final all = storage.getVoiceRecordings();
    // Show recordings belonging to the current user; also show legacy
    // recordings that have no userId (saved before per-user filtering was added).
    final filtered = currentUser != null
        ? all.where((r) => r['userId'] == null || r['userId'] == currentUser.id).toList()
        : all;
    if (mounted) setState(() { _savedRecordings = filtered; _isLoadingRecordings = false; });
    // Background-verify that the local audio file still exists on disk.
    _verifyLocalFiles(filtered);
  }

  Future<void> _verifyLocalFiles(List<Map<String, dynamic>> recordings) async {
    final updated = List<Map<String, dynamic>>.from(recordings);
    bool changed = false;
    for (int i = 0; i < updated.length; i++) {
      final rec = updated[i];
      final path = rec['localPath'] as String?;
      final exists = path != null && await File(path).exists();
      if ((rec['localExists'] as bool?) != exists) {
        updated[i] = {...rec, 'localExists': exists};
        changed = true;
      }
    }
    if (changed && mounted) setState(() => _savedRecordings = updated);
  }

  Future<void> _saveRecording() async {
    if (_audioFilePath == null) return;
    final isReRecord = _reRecordingTarget != null;
    String? savedTitle;
    if (!isReRecord) {
      final nameCtrl = TextEditingController(text: _lectureTitleController.text.trim());

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Name Your Recording'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Give this recording a name before saving:',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: nameCtrl,
              autofocus: true,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                labelText: 'Recording Name',
                hintText: 'e.g. Introduction to ML',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.trim().isNotEmpty) {
                savedTitle = nameCtrl.text.trim();
                Navigator.pop(ctx);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Save'),
          ),
        ],
      ),
    );
      // Do NOT call nameCtrl.dispose() here — the dialog pop animation still
      // uses the controller for a few frames after showDialog returns.
      if (savedTitle == null) return;
    } else {
      savedTitle = _reRecordingTarget!['title'] as String? ?? 'Re-recorded Lecture';
    }

    setState(() => _isSaving = true);
    try {
      final storage = getIt<HiveStorageService>();
      final currentUser = storage.getCurrentUser();

      // ── 1. Copy WAV to permanent app directory ──────────────────────────────
      final id = isReRecord ? (_reRecordingTarget!['id'] as String) : const Uuid().v4();
      final docsDir = await getApplicationDocumentsDirectory();
      final recDir = Directory('${docsDir.path}/cortexa_recordings');
      await recDir.create(recursive: true);
      final destPath = '${recDir.path}/$id.wav';
      await File(_audioFilePath!).copy(destPath);

      // ── 2. Delete old local file when re-recording (different path only) ────
      if (isReRecord) {
        final oldPath = _reRecordingTarget!['localPath'] as String?;
        if (oldPath != null && oldPath != destPath) {
          try { await File(oldPath).delete(); } catch (_) {}
        }
      }

      // ── 3. R2 upload (skip if file > 100 MB to protect free-tier quota) ─────
      String? r2Key;
      String? r2Url;
      final fileSizeBytes = await File(destPath).length();
      const maxR2Bytes = 100 * 1024 * 1024; // 100 MB guard
      if (ApiConfig.r2IsConfigured && fileSizeBytes <= maxR2Bytes) {
        try {
          final r2 = R2StorageService(
            accountId: ApiConfig.r2AccountId,
            accessKeyId: ApiConfig.r2AccessKeyId,
            secretAccessKey: ApiConfig.r2SecretAccessKey,
            bucketName: ApiConfig.r2BucketName,
          );
          // When re-recording, delete the old R2 object first.
          if (isReRecord) {
            final oldR2Key = _reRecordingTarget!['r2Key'] as String?;
            if (oldR2Key != null) {
              try { await r2.deleteObject(oldR2Key); } catch (_) {}
            }
          }
          final safeTitle = savedTitle!
              .replaceAll(RegExp(r'[^a-zA-Z0-9-_]'), '_')
              .substring(0, savedTitle!.length > 60 ? 60 : savedTitle!.length);
          final key = 'audio/${DateTime.now().millisecondsSinceEpoch}-$safeTitle.wav';
          final uploadedKey = await r2.uploadAudio(File(destPath), key);
          if (uploadedKey != null) {
            r2Key = uploadedKey;
            r2Url = 'https://pub-032e669fa4da47fa85eeca766f953268.r2.dev/$uploadedKey';
          }
        } catch (_) {
          // R2 unavailable — recording still saved locally.
        }
      }

      // ── 4. Persist / update Hive ─────────────────────────────────────────────
      if (isReRecord) {
        await storage.updateVoiceRecording(id, {
          'localPath': destPath,
          'localExists': true,
          'r2Key': r2Key,
          'r2Url': r2Url,
          'transcriptText': _previewController.text,
          'durationSeconds': _recordingDuration,
        });
      } else {
        await storage.saveVoiceRecording(<String, dynamic>{
          'id': id,
          'title': savedTitle!,
          'userId': currentUser?.id,
          'localPath': destPath,
          'localExists': true,
          'r2Key': r2Key,
          'r2Url': r2Url,
          'transcriptText': _previewController.text,
          'durationSeconds': _recordingDuration,
          'createdAt': DateTime.now().toIso8601String(),
        });
      }

      // ── 5. Push transcript to RAG (fire-and-forget) ───────────────────────
      // _transcribeAudio already sent the original transcript to RAG; here we
      // push the (possibly edited) preview text so any edits made before saving
      // are reflected in the knowledge base.
      if (currentUser != null && _previewController.text.trim().isNotEmpty) {
        _voiceRepository.ingestTextToRag(
          text: _previewController.text,
          lectureTitle: savedTitle!,
          teacherId: currentUser.id,
          institutionId: currentUser.institutionId ?? '',
          recordingId: id,
        ).ignore();
      }

      _reRecordingTarget = null;
      await _loadRecordings();
      _reset();

      final sizeWarning = fileSizeBytes > maxR2Bytes;
      _showStatusSnackBar(
        message: sizeWarning
            ? 'Saved locally (file >100 MB, skipped cloud)'
            : r2Key != null
                ? (isReRecord ? 'Re-recording saved and synced to cloud' : 'Saved and uploaded to cloud')
                : 'Saved locally (cloud unavailable)',
        icon: Icons.check_circle,
        color: Colors.green.shade600,
      );
    } catch (e) {
      _showStatusSnackBar(
        message: 'Save failed: ${e.toString().replaceAll("Exception: ", "")}',
        icon: Icons.error_outline,
        color: Colors.red.shade600,
        seconds: 4,
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _deleteRecording(Map<String, dynamic> recording) async {
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Recording'),
        content: Text(
          'Delete "${recording["title"]}"?\n\nThis will remove the file from your device and cloud storage.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    // Delete local file
    final localPath = recording['localPath'] as String?;
    if (localPath != null) {
      try {
        final f = File(localPath);
        if (await f.exists()) await f.delete();
      } catch (_) {}
    }

    // Delete from R2 directly using device credentials
    final r2Key = recording['r2Key'] as String?;
    if (r2Key != null && ApiConfig.r2IsConfigured) {
      try {
        final r2 = R2StorageService(
          accountId: ApiConfig.r2AccountId,
          accessKeyId: ApiConfig.r2AccessKeyId,
          secretAccessKey: ApiConfig.r2SecretAccessKey,
          bucketName: ApiConfig.r2BucketName,
        );
        await r2.deleteObject(r2Key);
      } catch (_) {}
    }

    await getIt<HiveStorageService>().deleteVoiceRecording(recording['id'] as String);
    await _loadRecordings();

    _showStatusSnackBar(
      message: 'Recording deleted',
      icon: Icons.delete_outline,
      color: Colors.red.shade600,
      seconds: 2,
    );
  }

  Future<void> _renameRecording(Map<String, dynamic> recording) async {
    String? newTitle;
    final ctrl = TextEditingController(text: recording['title'] as String? ?? '');
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Rename Recording'),
        content: TextField(
          controller: ctrl,
          autofocus: true,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            labelText: 'New Name',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (ctrl.text.trim().isNotEmpty) {
                newTitle = ctrl.text.trim();
                Navigator.pop(ctx);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Rename'),
          ),
        ],
      ),
    );
    if (newTitle == null) return;
    await getIt<HiveStorageService>()
        .updateVoiceRecording(recording['id'] as String, {'title': newTitle!});
    await _loadRecordings();
    _showStatusSnackBar(
      message: 'Recording renamed',
      icon: Icons.edit,
      color: AppColors.primary,
      seconds: 2,
    );
  }

  void _openRecordingDetail(Map<String, dynamic> recording) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RecordingDetailSheet(
        recording: recording,
        onReRecord: () {
          if (_titleListener != null) _lectureTitleController.removeListener(_titleListener!);
          _reRecordingTarget = recording;
          _lectureTitleController.text = recording['title'] as String? ?? '';
          if (_titleListener != null) _lectureTitleController.addListener(_titleListener!);
          setState(() => _isTitleFilled = _lectureTitleController.text.trim().isNotEmpty);
        },
        onTranscriptSaved: (id, transcript) async {
          final storage = getIt<HiveStorageService>();
          await storage.updateVoiceRecording(id, {'transcriptText': transcript});
          await _loadRecordings();
          // Push the edited transcript to the RAG knowledge base so students get
          // answers based on the corrected content, not the original version.
          final currentUser = storage.getCurrentUser();
          if (currentUser != null && transcript.trim().isNotEmpty) {
            final rec = storage
                .getVoiceRecordings()
                .firstWhere((r) => r['id'] == id, orElse: () => {});
            _voiceRepository.ingestTextToRag(
              text: transcript,
              lectureTitle: rec['title'] as String? ?? 'Lecture',
              teacherId: currentUser.id,
              institutionId: currentUser.institutionId ?? '',
              recordingId: id,
            ).ignore();
          }
        },
        onRename: (id, newTitle) async {
          await getIt<HiveStorageService>()
              .updateVoiceRecording(id, {'title': newTitle});
          await _loadRecordings();
        },
      ),
    );
  }

  // Determine current active step (1-based)
  int get _currentStep {
    if (_transcriptionResult != null) return 4;
    if (_audioFilePath != null && !_isRecording) return 3;
    if (_isTitleFilled) return 2;
    return 1;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 20),
            _buildSavedRecordingsSection(),
            const SizedBox(height: 16),
            Divider(color: AppColors.textTertiary.withValues(alpha: 0.2)),
            const SizedBox(height: 8),
            Row(
              children: [
                const Text(
                  'New Recording',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                if (_transcriptionResult != null || _audioFilePath != null)
                  TextButton.icon(
                    onPressed: _reset,
                    icon: const Icon(Icons.refresh, size: 15),
                    label: const Text('Reset'),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            // Re-record mode banner — shown when the user is replacing an
            // existing recording's audio without changing its name or ID.
            if (_reRecordingTarget != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.refresh, color: Colors.amber, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Re-recording: "${_reRecordingTarget!['title']}"',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.amber,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        if (_titleListener != null) _lectureTitleController.removeListener(_titleListener!);
                        _lectureTitleController.clear();
                        if (_titleListener != null) _lectureTitleController.addListener(_titleListener!);
                        setState(() { _reRecordingTarget = null; _isTitleFilled = false; });
                      },
                      child: const Icon(Icons.close, size: 16, color: Colors.amber),
                    ),
                  ],
                ),
              ),
            _buildStepIndicator(),
            const SizedBox(height: 24),
            _buildStep1Details(),
            const SizedBox(height: 16),
            _buildStep2Recording(),
            if (_audioFilePath != null && !_isRecording && _transcriptionResult == null) ...[
              const SizedBox(height: 16),
              _buildStep3Transcribe(),
            ],
            if (_transcriptionResult != null) ...[
              const SizedBox(height: 16),
              _buildStep4Preview(),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.1),
            AppColors.primary.withValues(alpha: 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
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
            child: const Icon(
              Icons.mic_outlined,
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
                  'Lecture Recorder',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Record your lecture and get AI-powered transcription',
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

  Widget _buildStepIndicator() {
    final steps = [
      (icon: Icons.edit_note, label: 'Details'),
      (icon: Icons.mic, label: 'Record'),
      (icon: Icons.auto_awesome, label: 'Transcribe'),
      (icon: Icons.article_outlined, label: 'Preview'),
    ];

    return Row(
      children: List.generate(steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          final stepIndex = i ~/ 2;
          final isDone = _currentStep > stepIndex + 1;
          return Expanded(
            child: Container(
              height: 2,
              color: isDone
                  ? AppColors.primary
                  : AppColors.textTertiary.withValues(alpha: 0.25),
            ),
          );
        }
        final index = i ~/ 2;
        final step = steps[index];
        final stepNum = index + 1;
        final isDone = _currentStep > stepNum;
        final isActive = _currentStep == stepNum;

        return Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDone
                    ? AppColors.primary
                    : isActive
                        ? AppColors.primary.withValues(alpha: 0.15)
                        : AppColors.surface,
                border: Border.all(
                  color: isDone || isActive
                      ? AppColors.primary
                      : AppColors.textTertiary.withValues(alpha: 0.3),
                  width: 1.5,
                ),
              ),
              child: Icon(
                isDone ? Icons.check : step.icon,
                size: 18,
                color: isDone
                    ? Colors.white
                    : isActive
                        ? AppColors.primary
                        : AppColors.textTertiary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              step.label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                color: isDone || isActive
                    ? AppColors.primary
                    : AppColors.textTertiary,
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildStep1Details() {
    final isLocked = _isRecording || _isProcessing;
    return _buildStepCard(
      stepNumber: 1,
      isCompleted: _currentStep > 1,
      isActive: _currentStep == 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Lecture Details',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              if (_isTitleFilled && !isLocked)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle, color: Colors.green, size: 14),
                      SizedBox(width: 4),
                      Text(
                        'Ready',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.green,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _lectureTitleController,
            enabled: !isLocked,
            decoration: InputDecoration(
              labelText: 'Lecture Title *',
              hintText: 'e.g. Introduction to Machine Learning',
              prefixIcon: const Icon(Icons.title),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: _isTitleFilled
                      ? Colors.green.withValues(alpha: 0.6)
                      : AppColors.textTertiary.withValues(alpha: 0.4),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _courseIdController,
            enabled: !isLocked,
            decoration: InputDecoration(
              labelText: 'Course ID (Optional)',
              hintText: 'e.g. CS-101',
              prefixIcon: const Icon(Icons.school_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2Recording() {
    final isLocked = !_isTitleFilled || _isProcessing;

    return _buildStepCard(
      stepNumber: 2,
      isCompleted: _audioFilePath != null && !_isRecording,
      isActive: _currentStep == 2,
      isLocked: _currentStep < 2,
      child: Column(
        children: [
          Row(
            children: [
              const Text(
                'Record Audio',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              if (_audioFilePath != null && !_isRecording)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        _formatDuration(_recordingDuration),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.green,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 24),

          if (!_isTitleFilled) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.textTertiary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, color: AppColors.textTertiary, size: 18),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      'Enter a lecture title first to unlock recording',
                      style: TextStyle(fontSize: 13, color: AppColors.textTertiary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: Opacity(
                opacity: 0.3,
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.textTertiary.withValues(alpha: 0.2),
                    border: Border.all(color: AppColors.textTertiary, width: 2),
                  ),
                  child: const Icon(Icons.mic_off, size: 40, color: AppColors.textTertiary),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Center(
              child: Text(
                'Recording disabled',
                style: TextStyle(fontSize: 13, color: AppColors.textTertiary),
              ),
            ),
          ] else if (_audioFilePath != null && !_isRecording) ...[
            // Row 1: Avatar + title + duration
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: Colors.green.withValues(alpha: 0.12),
                  child: const Icon(Icons.audiotrack, color: Colors.green, size: 24),
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Audio recording ready',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Duration: ${_formatDuration(_recordingDuration)}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Row 2: Full-width audio player
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.textTertiary.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () async {
                      if (_isPlayingAudio) {
                        await _videoPlayerController?.pause();
                      } else {
                        // If at end, seek back to start first
                        if (_audioPlaybackDuration.inMilliseconds > 0 &&
                            _audioPlaybackPosition.inMilliseconds >=
                                _audioPlaybackDuration.inMilliseconds) {
                          await _videoPlayerController?.seekTo(Duration.zero);
                        }
                        await _videoPlayerController?.play();
                      }
                    },
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary,
                      ),
                      child: Icon(
                        _isPlayingAudio ? Icons.pause : Icons.play_arrow,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      children: [
                        SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            trackHeight: 3,
                            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                            overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                          ),
                          child: Slider(
                            value: _audioPlaybackDuration.inMilliseconds > 0
                                ? (_audioPlaybackPosition.inMilliseconds /
                                        _audioPlaybackDuration.inMilliseconds)
                                    .clamp(0.0, 1.0)
                                : 0.0,
                            onChanged: (value) async {
                              final pos = Duration(
                                milliseconds:
                                    (value * _audioPlaybackDuration.inMilliseconds).toInt(),
                              );
                              await _videoPlayerController?.seekTo(pos);
                            },
                            activeColor: AppColors.primary,
                            inactiveColor: AppColors.textTertiary.withValues(alpha: 0.3),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _formatDurationObj(_audioPlaybackPosition),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textTertiary,
                                ),
                              ),
                              Text(
                                _formatDurationObj(_audioPlaybackDuration),
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textTertiary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Row 3: 80% width centered re-record button
            Center(
              child: FractionallySizedBox(
                widthFactor: 0.8,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    _videoPlayerController?.removeListener(_onVideoPlayerStateChanged);
                    await _videoPlayerController?.pause();
                    await _videoPlayerController?.dispose();
                    if (!mounted) return;
                    setState(() {
                      _videoPlayerController = null;
                      _isPlayingAudio = false;
                      _audioPlaybackPosition = Duration.zero;
                      _audioPlaybackDuration = Duration.zero;
                      _audioFilePath = null;
                      _recordingDuration = 0;
                    });
                  },
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text(
                    'Re-record Audio',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(color: AppColors.primary.withValues(alpha: 0.5)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),
          ] else if (_isRecording) ...[
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: Colors.red.withValues(alpha: 0.5)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, _) => Transform.scale(
                        scale: _pulseAnimation.value,
                        child: Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _formatDuration(_recordingDuration),
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                        fontFamily: 'monospace',
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'REC',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _stopRecording,
                icon: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                label: const Text(
                  'Stop Recording',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 3,
                ),
              ),
            ),
          ] else ...[
            Center(
              child: GestureDetector(
                onTap: isLocked ? null : _startRecording,
                child: Column(
                  children: [
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppColors.primary,
                            AppColors.primary.withValues(alpha: 0.8),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.35),
                            blurRadius: 20,
                            spreadRadius: 2,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.mic, size: 52, color: Colors.white),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Tap to start recording',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStep3Transcribe() {
    return _buildStepCard(
      stepNumber: 3,
      isCompleted: _transcriptionResult != null,
      isActive: _currentStep == 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Transcribe',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Send the recording to AI for transcription and formatting',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isProcessing ? null : _transcribeAudio,
              icon: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(
                _isProcessing ? 'Processing...' : 'Transcribe & Format with AI',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep4Preview() {
    final transcription = _transcriptionResult!['transcription'];
    final wordCount = transcription?['word_count'] ?? 0;
    final chunksAdded = _transcriptionResult!['rag_system']?['chunks_added'] ?? 0;

    return _buildStepCard(
      stepNumber: 4,
      isCompleted: true,
      isActive: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: title + copy icon (top-right)
          Row(
            children: [
              const Text(
                'Transcript Preview',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.copy_outlined, size: 20, color: AppColors.primary),
                tooltip: 'Copy transcript',
                onPressed: _copyToClipboard,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildStatChip(Icons.text_fields, '$wordCount words', Colors.blue),
              const SizedBox(width: 10),
              _buildStatChip(Icons.library_books, '$chunksAdded chunks added', Colors.green),
            ],
          ),
          const SizedBox(height: 14),
          // Editable transcript field
          Container(
            constraints: const BoxConstraints(minHeight: 150),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.textTertiary.withValues(alpha: 0.2),
              ),
            ),
            child: TextField(
              controller: _previewController,
              maxLines: null,
              style: const TextStyle(
                fontSize: 14,
                height: 1.7,
                color: AppColors.textPrimary,
              ),
              decoration: const InputDecoration(
                contentPadding: EdgeInsets.all(16),
                border: InputBorder.none,
                hintText: 'Transcript will appear here. You can edit before saving.',
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Save button — 80 % width, centred
          Center(
            child: FractionallySizedBox(
              widthFactor: 0.8,
              child: ElevatedButton.icon(
                onPressed: _isSaving ? null : _saveRecording,
                icon: _isSaving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.save_outlined, size: 20),
                label: Text(
                  _isSaving ? 'Saving…' : 'Save Recording',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard({
    required int stepNumber,
    required bool isCompleted,
    required bool isActive,
    bool isLocked = false,
    required Widget child,
  }) {
    Color borderColor;
    if (isCompleted) {
      borderColor = Colors.green.withValues(alpha: 0.4);
    } else if (isActive) {
      borderColor = AppColors.primary.withValues(alpha: 0.35);
    } else {
      borderColor = AppColors.textTertiary.withValues(alpha: 0.15);
    }

    return Opacity(
      opacity: isLocked ? 0.55 : 1.0,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: 1.5),
          boxShadow: [
            if (isActive && !isLocked)
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.06),
                blurRadius: 12,
                offset: const Offset(0, 4),
              )
            else
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: child,
      ),
    );
  }

  // ─── Saved Recordings Section ──────────────────────────────────────────────

  Widget _buildSavedRecordingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Saved Recordings',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(width: 8),
            if (!_isLoadingRecordings && _savedRecordings.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_savedRecordings.length}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_isLoadingRecordings)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          )
        else if (_savedRecordings.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.textTertiary.withValues(alpha: 0.15),
                width: 1.5,
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.mic_none_outlined,
                  size: 40,
                  color: AppColors.textTertiary.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 8),
                const Text(
                  'No recordings yet',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Record a lecture below and save it to see it here',
                  style: TextStyle(fontSize: 12, color: AppColors.textTertiary),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _savedRecordings.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) => _buildRecordingCard(_savedRecordings[i]),
          ),
      ],
    );
  }

  Widget _buildRecordingCard(Map<String, dynamic> recording) {
    final createdAt = recording['createdAt'] as String?;
    final date = createdAt != null ? DateTime.tryParse(createdAt) : null;
    final dateStr = date != null
        ? '${date.day}/${date.month}/${date.year}'
        : 'Unknown';
    final durSec = recording['durationSeconds'] as int? ?? 0;
    final durStr =
        '${durSec ~/ 60}:${(durSec % 60).toString().padLeft(2, '0')}';
    // localExists defaults to true so legacy records (before this field was
    // added) are shown as normal until _verifyLocalFiles runs.
    final localExists = recording['localExists'] as bool? ?? true;

    return GestureDetector(
      onTap: () => _openRecordingDetail(recording),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: AppColors.textTertiary.withValues(alpha: 0.2),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: localExists
                    ? AppColors.primary.withValues(alpha: 0.1)
                    : Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                localExists ? Icons.audiotrack : Icons.cloud_outlined,
                color: localExists ? AppColors.primary : Colors.orange,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recording['title'] as String? ?? 'Unnamed Recording',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 11, color: AppColors.textTertiary),
                      const SizedBox(width: 3),
                      Text(durStr, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                      const SizedBox(width: 10),
                      const Icon(Icons.calendar_today, size: 11, color: AppColors.textTertiary),
                      const SizedBox(width: 3),
                      Text(dateStr, style: const TextStyle(fontSize: 11, color: AppColors.textTertiary)),
                    ],
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.edit_outlined, size: 18),
              color: AppColors.primary,
              tooltip: 'Rename',
              onPressed: () => _renameRecording(recording),
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
              padding: EdgeInsets.zero,
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 20),
              color: Colors.red.shade400,
              tooltip: 'Delete recording',
              onPressed: () => _deleteRecording(recording),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Recording Detail Bottom Sheet ────────────────────────────────────────────

class _RecordingDetailSheet extends StatefulWidget {
  final Map<String, dynamic> recording;
  final VoidCallback onReRecord;
  final Future<void> Function(String id, String transcript) onTranscriptSaved;
  final Future<void> Function(String id, String newTitle) onRename;

  const _RecordingDetailSheet({
    required this.recording,
    required this.onReRecord,
    required this.onTranscriptSaved,
    required this.onRename,
  });

  @override
  State<_RecordingDetailSheet> createState() => _RecordingDetailSheetState();
}

class _RecordingDetailSheetState extends State<_RecordingDetailSheet> {
  VideoPlayerController? _controller;
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _audioDuration = Duration.zero;
  late TextEditingController _transcriptCtrl;
  bool _audioReady = false;
  bool _isSavingTranscript = false;
  late String _currentTitle;

  void _onVideoStateChanged() {
    if (!mounted) return;
    final ctrl = _controller;
    if (ctrl == null) return;
    final v = ctrl.value;
    setState(() {
      _isPlaying = v.isPlaying;
      _position = v.position;
      _audioDuration = v.duration;
      if (!v.isPlaying &&
          v.duration.inMilliseconds > 0 &&
          v.position.inMilliseconds >= v.duration.inMilliseconds) {
        _position = Duration.zero;
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _currentTitle = widget.recording['title'] as String? ?? 'Recording';
    _transcriptCtrl = TextEditingController(
      text: widget.recording['transcriptText'] as String? ?? '',
    );
    _initAudio();
  }

  @override
  void dispose() {
    _controller?.removeListener(_onVideoStateChanged);
    _controller?.dispose();
    _transcriptCtrl.dispose();
    super.dispose();
  }

  Future<void> _initAudio() async {
    final path = widget.recording['localPath'] as String?;
    if (path == null) return;
    final file = File(path);
    if (!await file.exists()) return;
    if (!mounted) return;

    _controller = VideoPlayerController.file(file);
    await _controller!.initialize();
    if (!mounted) {
      _controller?.dispose();
      _controller = null;
      return;
    }
    _controller!.addListener(_onVideoStateChanged);
    setState(() => _audioReady = true);
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 4),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textTertiary.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
            child: Row(
              children: [
                const Icon(Icons.audiotrack, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _currentTitle,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                // Rename button in the sheet header
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 17, color: AppColors.primary),
                  tooltip: 'Rename',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  onPressed: () async {
                    String? newTitle;
                    final ctrl = TextEditingController(text: _currentTitle);
                    await showDialog<void>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        title: const Text('Rename Recording'),
                        content: TextField(
                          controller: ctrl,
                          autofocus: true,
                          textCapitalization: TextCapitalization.sentences,
                          decoration: InputDecoration(
                            labelText: 'New Name',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                          ElevatedButton(
                            onPressed: () {
                              if (ctrl.text.trim().isNotEmpty) {
                                newTitle = ctrl.text.trim();
                                Navigator.pop(ctx);
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Rename'),
                          ),
                        ],
                      ),
                    );
                    if (newTitle == null || !mounted) return;
                    await widget.onRename(widget.recording['id'] as String, newTitle!);
                    if (mounted) setState(() => _currentTitle = newTitle!);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: const Text('Renamed successfully'),
                        backgroundColor: AppColors.primary,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        margin: const EdgeInsets.all(16),
                        duration: const Duration(seconds: 2),
                      ));
                    }
                  },
                ),
                TextButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    widget.onReRecord();
                  },
                  icon: const Icon(Icons.refresh, size: 15),
                  label: const Text('Re-record', style: TextStyle(fontSize: 13)),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                  color: AppColors.textSecondary,
                ),
              ],
            ),
          ),
          Divider(
            color: AppColors.textTertiary.withValues(alpha: 0.2),
            height: 1,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Audio player
                  if (_audioReady &&
                      _controller != null &&
                      _controller!.value.isInitialized)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.textTertiary.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Row(
                        children: [
                          GestureDetector(
                            onTap: () async {
                              if (_isPlaying) {
                                await _controller?.pause();
                              } else {
                                if (_audioDuration.inMilliseconds > 0 &&
                                    _position.inMilliseconds >=
                                        _audioDuration.inMilliseconds) {
                                  await _controller?.seekTo(Duration.zero);
                                }
                                await _controller?.play();
                              }
                            },
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.primary,
                              ),
                              child: Icon(
                                _isPlaying ? Icons.pause : Icons.play_arrow,
                                color: Colors.white,
                                size: 22,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              children: [
                                SliderTheme(
                                  data: SliderTheme.of(context).copyWith(
                                    trackHeight: 3,
                                    thumbShape: const RoundSliderThumbShape(
                                        enabledThumbRadius: 6),
                                    overlayShape:
                                        const RoundSliderOverlayShape(
                                            overlayRadius: 12),
                                  ),
                                  child: Slider(
                                    value: _audioDuration.inMilliseconds > 0
                                        ? (_position.inMilliseconds /
                                                _audioDuration.inMilliseconds)
                                            .clamp(0.0, 1.0)
                                        : 0.0,
                                    onChanged: (v) async {
                                      await _controller?.seekTo(Duration(
                                        milliseconds: (v *
                                                _audioDuration.inMilliseconds)
                                            .toInt(),
                                      ));
                                    },
                                    activeColor: AppColors.primary,
                                    inactiveColor: AppColors.textTertiary
                                        .withValues(alpha: 0.3),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 4),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(_fmt(_position),
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.textTertiary)),
                                      Text(_fmt(_audioDuration),
                                          style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.textTertiary)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.07),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: Colors.orange.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.warning_amber_rounded,
                              color: Colors.orange, size: 18),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Audio file not found on this device',
                              style: TextStyle(
                                  fontSize: 13, color: Colors.orange),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),
                  // Transcript
                  Row(
                    children: [
                      const Text(
                        'Transcript',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.copy,
                            size: 18, color: AppColors.primary),
                        tooltip: 'Copy transcript',
                        onPressed: () {
                          Clipboard.setData(
                              ClipboardData(text: _transcriptCtrl.text));
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: const Text('Copied to clipboard'),
                            backgroundColor: AppColors.primary,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                            margin: const EdgeInsets.all(16),
                            duration: const Duration(seconds: 1),
                          ));
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    constraints: const BoxConstraints(minHeight: 120),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.textTertiary.withValues(alpha: 0.2),
                      ),
                    ),
                    child: TextField(
                      controller: _transcriptCtrl,
                      maxLines: null,
                      style: const TextStyle(
                        fontSize: 14,
                        height: 1.7,
                        color: AppColors.textPrimary,
                      ),
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.all(12),
                        border: InputBorder.none,
                        hintText: 'No transcript available',
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Center(
                    child: FractionallySizedBox(
                      widthFactor: 0.75,
                      child: ElevatedButton.icon(
                        onPressed: _isSavingTranscript
                            ? null
                            : () async {
                                setState(() => _isSavingTranscript = true);
                                try {
                                  await widget.onTranscriptSaved(
                                    widget.recording['id'] as String,
                                    _transcriptCtrl.text,
                                  );
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                      content: const Row(children: [
                                        Icon(Icons.check_circle, color: Colors.white, size: 16),
                                        SizedBox(width: 8),
                                        Text('Transcript saved & synced to AI'),
                                      ]),
                                      backgroundColor: Colors.green.shade600,
                                      behavior: SnackBarBehavior.floating,
                                      shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(8)),
                                      margin: const EdgeInsets.all(16),
                                      duration: const Duration(seconds: 2),
                                    ));
                                  }
                                } finally {
                                  if (mounted) setState(() => _isSavingTranscript = false);
                                }
                              },
                        icon: _isSavingTranscript
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ))
                            : const Icon(Icons.save, size: 16),
                        label: Text(_isSavingTranscript ? 'Saving...' : 'Save Edits'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
