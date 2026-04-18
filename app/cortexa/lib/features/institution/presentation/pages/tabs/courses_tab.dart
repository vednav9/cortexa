import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../../../core/utils/fuzzy_search.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/config/api_config.dart';
import '../../../../../../core/services/terminology_service.dart';
import '../../../../../../core/services/hive_storage_service.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../data/repositories/course_repository.dart';
import '../../../data/repositories/department_repository.dart';
import '../../../data/repositories/faculty_repository.dart';
import '../../../data/repositories/semester_repository.dart';

class CoursesTab extends StatefulWidget {
  final bool readOnly;

  const CoursesTab({super.key, this.readOnly = false});

  @override
  State<CoursesTab> createState() => _CoursesTabState();
}

class _CoursesTabState extends State<CoursesTab> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _codeController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _creditsController = TextEditingController();
  final TextEditingController _semesterNumberController =
      TextEditingController();
  final TextEditingController _maxCapacityController = TextEditingController();
  final TextEditingController _syllabusController = TextEditingController();
  final _storage = getIt<HiveStorageService>();
  final _courseRepository = getIt<CourseRepository>();
  final _departmentRepository = getIt<DepartmentRepository>();
  final _facultyRepository = getIt<FacultyRepository>();
  final _semesterRepository = getIt<SemesterRepository>();

  List<Map<String, dynamic>> _courses = [];
  bool _isLoading = true;
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _facultyMembers = [];
  List<Map<String, dynamic>> _semesters = [];
  String _selectedDepartment = 'all';
  String _selectedSemester = 'all';
  String _selectedCourseDepartment = '';
  String _selectedCourseSemester = '';
  String _selectedCourseInstructor = '';
  String _selectedCourseFaculty = '';
  bool _isFetchingCourseDetails = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {});
    });
    _loadDepartments();
    _loadFaculty();
    _loadSemesters();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null) {
        setState(() {
          _courses = [];
          _isLoading = false;
        });
        return;
      }

      // Fetch from API first (Always get latest data from backend)
      try {
        final response = await _courseRepository.getCourses(institutionId);
        if (!mounted) return;

        setState(() {
          _courses = response['courses'] as List<Map<String, dynamic>>;
          _isLoading = false;
        });
        print('✅ Loaded ${_courses.length} courses from API');
      } catch (apiError) {
        print('⚠️ API fetch failed: $apiError');
        // Fall back to cache if API fails
        final cachedCourses = _courseRepository.getCachedCourses(institutionId);
        setState(() {
          _courses = cachedCourses;
          _isLoading = false;
        });
        print('📦 Loaded ${_courses.length} courses from cache');

        // Show error if both API and cache are empty
        if (_courses.isEmpty && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to load courses. Check your connection.'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      print('Error loading courses: $e');
      setState(() {
        _courses = [];
        _isLoading = false;
      });
    }
  }

  Future<void> _loadDepartments() async {
    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null) {
        setState(() {
          _departments = [];
        });
        return;
      }

      // Fetch from API first
      try {
        final response = await _departmentRepository.getDepartments(
          institutionId,
        );
        if (!mounted) return;

        setState(() {
          _departments = (response['data'] as List<dynamic>)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
        });
        print('✅ Loaded ${_departments.length} departments for dropdown');
      } catch (apiError) {
        print('⚠️ Department API failed: $apiError');
        // Fall back to cache
        setState(() {
          _departments = _storage.getAllDepartments(
            institutionId: institutionId,
          );
        });
      }
    } catch (e) {
      print('Error loading departments: $e');
      setState(() {
        _departments = [];
      });
    }
  }

  Future<void> _loadSemesters() async {
    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null) {
        setState(() {
          _semesters = [];
        });
        return;
      }

      // Fetch from API first
      try {
        final response = await _semesterRepository.getSemesters(institutionId);
        if (!mounted) return;

        setState(() {
          _semesters = (response['data'] as List<dynamic>)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
        });
        print('✅ Loaded ${_semesters.length} semesters for dropdown');
      } catch (apiError) {
        print('⚠️ Semester API failed: $apiError');
        // Fall back to cache
        setState(() {
          _semesters = _storage.getAllSemesters(institutionId: institutionId);
        });
      }
    } catch (e) {
      print('Error loading semesters: $e');
      setState(() {
        _semesters = [];
      });
    }
  }

  Future<void> _loadFaculty() async {
    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null || institutionId.isEmpty) {
        setState(() {
          _facultyMembers = [];
        });
        return;
      }

      final response = await _facultyRepository.getFaculty(
        institutionId: institutionId,
      );

      if (!mounted) return;

      setState(() {
        _facultyMembers =
            (response['faculty'] as List?)
                ?.map((e) => Map<String, dynamic>.from(e as Map))
                .toList() ??
            <Map<String, dynamic>>[];
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _facultyMembers = [];
      });
    }
  }

  String _extractId(dynamic value) {
    if (value is Map) {
      final id = value['_id']?.toString();
      if (id != null && id.isNotEmpty && id != 'null') {
        return id;
      }
    }

    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty || raw == 'null') {
      return '';
    }
    return raw;
  }

  String _normalizeSelection(String value, List<Map<String, dynamic>> options) {
    if (value.isEmpty) return '';
    final exists = options.any((item) => item['_id']?.toString() == value);
    return exists ? value : '';
  }

  int _toInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _textOrDash(dynamic value) {
    final text = value?.toString().trim();
    if (text == null || text.isEmpty || text == 'null') {
      return '-';
    }
    return text;
  }

  String _displayEntityText(dynamic value) {
    if (value is Map) {
      final map = Map<String, dynamic>.from(value);
      final candidate =
          map['fullName']?.toString().trim() ??
          map['name']?.toString().trim() ??
          map['code']?.toString().trim() ??
          '';
      if (candidate.isNotEmpty) {
        return candidate;
      }
    }

    return _textOrDash(value);
  }

  String _formatBytes(dynamic bytes) {
    final value = num.tryParse(bytes?.toString() ?? '');
    if (value == null || value <= 0) {
      return 'Unknown size';
    }
    if (value < 1024) {
      return '${value.toStringAsFixed(0)} B';
    }
    if (value < 1024 * 1024) {
      return '${(value / 1024).toStringAsFixed(1)} KB';
    }
    return '${(value / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  String _formatDate(dynamic value) {
    final parsed = DateTime.tryParse(value?.toString() ?? '');
    if (parsed == null) {
      return 'Unknown date';
    }

    final local = parsed.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    return '$day/$month/${local.year}';
  }

  String? _normalizeDownloadUrl(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty || raw == 'null') {
      return null;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    return '${ApiConfig.baseUrl}$raw';
  }

  Future<void> _openDocumentDownload(Map<String, dynamic> document) async {
    final fileUrl = _normalizeDownloadUrl(document['fileUrl']);
    final trackedDownloadUrl = _normalizeDownloadUrl(document['downloadUrl']);
    final targetUrl = fileUrl ?? trackedDownloadUrl;

    if (targetUrl == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Download link is not available for this file'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final uri = Uri.tryParse(targetUrl);
    if (uri == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Invalid download link'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Unable to open download link'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }

  Future<void> _showCourseDetails(Map<String, dynamic> course) async {
    if (_isFetchingCourseDetails) {
      return;
    }

    final courseCode = (course['code'] ?? '').toString().trim();
    if (courseCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Course code is missing for this record'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    setState(() {
      _isFetchingCourseDetails = true;
    });

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
      );
    }

    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;
      final slug = await _courseRepository.resolveInstitutionSlug(
        institutionId: institutionId,
      );
      if (slug == null || slug.isEmpty) {
        throw Exception('Unable to resolve institution slug');
      }

      final response = await _courseRepository.getCourseDetails(
        institutionSlug: slug,
        courseCode: courseCode,
      );

      if (!mounted) return;

      Navigator.pop(context);

      final responseCourse = response['course'];
      final detailedCourse = responseCourse is Map<String, dynamic>
          ? responseCourse
          : Map<String, dynamic>.from(course);

      final documents =
          (response['documents'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          <Map<String, dynamic>>[];

      final sourceCourseId = _extractId(course['_id']);
      final sourceIndex = _courses.indexWhere(
        (item) => _extractId(item['_id']) == sourceCourseId,
      );
      final editableCourse = sourceIndex >= 0
          ? Map<String, dynamic>.from(_courses[sourceIndex])
          : Map<String, dynamic>.from(course);

      _showCourseDetailsSheet(
        detailsCourse: detailedCourse,
        editableCourse: editableCourse,
        documents: documents,
      );
    } catch (e) {
      if (!mounted) return;

      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load course details: ${e.toString()}'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isFetchingCourseDetails = false;
        });
      }
    }
  }

  Widget _buildCourseDocumentCard(Map<String, dynamic> document) {
    final originalName = _textOrDash(document['originalName']);
    final fileType = _textOrDash(document['fileType']).toUpperCase();
    final uploadedBy = _textOrDash(document['uploadedBy']);
    final fileSize = _formatBytes(document['fileSize']);
    final chunks = _toInt(document['chunksCount']);
    final downloads = _toInt(document['downloadCount']);
    final isProcessed = document['isProcessed'] == true;
    final uploadedOn = _formatDate(document['createdAt']);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderDark.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            originalName,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$fileType • $fileSize • Uploaded by $uploadedBy',
            style: TextStyle(
              color: AppColors.textSecondary.withValues(alpha: 0.85),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'MongoDB Index: ${isProcessed ? 'Ready' : 'Pending'} ($chunks chunks) • Downloads: $downloads',
            style: TextStyle(
              color: AppColors.textSecondary.withValues(alpha: 0.85),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Uploaded on: $uploadedOn',
            style: TextStyle(
              color: AppColors.textSecondary.withValues(alpha: 0.75),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 10),
          if (widget.readOnly)
            Align(
              alignment: Alignment.centerLeft,
              child: ElevatedButton.icon(
                onPressed: () => _openDocumentDownload(document),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                ),
                icon: const Icon(Icons.download_rounded, size: 16),
                label: const Text(
                  'Download',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppColors.borderDark.withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                'Download available for students only',
                style: TextStyle(
                  color: AppColors.textSecondary.withValues(alpha: 0.8),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showReadOnlyCourseDetailsSheet({
    required Map<String, dynamic> detailsCourse,
    required List<Map<String, dynamic>> documents,
  }) {
    final programLabel = TerminologyService.getLearningProgramLabel(context);
    final programDescription = _textOrDash(
      detailsCourse['description'] ?? detailsCourse['fullDescription'],
    );
    final credits = _textOrDash(detailsCourse['credits']);
    final code = _textOrDash(detailsCourse['code']);
    final displayName = _textOrDash(detailsCourse['name']);
    final instructorName = _displayEntityText(detailsCourse['instructor']);
    final departmentName = _displayEntityText(detailsCourse['department']);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.55,
        maxChildSize: 0.97,
        expand: false,
        builder: (context, scrollController) {
          return Container(
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: AppColors.borderDark.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scrollController,
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primary.withValues(alpha: 0.14),
                                AppColors.primaryLight.withValues(alpha: 0.08),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.2),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      code,
                                      style: const TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                  if (credits != '-')
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 5,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.surface,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        '$credits credits',
                                        style: const TextStyle(
                                          color: AppColors.textPrimary,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                displayName,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                  letterSpacing: -0.4,
                                ),
                              ),
                              if (programDescription != '-') ...[
                                const SizedBox(height: 8),
                                Text(
                                  programDescription,
                                  style: TextStyle(
                                    color: AppColors.textSecondary.withValues(alpha: 0.9),
                                    fontSize: 14,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'Uploaded $programLabel Content',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        if (documents.isEmpty)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.cardBackground,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppColors.borderDark.withValues(alpha: 0.25),
                              ),
                            ),
                            child: Text(
                              'No uploaded content available for this $programLabel yet.',
                              style: TextStyle(
                                color: AppColors.textSecondary.withValues(alpha: 0.85),
                                fontSize: 13,
                              ),
                            ),
                          )
                        else
                          ...documents.map(_buildCourseDocumentCard),
                        const SizedBox(height: 14),
                        Text(
                          '$programLabel Information',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.cardBackground,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.borderDark.withValues(alpha: 0.25),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Instructor: $instructorName',
                                style: TextStyle(
                                  color: AppColors.textSecondary.withValues(alpha: 0.9),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Department: $departmentName',
                                style: TextStyle(
                                  color: AppColors.textSecondary.withValues(alpha: 0.9),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Close'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showCourseDetailsSheet({
    required Map<String, dynamic> detailsCourse,
    required Map<String, dynamic> editableCourse,
    required List<Map<String, dynamic>> documents,
  }) {
    if (widget.readOnly) {
      _showReadOnlyCourseDetailsSheet(
        detailsCourse: detailsCourse,
        documents: documents,
      );
      return;
    }

    final codeController = TextEditingController(
      text: (editableCourse['code'] ?? detailsCourse['code'] ?? '')
          .toString()
          .toUpperCase(),
    );
    final nameController = TextEditingController(
      text: (editableCourse['name'] ?? detailsCourse['name'] ?? '').toString(),
    );
    final descriptionController = TextEditingController(
      text:
          (editableCourse['description'] ?? detailsCourse['description'] ?? '')
              .toString(),
    );
    final creditsController = TextEditingController(
      text: (editableCourse['credits'] ?? detailsCourse['credits'] ?? '')
          .toString(),
    );
    final semesterNumberController = TextEditingController(
      text: (editableCourse['semester'] ?? detailsCourse['semester'] ?? '')
          .toString(),
    );
    final maxCapacityController = TextEditingController(
      text: (editableCourse['maxCapacity'] ?? '').toString(),
    );
    final syllabusController = TextEditingController(
      text: (editableCourse['syllabus'] ?? '').toString(),
    );

    String selectedDepartment = _normalizeSelection(
      _extractId(editableCourse['department']),
      _departments,
    );
    String selectedSemester = _normalizeSelection(
      _extractId(editableCourse['semesterAvailable']),
      _semesters,
    );
    String selectedInstructor = _normalizeSelection(
      _extractId(editableCourse['instructor']),
      _facultyMembers,
    );
    String selectedFaculty = _normalizeSelection(
      _extractId(editableCourse['facultyAvailable']),
      _facultyMembers,
    );

    bool isUpdating = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) {
          final programLabel = TerminologyService.getLearningProgramLabel(
            context,
          );
          final programDescription = _textOrDash(
            detailsCourse['description'] ??
                detailsCourse['fullDescription'] ??
                editableCourse['description'],
          );
          final credits = _textOrDash(
            detailsCourse['credits'] ?? editableCourse['credits'],
          );
          final code = _textOrDash(
            detailsCourse['code'] ?? editableCourse['code'],
          );
          final displayName = _textOrDash(
            detailsCourse['name'] ?? editableCourse['name'],
          );
          final courseId = _extractId(
            editableCourse['_id'] ??
                detailsCourse['id'] ??
                detailsCourse['_id'],
          );

          Future<void> handleUpdate() async {
            final rootContext = this.context;
            final messenger = ScaffoldMessenger.of(rootContext);
            final sheetNavigator = Navigator.of(sheetContext);
            final successLabel = TerminologyService.getLearningProgramLabel(
              rootContext,
            );

            if (courseId.isEmpty) {
              messenger.showSnackBar(
                SnackBar(
                  content: const Text('Invalid course ID for update'),
                  backgroundColor: AppColors.error,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              );
              return;
            }

            if (nameController.text.trim().isEmpty ||
                codeController.text.trim().isEmpty ||
                creditsController.text.trim().isEmpty ||
                selectedDepartment.isEmpty) {
              messenger.showSnackBar(
                SnackBar(
                  content: const Text('Please fill all required fields'),
                  backgroundColor: AppColors.error,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              );
              return;
            }

            final parsedCredits = int.tryParse(creditsController.text.trim());
            if (parsedCredits == null) {
              messenger.showSnackBar(
                SnackBar(
                  content: const Text('Credits must be a valid number'),
                  backgroundColor: AppColors.error,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              );
              return;
            }

            final semRaw = semesterNumberController.text.trim();
            final parsedSemester = semRaw.isEmpty ? null : int.tryParse(semRaw);
            if (semRaw.isNotEmpty && parsedSemester == null) {
              messenger.showSnackBar(
                SnackBar(
                  content: const Text('Semester number must be a valid number'),
                  backgroundColor: AppColors.error,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              );
              return;
            }

            setSheetState(() {
              isUpdating = true;
            });

            try {
              await _courseRepository.updateCourse(
                courseId: courseId,
                department: selectedDepartment,
                code: codeController.text.trim().toUpperCase(),
                name: nameController.text.trim(),
                description: descriptionController.text.trim(),
                credits: parsedCredits,
                semester: parsedSemester,
                semesterAvailable: selectedSemester.isEmpty
                    ? null
                    : selectedSemester,
                instructor: selectedInstructor.isEmpty
                    ? null
                    : selectedInstructor,
                facultyAvailable: selectedFaculty.isEmpty
                    ? null
                    : selectedFaculty,
                maxCapacity: int.tryParse(maxCapacityController.text.trim()),
                syllabus: syllabusController.text.trim().isEmpty
                    ? null
                    : syllabusController.text.trim(),
              );

              if (!mounted) return;

              sheetNavigator.pop();

              messenger.showSnackBar(
                SnackBar(
                  content: Text('$successLabel updated successfully'),
                  backgroundColor: AppColors.success,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              );

              await _loadCourses();
            } catch (e) {
              if (!mounted) return;

              setSheetState(() {
                isUpdating = false;
              });

              messenger.showSnackBar(
                SnackBar(
                  content: Text('Failed to update: ${e.toString()}'),
                  backgroundColor: AppColors.error,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              );
            }
          }

          return DraggableScrollableSheet(
            initialChildSize: 0.9,
            minChildSize: 0.55,
            maxChildSize: 0.97,
            expand: false,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 12),
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: AppColors.borderDark.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                    Expanded(
                      child: SingleChildScrollView(
                        controller: scrollController,
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.primary.withValues(alpha: 0.14),
                                    AppColors.primaryLight.withValues(
                                      alpha: 0.08,
                                    ),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: AppColors.primary.withValues(
                                    alpha: 0.2,
                                  ),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppColors.primary.withValues(
                                            alpha: 0.15,
                                          ),
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                        child: Text(
                                          code,
                                          style: const TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      if (credits != '-')
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 10,
                                            vertical: 5,
                                          ),
                                          decoration: BoxDecoration(
                                            color: AppColors.surface,
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: Text(
                                            '$credits credits',
                                            style: const TextStyle(
                                              color: AppColors.textPrimary,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    displayName,
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                      letterSpacing: -0.4,
                                    ),
                                  ),
                                  if (programDescription != '-') ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      programDescription,
                                      style: TextStyle(
                                        color: AppColors.textSecondary
                                            .withValues(alpha: 0.9),
                                        fontSize: 14,
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 18),
                            Text(
                              'Uploaded $programLabel Content',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 10),
                            if (documents.isEmpty)
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.cardBackground,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.25,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  'No uploaded content available for this $programLabel yet.',
                                  style: TextStyle(
                                    color: AppColors.textSecondary.withValues(
                                      alpha: 0.85,
                                    ),
                                    fontSize: 13,
                                  ),
                                ),
                              )
                            else
                              ...documents.map(_buildCourseDocumentCard),
                            const SizedBox(height: 10),
                            const Text(
                              'Edit Course',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: codeController,
                                    textCapitalization:
                                        TextCapitalization.characters,
                                    decoration: InputDecoration(
                                      labelText: 'Code *',
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextField(
                                    controller: creditsController,
                                    keyboardType: TextInputType.number,
                                    decoration: InputDecoration(
                                      labelText: 'Credits *',
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: nameController,
                              decoration: InputDecoration(
                                labelText: 'Name *',
                                filled: true,
                                fillColor: AppColors.cardBackground,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: descriptionController,
                              maxLines: 3,
                              decoration: InputDecoration(
                                labelText: 'Description',
                                filled: true,
                                fillColor: AppColors.cardBackground,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    initialValue: selectedDepartment.isEmpty
                                        ? null
                                        : selectedDepartment,
                                    isExpanded: true,
                                    decoration: InputDecoration(
                                      labelText:
                                          '${TerminologyService.getOrganizationalUnitLabel(context)} *',
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    items: _departments
                                        .map(
                                          (dept) => DropdownMenuItem<String>(
                                            value:
                                                dept['_id']?.toString() ?? '',
                                            child: Text(
                                              dept['name']?.toString() ?? '',
                                            ),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (value) {
                                      setSheetState(() {
                                        selectedDepartment = value ?? '';
                                      });
                                    },
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    initialValue: selectedSemester.isEmpty
                                        ? null
                                        : selectedSemester,
                                    isExpanded: true,
                                    decoration: InputDecoration(
                                      labelText:
                                          TerminologyService.getTimePeriodLabel(
                                            context,
                                          ),
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    items: _semesters
                                        .map(
                                          (sem) => DropdownMenuItem<String>(
                                            value: sem['_id']?.toString() ?? '',
                                            child: Text(
                                              sem['name']?.toString() ?? '',
                                            ),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (value) {
                                      setSheetState(() {
                                        selectedSemester = value ?? '';
                                      });
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: semesterNumberController,
                                    keyboardType: TextInputType.number,
                                    decoration: InputDecoration(
                                      labelText: 'Semester Number',
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextField(
                                    controller: maxCapacityController,
                                    keyboardType: TextInputType.number,
                                    decoration: InputDecoration(
                                      labelText: 'Max Capacity',
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    initialValue: selectedInstructor.isEmpty
                                        ? null
                                        : selectedInstructor,
                                    isExpanded: true,
                                    decoration: InputDecoration(
                                      labelText: 'Instructor',
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    items: _facultyMembers
                                        .map(
                                          (faculty) => DropdownMenuItem<String>(
                                            value:
                                                faculty['_id']?.toString() ??
                                                '',
                                            child: Text(
                                              faculty['fullName']?.toString() ??
                                                  'Unknown',
                                            ),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (value) {
                                      setSheetState(() {
                                        selectedInstructor = value ?? '';
                                      });
                                    },
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    initialValue: selectedFaculty.isEmpty
                                        ? null
                                        : selectedFaculty,
                                    isExpanded: true,
                                    decoration: InputDecoration(
                                      labelText: 'Faculty Available',
                                      filled: true,
                                      fillColor: AppColors.cardBackground,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    items: _facultyMembers
                                        .map(
                                          (faculty) => DropdownMenuItem<String>(
                                            value:
                                                faculty['_id']?.toString() ??
                                                '',
                                            child: Text(
                                              faculty['fullName']?.toString() ??
                                                  'Unknown',
                                            ),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (value) {
                                      setSheetState(() {
                                        selectedFaculty = value ?? '';
                                      });
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: syllabusController,
                              maxLines: 4,
                              decoration: InputDecoration(
                                labelText: 'Syllabus / Course Outline',
                                filled: true,
                                fillColor: AppColors.cardBackground,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: isUpdating
                                        ? null
                                        : () => Navigator.pop(context),
                                    child: const Text('Close'),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: isUpdating ? null : handleUpdate,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                    ),
                                    child: isUpdating
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                    Colors.white,
                                                  ),
                                            ),
                                          )
                                        : const Text('Update'),
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
              );
            },
          );
        },
      ),
    ).whenComplete(() {
      codeController.dispose();
      nameController.dispose();
      descriptionController.dispose();
      creditsController.dispose();
      semesterNumberController.dispose();
      maxCapacityController.dispose();
      syllabusController.dispose();
    });
  }

  List<Map<String, dynamic>> get _filteredCourses {
    final query = _searchController.text.trim();
    var filtered = _courses;

    // Filter by search text
    if (query.isNotEmpty) {
      filtered = filtered.where((course) {
        return FuzzySearch.matchesAny([
          (course['name'] ?? '').toString(),
          (course['code'] ?? '').toString(),
        ], query);
      }).toList();
    }

    // Filter by department — course['department'] may be a populated object {_id, name} or raw ID string
    if (_selectedDepartment != 'all') {
      filtered = filtered.where((course) {
        final dept = course['department'];
        if (dept == null) return false;
        if (dept is Map) {
          return dept['_id']?.toString() == _selectedDepartment ||
              dept['name']?.toString() == _selectedDepartment;
        }
        return dept.toString() == _selectedDepartment;
      }).toList();
    }

    // Filter by semester — course['semesterAvailable'] may be populated or raw ID
    if (_selectedSemester != 'all') {
      filtered = filtered.where((course) {
        final sem = course['semesterAvailable'];
        if (sem == null) return false;
        if (sem is Map) {
          return sem['_id']?.toString() == _selectedSemester ||
              sem['name']?.toString() == _selectedSemester;
        }
        return sem.toString() == _selectedSemester;
      }).toList();
    }

    return filtered;
  }

  @override
  void dispose() {
    _searchController.dispose();
    _nameController.dispose();
    _codeController.dispose();
    _descriptionController.dispose();
    _creditsController.dispose();
    _semesterNumberController.dispose();
    _maxCapacityController.dispose();
    _syllabusController.dispose();
    super.dispose();
  }

  void _showAddCourseDialog([Map<String, dynamic>? course, int? index]) {
    final isEditing = course != null;

    if (isEditing) {
      _nameController.text = course['name'];
      _codeController.text = course['code'];
      _descriptionController.text = course['description'] ?? '';
      _creditsController.text = course['credits']?.toString() ?? '';
      _semesterNumberController.text = course['semester']?.toString() ?? '';
      _maxCapacityController.text = course['maxCapacity']?.toString() ?? '';
      _syllabusController.text = course['syllabus']?.toString() ?? '';
      _selectedCourseDepartment = _extractId(course['department']);
      _selectedCourseSemester = _extractId(course['semesterAvailable']);
      _selectedCourseInstructor = _extractId(course['instructor']);
      _selectedCourseFaculty = _extractId(course['facultyAvailable']);
    } else {
      _nameController.clear();
      _codeController.clear();
      _descriptionController.clear();
      _creditsController.clear();
      _semesterNumberController.clear();
      _selectedCourseDepartment = '';
      _selectedCourseSemester = '';
      _selectedCourseInstructor = '';
      _selectedCourseFaculty = '';
      _maxCapacityController.clear();
      _syllabusController.clear();
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
            initialChildSize: 0.75,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) => Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(28),
                ),
              ),
              child: Column(
                children: [
                  // Drag handle — tapping dismisses the sheet
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 14),
                      width: 45,
                      height: 5,
                      decoration: BoxDecoration(
                        color: AppColors.borderDark.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(3),
                      ),
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
                            isEditing
                                ? 'Update ${TerminologyService.getLearningProgramLabel(context)}'
                                : 'Add ${TerminologyService.getLearningProgramLabel(context)}',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            isEditing
                                ? 'Update ${TerminologyService.getLearningProgramLabel(context).toLowerCase()} information'
                                : 'Create a new ${TerminologyService.getLearningProgramLabel(context).toLowerCase()}',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary.withValues(
                                alpha: 0.8,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${TerminologyService.getLearningProgramFields(context).codeLabel} *',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextField(
                                      controller: _codeController,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                      ),
                                      textCapitalization:
                                          TextCapitalization.characters,
                                      decoration: InputDecoration(
                                        hintText: 'e.g., CS101',
                                        hintStyle: TextStyle(
                                          color: AppColors.textTertiary
                                              .withValues(alpha: 0.5),
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
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${TerminologyService.getLearningProgramFields(context).creditsLabel} *',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextField(
                                      controller: _creditsController,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                      ),
                                      keyboardType: TextInputType.number,
                                      decoration: InputDecoration(
                                        hintText: '3',
                                        hintStyle: TextStyle(
                                          color: AppColors.textTertiary
                                              .withValues(alpha: 0.5),
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
                          const SizedBox(height: 20),
                          Text(
                            '${TerminologyService.getLearningProgramFields(context).nameLabel} *',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _nameController,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                            ),
                            decoration: InputDecoration(
                              hintText: 'e.g., Introduction to Programming',
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
                          const Text(
                            'Description',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _descriptionController,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 4,
                            decoration: InputDecoration(
                              hintText: 'Brief description of the course...',
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
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${TerminologyService.getOrganizationalUnitLabel(context)} *',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    StatefulBuilder(
                                      builder: (context, setDropdownState) =>
                                          Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.cardBackground,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: AppColors.borderDark
                                                    .withValues(alpha: 0.3),
                                              ),
                                            ),
                                            child: DropdownButtonHideUnderline(
                                              child: DropdownButton<String>(
                                                value:
                                                    _selectedCourseDepartment
                                                        .isEmpty
                                                    ? ''
                                                    : _selectedCourseDepartment,
                                                isExpanded: true,
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 16,
                                                      vertical: 4,
                                                    ),
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                                dropdownColor:
                                                    AppColors.cardBackground,
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 16,
                                                ),
                                                items: [
                                                  DropdownMenuItem(
                                                    value: '',
                                                    child: Text(
                                                      'Select ${TerminologyService.getOrganizationalUnitLabel(context)}',
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: TextStyle(
                                                        color: AppColors
                                                            .textSecondary
                                                            .withValues(
                                                              alpha: 0.6,
                                                            ),
                                                      ),
                                                    ),
                                                  ),
                                                  ..._departments.map(
                                                    (dept) => DropdownMenuItem(
                                                      value:
                                                          dept['_id']
                                                              ?.toString() ??
                                                          '',
                                                      child: Text(
                                                        dept['name']
                                                                ?.toString() ??
                                                            '',
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                                onChanged: (value) {
                                                  setDropdownState(() {
                                                    _selectedCourseDepartment =
                                                        value!;
                                                  });
                                                  setState(() {
                                                    _selectedCourseDepartment =
                                                        value!;
                                                  });
                                                },
                                              ),
                                            ),
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 16),
                              // Semester dropdown
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      TerminologyService.getTimePeriodLabel(
                                        context,
                                      ),
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    StatefulBuilder(
                                      builder: (context, setSemDropState) =>
                                          Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.cardBackground,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: AppColors.borderDark
                                                    .withValues(alpha: 0.3),
                                              ),
                                            ),
                                            child: DropdownButtonHideUnderline(
                                              child: DropdownButton<String>(
                                                value:
                                                    _selectedCourseSemester
                                                        .isEmpty
                                                    ? ''
                                                    : _selectedCourseSemester,
                                                isExpanded: true,
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 16,
                                                      vertical: 4,
                                                    ),
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                                dropdownColor:
                                                    AppColors.cardBackground,
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 16,
                                                ),
                                                items: [
                                                  DropdownMenuItem(
                                                    value: '',
                                                    child: Text(
                                                      'Select ${TerminologyService.getTimePeriodLabel(context)}',
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: TextStyle(
                                                        color: AppColors
                                                            .textSecondary
                                                            .withValues(
                                                              alpha: 0.6,
                                                            ),
                                                      ),
                                                    ),
                                                  ),
                                                  ..._semesters.map(
                                                    (sem) => DropdownMenuItem(
                                                      value:
                                                          sem['_id']
                                                              ?.toString() ??
                                                          '',
                                                      child: Text(
                                                        sem['name']
                                                                ?.toString() ??
                                                            '',
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                                onChanged: (value) {
                                                  setSemDropState(() {
                                                    _selectedCourseSemester =
                                                        value!;
                                                  });
                                                  setState(() {
                                                    _selectedCourseSemester =
                                                        value!;
                                                  });
                                                },
                                              ),
                                            ),
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Max Capacity',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextField(
                                      controller: _maxCapacityController,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                      ),
                                      keyboardType: TextInputType.number,
                                      decoration: InputDecoration(
                                        hintText: '60',
                                        hintStyle: TextStyle(
                                          color: AppColors.textTertiary
                                              .withValues(alpha: 0.5),
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
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Semester Number',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextField(
                                      controller: _semesterNumberController,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                      ),
                                      keyboardType: TextInputType.number,
                                      decoration: InputDecoration(
                                        hintText: '1',
                                        hintStyle: TextStyle(
                                          color: AppColors.textTertiary
                                              .withValues(alpha: 0.5),
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
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Instructor',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    StatefulBuilder(
                                      builder: (context, setInstructorState) =>
                                          Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.cardBackground,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: AppColors.borderDark
                                                    .withValues(alpha: 0.3),
                                              ),
                                            ),
                                            child: DropdownButtonHideUnderline(
                                              child: DropdownButton<String>(
                                                value:
                                                    _selectedCourseInstructor
                                                        .isEmpty
                                                    ? ''
                                                    : _selectedCourseInstructor,
                                                isExpanded: true,
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 16,
                                                      vertical: 4,
                                                    ),
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                                dropdownColor:
                                                    AppColors.cardBackground,
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 16,
                                                ),
                                                items: [
                                                  const DropdownMenuItem(
                                                    value: '',
                                                    child: Text(
                                                      'Select Instructor',
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  ..._facultyMembers.map(
                                                    (
                                                      faculty,
                                                    ) => DropdownMenuItem(
                                                      value:
                                                          faculty['_id']
                                                              ?.toString() ??
                                                          '',
                                                      child: Text(
                                                        faculty['fullName']
                                                                ?.toString() ??
                                                            'Unknown',
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                                onChanged: (value) {
                                                  setInstructorState(() {
                                                    _selectedCourseInstructor =
                                                        value!;
                                                  });
                                                  setState(() {
                                                    _selectedCourseInstructor =
                                                        value!;
                                                  });
                                                },
                                              ),
                                            ),
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Faculty Available',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    StatefulBuilder(
                                      builder: (context, setFacultyState) =>
                                          Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.cardBackground,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: AppColors.borderDark
                                                    .withValues(alpha: 0.3),
                                              ),
                                            ),
                                            child: DropdownButtonHideUnderline(
                                              child: DropdownButton<String>(
                                                value:
                                                    _selectedCourseFaculty
                                                        .isEmpty
                                                    ? ''
                                                    : _selectedCourseFaculty,
                                                isExpanded: true,
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 16,
                                                      vertical: 4,
                                                    ),
                                                borderRadius:
                                                    BorderRadius.circular(12),
                                                dropdownColor:
                                                    AppColors.cardBackground,
                                                style: const TextStyle(
                                                  color: AppColors.textPrimary,
                                                  fontSize: 16,
                                                ),
                                                items: [
                                                  const DropdownMenuItem(
                                                    value: '',
                                                    child: Text(
                                                      'Select Faculty',
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                  ..._facultyMembers.map(
                                                    (
                                                      faculty,
                                                    ) => DropdownMenuItem(
                                                      value:
                                                          faculty['_id']
                                                              ?.toString() ??
                                                          '',
                                                      child: Text(
                                                        faculty['fullName']
                                                                ?.toString() ??
                                                            'Unknown',
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                                onChanged: (value) {
                                                  setFacultyState(() {
                                                    _selectedCourseFaculty =
                                                        value!;
                                                  });
                                                  setState(() {
                                                    _selectedCourseFaculty =
                                                        value!;
                                                  });
                                                },
                                              ),
                                            ),
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Syllabus / Course Outline',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _syllabusController,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 4,
                            decoration: InputDecoration(
                              hintText: 'Enter course syllabus or outline...',
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
                          const SizedBox(height: 28),
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
                                      _updateCourse(index!);
                                    } else {
                                      _createCourse();
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
    );
  }

  Future<void> _createCourse() async {
    if (_nameController.text.trim().isEmpty ||
        _codeController.text.trim().isEmpty ||
        _creditsController.text.trim().isEmpty ||
        _selectedCourseDepartment.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please fill all required fields'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final credits = int.tryParse(_creditsController.text.trim());
    if (credits == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Credits must be a valid number'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final semesterRaw = _semesterNumberController.text.trim();
    final semester = semesterRaw.isEmpty ? null : int.tryParse(semesterRaw);
    if (semesterRaw.isNotEmpty && semester == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Semester number must be a valid number'),
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

    // Find department ID from selected department ID
    final selectedDept = _departments.firstWhere(
      (dept) => dept['_id']?.toString() == _selectedCourseDepartment,
      orElse: () => <String, dynamic>{},
    );

    final departmentId = selectedDept['_id']?.toString();
    if (departmentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Error: Invalid department selected'),
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
      await _courseRepository.createCourse(
        institutionId: institutionId,
        departmentId: departmentId,
        name: _nameController.text.trim(),
        code: _codeController.text.trim().toUpperCase(),
        credits: credits,
        description: _descriptionController.text.trim(),
        semester: semester,
        semesterAvailable: _selectedCourseSemester.isEmpty
            ? null
            : _selectedCourseSemester,
        instructor: _selectedCourseInstructor.isEmpty
            ? null
            : _selectedCourseInstructor,
        facultyAvailable: _selectedCourseFaculty.isEmpty
            ? null
            : _selectedCourseFaculty,
        maxCapacity: int.tryParse(_maxCapacityController.text.trim()),
        syllabus: _syllabusController.text.trim().isEmpty
            ? null
            : _syllabusController.text.trim(),
      );

      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${TerminologyService.getLearningProgramLabel(context)} created successfully',
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );

      // Refresh courses list
      await _loadCourses();
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      print('Error creating course: $e');
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

  Future<void> _updateCourse(int index) async {
    if (_nameController.text.trim().isEmpty ||
        _codeController.text.trim().isEmpty ||
        _creditsController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please fill all required fields'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final credits = int.tryParse(_creditsController.text.trim());
    if (credits == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Credits must be a valid number'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final semesterRaw = _semesterNumberController.text.trim();
    final semester = semesterRaw.isEmpty ? null : int.tryParse(semesterRaw);
    if (semesterRaw.isNotEmpty && semester == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Semester number must be a valid number'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    final courseId = _courses[index]['_id']?.toString();
    if (courseId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Error: Invalid course ID'),
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
      await _courseRepository.updateCourse(
        courseId: courseId,
        department: _selectedCourseDepartment.isEmpty
            ? null
            : _selectedCourseDepartment,
        name: _nameController.text.trim(),
        code: _codeController.text.trim().toUpperCase(),
        credits: credits,
        description: _descriptionController.text.trim(),
        semester: semester,
        semesterAvailable: _selectedCourseSemester.isEmpty
            ? null
            : _selectedCourseSemester,
        instructor: _selectedCourseInstructor.isEmpty
            ? null
            : _selectedCourseInstructor,
        facultyAvailable: _selectedCourseFaculty.isEmpty
            ? null
            : _selectedCourseFaculty,
        maxCapacity: int.tryParse(_maxCapacityController.text.trim()),
        syllabus: _syllabusController.text.trim().isEmpty
            ? null
            : _syllabusController.text.trim(),
      );

      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${TerminologyService.getLearningProgramLabel(context)} updated successfully',
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );

      // Refresh courses list
      await _loadCourses();
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog
      Navigator.pop(context);

      print('Error updating course: $e');
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

  String _getInitials(String name) {
    final words = name.trim().split(RegExp(r'\s+'));
    if (words.isEmpty) return '';
    if (words.length == 1) return words[0].substring(0, 1).toUpperCase();
    return (words[0].substring(0, 1) + words[1].substring(0, 1)).toUpperCase();
  }

  Future<void> _deleteCourse(int index) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final programLabel = TerminologyService.getLearningProgramLabel(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Delete ${TerminologyService.getLearningProgramLabel(context)}',
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          'Are you sure you want to delete "${_courses[index]['name']}"?',
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

    final courseId = _courses[index]['_id']?.toString();
    if (courseId == null) {
      messenger.showSnackBar(
        SnackBar(
          content: const Text('Error: Invalid course ID'),
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
      await _courseRepository.deleteCourse(courseId);

      if (!mounted) return;

      // Close loading dialog
      navigator.pop();

      messenger.showSnackBar(
        SnackBar(
          content: Text('$programLabel deleted successfully'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );

      // Refresh courses list
      await _loadCourses();
    } catch (e) {
      if (!mounted) return;

      // Close loading dialog
      navigator.pop();

      print('Error deleting course: $e');
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
        onRefresh: _loadCourses,
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
                        Icons.book_outlined,
                        size: 32,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Courses',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            TerminologyService.getLearningProgramDescription(
                              context,
                            ),
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
                      hintText:
                          'Search ${TerminologyService.getLearningProgramLabel(context, plural: true).toLowerCase()}...',
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
              const SizedBox(height: 16),

              // Filter Row
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.cardBackground,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.borderDark.withValues(alpha: 0.3),
                        ),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedDepartment,
                          isExpanded: true,
                          dropdownColor: AppColors.surface,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                          ),
                          icon: Icon(
                            Icons.arrow_drop_down,
                            color: AppColors.textTertiary.withValues(
                              alpha: 0.6,
                            ),
                          ),
                          items: [
                            DropdownMenuItem(
                              value: 'all',
                              child: Text(
                                'All ${TerminologyService.getOrganizationalUnitLabel(context, plural: true)}',
                              ),
                            ),
                            ..._departments.map(
                              (dept) => DropdownMenuItem(
                                value: dept['_id']?.toString() ?? dept['name'],
                                child: Text(
                                  dept['name']?.toString() ?? '',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedDepartment = value!;
                            });
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppColors.cardBackground,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.borderDark.withValues(alpha: 0.3),
                        ),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedSemester,
                          isExpanded: true,
                          dropdownColor: AppColors.surface,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                          ),
                          icon: Icon(
                            Icons.arrow_drop_down,
                            color: AppColors.textTertiary.withValues(
                              alpha: 0.6,
                            ),
                          ),
                          items: [
                            DropdownMenuItem(
                              value: 'all',
                              child: Text(
                                'All ${TerminologyService.getTimePeriodLabel(context, plural: true)}',
                              ),
                            ),
                            ..._semesters.map(
                              (semester) => DropdownMenuItem(
                                value:
                                    semester['_id']?.toString() ??
                                    semester['name'],
                                child: Text(
                                  semester['name']?.toString() ?? '',
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedSemester = value!;
                            });
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: 200,
                  maxHeight: MediaQuery.of(context).size.height - 400,
                ),
                child: _courses.isEmpty
                    ? _buildEmptyState()
                    : _filteredCourses.isEmpty
                    ? _buildNoResultsState()
                    : _buildCoursesList(),
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
                onPressed: _showAddCourseDialog,
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
                Icons.book_outlined,
                size: 48,
                color: AppColors.primary.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'No courses yet',
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
                'Get started by creating your first course to organize your curriculum.',
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

  Widget _buildNoResultsState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(bottom: 60, left: 24, right: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.textSecondary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(40),
              ),
              child: Icon(
                Icons.search_off_rounded,
                size: 40,
                color: AppColors.textSecondary.withValues(alpha: 0.4),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'No courses match your filters',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                letterSpacing: -0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Try changing the department or semester filter.',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary.withValues(alpha: 0.7),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCoursesList() {
    final filteredCourses = _filteredCourses;
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.9,
      ),
      itemCount: filteredCourses.length,
      itemBuilder: (context, index) {
        final course = filteredCourses[index];
        final initials = _getInitials(course['name']);
        final courseId = course['_id']?.toString();
        final sourceIndex = _courses.indexWhere(
          (item) => item['_id']?.toString() == courseId,
        );

        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _showCourseDetails(course),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppColors.borderDark.withValues(alpha: 0.3),
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
              child: Stack(
                children: [
                  // Main content - centered
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Circular avatar with initials
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primary.withValues(alpha: 0.2),
                                AppColors.primaryLight.withValues(alpha: 0.1),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.4),
                              width: 2,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              initials,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Course name
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            course['name'],
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.3,
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (!widget.readOnly)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: sourceIndex >= 0
                              ? () => _deleteCourse(sourceIndex)
                              : null,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppColors.error,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.error.withValues(alpha: 0.4),
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
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
