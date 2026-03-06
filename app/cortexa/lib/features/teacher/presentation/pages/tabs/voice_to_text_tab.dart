import 'dart:io';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_player/video_player.dart';
import '../../../../../../core/constants/app_colors.dart';
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
  String _formattedText = '';

  // Audio playback
  VideoPlayerController? _videoPlayerController;
  bool _isPlayingAudio = false;
  Duration _audioPlaybackPosition = Duration.zero;
  Duration _audioPlaybackDuration = Duration.zero;
  
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

    _lectureTitleController.addListener(() {
      final filled = _lectureTitleController.text.trim().isNotEmpty;
      if (filled != _isTitleFilled) {
        setState(() => _isTitleFilled = filled);
      }
    });
  }

  @override
  void dispose() {
    _audioRecorder.dispose();
    _videoPlayerController?.dispose();
    _pulseController.dispose();
    _lectureTitleController.dispose();
    _courseIdController.dispose();
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

  Future<void> _initAudioPlayer() async {
    await _videoPlayerController?.pause();
    await _videoPlayerController?.dispose();
    _videoPlayerController = null;

    if (_audioFilePath == null) return;

    _videoPlayerController = VideoPlayerController.file(File(_audioFilePath!));
    await _videoPlayerController!.initialize();

    _videoPlayerController!.addListener(() {
      if (!mounted) return;
      final val = _videoPlayerController!.value;
      setState(() {
        _isPlayingAudio = val.isPlaying;
        _audioPlaybackPosition = val.position;
        _audioPlaybackDuration = val.duration;
        // Auto-reset to start when playback completes
        if (!val.isPlaying &&
            val.duration.inMilliseconds > 0 &&
            val.position.inMilliseconds >= val.duration.inMilliseconds) {
          _audioPlaybackPosition = Duration.zero;
        }
      });
    });
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
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Row(
                children: [
                  Icon(Icons.mic, color: Colors.white, size: 20),
                  SizedBox(width: 12),
                  Text('Recording started!', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                ],
              ),
              backgroundColor: AppColors.primary,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              margin: const EdgeInsets.all(16),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Row(
                children: [
                  Icon(Icons.mic_off, color: Colors.white, size: 20),
                  SizedBox(width: 12),
                  Expanded(child: Text('Microphone permission denied', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
                ],
              ),
              backgroundColor: Colors.red.shade600,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              margin: const EdgeInsets.all(16),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text('Failed to start recording: ${e.toString()}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
              ],
            ),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }
  }

  Future<void> _stopRecording() async {
    try {
      await _audioRecorder.stop();
      setState(() {
        _isRecording = false;
      });
      await _initAudioPlayer();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                SizedBox(width: 12),
                Text('Recording stopped!', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(16),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text('Failed to stop recording: ${e.toString()}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
              ],
            ),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    }
  }

  Future<void> _transcribeAudio() async {
    if (_audioFilePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
              SizedBox(width: 12),
              Text('No audio recording found', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
          backgroundColor: Colors.orange.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          margin: const EdgeInsets.all(16),
        ),
      );
      return;
    }

    if (_lectureTitleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
              SizedBox(width: 12),
              Text('Please enter a lecture title', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
          backgroundColor: Colors.orange.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          margin: const EdgeInsets.all(16),
        ),
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

      setState(() {
        _transcriptionResult = result;
        _formattedText = result['transcription']?['formatted_text'] ?? '';
        _isProcessing = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                SizedBox(width: 12),
                Text('Lecture transcribed successfully!', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Transcription failed: ${e.toString().replaceAll('Exception: ', '')}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(16),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  void _reset() {
    _videoPlayerController?.pause();
    _videoPlayerController?.dispose();
    setState(() {
      _videoPlayerController = null;
      _isPlayingAudio = false;
      _audioPlaybackPosition = Duration.zero;
      _audioPlaybackDuration = Duration.zero;
      _audioFilePath = null;
      _transcriptionResult = null;
      _formattedText = '';
      _recordingDuration = 0;
      _isTitleFilled = false;
      _lectureTitleController.clear();
      _courseIdController.clear();
    });
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
                    await _videoPlayerController?.pause();
                    await _videoPlayerController?.dispose();
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
              TextButton.icon(
                onPressed: _reset,
                icon: const Icon(Icons.add, size: 16),
                label: const Text('New Recording'),
                style: TextButton.styleFrom(foregroundColor: AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildStatChip(Icons.text_fields, '$wordCount words', Colors.blue),
              const SizedBox(width: 10),
              _buildStatChip(Icons.library_books, '$chunksAdded chunks added', Colors.green),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.textTertiary.withValues(alpha: 0.2),
              ),
            ),
            child: SelectableText(
              _formattedText.isNotEmpty ? _formattedText : 'No formatted text available.',
              style: const TextStyle(
                fontSize: 14,
                height: 1.7,
                color: AppColors.textPrimary,
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
}
