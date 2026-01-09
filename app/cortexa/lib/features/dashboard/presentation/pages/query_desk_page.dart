import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';

class QueryDeskPage extends StatefulWidget {
  const QueryDeskPage({super.key});

  @override
  State<QueryDeskPage> createState() => _QueryDeskPageState();
}

class _QueryDeskPageState extends State<QueryDeskPage> {
  final _storage = getIt<HiveStorageService>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _selectedCategory = 'General';
  String _selectedPriority = 'Normal';
  
  final List<String> _categories = ['General', 'Technical', 'Academic', 'Administrative'];
  final List<String> _priorities = ['Low', 'Normal', 'High', 'Urgent'];
  
  List<Map<String, dynamic>> _queries = [];
  String _filterStatus = 'All';
  bool _isInstitutionContext = false;
  String? _institutionName;

  @override
  void initState() {
    super.initState();
    _determineContext();
    _loadQueries();
  }
  
  void _determineContext() {
    final currentUser = _storage.getCurrentUser();
    final institutionId = currentUser?.institutionId;
    
    // Determine context based on query scope:
    // - Cortexa-level: Queries submitted to Cortexa platform (for super admin/developers)
    // - Environment-level: Queries within an institution (for institution admin)
    
    if (institutionId != null && institutionId.isNotEmpty) {
      // User belongs to an institution - environment level
      _isInstitutionContext = true;
      
      // Load institution name
      final institution = _storage.findInstitutionById(institutionId);
      _institutionName = institution?['institution_name']?.toString() ?? 
                        institution?['name']?.toString() ?? 
                        'Your Institution';
    } else {
      // Cortexa-level queries (platform-wide support)
      _isInstitutionContext = false;
    }
  }

