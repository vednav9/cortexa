import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../data/models/query_model.dart';
import '../../data/repositories/query_repository.dart';

class QueryDeskPage extends StatefulWidget {
  const QueryDeskPage({super.key});

  @override
  State<QueryDeskPage> createState() => _QueryDeskPageState();
}

class _QueryDeskPageState extends State<QueryDeskPage> {
  final _storage = getIt<HiveStorageService>();
  final _queryRepository = QueryRepository();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _replyController = TextEditingController();
  String _selectedCategory = 'general';
  String _selectedPriority = 'normal';

  final List<Map<String, String>> _categories = [
    {'value': 'general', 'label': 'General'},
    {'value': 'technical', 'label': 'Technical'},
    {'value': 'academic', 'label': 'Academic'},
    {'value': 'administrative', 'label': 'Administrative'},
  ];
  
  final List<Map<String, String>> _priorities = [
    {'value': 'low', 'label': 'Low'},
    {'value': 'normal', 'label': 'Normal'},
    {'value': 'high', 'label': 'High'},
    {'value': 'urgent', 'label': 'Urgent'},
  ];

  List<Query> _queries = [];
  QueryStats? _stats;
  String _filterStatus = 'all';
  bool _isLoading = true;
  String? _institutionId;
  String? _userRole;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    final currentUser = _storage.getCurrentUser();
    _institutionId = currentUser?.institutionId;
    _userRole = currentUser?.role;

