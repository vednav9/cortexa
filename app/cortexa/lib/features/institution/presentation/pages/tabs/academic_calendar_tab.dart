import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/utils/fuzzy_search.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../data/repositories/academic_calendar_repository.dart';

class AcademicCalendarTab extends StatefulWidget {
  final bool readOnly;

  const AcademicCalendarTab({super.key, this.readOnly = false});

  @override
  State<AcademicCalendarTab> createState() => _AcademicCalendarTabState();
}

class _AcademicCalendarTabState extends State<AcademicCalendarTab> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _startDateController = TextEditingController();
  final TextEditingController _endDateController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final _storage = getIt<HiveStorageService>();
  final _calendarRepository = getIt<AcademicCalendarRepository>();

  List<Map<String, dynamic>> _events = [];
  bool _isLoading = true;
  String _selectedEventType = 'event';
  String _selectedAudience = 'all';
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {});
    });
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null) {
        setState(() {
          _events = [];
          _isLoading = false;
        });
        return;
      }

      // Fetch from API first (Always get latest data from backend)
      try {
        final response = await _calendarRepository.getCalendarEvents(
          institutionId,
        );
        if (!mounted) return;

        setState(() {
          _events = response['events'] as List<Map<String, dynamic>>;
          _isLoading = false;
        });
        print('✅ Loaded ${_events.length} events from API');
      } catch (apiError) {
        print('⚠️ API fetch failed: $apiError');
        // Fall back to cache if API fails
        final cachedEvents = _calendarRepository.getCachedEvents(institutionId);
        setState(() {
          _events = cachedEvents;
          _isLoading = false;
        });
        print('📦 Loaded ${_events.length} events from cache');

        // Show error if both API and cache are empty
        if (_events.isEmpty && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to load events. Check your connection.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      print('Error loading events: $e');
      setState(() {
        _events = [];
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filteredEvents {
    final query = _searchController.text.trim();
    if (query.isEmpty) return _events;
    return _events.where((event) {
      return FuzzySearch.matchesAny([
        event['title']?.toString() ?? '',
        event['description']?.toString() ?? '',
        event['location']?.toString() ?? '',
      ], query);
    }).toList();
  }

  void _showAddEventDialog([Map<String, dynamic>? event, int? index]) {
    final isEditing = event != null;

    if (isEditing) {
      _titleController.text = event['title'] ?? '';
      _descriptionController.text = event['description'] ?? '';
      _selectedEventType = event['eventType'] ?? 'event';
      _selectedAudience = event['targetAudience'] ?? 'all';
      _locationController.text = event['location'] ?? '';

      // Parse dates from ISO string
      if (event['startDate'] != null) {
        _startDate = DateTime.parse(event['startDate']);
        _startDateController.text = DateFormat(
          'dd-MM-yyyy',
        ).format(_startDate!);
      } else {
        _startDate = null;
        _startDateController.clear();
      }

      if (event['endDate'] != null) {
        _endDate = DateTime.parse(event['endDate']);
        _endDateController.text = DateFormat('dd-MM-yyyy').format(_endDate!);
      } else {
        _endDate = null;
        _endDateController.clear();
      }
    } else {
      _titleController.clear();
      _descriptionController.clear();
      _startDateController.clear();
      _endDateController.clear();
      _locationController.clear();
      _selectedEventType = 'event';
      _selectedAudience = 'all';
      _startDate = null;
      _endDate = null;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: DraggableScrollableSheet(
            initialChildSize: 0.85,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            builder: (context, scrollController) => StatefulBuilder(
              builder: (context, setModalState) => Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(28),
                  ),
                ),
                child: Column(
                  children: [
                    // Drag handle
                    Container(
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      width: 45,
                      height: 5,
                      decoration: BoxDecoration(
                        color: AppColors.borderDark.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),

                    // Content
                    Expanded(
                      child: SingleChildScrollView(
                        controller: scrollController,
                        padding: EdgeInsets.fromLTRB(
                          28,
                          0,
                          28,
                          MediaQuery.of(context).viewInsets.bottom + 28,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isEditing ? 'Update Event' : 'Add Event',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              isEditing
                                  ? 'Update event information'
                                  : 'Create a new event',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary.withValues(
                                  alpha: 0.8,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Title *',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _titleController,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                              ),
                              decoration: InputDecoration(
                                hintText: 'e.g., Mid-term Exam',
                                hintStyle: TextStyle(
                                  color: AppColors.textTertiary.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                                filled: true,
                                fillColor: AppColors.cardBackground,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.3,
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
                            const SizedBox(height: 12),
                            const Text(
                              'Description',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _descriptionController,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 2,
                              decoration: InputDecoration(
                                hintText: 'Enter event details...',
                                hintStyle: TextStyle(
                                  color: AppColors.textTertiary.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                                filled: true,
                                fillColor: AppColors.cardBackground,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.3,
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
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Event Type *',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Container(
                                        decoration: BoxDecoration(
                                          color: AppColors.cardBackground,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: AppColors.borderDark
                                                .withValues(alpha: 0.3),
                                          ),
                                        ),
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: _selectedEventType,
                                            isExpanded: true,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 16,
                                              vertical: 4,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            dropdownColor:
                                                AppColors.cardBackground,
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontSize: 16,
                                            ),
                                            items: [
                                              DropdownMenuItem(
                                                value: 'event',
                                                child: Text('Event'),
                                              ),
                                              DropdownMenuItem(
                                                value: 'exam',
                                                child: Text('Exam'),
                                              ),
                                              DropdownMenuItem(
                                                value: 'holiday',
                                                child: Text('Holiday'),
                                              ),
                                              DropdownMenuItem(
                                                value: 'deadline',
                                                child: Text('Deadline'),
                                              ),
                                              DropdownMenuItem(
                                                value: 'other',
                                                child: Text('Other'),
                                              ),
                                            ],
                                            onChanged: (value) {
                                              setModalState(() {
                                                _selectedEventType = value!;
                                              });
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Audience *',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Container(
                                        decoration: BoxDecoration(
                                          color: AppColors.cardBackground,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: AppColors.borderDark
                                                .withValues(alpha: 0.3),
                                          ),
                                        ),
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: _selectedAudience,
                                            isExpanded: true,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 16,
                                              vertical: 4,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            dropdownColor:
                                                AppColors.cardBackground,
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontSize: 16,
                                            ),
                                            items: [
                                              DropdownMenuItem(
                                                value: 'all',
                                                child: Text('All'),
                                              ),
                                              DropdownMenuItem(
                                                value: 'students',
                                                child: Text('Students'),
                                              ),
                                              DropdownMenuItem(
                                                value: 'faculty',
                                                child: Text('Faculty'),
                                              ),
                                              DropdownMenuItem(
                                                value: 'staff',
                                                child: Text('Staff'),
                                              ),
                                            ],
                                            onChanged: (value) {
                                              setModalState(() {
                                                _selectedAudience = value!;
                                              });
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Start Date *',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      TextField(
                                        controller: _startDateController,
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                        ),
                                        readOnly: true,
                                        onTap: () async {
                                          final DateTime?
                                          picked = await showDatePicker(
                                            context: context,
                                            initialDate:
                                                _startDate ?? DateTime.now(),
                                            firstDate: DateTime(2000),
                                            lastDate: DateTime(2100),
                                            builder: (context, child) {
                                              return Theme(
                                                data: Theme.of(context).copyWith(
                                                  colorScheme:
                                                      const ColorScheme.dark(
                                                        primary:
                                                            AppColors.primary,
                                                        onPrimary: Colors.white,
                                                        surface:
                                                            AppColors.surface,
                                                        onSurface: AppColors
                                                            .textPrimary,
                                                      ),
                                                ),
                                                child: child!,
                                              );
                                            },
                                          );
                                          if (picked != null) {
                                            setModalState(() {
                                              _startDate = picked;
                                              _startDateController.text =
                                                  DateFormat(
                                                    'dd-MM-yyyy',
                                                  ).format(picked);
                                              // Auto-set end date if not set
                                              if (_endDate == null ||
                                                  _endDate!.isBefore(picked)) {
                                                _endDate = picked;
                                                _endDateController.text =
                                                    DateFormat(
                                                      'dd-MM-yyyy',
                                                    ).format(picked);
                                              }
                                            });
                                          }
                                        },
                                        decoration: InputDecoration(
                                          hintText: 'dd-mm-yyyy',
                                          hintStyle: TextStyle(
                                            color: AppColors.textTertiary
                                                .withValues(alpha: 0.5),
                                          ),
                                          suffixIcon: const Icon(
                                            Icons.calendar_today,
                                            color: AppColors.textTertiary,
                                            size: 20,
                                          ),
                                          filled: true,
                                          fillColor: AppColors.cardBackground,
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: BorderSide(
                                              color: AppColors.borderDark
                                                  .withValues(alpha: 0.3),
                                            ),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: BorderSide(
                                              color: AppColors.borderDark
                                                  .withValues(alpha: 0.3),
                                            ),
                                          ),
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: const BorderSide(
                                              color: AppColors.primary,
                                              width: 2,
                                            ),
                                          ),
                                          contentPadding:
                                              const EdgeInsets.symmetric(
                                                horizontal: 16,
                                                vertical: 16,
                                              ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'End Date *',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      TextField(
                                        controller: _endDateController,
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                        ),
                                        readOnly: true,
                                        onTap: () async {
                                          final DateTime?
                                          picked = await showDatePicker(
                                            context: context,
                                            initialDate:
                                                _endDate ??
                                                _startDate ??
                                                DateTime.now(),
                                            firstDate:
                                                _startDate ?? DateTime(2000),
                                            lastDate: DateTime(2100),
                                            builder: (context, child) {
                                              return Theme(
                                                data: Theme.of(context).copyWith(
                                                  colorScheme:
                                                      const ColorScheme.dark(
                                                        primary:
                                                            AppColors.primary,
                                                        onPrimary: Colors.white,
                                                        surface:
                                                            AppColors.surface,
                                                        onSurface: AppColors
                                                            .textPrimary,
                                                      ),
                                                ),
                                                child: child!,
                                              );
                                            },
                                          );
                                          if (picked != null) {
                                            setModalState(() {
                                              _endDate = picked;
                                              _endDateController.text =
                                                  DateFormat(
                                                    'dd-MM-yyyy',
                                                  ).format(picked);
                                            });
                                          }
                                        },
                                        decoration: InputDecoration(
                                          hintText: 'dd-mm-yyyy',
                                          hintStyle: TextStyle(
                                            color: AppColors.textTertiary
                                                .withValues(alpha: 0.5),
                                          ),
                                          suffixIcon: const Icon(
                                            Icons.calendar_today,
                                            color: AppColors.textTertiary,
                                            size: 20,
                                          ),
                                          filled: true,
                                          fillColor: AppColors.cardBackground,
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: BorderSide(
                                              color: AppColors.borderDark
                                                  .withValues(alpha: 0.3),
                                            ),
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: BorderSide(
                                              color: AppColors.borderDark
                                                  .withValues(alpha: 0.3),
                                            ),
                                          ),
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                            borderSide: const BorderSide(
                                              color: AppColors.primary,
                                              width: 2,
                                            ),
                                          ),
                                          contentPadding:
                                              const EdgeInsets.symmetric(
                                                horizontal: 16,
                                                vertical: 16,
                                              ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Location',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _locationController,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                              ),
                              decoration: InputDecoration(
                                hintText: 'e.g., Room 101, Main Hall',
                                hintStyle: TextStyle(
                                  color: AppColors.textTertiary.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                                filled: true,
                                fillColor: AppColors.cardBackground,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.3,
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

                            const SizedBox(height: 20),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: () => Navigator.pop(context),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 16,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      side: BorderSide(
                                        color: AppColors.borderDark.withValues(
                                          alpha: 0.5,
                                        ),
                                        width: 1.5,
                                      ),
                                      foregroundColor: AppColors.textSecondary,
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
                                  child: ElevatedButton(
                                    onPressed: () {
                                      if (isEditing) {
                                        _updateEvent(index!);
                                      } else {
                                        _createEvent();
                                      }
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 16,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      elevation: 0,
                                    ),
                                    child: Text(
                                      isEditing ? 'Update' : 'Create',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _createEvent() async {
    if (_titleController.text.trim().isEmpty ||
        _startDate == null ||
        _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Please fill all required fields (Title, Start Date, End Date)',
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final currentUser = _storage.getCurrentUser();
    final institutionId = currentUser?.institutionId;

    if (institutionId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Error: No institution selected'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    Navigator.pop(context);

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      ),
    );

    try {
      await _calendarRepository.createCalendarEvent(
        institutionId: institutionId,
        title: _titleController.text.trim(),
        startDate: _startDate!,
        endDate: _endDate!,
        description: _descriptionController.text.trim(),
        eventType: _selectedEventType,
        location: _locationController.text.trim(),
        targetAudience: _selectedAudience,
      );

      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Event created successfully'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );

      // Refresh events list
      await _loadEvents();
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      print('Error creating event: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to create: ${e.toString()}'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }

  Future<void> _updateEvent(int index) async {
    if (_titleController.text.trim().isEmpty ||
        _startDate == null ||
        _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Please fill all required fields (Title, Start Date, End Date)',
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final eventId = _events[index]['_id']?.toString();
    if (eventId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Error: Invalid event ID'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    Navigator.pop(context);

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      ),
    );

    try {
      await _calendarRepository.updateCalendarEvent(
        eventId: eventId,
        title: _titleController.text.trim(),
        startDate: _startDate!,
        endDate: _endDate!,
        description: _descriptionController.text.trim(),
        eventType: _selectedEventType,
        location: _locationController.text.trim(),
        targetAudience: _selectedAudience,
      );

      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Event updated successfully'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );

      // Refresh events list
      await _loadEvents();
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      print('Error updating event: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to update: ${e.toString()}'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }

  Future<void> _deleteEvent(int index) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Event',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          'Are you sure you want to delete "${_events[index]['title']}"?',
          style: TextStyle(
            color: AppColors.textSecondary.withValues(alpha: 0.9),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    if (!mounted) return;

    final eventId = _events[index]['_id']?.toString();
    if (eventId == null) {
      messenger.showSnackBar(
        SnackBar(
          content: const Text('Error: Invalid event ID'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      ),
    );

    try {
      await _calendarRepository.deleteCalendarEvent(eventId);

      if (!mounted) return;

      // Close loading dialog
      navigator.pop();

      messenger.showSnackBar(
        SnackBar(
          content: const Text('Event deleted successfully'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );

      // Refresh events list
      await _loadEvents();
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog
      navigator.pop();

      print('Error deleting event: $e');
      messenger.showSnackBar(
        SnackBar(
          content: Text('Failed to delete: ${e.toString()}'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      resizeToAvoidBottomInset: true,
      body: RefreshIndicator(
        onRefresh: _loadEvents,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // Header Section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.1),
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
                        Icons.event_note_outlined,
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
                            'Academic Calendar',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Manage events, exams, and deadlines',
                            style: TextStyle(
                              color: AppColors.textSecondary.withValues(
                                alpha: 0.9,
                              ),
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
              const SizedBox(height: 20),

              // Search Bar
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.cardBackground,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _searchController,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search events...',
                      hintStyle: TextStyle(
                        color: AppColors.textTertiary.withValues(alpha: 0.5),
                        fontSize: 15,
                      ),
                      prefixIcon: Icon(
                        Icons.search_rounded,
                        color: AppColors.primary.withValues(alpha: 0.7),
                        size: 22,
                      ),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: Icon(
                                Icons.clear_rounded,
                                color: AppColors.textTertiary.withValues(
                                  alpha: 0.6,
                                ),
                                size: 20,
                              ),
                              onPressed: () {
                                setState(() {
                                  _searchController.clear();
                                });
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          width: 1,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          width: 1,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          width: 1.5,
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Content
              ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: 200,
                  maxHeight: MediaQuery.of(context).size.height - 400,
                ),
                child: _events.isEmpty
                    ? _buildEmptyState()
                    : _buildEventsList(),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: widget.readOnly
          ? null
          : Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: FloatingActionButton.extended(
                onPressed: _showAddEventDialog,
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 4,
                icon: const Icon(Icons.add, size: 24),
                label: const Text(
                  'Add',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                ),
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 60, left: 24, right: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.3),
                    AppColors.primaryLight.withValues(alpha: 0.15),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(50),
              ),
              child: Icon(
                Icons.event_note_outlined,
                size: 48,
                color: AppColors.primary.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'No events scheduled yet',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Container(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(
                'Start organizing your academic calendar by adding events, exams, and important deadlines.',
                style: TextStyle(
                  fontSize: 15,
                  color: AppColors.textSecondary.withValues(alpha: 0.8),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _eventTypeAccentColor(String eventType) {
    switch (eventType.toLowerCase()) {
      case 'exam':
        return Colors.red;
      case 'holiday':
        return Colors.green;
      case 'deadline':
        return Colors.orange;
      case 'other':
        return Colors.blue;
      case 'event':
      default:
        return Colors.yellow.shade700;
    }
  }

  String _formatEventDate(dynamic rawDate) {
    final parsed = DateTime.tryParse(rawDate?.toString() ?? '');
    if (parsed == null) {
      return 'Date not set';
    }
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  String _textOrFallback(dynamic value, String fallback) {
    final text = value?.toString().trim() ?? '';
    if (text.isEmpty || text.toLowerCase() == 'null') {
      return fallback;
    }
    return text;
  }

  int _resolveEventSourceIndex(Map<String, dynamic> event, int fallbackIndex) {
    final eventId = event['_id']?.toString() ?? '';
    if (eventId.isNotEmpty) {
      final sourceIndex = _events.indexWhere(
        (item) => item['_id']?.toString() == eventId,
      );
      if (sourceIndex >= 0) {
        return sourceIndex;
      }
    }

    final sourceIndex = _events.indexOf(event);
    if (sourceIndex >= 0) {
      return sourceIndex;
    }

    return fallbackIndex;
  }

  Widget _buildReadOnlyDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: AppColors.textSecondary.withValues(alpha: 0.9),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: AppColors.borderDark.withValues(alpha: 0.25),
              ),
            ),
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showEventDetailsSheet(Map<String, dynamic> event) {
    final title = _textOrFallback(event['title'], 'Untitled event');
    final description = _textOrFallback(
      event['description'],
      'No description added',
    );
    final eventType = _textOrFallback(event['eventType'], 'event').toUpperCase();
    final audience = _textOrFallback(event['targetAudience'], 'all').toUpperCase();
    final startDate = _formatEventDate(event['startDate']);
    final endDate = _formatEventDate(event['endDate']);
    final location = _textOrFallback(event['location'], 'Not specified');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.45,
            maxChildSize: 0.92,
            builder: (context, scrollController) => Container(
              decoration: const BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: AppColors.borderDark.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(22, 4, 22, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Event Details',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 18),
                          _buildReadOnlyDetailRow('Title', title),
                          _buildReadOnlyDetailRow('Description', description),
                          _buildReadOnlyDetailRow('Event Type', eventType),
                          _buildReadOnlyDetailRow('Audience', audience),
                          _buildReadOnlyDetailRow('Start Date', startDate),
                          _buildReadOnlyDetailRow('End Date', endDate),
                          _buildReadOnlyDetailRow('Location', location),
                        ],
                      ),
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

  Widget _buildEventsList() {
    final filteredEvents = _filteredEvents;
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      itemCount: filteredEvents.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final event = filteredEvents[index];
        final sourceIndex = _resolveEventSourceIndex(event, index);
        final eventType = _textOrFallback(
          event['eventType'],
          'event',
        ).toLowerCase();
        final accentColor = _eventTypeAccentColor(eventType);
        final eventTypeLabel = eventType.toUpperCase();
        final title = _textOrFallback(event['title'], 'Untitled event');
        final description = _textOrFallback(
          event['description'],
          'No description added',
        );
        final dateLabel = _formatEventDate(event['startDate']);
        final location = _textOrFallback(event['location'], 'Not specified');

        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.readOnly
                ? () => _showEventDetailsSheet(event)
                : () => _showAddEventDialog(event, sourceIndex),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.borderDark.withValues(alpha: 0.28),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Flexible(
                                fit: FlexFit.loose,
                                child: Text(
                                  title,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary,
                                    letterSpacing: -0.3,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: accentColor.withValues(alpha: 0.16),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  eventTypeLabel,
                                  style: TextStyle(
                                    color: accentColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (!widget.readOnly)
                          Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () => _deleteEvent(sourceIndex),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                padding: const EdgeInsets.all(5),
                                decoration: BoxDecoration(
                                  color: AppColors.error,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.error.withValues(
                                        alpha: 0.35,
                                      ),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.close_rounded,
                                  size: 14,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      description,
                      style: TextStyle(
                        color: AppColors.textSecondary.withValues(alpha: 0.9),
                        fontSize: 13,
                        height: 1.35,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_rounded,
                          size: 15,
                          color: accentColor.withValues(alpha: 0.85),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            dateLabel,
                            style: TextStyle(
                              color: AppColors.textSecondary.withValues(
                                alpha: 0.9,
                              ),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: AppColors.textSecondary.withValues(
                            alpha: 0.75,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            location,
                            style: TextStyle(
                              color: AppColors.textSecondary.withValues(
                                alpha: 0.86,
                              ),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
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
      },
    );
  }
}
