import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:excel/excel.dart' as excel_pkg;
import 'package:csv/csv.dart';
import 'dart:io';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../data/repositories/invitation_repository.dart';
import '../../../institution/data/repositories/institution_admin_repository.dart';
import '../../../institution/data/repositories/department_repository.dart';
import '../../../institution/data/repositories/semester_repository.dart';
import '../../../institution/data/repositories/course_repository.dart';
import '../../../../core/services/terminology_service.dart';

enum InviteSection { teachers, students }

enum EntryMethod { csvUpload, manual }

class InvitePeoplePage extends StatefulWidget {
  const InvitePeoplePage({super.key});

  @override
  State<InvitePeoplePage> createState() => _InvitePeoplePageState();
}

class _InvitePeoplePageState extends State<InvitePeoplePage> {
  final _invitationRepository = getIt<InvitationRepository>();
  final _institutionRepository = getIt<InstitutionAdminRepository>();
  final _departmentRepository = getIt<DepartmentRepository>();
  final _semesterRepository = getIt<SemesterRepository>();
  final _courseRepository = getIt<CourseRepository>();
  final _storage = getIt<HiveStorageService>();
  InviteSection _selectedSection = InviteSection.students;
  EntryMethod _selectedEntryMethod = EntryMethod.csvUpload;
  String? _selectedFileName;
  List<Map<String, String>> _extractedUsers = [];
  bool _isProcessing = false;

  // Academic data
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _semesters = [];
  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _filteredCourses = [];
  String _selectedDepartment = '';
  String _selectedSemester = '';
  List<String> _selectedCourses = [];

  // Admin invitation status tracking
  List<Map<String, dynamic>> _adminInvitations = [];
  bool _isLoadingInvitations = false;
  String _inviteStatusFilter = 'all'; // all | pending | accepted | rejected
  String _inviteRoleFilter = 'all'; // all | Student | Teacher