  void _loadQueries() {
    try {
      final currentUser = _storage.getCurrentUser();
      final userId = currentUser?.id;
      final userRole = currentUser?.role.toLowerCase();
      final institutionId = currentUser?.institutionId;
      
      if (userId != null) {
        List<Map<String, dynamic>> queries;
        
        if (_isInstitutionContext) {
          // Environment-level: Queries within an institution
          if (userRole == 'admin') {
            // Institution admin sees all environment-level queries from their institution
            queries = _storage.getAllQueries(userId: null)
              .where((q) => 
                q['institution_id'] == institutionId && 
                q['query_level'] == 'environment'
              )
              .toList();
          } else {
            // Students/teachers see only their own environment-level queries
            queries = _storage.getAllQueries(userId: userId)
              .where((q) => q['query_level'] == 'environment')
              .toList();
          }
        } else {
          // Cortexa-level: Platform-wide queries (for super admin/developers)
          // Users without institution can only submit Cortexa-level queries
          // TODO: When super admin is implemented, they will see all Cortexa-level queries
          queries = _storage.getAllQueries(userId: userId)
            .where((q) => q['query_level'] == 'cortexa' || q['query_level'] == null)
            .toList();
        }
        
        setState(() {
          _queries = queries;
        });
      } else {
        setState(() {
          _queries = [];
        });
      }
    } catch (e) {
      print('Error loading queries: $e');
      setState(() {
        _queries = [];
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _submitQuery() {
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

    final currentUser = _storage.getCurrentUser();
    final institutionId = currentUser?.institutionId;

    final newQuery = {
      'id': 'query_${DateTime.now().millisecondsSinceEpoch}',
      'institution_id': institutionId,
      'user_id': currentUser?.id ?? 'unknown',
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'category': _selectedCategory,
      'priority': _selectedPriority,
      'status': 'Open',
      'query_level': _isInstitutionContext ? 'environment' : 'cortexa',
      'createdAt': DateTime.now().toIso8601String(),
      'username': currentUser?.username ?? 'Unknown User',
    };

    _storage.saveQuery(newQuery);

    setState(() {
      _queries.insert(0, newQuery);
    });

    // Clear form
    _titleController.clear();
    _descriptionController.clear();
    setState(() {
      _selectedCategory = 'General';
      _selectedPriority = 'Normal';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Query submitted successfully!'),
        backgroundColor: AppColors.success,
      ),
    );

    Navigator.pop(context);
  }

  void _showNewQueryDialog() {
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
                      _isInstitutionContext
                          ? 'Submit your query to $_institutionName'
                          : 'Submit your query to the Cortexa support team',
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
                          hintText: 'Enter query title',
                          hintStyle: TextStyle(fontSize: 14, color: AppColors.textTertiary.withValues(alpha: 0.5)),
                          filled: true,
                          fillColor: AppColors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppColors.borderDark.withValues(alpha: 0.2)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
                          hintStyle: TextStyle(fontSize: 14, color: AppColors.textTertiary.withValues(alpha: 0.5)),
                          alignLabelWithHint: true,
                          filled: true,
                          fillColor: AppColors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppColors.borderDark.withValues(alpha: 0.2)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(color: AppColors.primary, width: 2),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                      ),
                      const SizedBox(height: 18),
                      
                      // Category
                      StatefulBuilder(
                        builder: (context, setDialogState) => DropdownButtonFormField<String>(
                          initialValue: _selectedCategory,
                          style: const TextStyle(fontSize: 15, color: AppColors.textPrimary),
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
                              borderSide: BorderSide(color: AppColors.borderDark.withValues(alpha: 0.2)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppColors.primary, width: 2),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          ),
                          items: _categories.map((category) {
                            return DropdownMenuItem(
                              value: category,
                              child: Text(category),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setDialogState(() => _selectedCategory = value!);
                            setState(() => _selectedCategory = value!);
                          },
                        ),
                      ),
                      const SizedBox(height: 18),
                      
                      // Priority
                      StatefulBuilder(
                        builder: (context, setDialogState) => DropdownButtonFormField<String>(
                          initialValue: _selectedPriority,
                          style: const TextStyle(fontSize: 15, color: AppColors.textPrimary),
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
                              borderSide: BorderSide(color: AppColors.borderDark.withValues(alpha: 0.2)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: AppColors.primary, width: 2),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          ),
                          items: _priorities.map((priority) {
                            IconData icon;
                            Color color;
                            switch (priority) {
                              case 'Low':
                                icon = Icons.arrow_downward;
                                color = Colors.blue;
                                break;
                              case 'Normal':
                                icon = Icons.remove;
                                color = Colors.green;
                                break;
                              case 'High':
                                icon = Icons.arrow_upward;
                                color = Colors.orange;
                                break;
                              case 'Urgent':
                                icon = Icons.priority_high;
                                color = Colors.red;
                                break;
                              default:
                                icon = Icons.remove;
                                color = Colors.grey;
                            }
                            
                            return DropdownMenuItem(
                              value: priority,
                              child: Row(
                                children: [
                                  Icon(icon, size: 18, color: color),
                                  const SizedBox(width: 10),
                                  Text(
                                    priority,
                                    style: const TextStyle(fontSize: 15),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setDialogState(() => _selectedPriority = value!);
                            setState(() => _selectedPriority = value!);
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
                          side: BorderSide(color: AppColors.borderDark.withValues(alpha: 0.4)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
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
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
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

  void _showQueryDetails(Map<String, dynamic> query) {
    final createdAt = DateTime.parse(query['createdAt'] as String);
    final formattedDate = '${createdAt.day.toString().padLeft(2, '0')}/${createdAt.month.toString().padLeft(2, '0')}/${createdAt.year}, ${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}:${createdAt.second.toString().padLeft(2, '0')}';
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.background,
      builder: (context) => DraggableScrollableSheet(
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
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        query['title'] as String,
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
                      // Status badges
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _getStatusColor(query['status'] as String).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _getStatusColor(query['status'] as String).withValues(alpha: 0.3),
                                width: 1,
                              ),
                            ),
                            child: Text(
                              query['status'] as String,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _getStatusColor(query['status'] as String),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _getPriorityColor(query['priority'] as String).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: _getPriorityColor(query['priority'] as String).withValues(alpha: 0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _getPriorityIcon(query['priority'] as String),
                                  size: 14,
                                  color: _getPriorityColor(query['priority'] as String),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  query['priority'] as String,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: _getPriorityColor(query['priority'] as String),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      
                      // Description
                      Text(
                        query['description'] as String,
                        style: const TextStyle(
                          fontSize: 15,
                          color: AppColors.textSecondary,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Category
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
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
                              query['category'] as String,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      // Admin response section (mock)
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.borderDark.withValues(alpha: 0.2),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: AppColors.success,
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'A',
                                      style: TextStyle(
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
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Admin',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        formattedDate,
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: AppColors.textTertiary.withValues(alpha: 0.7),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Your query has been received. Our support team will review it and respond shortly.',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Open':
        return Colors.orange;
      case 'In Progress':
        return Colors.blue;
      case 'Resolved':
        return AppColors.success;
      default:
        return Colors.grey;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'Low':
        return Colors.blue;
      case 'Normal':
        return Colors.green;
      case 'High':
        return Colors.orange;
      case 'Urgent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority) {
      case 'Low':
        return Icons.arrow_downward;
      case 'Normal':
        return Icons.remove;
      case 'High':
        return Icons.arrow_upward;
      case 'Urgent':
        return Icons.priority_high;
      default:
        return Icons.remove;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredQueries = _filterStatus == 'All'
        ? _queries
        : _queries.where((q) => q['status'] == _filterStatus).toList();

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
                  _isInstitutionContext
                      ? 'Get help and support from $_institutionName'
                      : 'Get help and support from Cortexa team',
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
                          _queries.length.toString(),
                          Icons.chat_bubble_outline,
                          AppColors.primary,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          'Open',
                          _queries.where((q) => q['status'] == 'Open').length.toString(),
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
                          _queries.where((q) => q['status'] == 'In Progress').length.toString(),
                          Icons.hourglass_empty,
                          Colors.blue,
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          'Resolved',
                          _queries.where((q) => q['status'] == 'Resolved').length.toString(),
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
                _buildFilterChip('All', _filterStatus == 'All', Icons.list),
                const SizedBox(width: 8),
                _buildFilterChip('Open', _filterStatus == 'Open', Icons.schedule),
                const SizedBox(width: 8),
                _buildFilterChip('In Progress', _filterStatus == 'In Progress', Icons.hourglass_empty),
                const SizedBox(width: 8),
                _buildFilterChip('Resolved', _filterStatus == 'Resolved', Icons.check_circle),
              ],
            ),
          ),
          const SizedBox(height: 8),
          
          // Queries list
          Expanded(
            child: filteredQueries.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
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
                            color: AppColors.textSecondary.withValues(alpha: 0.8),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tap the + button to create your first query',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.textTertiary.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
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

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withValues(alpha: 0.2),
            width: 1,
          ),
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

  Widget _buildFilterChip(String label, bool isSelected, IconData icon) {
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
        setState(() => _filterStatus = label);
      },
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      showCheckmark: false,
      side: BorderSide(
        color: isSelected ? AppColors.primary : AppColors.borderDark.withValues(alpha: 0.3),
        width: 1,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    );
  }

  Widget _buildQueryCard(Map<String, dynamic> query) {
    final createdAt = DateTime.parse(query['createdAt'] as String);
    final timeAgo = _formatTimeAgo(createdAt);

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
                        query['title'] as String,
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
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(query['status'] as String).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        query['status'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _getStatusColor(query['status'] as String),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  query['description'] as String,
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
                    // Show username for admin viewing institution queries
                    if (_isInstitutionContext && _storage.getCurrentUser()?.role.toLowerCase() == 'admin' && query['username'] != null) ...[
                      Icon(
                        Icons.person_outline,
                        size: 14,
                        color: AppColors.textTertiary.withValues(alpha: 0.6),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          query['username'] as String,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textTertiary.withValues(alpha: 0.8),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          query['category'] as String,
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
                      _getPriorityIcon(query['priority'] as String),
                      size: 14,
                      color: _getPriorityColor(query['priority'] as String),
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        query['priority'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: _getPriorityColor(query['priority'] as String),
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
