import 'package:flutter/material.dart';
import '../../../../../../core/constants/app_colors.dart';

class VoiceToTextTab extends StatefulWidget {
  const VoiceToTextTab({super.key});

  @override
  State<VoiceToTextTab> createState() => _VoiceToTextTabState();
}

class _VoiceToTextTabState extends State<VoiceToTextTab> with SingleTickerProviderStateMixin {
  bool _isRecording = false;
  final TextEditingController _transcriptController = TextEditingController();
  final List<Map<String, dynamic>> _savedNotes = [];
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  String _realTimeText = '';
  final List<String> _realTimeChunks = [
    'Machine learning is ',
    'a subset of artificial intelligence ',
    'that focuses on the development of ',
    'algorithms and statistical models ',
    'that enable computers to learn ',
    'from and make predictions or ',
    'decisions based on data. ',
    'Unlike traditional programming, ',
    'where explicit instructions are coded, ',
    'machine learning systems improve ',
    'their performance over time ',
    'as they are exposed to more data.',
  ];
  int _currentChunkIndex = 0;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
    
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    
    _loadSavedNotes();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _transcriptController.dispose();
    super.dispose();
  }

  Future<void> _loadSavedNotes() async {
    // Mock saved notes data
    setState(() {
      _savedNotes.addAll([
        {
          'title': 'Lecture - Machine Learning Intro',
          'date': DateTime.now().subtract(const Duration(days: 1)),
          'text': 'Sample transcription about machine learning basics...',
        },
        {
          'title': 'Discussion - Big Data Concepts',
          'date': DateTime.now().subtract(const Duration(days: 3)),
          'text': 'Sample transcription about big data and analytics...',
        },
      ]);
    });
  }

  void _toggleRecording() {
    setState(() {
      _isRecording = !_isRecording;
      if (_isRecording) {
        // Start real-time transcription simulation
        _currentChunkIndex = 0;
        _realTimeText = '';
        _simulateRealTimeTranscription();
      }
    });
  }

  Future<void> _simulateRealTimeTranscription() async {
    while (_isRecording && _currentChunkIndex < _realTimeChunks.length && mounted) {
      await Future.delayed(const Duration(milliseconds: 800));
      if (_isRecording && mounted) {
        setState(() {
          _realTimeText += _realTimeChunks[_currentChunkIndex];
          _transcriptController.text = _realTimeText;
          _transcriptController.selection = TextSelection.fromPosition(
            TextPosition(offset: _transcriptController.text.length),
          );
          _currentChunkIndex++;
        });
      }
    }
  }

  void _saveTranscription() {
    if (_transcriptController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No text to save')),
      );
      return;
    }

    final titleController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Save Transcription'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(
            hintText: 'Enter a title for this note',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _savedNotes.insert(0, {
                  'title': titleController.text.isEmpty 
                      ? 'Untitled Note' 
                      : titleController.text,
                  'date': DateTime.now(),
                  'text': _transcriptController.text,
                });
                _transcriptController.clear();
                _realTimeText = '';
                _currentChunkIndex = 0;
                _isRecording = false;
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Transcription saved successfully'),
                  backgroundColor: AppColors.primary,
                ),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            const Text(
              'Voice to Text',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Speak naturally and your words will appear below',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 48),
            _buildRecordingButton(),
            const SizedBox(height: 32),
            _buildTranscriptField(),
            if (_transcriptController.text.isNotEmpty) ...[
              const SizedBox(height: 24),
              _buildSaveButton(),
            ],
            if (_savedNotes.isNotEmpty) ...[
              const SizedBox(height: 48),
              _buildSavedNotesList(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRecordingButton() {
    return Column(
      children: [
        GestureDetector(
          onTap: _toggleRecording,
          child: AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: _isRecording
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 30 * _scaleAnimation.value,
                            spreadRadius: 10 * _scaleAnimation.value,
                          ),
                        ]
                      : [],
                ),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: _isRecording
                        ? RadialGradient(
                            colors: [
                              AppColors.primary,
                              AppColors.primary.withValues(alpha: 0.8),
                            ],
                          )
                        : null,
                    color: _isRecording ? null : AppColors.primary.withValues(alpha: 0.2),
                  ),
                  child: Icon(
                    _isRecording ? Icons.stop : Icons.mic,
                    size: 50,
                    color: _isRecording ? Colors.white : AppColors.primary,
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Text(
          _isRecording ? 'Tap to stop recording' : 'Tap to start recording',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: _isRecording ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
        if (_isRecording) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Recording in progress...',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildTranscriptField() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 200),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _transcriptController.text.isNotEmpty
              ? AppColors.primary.withValues(alpha: 0.3)
              : AppColors.textTertiary.withValues(alpha: 0.2),
        ),
      ),
      child: TextField(
        controller: _transcriptController,
        maxLines: null,
        onTap: () {
          // Pause recording when user taps to edit
          if (_isRecording) {
            setState(() => _isRecording = false);
          }
        },
        style: const TextStyle(
          fontSize: 15,
          color: AppColors.textPrimary,
          height: 1.6,
        ),
        decoration: InputDecoration(
          hintText: 'Your transcript will appear here...\nTap to edit manually (recording will pause)',
          hintStyle: TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary.withValues(alpha: 0.6),
            height: 1.5,
          ),
          border: InputBorder.none,
          isDense: true,
        ),
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: 300,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: _saveTranscription,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        icon: const Icon(Icons.save, size: 22),
        label: const Text(
          'Save Transcription',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildSavedNotesList() {
    return SizedBox(
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Saved Transcriptions',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_savedNotes.length}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _savedNotes.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final note = _savedNotes[index];
              return Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.textTertiary.withValues(alpha: 0.2),
                  ),
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  onTap: () => _showTranscriptModal(note),
                  leading: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.description,
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                  title: Text(
                    note['title'],
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      _formatDate(note['date']),
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                  trailing: const Icon(
                    Icons.chevron_right,
                    color: AppColors.textTertiary,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showTranscriptModal(Map<String, dynamic> note) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textTertiary.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Container(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: AppColors.textTertiary.withValues(alpha: 0.2),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.description,
                        color: AppColors.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            note['title'],
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatDate(note['date']),
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                      color: AppColors.textSecondary,
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: controller,
                  padding: const EdgeInsets.all(24),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppColors.textTertiary.withValues(alpha: 0.2),
                      ),
                    ),
                    child: SelectableText(
                      note['text'],
                      style: const TextStyle(
                        fontSize: 15,
                        color: AppColors.textPrimary,
                        height: 1.6,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return 'Just now';
      }
      return '${difference.inHours}h ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