  // Manual entry form controllers
  final _formKey = GlobalKey<FormState>();
  final _emailOrUsernameController = TextEditingController();
  final _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadAcademicData();
  }

  Future<void> _loadAcademicData() async {
    final currentUser = _storage.getCurrentUser();
    final institutionId = currentUser?.institutionId;

    if (institutionId == null) return;

    try {
      // Load departments, semesters, and courses in parallel
      final results = await Future.wait([
        _departmentRepository.getDepartments(institutionId),
        _semesterRepository.getSemesters(institutionId),
        _courseRepository.getCourses(institutionId),
      ]);

      final deptResponse = results[0];
      final semResponse = results[1];
      final courseResponse = results[2];

      setState(() {
        _departments = (deptResponse['data'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _semesters = (semResponse['data'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _courses = (courseResponse['courses'] as List? ?? [])
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      });

      print(
        '✅ Loaded academic data: ${_departments.length} depts, ${_semesters.length} semesters, ${_courses.length} courses',
      );

      // Debug: Print first course structure if available
      if (_courses.isNotEmpty) {
        final firstCourse = _courses.first;
        print('📚 Sample course structure:');
        print('  Name: ${firstCourse['name']}');
        print('  Code: ${firstCourse['code']}');
        print('  Department: ${firstCourse['department']}');
        print('  Semester Available: ${firstCourse['semesterAvailable']}');
      }
    } catch (e) {
      print('❌ Error loading academic data: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load academic data: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _filterCourses() {
    if (_selectedDepartment.isEmpty || _selectedSemester.isEmpty) {
      setState(() => _filteredCourses = []);
      return;
    }

    print('🔍 Filtering courses...');
    print('Selected Department ID: $_selectedDepartment');
    print('Selected Semester ID: $_selectedSemester');
    print('Total courses available: ${_courses.length}');

    final filtered = _courses.where((course) {
      // Extract department ID
      String? courseDeptId;
      final dept = course['department'];
      if (dept is Map) {
        courseDeptId = dept['_id']?.toString();
      } else if (dept != null) {
        courseDeptId = dept.toString();
      }

      // Extract semester ID
      String? courseSemId;
      final sem = course['semesterAvailable'];
      if (sem is Map) {
        courseSemId = sem['_id']?.toString();
      } else if (sem != null) {
        courseSemId = sem.toString();
      }

      final deptMatch = courseDeptId == _selectedDepartment;
      final semMatch = courseSemId == _selectedSemester;

      if (deptMatch || semMatch) {
        print(
          '  Course: ${course['name']} - Dept Match: $deptMatch (${courseDeptId}), Sem Match: $semMatch (${courseSemId})',
        );
      }

      return deptMatch && semMatch;
    }).toList();

    print('✅ Filtered courses: ${filtered.length}');
    setState(() => _filteredCourses = filtered);
  }

  @override
  void dispose() {
    _emailOrUsernameController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _pickExcelFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'xls', 'csv'],
      );

      if (result != null) {
        setState(() {
          _selectedFileName = result.files.single.name;
        });

        final filePath = result.files.single.path!;
        final extension = result.files.single.extension?.toLowerCase();

        // Parse file based on extension
        List<Map<String, String>> users = [];
        if (extension == 'csv') {
          users = await _parseCSVFile(filePath);
        } else if (extension == 'xlsx' || extension == 'xls') {
          users = await _parseExcelFile(filePath);
        }

        setState(() {
          _extractedUsers = users;
        });

        if (mounted && users.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${users.length} users extracted from file'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        final errorMessage = e is ApiException
            ? e.message
            : 'Error processing file';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<List<Map<String, String>>> _parseExcelFile(String filePath) async {
    try {
      final bytes = File(filePath).readAsBytesSync();
      final excel = excel_pkg.Excel.decodeBytes(bytes);

      final users = <Map<String, String>>[];

      // Get first sheet
      final sheet = excel.tables.keys.first;
      final table = excel.tables[sheet];

      if (table != null && table.rows.length > 1) {
        // Expected columns: emailOrUsername, message (optional)
        for (var i = 1; i < table.rows.length; i++) {
          final row = table.rows[i];
          if (row.isNotEmpty) {
            final emailOrUsername = row[0]?.value?.toString().trim() ?? '';
            final message = row.length > 1
                ? (row[1]?.value?.toString().trim() ?? '')
                : '';

            if (emailOrUsername.isNotEmpty) {
              users.add({
                'emailOrUsername': emailOrUsername,
                'message': message.isEmpty
                    ? 'You are invited to join the institution'
                    : message,
              });
            }
          }
        }
      }

      print('📊 Parsed Excel: Found ${users.length} users');
      return users.take(100).toList(); // Limit to 100
    } catch (e) {
      print('❌ Error parsing Excel: $e');
      rethrow;
    }
  }

  Future<List<Map<String, String>>> _parseCSVFile(String filePath) async {
    try {
      final input = File(filePath).readAsStringSync();
      final rows = const CsvToListConverter().convert(input);

      final users = <Map<String, String>>[];

      // Skip header row, start from row 1
      for (var i = 1; i < rows.length; i++) {
        if (rows[i].isNotEmpty) {
          final emailOrUsername = rows[i][0]?.toString().trim() ?? '';
          final message = rows[i].length > 1
              ? (rows[i][1]?.toString().trim() ?? '')
              : '';

          if (emailOrUsername.isNotEmpty) {
            users.add({
              'emailOrUsername': emailOrUsername,
              'message': message.isEmpty
                  ? 'You are invited to join the institution'
                  : message,
            });
          }
        }
      }

      print('📊 Parsed CSV: Found ${users.length} users');
      return users.take(100).toList(); // Limit to 100
    } catch (e) {
      print('❌ Error parsing CSV: $e');
      rethrow;
    }
  }

  Future<void> _downloadTemplate() async {
    try {
      // Load template from assets
      final ByteData data = await rootBundle.load('assets/template_file.xlsx');
      final List<int> bytes = data.buffer.asUint8List();

      // Let user choose where to save the file (bytes required for Android/iOS)
      String? outputPath = await FilePicker.platform.saveFile(
        dialogTitle: 'Save Template',
        fileName: 'Cortexa_Invitation_Template.xlsx',
        type: FileType.custom,
        allowedExtensions: ['xlsx'],
        bytes: Uint8List.fromList(bytes),
      );

      if (outputPath == null) {
        // User canceled the save dialog
        print('📥 Download canceled by user');
        return;
      }

      print('📥 Template saved to: $outputPath');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Template downloaded successfully',
                    style: TextStyle(fontSize: 13, height: 1.4),
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.success,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      print('❌ Download error: $e');
      if (mounted) {
        final errorMessage = e is ApiException
            ? e.message
            : 'Download failed. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    errorMessage,
                    style: const TextStyle(fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  /// Checks whether the entered email/username belongs to a user who is
  /// already a member of this institution under a DIFFERENT role.
  /// Returns a descriptive error string if a mismatch is found, null otherwise.
  Future<String?> _checkRoleMismatch(
    String identifier,
    String institutionId,
  ) async {
    final normalizedId = identifier.toLowerCase().trim();
    final isInvitingStudent = _selectedSection == InviteSection.students;
    final oppositeRole = isInvitingStudent ? 'Teacher' : 'Student';

    try {
      // Fetch the OPPOSITE roster — students if inviting teacher, teachers if inviting student
      final oppositeList = isInvitingStudent
          ? await _institutionRepository.getInstitutionTeachers(institutionId)
          : await _institutionRepository.getInstitutionStudents(institutionId);

      for (final member in oppositeList) {
        final email = (member['email'] as String? ?? '').toLowerCase();
        final username = (member['username'] as String? ?? '').toLowerCase();
        if (email == normalizedId || username == normalizedId) {
          return 'This user is already a $oppositeRole in your institution. '
              'Please switch to the ${oppositeRole}s tab to manage them.';
        }
      }
    } catch (_) {
      // If roster fetch fails, silently allow — don't block the invite
    }
    return null;
  }

  Future<void> _addManually() async {
    if (!_formKey.currentState!.validate()) return;

    // Check if student is trying to invite teachers
    final currentUser = _storage.getCurrentUser();
    if (currentUser?.institutionRole?.toLowerCase() == 'student' &&
        _selectedSection == InviteSection.teachers) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Students are not allowed to invite teachers'),
          backgroundColor: AppColors.error,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    // Validate department and semester selection
    if (_selectedDepartment.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a department'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_selectedSemester.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a semester'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // For teachers, validate course selection
    if (_selectedSection == InviteSection.teachers &&
        _selectedCourses.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one course for the teacher'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null) {
        throw Exception('Institution not found');
      }

      // ✅ Flutter-side role mismatch check — query the opposing roster
      final roleMismatchError = await _checkRoleMismatch(
        _emailOrUsernameController.text.trim(),
        institutionId,
      );
      if (roleMismatchError != null) {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      roleMismatchError,
                      style: const TextStyle(fontSize: 13, height: 1.4),
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.warning,
              duration: const Duration(seconds: 6),
            ),
          );
        }
        return;
      }

      final recipientType = _selectedSection == InviteSection.students
          ? 'Student'
          : 'Teacher';

      await _invitationRepository.createInvitation(
        institutionId: institutionId,
        recipientType: recipientType,
        emailOrUsername: _emailOrUsernameController.text.trim(),
        message: _messageController.text.trim().isEmpty
            ? null
            : _messageController.text.trim(),
        department: _selectedDepartment,
        semester: _selectedSemester,
        courses: _selectedSection == InviteSection.teachers
            ? _selectedCourses
            : null,
      );

      setState(() => _isProcessing = false);

      // Clear form
      _emailOrUsernameController.clear();
      _messageController.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                const Expanded(child: Text('Invitation sent successfully!')),
              ],
            ),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);

      if (mounted) {
        final errorMessage = e is ApiException
            ? e.message
            : e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text(errorMessage)),
              ],
            ),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  /// Show bottom sheet with all admin invitations, with status and role filters
  Future<void> _showInvitationStatusSheet() async {
    // Reset filters and load
    _inviteStatusFilter = 'all';
    _inviteRoleFilter = 'all';
    await _fetchAdminInvitations();

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Align(
          alignment: Alignment.bottomCenter,
          child: StatefulBuilder(
            builder: (ctx, setSheetState) {
              Future<void> reload() async {
                setSheetState(() => _isLoadingInvitations = true);
                final invitations = await _invitationRepository
                    .getAdminInvitations(
                      status: _inviteStatusFilter == 'all'
                          ? null
                          : _inviteStatusFilter,
                      recipientType: _inviteRoleFilter == 'all'
                          ? null
                          : _inviteRoleFilter,
                    );
                setSheetState(() {
                  _adminInvitations = invitations;
                  _isLoadingInvitations = false;
                });
              }

              return DraggableScrollableSheet(
                initialChildSize: 0.85,
                maxChildSize: 0.95,
                minChildSize: 0.5,
                builder: (_, scrollController) {
                  return Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(24),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.15),
                          blurRadius: 20,
                          offset: const Offset(0, -4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Handle + Header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                          child: Column(
                            children: [
                              Center(
                                child: Container(
                                  width: 40,
                                  height: 4,
                                  decoration: BoxDecoration(
                                    color: AppColors.borderDark.withValues(
                                      alpha: 0.4,
                                    ),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(
                                        alpha: 0.1,
                                      ),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(
                                      Icons.mail_outline,
                                      color: AppColors.primary,
                                      size: 22,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  const Expanded(
                                    child: Text(
                                      'Invitation Status',
                                      style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.close),
                                    color: AppColors.textSecondary,
                                    onPressed: () => Navigator.pop(ctx),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              // Status filter chips
                              SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                child: Row(
                                  children:
                                      [
                                        'all',
                                        'pending',
                                        'accepted',
                                        'rejected',
                                      ].map((status) {
                                        final isSelected =
                                            _inviteStatusFilter == status;
                                        return Padding(
                                          padding: const EdgeInsets.only(
                                            right: 8,
                                          ),
                                          child: FilterChip(
                                            label: Text(
                                              status.toUpperCase(),
                                              style: TextStyle(
                                                color: isSelected
                                                    ? Colors.white
                                                    : AppColors.textSecondary,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 12,
                                              ),
                                            ),
                                            selected: isSelected,
                                            onSelected: (_) {
                                              _inviteStatusFilter = status;
                                              reload();
                                            },
                                            backgroundColor:
                                                AppColors.cardBackground,
                                            selectedColor: AppColors.primary,
                                            checkmarkColor: Colors.white,
                                            showCheckmark: false,
                                            side: BorderSide(
                                              color: isSelected
                                                  ? AppColors.primary
                                                  : AppColors.borderDark
                                                        .withValues(alpha: 0.3),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                ),
                              ),
                              const SizedBox(height: 8),
                              // Role filter chips
                              SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                child: Row(
                                  children:
                                      [
                                        {'label': 'ALL ROLES', 'value': 'all'},
                                        {
                                          'label': 'STUDENT',
                                          'value': 'Student',
                                        },
                                        {
                                          'label': 'TEACHER',
                                          'value': 'Teacher',
                                        },
                                      ].map((role) {
                                        final isSelected =
                                            _inviteRoleFilter == role['value'];
                                        return Padding(
                                          padding: const EdgeInsets.only(
                                            right: 8,
                                          ),
                                          child: FilterChip(
                                            label: Text(
                                              role['label']!,
                                              style: TextStyle(
                                                color: isSelected
                                                    ? Colors.white
                                                    : AppColors.textSecondary,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 12,
                                              ),
                                            ),
                                            selected: isSelected,
                                            onSelected: (_) {
                                              _inviteRoleFilter =
                                                  role['value']!;
                                              reload();
                                            },
                                            backgroundColor:
                                                AppColors.cardBackground,
                                            selectedColor: const Color(
                                              0xFF3B82F6,
                                            ),
                                            checkmarkColor: Colors.white,
                                            showCheckmark: false,
                                            side: BorderSide(
                                              color: isSelected
                                                  ? const Color(0xFF3B82F6)
                                                  : AppColors.borderDark
                                                        .withValues(alpha: 0.3),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Divider(
                                color: AppColors.borderDark.withValues(
                                  alpha: 0.2,
                                ),
                                height: 1,
                              ),
                            ],
                          ),
                        ),
                        // Content
                        Expanded(
                          child: _isLoadingInvitations
                              ? const Center(
                                  child: CircularProgressIndicator(
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      AppColors.primary,
                                    ),
                                  ),
                                )
                              : _adminInvitations.isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.mail_outline,
                                        size: 60,
                                        color: AppColors.textTertiary
                                            .withValues(alpha: 0.4),
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'No invitations found',
                                        style: TextStyle(
                                          color: AppColors.textSecondary
                                              .withValues(alpha: 0.7),
                                          fontSize: 16,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Try adjusting your filters',
                                        style: TextStyle(
                                          color: AppColors.textTertiary
                                              .withValues(alpha: 0.5),
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : ListView.separated(
                                  controller: scrollController,
                                  padding: const EdgeInsets.all(16),
                                  itemCount: _adminInvitations.length,
                                  separatorBuilder: (_, __) =>
                                      const SizedBox(height: 8),
                                  itemBuilder: (_, index) {
                                    final inv = _adminInvitations[index];
                                    final status =
                                        inv['status']?.toString() ?? 'pending';
                                    final email =
                                        inv['email']?.toString() ?? '—';
                                    final recipientType =
                                        inv['recipientType']?.toString() ?? '—';
                                    final createdAt = inv['createdAt'] != null
                                        ? DateTime.tryParse(
                                            inv['createdAt'].toString(),
                                          )
                                        : null;
                                    final dateStr = createdAt != null
                                        ? '${createdAt.day}/${createdAt.month}/${createdAt.year}'
                                        : '—';

                                    Color statusColor;
                                    Color statusBg;
                                    IconData statusIcon;
                                    switch (status) {
                                      case 'accepted':
                                        statusColor = AppColors.success;
                                        statusBg = AppColors.success.withValues(
                                          alpha: 0.1,
                                        );
                                        statusIcon = Icons.check_circle_outline;
                                        break;
                                      case 'rejected':
                                        statusColor = AppColors.error;
                                        statusBg = AppColors.error.withValues(
                                          alpha: 0.1,
                                        );
                                        statusIcon = Icons.cancel_outlined;
                                        break;
                                      default:
                                        statusColor = AppColors.warning;
                                        statusBg = AppColors.warning.withValues(
                                          alpha: 0.1,
                                        );
                                        statusIcon = Icons.schedule_outlined;
                                    }

                                    return Container(
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: AppColors.cardBackground,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: AppColors.borderDark
                                              .withValues(alpha: 0.15),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 20,
                                            backgroundColor: AppColors.primary
                                                .withValues(alpha: 0.12),
                                            child: Text(
                                              email.isNotEmpty
                                                  ? email[0].toUpperCase()
                                                  : '?',
                                              style: const TextStyle(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16,
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
                                                  email,
                                                  style: const TextStyle(
                                                    color:
                                                        AppColors.textPrimary,
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 14,
                                                  ),
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                ),
                                                const SizedBox(height: 4),
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding:
                                                          const EdgeInsets.symmetric(
                                                            horizontal: 6,
                                                            vertical: 2,
                                                          ),
                                                      decoration: BoxDecoration(
                                                        color: AppColors.primary
                                                            .withValues(
                                                              alpha: 0.08,
                                                            ),
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              4,
                                                            ),
                                                      ),
                                                      child: Text(
                                                        recipientType,
                                                        style: TextStyle(
                                                          color: AppColors
                                                              .primary
                                                              .withValues(
                                                                alpha: 0.8,
                                                              ),
                                                          fontSize: 10,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 6),
                                                    Text(
                                                      dateStr,
                                                      style: TextStyle(
                                                        color: AppColors
                                                            .textTertiary
                                                            .withValues(
                                                              alpha: 0.7,
                                                            ),
                                                        fontSize: 11,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 4,
                                            ),
                                            decoration: BoxDecoration(
                                              color: statusBg,
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  statusIcon,
                                                  color: statusColor,
                                                  size: 13,
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  status.toUpperCase(),
                                                  style: TextStyle(
                                                    color: statusColor,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Future<void> _fetchAdminInvitations() async {
    setState(() => _isLoadingInvitations = true);
    try {
      final invitations = await _invitationRepository.getAdminInvitations(
        status: _inviteStatusFilter == 'all' ? null : _inviteStatusFilter,
        recipientType: _inviteRoleFilter == 'all' ? null : _inviteRoleFilter,
      );
      setState(() {
        _adminInvitations = invitations;
        _isLoadingInvitations = false;
      });
    } catch (e) {
      setState(() => _isLoadingInvitations = false);
      print('❌ Error fetching admin invitations: $e');
    }
  }

  Future<void> _sendBulkInvitations() async {
    if (_extractedUsers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No users to invite. Please upload a file first.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    // Check if student is trying to invite teachers
    final currentUser = _storage.getCurrentUser();
    if (currentUser?.institutionRole?.toLowerCase() == 'student' &&
        _selectedSection == InviteSection.teachers) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Students are not allowed to invite teachers'),
          backgroundColor: AppColors.error,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    // Validate department and semester selection
    if (_selectedDepartment.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a department'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_selectedSemester.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a semester'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId;

      if (institutionId == null) {
        throw Exception('Institution not found');
      }

      final recipientType = _selectedSection == InviteSection.students
          ? 'Student'
          : 'Teacher';

      final response = await _invitationRepository.bulkInviteUsers(
        institutionId: institutionId,
        recipientType: recipientType,
        users: _extractedUsers,
        department: _selectedDepartment,
        semester: _selectedSemester,
      );

      final successCount = response['successCount'] ?? 0;
      final errors = response['errors'] as List? ?? [];

      setState(() {
        _isProcessing = false;
        _selectedFileName = null;
        _extractedUsers = [];
      });

      if (mounted) {
        if (errors.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Successfully sent $successCount invitation${successCount > 1 ? 's' : ''}!',
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.success,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.warning, color: Colors.white, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '$successCount successful, ${errors.length} failed',
                        ),
                      ),
                    ],
                  ),
                  if (errors.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      'First error: ${errors[0]['error'] ?? 'Unknown error'}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ],
              ),
              backgroundColor: AppColors.warning,
              duration: const Duration(seconds: 7),
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isProcessing = false);

      if (mounted) {
        final errorMessage = e is ApiException
            ? e.message
            : e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(child: Text(errorMessage)),
              ],
            ),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Widget _buildAcademicDropdowns() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Department dropdown
        DropdownButtonFormField<String>(
          value: _selectedDepartment.isEmpty ? null : _selectedDepartment,
          isExpanded: true,
          menuMaxHeight: 300,
          hint: Text(
            'Select ${TerminologyService.getOrganizationalUnitLabel(context)}',
            style: TextStyle(
              color: AppColors.textSecondary.withValues(alpha: 0.7),
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
          decoration: InputDecoration(
            labelText: TerminologyService.getOrganizationalUnitLabel(context),
            filled: true,
            fillColor: AppColors.cardBackground.withValues(alpha: 0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppColors.borderDark.withValues(alpha: 0.2),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppColors.borderDark.withValues(alpha: 0.2),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
          items: _departments.map((dept) {
            final deptId = dept['_id']?.toString() ?? '';
            final deptName = dept['name']?.toString() ?? 'Unknown';
            return DropdownMenuItem(
              value: deptId,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Text(
                  deptName,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedDepartment = value ?? '';
              _selectedCourses = [];
            });
            _filterCourses();
          },
        ),
        const SizedBox(height: 16),

        // Semester dropdown
        DropdownButtonFormField<String>(
          value: _selectedSemester.isEmpty ? null : _selectedSemester,
          isExpanded: true,
          menuMaxHeight: 300,
          hint: Text(
            'Select ${TerminologyService.getTimePeriodLabel(context)}',
            style: TextStyle(
              color: AppColors.textSecondary.withValues(alpha: 0.7),
            ),
            overflow: TextOverflow.ellipsis,
            maxLines: 1,
          ),
          decoration: InputDecoration(
            labelText: TerminologyService.getTimePeriodLabel(context),
            filled: true,
            fillColor: AppColors.cardBackground.withValues(alpha: 0.5),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppColors.borderDark.withValues(alpha: 0.2),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: AppColors.borderDark.withValues(alpha: 0.2),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
          items: _semesters.map((sem) {
            final semId = sem['_id']?.toString() ?? '';
            final semName = sem['name']?.toString() ?? 'Unknown';
            return DropdownMenuItem(
              value: semId,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Text(
                  semName,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedSemester = value ?? '';
              _selectedCourses = [];
            });
            _filterCourses();
          },
        ),

        // Course selection (only for teachers — always visible for teachers)
        if (_selectedSection == InviteSection.teachers) ...[
          const SizedBox(height: 16),
          Row(
            children: [
              Text(
                '${TerminologyService.getLearningProgramLabel(context, plural: true)} *',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              if (_selectedCourses.isNotEmpty) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_selectedCourses.length} selected',
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          // Before dept + sem are chosen
          if (_selectedDepartment.isEmpty || _selectedSemester.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.cardBackground.withValues(alpha: 0.5),
                border: Border.all(
                  color: AppColors.borderDark.withValues(alpha: 0.2),
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 18,
                    color: AppColors.textSecondary.withValues(alpha: 0.6),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Select a department and semester first to load available courses.',
                      style: TextStyle(
                        color: AppColors.textSecondary.withValues(alpha: 0.7),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            )
          // Dept + sem selected but no courses found
          else if (_filteredCourses.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.08),
                border: Border.all(
                  color: AppColors.warning.withValues(alpha: 0.3),
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    size: 18,
                    color: AppColors.warning,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'No courses found for the selected department and semester. Add courses first from the Academic Structure section.',
                      style: TextStyle(
                        color: AppColors.warning.withValues(alpha: 0.9),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            )
          // Courses available — show checkbox list
          else
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              decoration: BoxDecoration(
                color: AppColors.cardBackground.withValues(alpha: 0.5),
                border: Border.all(
                  color: AppColors.borderDark.withValues(alpha: 0.2),
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: ListView.builder(
                shrinkWrap: true,
                physics: const ClampingScrollPhysics(),
                itemCount: _filteredCourses.length,
                itemBuilder: (context, index) {
                  final course = _filteredCourses[index];
                  final courseId = course['_id']?.toString() ?? '';
                  final courseName = course['name']?.toString() ?? 'Unknown';
                  final courseCode = course['code']?.toString() ?? '';
                  final isSelected = _selectedCourses.contains(courseId);

                  return CheckboxListTile(
                    title: Text(
                      courseName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    subtitle: courseCode.isNotEmpty
                        ? Text(
                            courseCode,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary.withValues(
                                alpha: 0.7,
                              ),
                            ),
                          )
                        : null,
                    value: isSelected,
                    activeColor: AppColors.primary,
                    checkColor: Colors.white,
                    controlAffinity: ListTileControlAffinity.leading,
                    dense: true,
                    onChanged: (selected) {
                      setState(() {
                        if (selected == true) {
                          _selectedCourses.add(courseId);
                        } else {
                          _selectedCourses.remove(courseId);
                        }
                      });
                    },
                  );
                },
              ),
            ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        SingleChildScrollView(
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
                        Icons.person_add_outlined,
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
                            'Invite People',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Invite ${_selectedSection == InviteSection.students ? 'students' : 'teachers'} to join your institution',
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
              const SizedBox(height: 32),

              // Section selector (Students/Teachers)
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildSectionButton(
                        'Students',
                        InviteSection.students,
                        Icons.person_outline,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: _buildSectionButton(
                        'Teachers',
                        InviteSection.teachers,
                        Icons.school_outlined,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Entry method selector (CSV Upload/Manual Entry)
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildEntryMethodButton(
                        'CSV Upload',
                        EntryMethod.csvUpload,
                        Icons.upload_file,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: _buildEntryMethodButton(
                        'Manual Entry',
                        EntryMethod.manual,
                        Icons.edit_outlined,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Content based on selected entry method
              if (_selectedEntryMethod == EntryMethod.csvUpload)
                _buildUploadSection()
              else
                _buildManualEntrySection(),

              const SizedBox(height: 24),

              // Added users list
              if (_extractedUsers.isNotEmpty) ...[
                Text(
                  'Adding Users (${_extractedUsers.length})',
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  constraints: const BoxConstraints(maxHeight: 300),
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _extractedUsers.length,
                    itemBuilder: (context, index) {
                      final user = _extractedUsers[index];
                      final emailOrUsername =
                          user['emailOrUsername'] ?? 'Unknown';
                      final message = user['message'] ?? '';
                      final initial = emailOrUsername
                          .substring(0, 1)
                          .toUpperCase();
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        color: AppColors.cardBackground,
                        elevation: 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(
                            color: AppColors.primary.withValues(alpha: 0.2),
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          leading: CircleAvatar(
                            backgroundColor: AppColors.primary.withValues(
                              alpha: 0.2,
                            ),
                            radius: 20,
                            child: Text(
                              initial,
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          title: Text(
                            emailOrUsername,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: message.isNotEmpty
                              ? Row(
                                  children: [
                                    const Icon(
                                      Icons.message_outlined,
                                      size: 12,
                                      color: AppColors.textTertiary,
                                    ),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        message,
                                        style: const TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 12,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                )
                              : null,
                          trailing: IconButton(
                            icon: const Icon(
                              Icons.close,
                              color: AppColors.error,
                            ),
                            tooltip: 'Remove user',
                            onPressed: () {
                              setState(() {
                                _extractedUsers.removeAt(index);
                              });
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
                CustomButton(
                  text: _isProcessing
                      ? 'Sending Invitations...'
                      : 'Send Invitations (${_extractedUsers.length})',
                  onPressed: _sendBulkInvitations,
                  isLoading: _isProcessing,
                  icon: Icons.send,
                ),
              ],
            ],
          ),
        ),
        // Loading overlay
        if (_isProcessing)
          Container(
            color: Colors.black.withValues(alpha: 0.5),
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Processing...',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Validating users from file',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildSectionButton(
    String label,
    InviteSection section,
    IconData icon,
  ) {
    final isSelected = _selectedSection == section;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            setState(() {
              _selectedSection = section;
            });
          },
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              gradient: isSelected
                  ? const LinearGradient(
                      colors: [AppColors.primary, Color(0xFF5B4FD8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : null,
              color: isSelected ? null : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEntryMethodButton(
    String label,
    EntryMethod method,
    IconData icon,
  ) {
    final isSelected = _selectedEntryMethod == method;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            setState(() {
              _selectedEntryMethod = method;
            });
          },
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              gradient: isSelected
                  ? const LinearGradient(
                      colors: [AppColors.primary, Color(0xFF5B4FD8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : null,
              color: isSelected ? null : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUploadSection() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header section
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Upload CSV File',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Download template, fill data, and upload',
                style: TextStyle(
                  color: AppColors.textSecondary.withValues(alpha: 0.8),
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _downloadTemplate,
                  icon: const Icon(Icons.download_rounded, size: 20),
                  label: const Text('Download Template'),
                  style: ElevatedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Upload drop zone
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _pickExcelFile,
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(48),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.03),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.cloud_upload_outlined,
                        size: 40,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (_selectedFileName != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.success.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.check_circle,
                              color: AppColors.success,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                _selectedFileName!,
                                style: const TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${_extractedUsers.length} users extracted',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ] else ...[
                      const Text(
                        'Drop your files here',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'or click to browse',
                        style: TextStyle(
                          color: AppColors.textSecondary.withValues(alpha: 0.7),
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Supports: .xlsx, .xls, .csv',
                        style: TextStyle(
                          color: AppColors.textSecondary.withValues(alpha: 0.5),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // CSV Format information
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.15),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppColors.primary, size: 16),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'CSV Format: emailOrUsername, message (optional)',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Academic selection section
          if (_extractedUsers.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text(
              'Select Academic Details',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            _buildAcademicDropdowns(),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                text:
                    'Send ${_extractedUsers.length} Invitation${_extractedUsers.length > 1 ? 's' : ''}',
                onPressed: _sendBulkInvitations,
                icon: Icons.send,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildManualEntrySection() {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Add Manually',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Enter user details one at a time',
                  style: TextStyle(
                    color: AppColors.textSecondary.withValues(alpha: 0.8),
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Email or Username field
            _buildTextField(
              controller: _emailOrUsernameController,
              label: 'Email or Username',
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Email or username is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Message field (optional)
            _buildTextField(
              controller: _messageController,
              label: 'Message (optional)',
              maxLines: 3,
            ),
            const SizedBox(height: 16),

            // Academic dropdowns (department, semester, courses)
            _buildAcademicDropdowns(),
            const SizedBox(height: 20),

            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _isProcessing ? null : _addManually,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.buttonPrimary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                      icon: _isProcessing
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.send, size: 18),
                      label: const Text(
                        'Send Invitation',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Center(
                  child: Expanded(
                    child: SizedBox(
                      height: 52,
                      child: OutlinedButton.icon(
                        onPressed: _showInvitationStatusSheet,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        icon: const Icon(Icons.list_alt_outlined, size: 18),
                        label: const Text(
                          'Check Status',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 2,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      enableInteractiveSelection: true,
      keyboardType: keyboardType,
      validator: validator,
      maxLines: maxLines,
      style: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 15,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(
          color: AppColors.textSecondary.withValues(alpha: 0.7),
          fontSize: 14,
        ),
        filled: true,
        fillColor: AppColors.cardBackground.withValues(alpha: 0.5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.2),
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: AppColors.borderDark.withValues(alpha: 0.2),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: AppColors.error.withValues(alpha: 0.7),
            width: 1.5,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
    );
  }
}
