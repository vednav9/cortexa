import 'package:flutter/material.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../../../../core/di/service_locator.dart';

class AnnouncementsTab extends StatefulWidget {
  final bool isReadOnly;
  final String? audience; // 'students', 'teachers', or null for admin (all)
  
  const AnnouncementsTab({
    super.key,
    this.isReadOnly = false,
    this.audience,
  });

  @override
  State<AnnouncementsTab> createState() => _AnnouncementsTabState();
}

class _AnnouncementsTabState extends State<AnnouncementsTab> {
  final _storage = getIt<HiveStorageService>();
  List<Map<String, dynamic>> _announcements = [];
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String _selectedType = 'General';
  String _selectedPriority = 'Normal';
  bool _isPinned = false;

  final List<String> _types = ['General', 'Academic', 'Event', 'Exam', 'Urgent'];
  final List<String> _priorities = ['Low', 'Normal', 'High', 'Urgent'];

  @override
  void initState() {
    super.initState();
    _loadAnnouncements();
  }

  void _loadAnnouncements() {
    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;
      
      if (institutionId != null) {
        setState(() {
          _announcements = _storage.getAllAnnouncements(
            institutionId: institutionId,
            audience: widget.audience,
          );
        });
      } else {
        setState(() {
          _announcements = [];
        });
      }
    } catch (e) {
      print('Error loading announcements: $e');
      setState(() {
        _announcements = [];
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  void _showCreateAnnouncementDialog() {
    _titleController.clear();
    _contentController.clear();
    setState(() {
      _selectedType = 'General';
      _selectedPriority = 'Normal';
      _isPinned = false;
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.92,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(28),
              topRight: Radius.circular(28),
            ),
          ),
          child: Column(
            children: [
              // Drag handle
              Container(
                margin: const EdgeInsets.symmetric(vertical: 14),
                width: 45,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.borderDark.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 8, 28, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Create Announcement',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.audience == 'students' 
                        ? 'Share important information with your students'
                        : 'Share important information with your institution',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, thickness: 1),

              Expanded(
                child: SingleChildScrollView(
                  physics: const ClampingScrollPhysics(),
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(28, 24, 28, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      TextField(
                        controller: _titleController,
                        enableInteractiveSelection: true,
                        style: const TextStyle(fontSize: 15),
                        decoration: InputDecoration(
                          labelText: 'Title *',
                          labelStyle: const TextStyle(fontSize: 14),
                          hintText: 'Enter announcement title',
                          hintStyle: TextStyle(
                              fontSize: 14,
                              color: AppColors.textTertiary.withValues(alpha: 0.5)),
                          filled: true,
                          fillColor: AppColors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                                color: AppColors.borderDark.withValues(alpha: 0.2)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                                color: AppColors.primary, width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 16),
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Content
                      TextField(
                        controller: _contentController,
                        enableInteractiveSelection: true,
                        maxLines: 6,
                        style: const TextStyle(fontSize: 15),
                        decoration: InputDecoration(
                          labelText: 'Content *',
                          labelStyle: const TextStyle(fontSize: 14),
                          hintText: 'Write your announcement...',
                          hintStyle: TextStyle(
                              fontSize: 14,
                              color: AppColors.textTertiary.withValues(alpha: 0.5)),
                          alignLabelWithHint: true,
                          filled: true,
                          fillColor: AppColors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                                color: AppColors.borderDark.withValues(alpha: 0.2)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                                color: AppColors.primary, width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 16),
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Type and Priority Row
                      Row(
                        children: [
                          Expanded(
                            child: StatefulBuilder(
                              builder: (context, setDialogState) =>
                                  DropdownButtonFormField<String>(
                                initialValue: _selectedType,
                                style: const TextStyle(
                                    fontSize: 15, color: AppColors.textPrimary),
                                decoration: InputDecoration(
                                  labelText: 'Type',
                                  labelStyle: const TextStyle(fontSize: 14),
                                  filled: true,
                                  fillColor: AppColors.background,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                        color: AppColors.borderDark
                                            .withValues(alpha: 0.2)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                        color: AppColors.primary, width: 2),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 16),
                                ),
                                items: _types.map((type) {
                                  return DropdownMenuItem(
                                    value: type,
                                    child: Text(type),
                                  );
                                }).toList(),
                                onChanged: (value) {
                                  setDialogState(() => _selectedType = value!);
                                  setState(() => _selectedType = value!);
                                },
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: StatefulBuilder(
                              builder: (context, setDialogState) =>
                                  DropdownButtonFormField<String>(
                                initialValue: _selectedPriority,
                                style: const TextStyle(
                                    fontSize: 15, color: AppColors.textPrimary),
                                decoration: InputDecoration(
                                  labelText: 'Priority',
                                  labelStyle: const TextStyle(fontSize: 14),
                                  filled: true,
                                  fillColor: AppColors.background,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                        color: AppColors.borderDark
                                            .withValues(alpha: 0.2)),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                        color: AppColors.primary, width: 2),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 16),
                                ),
                                items: _priorities.map((priority) {
                                  return DropdownMenuItem(
                                    value: priority,
                                    child: Text(priority),
                                  );
                                }).toList(),
                                onChanged: (value) {
                                  setDialogState(() => _selectedPriority = value!);
                                  setState(() => _selectedPriority = value!);
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Pin to top checkbox
                      StatefulBuilder(
                        builder: (context, setDialogState) => Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.borderDark.withValues(alpha: 0.2),
                            ),
                          ),
                          child: CheckboxListTile(
                            value: _isPinned,
                            onChanged: (value) {
                              setDialogState(() => _isPinned = value ?? false);
                              setState(() => _isPinned = value ?? false);
                            },
                            title: const Text(
                              'Pin this announcement to the top',
                              style: TextStyle(fontSize: 14),
                            ),
                            controlAffinity: ListTileControlAffinity.leading,
                            activeColor: AppColors.primary,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom buttons section
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border(
                    top: BorderSide(
                      color: AppColors.borderDark.withValues(alpha: 0.2),
                      width: 1,
                    ),
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(28, 16, 28, 28),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textPrimary,
                          side: BorderSide(
                              color: AppColors.borderDark.withValues(alpha: 0.4)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: _createAnnouncement,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Create',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600),
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
    );
  }

  void _createAnnouncement() {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a title'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_contentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter content'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final currentUser = _storage.getCurrentUser();
    final institutionId = currentUser?.institutionId;
    
    if (institutionId == null) return;

    final newAnnouncement = {
      'id': 'announcement_${DateTime.now().millisecondsSinceEpoch}',
      'institution_id': institutionId,
      'title': _titleController.text.trim(),
      'content': _contentController.text.trim(),
      'type': _selectedType,
      'priority': _selectedPriority,
      'isPinned': _isPinned,
      'audience': widget.audience ?? 'all',
      'createdAt': DateTime.now().toIso8601String(),
    };

    _storage.saveAnnouncement(newAnnouncement);

    setState(() {
      if (_isPinned) {
        _announcements.insert(0, newAnnouncement);
      } else {
        // Insert after pinned announcements
        final firstUnpinnedIndex = _announcements.indexWhere((a) => a['isPinned'] != true);
        if (firstUnpinnedIndex == -1) {
          _announcements.add(newAnnouncement);
        } else {
          _announcements.insert(firstUnpinnedIndex, newAnnouncement);
        }
      }
    });

    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Announcement created successfully!'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'Academic':
        return Colors.blue;
      case 'Event':
        return Colors.purple;
      case 'Exam':
        return Colors.green;
      case 'Urgent':
        return Colors.red;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
              // Page title section with gradient background
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.success.withValues(alpha: 0.1),
                      AppColors.success.withValues(alpha: 0.05),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.success.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.campaign_outlined,
                        size: 32,
                        color: AppColors.success,
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Announcements',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Stay updated with latest news and updates',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Announcements List
              _announcements.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 60),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.campaign_outlined,
                              size: 80,
                              color: AppColors.textTertiary.withValues(alpha: 0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No announcements yet',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondary.withValues(alpha: 0.8),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Check back later for updates',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.textTertiary.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : Column(
                      children: _announcements.map((announcement) {
                        return _buildAnnouncementCard(announcement);
                      }).toList(),
                    ),
            ],
          ),
      ),
      floatingActionButton: widget.isReadOnly
          ? null
          : Padding(
              padding: const EdgeInsets.only(bottom: 30),
              child: FloatingActionButton.extended(
                onPressed: _showCreateAnnouncementDialog,
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                elevation: 4,
                icon: const Icon(Icons.add, size: 24),
                label: const Text(
                  'Create',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
    );
  }
  Widget _buildAnnouncementCard(Map<String, dynamic> announcement) {
    final createdAt = DateTime.parse(announcement['createdAt'] as String);
    final timeAgo = _formatTimeAgo(createdAt);
    final isPinned = announcement['isPinned'] as bool;
    final type = announcement['type'] as String;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: isPinned
            ? Border.all(color: AppColors.success.withValues(alpha: 0.3), width: 2)
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (isPinned)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.push_pin,
                          size: 12,
                          color: AppColors.success,
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          'Pinned',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ),
                if (isPinned) const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getTypeColor(type).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    type,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: _getTypeColor(type),
                    ),
                  ),
                ),
                const Spacer(),
                Icon(
                  Icons.access_time,
                  size: 14,
                  color: AppColors.textTertiary.withValues(alpha: 0.6),
                ),
                const SizedBox(width: 4),
                Text(
                  timeAgo,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textTertiary.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              announcement['title'] as String,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              announcement['content'] as String,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary.withValues(alpha: 0.9),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