    if (_institutionId != null) {
      await _loadQueries();
      await _loadStats();
    } else {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Institution not found'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _loadQueries() async {
    if (_institutionId == null) return;

    try {
      setState(() => _isLoading = true);
      
      final queries = await _queryRepository.getQueries(
        institutionId: _institutionId!,
        status: _filterStatus,
      );

      if (mounted) {
        setState(() {
          _queries = queries;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading queries: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _loadStats() async {
    if (_institutionId == null) return;

    try {
      final stats = await _queryRepository.getQueryStats(_institutionId!);
      if (mounted) {
        setState(() => _stats = stats);
      }
    } catch (e) {
      print('Error loading stats: $e');
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _submitQuery() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a title'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a description'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_institutionId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Institution not found'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    try {
      await _queryRepository.createQuery(
        institutionId: _institutionId!,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        category: _selectedCategory,
        priority: _selectedPriority,
      );

      // Clear form
      _titleController.clear();
      _descriptionController.clear();
      setState(() {
        _selectedCategory = 'general';
        _selectedPriority = 'normal';
      });

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Query submitted successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        
        // Reload queries and stats
        await _loadQueries();
        await _loadStats();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error submitting query: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showNewQueryDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: DraggableScrollableSheet(
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
                          'New Query',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _institutionId != null
                              ? 'Submit your query to your institution'
                              : 'Submit your query to Cortexa support',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary.withValues(
                              alpha: 0.8,
                            ),
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
                              hintText: 'Enter query title',
                              hintStyle: TextStyle(
                                fontSize: 14,
                                color: AppColors.textTertiary.withValues(
                                  alpha: 0.5,
                                ),
                              ),
                              filled: true,
                              fillColor: AppColors.background,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: AppColors.borderDark.withValues(
                                    alpha: 0.2,
                                  ),
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.primary,
                                  width: 2,
                                ),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Description
                          TextField(
                            controller: _descriptionController,
                            enableInteractiveSelection: true,
                            maxLines: 5,
                            style: const TextStyle(fontSize: 15),
                            decoration: InputDecoration(
                              labelText: 'Description *',
                              labelStyle: const TextStyle(fontSize: 14),
                              hintText: 'Describe your query in detail',
                              hintStyle: TextStyle(
                                fontSize: 14,
                                color: AppColors.textTertiary.withValues(
                                  alpha: 0.5,
                                ),
                              ),
                              alignLabelWithHint: true,
                              filled: true,
                              fillColor: AppColors.background,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: AppColors.borderDark.withValues(
                                    alpha: 0.2,
                                  ),
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.primary,
                                  width: 2,
                                ),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),

                          // Category
                          StatefulBuilder(
                            builder: (context, setDialogState) =>
                                DropdownButtonFormField<String>(
                                  initialValue: _selectedCategory,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    color: AppColors.textPrimary,
                                  ),
                                  decoration: InputDecoration(
                                    labelText: 'Category',
                                    labelStyle: const TextStyle(fontSize: 14),
                                    filled: true,
                                    fillColor: AppColors.background,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(
                                        color: AppColors.borderDark.withValues(
                                          alpha: 0.2,
                                        ),
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: AppColors.primary,
                                        width: 2,
                                      ),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 16,
                                    ),
                                  ),
                                  items: _categories.map((category) {
                                    return DropdownMenuItem(
                                      value: category['value'],
                                      child: Text(category['label']!),
                                    );
                                  }).toList(),
                                  onChanged: (value) {
                                    if (value != null) {
                                      setDialogState(() => _selectedCategory = value);
                                      setState(() => _selectedCategory = value);
                                    }
                                  },
                                ),
                          ),
                          const SizedBox(height: 18),

                          // Priority
                          StatefulBuilder(
                            builder: (context, setDialogState) =>
                                DropdownButtonFormField<String>(
                                  initialValue: _selectedPriority,
                                  style: const TextStyle(
                                    fontSize: 15,
                                    color: AppColors.textPrimary,
                                  ),
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
                                        color: AppColors.borderDark.withValues(
                                          alpha: 0.2,
                                        ),
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: AppColors.primary,
                                        width: 2,
                                      ),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 16,
                                    ),
                                  ),
                                  items: _priorities.map((priority) {
                                    final priorityValue = priority['value']!;
                                    final priorityLabel = priority['label']!;
                                    IconData icon;
                                    Color color;
                                    switch (priorityValue) {
                                      case 'low':
                                        icon = Icons.arrow_downward;
                                        color = Colors.blue;
                                        break;
                                      case 'normal':
                                        icon = Icons.remove;
                                        color = Colors.green;
                                        break;
                                      case 'high':
                                        icon = Icons.arrow_upward;
                                        color = Colors.orange;
                                        break;
                                      case 'urgent':
                                        icon = Icons.priority_high;
                                        color = Colors.red;
                                        break;
                                      default:
                                        icon = Icons.remove;
                                        color = Colors.grey;
                                    }

                                    return DropdownMenuItem(
                                      value: priorityValue,
                                      child: Row(
                                        children: [
                                          Icon(icon, size: 18, color: color),
                                          const SizedBox(width: 10),
                                          Text(
                                            priorityLabel,
                                            style: const TextStyle(
                                              fontSize: 15,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (value) {
                                    if (value != null) {
                                      setDialogState(() => _selectedPriority = value);
                                      setState(() => _selectedPriority = value);
                                    }
                                  },
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
                                color: AppColors.borderDark.withValues(
                                  alpha: 0.4,
                                ),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: _submitQuery,
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
                              'Submit Query',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
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
    );
  }

  void _showQueryDetails(Query query) {
    // Local state for this modal
    Query currentQuery = query;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      builder: (modalContext) => StatefulBuilder(
        builder: (context, setModalState) {
          return Scaffold(
            backgroundColor: Colors.transparent,
            body: Align(
              alignment: Alignment.bottomCenter,
              child: DraggableScrollableSheet(
                initialChildSize: 0.85,
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

                      // Header with title and close button
                      Padding(
                        padding: const EdgeInsets.fromLTRB(28, 8, 20, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Title and Close Button Row
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    currentQuery.title,
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                      letterSpacing: -0.5,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, size: 24),
                                  onPressed: () => Navigator.pop(context),
                                  color: AppColors.textSecondary,
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            
                            // Tags and Status Dropdown Row
                            Row(
                              children: [
                                // Tags wrapped in Flexible to prevent overflow
                                Expanded(
                                  child: Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(
                                            currentQuery.status,
                                          ).withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                            color: _getStatusColor(
                                              currentQuery.status,
                                            ).withValues(alpha: 0.3),
                                            width: 1,
                                          ),
                                        ),
                                        child: Text(
                                          currentQuery.status,
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: _getStatusColor(
                                              currentQuery.status,
                                            ),
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: _getPriorityColor(
                                            currentQuery.priority,
                                          ).withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                            color: _getPriorityColor(
                                              currentQuery.priority,
                                            ).withValues(alpha: 0.3),
                                            width: 1,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              _getPriorityIcon(
                                                currentQuery.priority,
                                              ),
                                              size: 14,
                                              color: _getPriorityColor(
                                                currentQuery.priority,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              currentQuery.priority,
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: _getPriorityColor(
                                                  currentQuery.priority,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                // Status update dropdown for admin/teacher
                                if (_userRole == 'admin' || _userRole == 'teacher') ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    constraints: const BoxConstraints(maxWidth: 140),
                                    padding: const EdgeInsets.only(left: 8, right: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: AppColors.borderDark.withValues(
                                          alpha: 0.3,
                                        ),
                                      ),
                                    ),
                                    child: DropdownButton<String>(
                                      value: currentQuery.status,
                                      underline: const SizedBox(),
                                      isDense: true,
                                      isExpanded: true,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textPrimary,
                                      ),
                                      items: const [
                                        DropdownMenuItem(
                                          value: 'open',
                                          child: Text('Open'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'in-progress',
                                          child: Text('In Progress'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'resolved',
                                          child: Text('Resolved'),
                                        ),
                                        DropdownMenuItem(
                                          value: 'closed',
                                          child: Text('Closed'),
                                        ),
                                      ],
                                      onChanged: (newStatus) async {
                                        if (newStatus != null) {
                                          try {
                                            final updatedQuery =
                                                await _queryRepository
                                                    .updateQueryStatus(
                                              queryId: currentQuery.id,
                                              status: newStatus,
                                            );
                                            setModalState(() {
                                              currentQuery = updatedQuery;
                                            });
                                            setState(() {
                                              _queries = _queries
                                                  .map((q) => q.id ==
                                                          currentQuery.id
                                                      ? updatedQuery
                                                      : q)
                                                  .toList();
                                            });
                                            _loadStats();
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              const SnackBar(
                                                content: Text(
                                                  'Status updated successfully',
                                                ),
                                                backgroundColor: AppColors.success,
                                              ),
                                            );
                                          } catch (e) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  'Error updating status: $e',
                                                ),
                                                backgroundColor: AppColors.error,
                                              ),
                                            );
                                          }
                                        }
                                      },
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),

                      const Divider(height: 1, thickness: 1),

                      Expanded(
                        child: SingleChildScrollView(
                          physics: const ClampingScrollPhysics(),
                          controller: scrollController,
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Description
                              const Text(
                                'Description',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                currentQuery.description,
                                style: const TextStyle(
                                  fontSize: 15,
                                  color: AppColors.textSecondary,
                                  height: 1.6,
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Category
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(
                                        alpha: 0.1,
                                      ),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.category_outlined,
                                          size: 16,
                                          color: AppColors.primary,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          currentQuery.category,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'By ${currentQuery.createdBy.name}',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: AppColors.textTertiary.withValues(
                                        alpha: 0.8,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 32),

                              // Replies section
                              const Text(
                                'Replies',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 16),

                              if (currentQuery.replies.isEmpty)
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: AppColors.background,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppColors.borderDark.withValues(
                                        alpha: 0.2,
                                      ),
                                      width: 1,
                                    ),
                                  ),
                                  child: Center(
                                    child: Column(
                                      children: [
                                        Icon(
                                          Icons.chat_bubble_outline,
                                          size: 48,
                                          color: AppColors.textTertiary
                                              .withValues(alpha: 0.3),
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          'No replies yet',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: AppColors.textTertiary
                                                .withValues(alpha: 0.6),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                              else
                                ...currentQuery.replies.map((reply) {
                                  final replyDate = _formatDateTime(
                                    reply.repliedAt,
                                  );
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: AppColors.borderDark.withValues(
                                          alpha: 0.2,
                                        ),
                                        width: 1,
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              width: 36,
                                              height: 36,
                                              decoration: BoxDecoration(
                                                color: _getUserRoleColor(
                                                  reply.repliedBy.userModel,
                                                ),
                                                borderRadius:
                                                    BorderRadius.circular(18),
                                              ),
                                              child: Center(
                                                child: Text(
                                                  reply.repliedBy.name[0]
                                                      .toUpperCase(),
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    reply.repliedBy.name,
                                                    style: const TextStyle(
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      color:
                                                          AppColors.textPrimary,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    replyDate,
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      color: AppColors
                                                          .textTertiary
                                                          .withValues(
                                                        alpha: 0.7,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          reply.text,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            color: AppColors.textSecondary,
                                            height: 1.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }),
                            ],
                          ),
                        ),
                      ),

                      // Reply input field
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          border: Border(
                            top: BorderSide(
                              color: AppColors.borderDark.withValues(
                                alpha: 0.2,
                              ),
                              width: 1,
                            ),
                          ),
                        ),
                        padding: const EdgeInsets.fromLTRB(28, 16, 28, 28),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _replyController,
                                minLines: 1,
                                maxLines: 3,
                                style: const TextStyle(fontSize: 15),
                                decoration: InputDecoration(
                                  hintText: 'Type your reply...',
                                  hintStyle: TextStyle(
                                    fontSize: 14,
                                    color: AppColors.textTertiary.withValues(
                                      alpha: 0.5,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: AppColors.background,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: AppColors.borderDark.withValues(
                                        alpha: 0.2,
                                      ),
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                      color: AppColors.primary,
                                      width: 2,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: () async {
                                if (_replyController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Please enter a reply'),
                                      backgroundColor: AppColors.error,
                                    ),
                                  );
                                  return;
                                }

                                try {
                                  final updatedQuery =
                                      await _queryRepository.addReply(
                                    queryId: currentQuery.id,
                                    text: _replyController.text.trim(),
                                  );

                                  _replyController.clear();
                                  setModalState(() {
                                    currentQuery = updatedQuery;
                                  });
                                  setState(() {
                                    _queries = _queries
                                        .map((q) =>
                                            q.id == currentQuery.id
                                                ? updatedQuery
                                                : q)
                                        .toList();
                                  });

                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Reply sent successfully'),
                                      backgroundColor: AppColors.success,
                                    ),
                                  );
                                } catch (e) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Error sending reply: $e'),
                                      backgroundColor: AppColors.error,
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Icon(Icons.send, size: 20),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Color _getUserRoleColor(String userModel) {
    switch (userModel.toLowerCase()) {
      case 'admin':
        return AppColors.error;
      case 'teacher':
        return AppColors.success;
      case 'student':
        return AppColors.primary;
      default:
        return Colors.grey;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year} at ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return Colors.orange;
      case 'in-progress':
        return Colors.blue;
      case 'resolved':
        return AppColors.success;
      case 'closed':
        return Colors.grey.shade600;
      default:
        return Colors.grey;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return Colors.blue;
      case 'normal':
        return Colors.green;
      case 'high':
        return Colors.orange;
      case 'urgent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority.toLowerCase()) {
      case 'low':
        return Icons.arrow_downward;
      case 'normal':
        return Icons.remove;
      case 'high':
        return Icons.arrow_upward;
      case 'urgent':
        return Icons.priority_high;
      default:
        return Icons.remove;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Queries are already filtered from backend based on _filterStatus
    final filteredQueries = _queries;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Header with stats
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.help_outline,
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
                            'Query Desk',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          SizedBox(height: 4),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Get help and support for your queries',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 20),

                // Stats in 2x2 grid
                Column(
                  children: [
                    Row(
                      children: [
                        _buildStatCard(
                          'Total Queries',
                          _stats?.total.toString() ?? '0',
                          Icons.chat_bubble_outline,
                          AppColors.primary,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          'Open',
                          _stats?.open.toString() ?? '0',
                          Icons.schedule,
                          Colors.orange,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildStatCard(
                          'In Progress',
                          _stats?.inProgress.toString() ?? '0',
                          Icons.hourglass_empty,
                          Colors.blue,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          'Resolved',
                          _stats?.resolved.toString() ?? '0',
                          Icons.check_circle_outline,
                          AppColors.success,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Filter chips with horizontal scroll
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              children: [
                _buildFilterChip('all', 'All', _filterStatus == 'all', Icons.list),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'open',
                  'Open',
                  _filterStatus == 'open',
                  Icons.schedule,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'in-progress',
                  'In Progress',
                  _filterStatus == 'in-progress',
                  Icons.hourglass_empty,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  'resolved',
                  'Resolved',
                  _filterStatus == 'resolved',
                  Icons.check_circle,
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Queries list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primary,
                    ),
                  )
                : filteredQueries.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.help_outline,
                              size: 80,
                              color: AppColors.textTertiary.withValues(alpha: 0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No queries yet',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSecondary.withValues(
                                  alpha: 0.8,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Tap the + button to create your first query',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.textTertiary.withValues(
                                  alpha: 0.6,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 8,
                        ),
                        itemCount: filteredQueries.length,
                        itemBuilder: (context, index) {
                          final query = filteredQueries[index];
                          return _buildQueryCard(query);
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showNewQueryDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text(
          'New Query',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2), width: 1),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color, size: 18),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, bool isSelected, IconData icon) {
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              color: isSelected ? Colors.white : AppColors.textPrimary,
            ),
          ),
        ],
      ),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filterStatus = value);
        _loadQueries(); // Reload with new filter
      },
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      showCheckmark: false,
      side: BorderSide(
        color: isSelected
            ? AppColors.primary
            : AppColors.borderDark.withValues(alpha: 0.3),
        width: 1,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    );
  }

  Widget _buildQueryCard(Query query) {
    final timeAgo = _formatTimeAgo(query.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _showQueryDetails(query),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        query.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(query.status).withValues(
                          alpha: 0.15,
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        query.status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _getStatusColor(query.status),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  query.description,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    // Show username for admin/teacher viewing all queries
                    if (_userRole != null &&
                        (_userRole == 'admin' || _userRole == 'teacher')) ...[
                      Icon(
                        Icons.person_outline,
                        size: 14,
                        color: AppColors.textTertiary.withValues(alpha: 0.6),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          query.createdBy.name,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textTertiary.withValues(
                              alpha: 0.8,
                            ),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          query.category,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.primary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      _getPriorityIcon(query.priority),
                      size: 14,
                      color: _getPriorityColor(query.priority),
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        query.priority,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: _getPriorityColor(query.priority),
                        ),
                        overflow: TextOverflow.ellipsis,
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
                        fontSize: 11,
                        color: AppColors.textTertiary.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
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
