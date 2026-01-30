import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:excel/excel.dart' as excel_pkg;
import 'package:csv/csv.dart';
import 'dart:io';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/custom_button.dart';
import '../../../../core/services/hive_storage_service.dart';
import '../../../../core/di/service_locator.dart';
import '../../data/repositories/mock_dashboard_repository.dart';

enum InviteSection { teachers, students }
enum EntryMethod { csvUpload, manual }

class InvitePeoplePage extends StatefulWidget {
  const InvitePeoplePage({super.key});

  @override
  State<InvitePeoplePage> createState() => _InvitePeoplePageState();
}

class _InvitePeoplePageState extends State<InvitePeoplePage> {
  final _repository = MockDashboardRepository();
  final _storage = getIt<HiveStorageService>();
  InviteSection _selectedSection = InviteSection.students;
  EntryMethod _selectedEntryMethod = EntryMethod.csvUpload;
  String? _selectedFileName;
  List<Map<String, String>> _extractedUsers = [];
  List<Map<String, String>> _validatedUsers = []; // Users that exist in Cortexa
  bool _isProcessing = false;
  
  // Validation result details
  List<String> _invalidUsernames = [];
  List<String> _wrongRoleUsers = [];
  List<String> _alreadyInvitedUsers = [];
  List<String> _alreadyJoinedUsers = [];
  
  // Manual entry form controllers
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _yearController = TextEditingController();
  final _departmentController = TextEditingController();
  final _divisionController = TextEditingController();
  final _usernameController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
  }
  
  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _yearController.dispose();
    _departmentController.dispose();
    _divisionController.dispose();
    _usernameController.dispose();
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

        // Validate users against Cortexa backend
        await _validateExtractedUsers();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error processing file: $e'),
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
        // Expected columns: Full Name, Email, Mobile, Year, Department, Division, Cortexa Username
        for (var i = 1; i < table.rows.length; i++) {
          final row = table.rows[i];
          if (row.length >= 7) {
            users.add({
              'fullName': row[0]?.value?.toString().trim() ?? '',
              'email': row[1]?.value?.toString().trim() ?? '',
              'mobile': row[2]?.value?.toString().trim() ?? '',
              'year': row[3]?.value?.toString().trim() ?? '',
              'department': row[4]?.value?.toString().trim() ?? '',
              'division': row[5]?.value?.toString().trim() ?? '',
              'username': row[6]?.value?.toString().trim() ?? '',
            });
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
        if (rows[i].length >= 7) {
          users.add({
            'fullName': rows[i][0]?.toString().trim() ?? '',
            'email': rows[i][1]?.toString().trim() ?? '',
            'mobile': rows[i][2]?.toString().trim() ?? '',
            'year': rows[i][3]?.toString().trim() ?? '',
            'department': rows[i][4]?.toString().trim() ?? '',
            'division': rows[i][5]?.toString().trim() ?? '',
            'username': rows[i][6]?.toString().trim() ?? '',
          });
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
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                    ),
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Download Failed: ${e.toString()}',
                    style: const TextStyle(
                      fontSize: 13,
                    ),
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

  Future<void> _validateExtractedUsers() async {
    if (_extractedUsers.isEmpty) return;

    setState(() => _isProcessing = true);

    try {
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId ?? 'default_institution';
      final targetRole = _selectedSection == InviteSection.students ? 'student' : 'teacher';
      
      // Extract usernames from the user list
      final usernames = _extractedUsers
          .map((user) => user['username'] ?? '')
          .where((username) => username.isNotEmpty)
          .toList();

      // Validate users against backend
      final validationResult = await _repository.validateUsersByUsername(usernames);
      
      // Get all existing invitations for this institution
      final allInvitations = _storage.getAllInvitations();
      final institutionInvitations = allInvitations
          .where((inv) => inv['institution_id'] == institutionId)
          .toList();

      // Filter only valid users (those that exist in Cortexa with correct role)
      final validUsers = <Map<String, String>>[];
      final invalidUsernames = <String>[];
      final wrongRoleUsers = <String>[];
      final alreadyInvitedUsers = <String>[];
      final alreadyJoinedUsers = <String>[];

      for (final user in _extractedUsers) {
        final username = user['username'] ?? '';
        final registeredUser = validationResult[username];
        
        if (registeredUser == null) {
          // User doesn't exist in Cortexa
          invalidUsernames.add(username);
          continue;
        }
        
        // Check if user has the correct role
        final userRole = registeredUser['role']?.toString().toLowerCase();
        if (userRole != targetRole) {
          wrongRoleUsers.add('$username (is $userRole)');
          continue;
        }
        
        // Check if user already belongs to this institution
        if (registeredUser['institutionId'] == institutionId) {
          alreadyJoinedUsers.add(username);
          continue;
        }
        
        // Check for existing invitations
        final existingInvitation = institutionInvitations.firstWhere(
          (inv) => inv['invited_user_username'] == username,
          orElse: () => {},
        );
        
        if (existingInvitation.isNotEmpty) {
          final status = existingInvitation['status']?.toString().toLowerCase();
          if (status == 'pending' || status == 'accepted') {
            // Don't allow re-invitation if pending or accepted
            alreadyInvitedUsers.add('$username ($status)');
            continue;
          }
          // If status is 'denied' or 'rejected', allow re-invitation
        }
        
        // User is valid and can be invited
        validUsers.add(user);
      }

      setState(() {
        _validatedUsers = validUsers;
        _invalidUsernames = invalidUsernames;
        _wrongRoleUsers = wrongRoleUsers;
        _alreadyInvitedUsers = alreadyInvitedUsers;
        _alreadyJoinedUsers = alreadyJoinedUsers;
        _isProcessing = false;
      });

      // Show detailed validation results dialog
      if (mounted) {
        _showValidationResultsDialog(targetRole);
      }
    } catch (e) {
      setState(() => _isProcessing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Validation error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _addManually() async {
    if (_formKey.currentState!.validate()) {
      final newUser = {
        'fullName': _fullNameController.text.trim(),
        'email': _emailController.text.trim(),
        'mobile': _mobileController.text.trim(),
        'year': _yearController.text.trim(),
        'department': _departmentController.text.trim(),
        'division': _divisionController.text.trim(),
        'username': _usernameController.text.trim(),
      };

      setState(() => _isProcessing = true);

      try {
        final currentUser = _storage.getCurrentUser();
        final institutionId = currentUser?.institutionId ?? 'default_institution';
        final targetRole = _selectedSection == InviteSection.students ? 'student' : 'teacher';
        
        // Validate username against Cortexa backend
        final validationResult = await _repository.validateUsersByUsername(
          [newUser['username']!],
        );

        final registeredUser = validationResult[newUser['username']!];

        setState(() => _isProcessing = false);

        if (registeredUser == null) {
          // User doesn't exist in Cortexa
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Username "${newUser['username']}" not found in Cortexa. Please verify.',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ),
                backgroundColor: AppColors.error,
                duration: const Duration(seconds: 5),
              ),
            );
          }
          return;
        }

        // Check if user has the correct role
        final userRole = registeredUser['role']?.toString().toLowerCase();
        if (userRole != targetRole) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.warning, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Cannot invite ${newUser['username']}: user is a $userRole, but you\'re inviting ${targetRole}s.',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ),
                backgroundColor: AppColors.error,
                duration: const Duration(seconds: 5),
              ),
            );
          }
          return;
        }

        // Check if user already belongs to this institution
        if (registeredUser['institutionId'] == institutionId) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '${newUser['username']} is already a member of your institution.',
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ),
                backgroundColor: AppColors.warning,
                duration: const Duration(seconds: 5),
              ),
            );
          }
          return;
        }

        // Check for existing invitations
        final allInvitations = _storage.getAllInvitations();
        final existingInvitation = allInvitations.firstWhere(
          (inv) => inv['institution_id'] == institutionId && 
                   inv['invited_user_username'] == newUser['username'],
          orElse: () => {},
        );

        if (existingInvitation.isNotEmpty) {
          final status = existingInvitation['status']?.toString().toLowerCase();
          if (status == 'pending') {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Colors.white, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'An invitation to ${newUser['username']} is already pending.',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  backgroundColor: AppColors.warning,
                  duration: const Duration(seconds: 5),
                ),
              );
            }
            return;
          } else if (status == 'accepted') {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.white, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${newUser['username']} has already accepted the invitation and joined the institution.',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  backgroundColor: AppColors.success,
                  duration: const Duration(seconds: 5),
                ),
              );
            }
            return;
          }
          // If status is 'denied' or 'rejected', continue and allow re-invitation
        }

        // User is valid and can be invited
        setState(() {
          _extractedUsers.add(newUser);
          _validatedUsers.add(newUser);
        });

        // Clear form
        _fullNameController.clear();
        _emailController.clear();
        _mobileController.clear();
        _yearController.clear();
        _departmentController.clear();
        _divisionController.clear();
        _usernameController.clear();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${newUser['username']} validated and added to list!',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.success,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        setState(() => _isProcessing = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Validation error: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  Future<void> _sendInvitations() async {
    if (_validatedUsers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.warning, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'No valid users to send invitations to. Please add users.',
                  style: TextStyle(fontSize: 13),
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.warning,
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // Get current user's institution ID
      final currentUser = _storage.getCurrentUser();
      final institutionId = currentUser?.institutionId ?? 'default_institution';

      // Send invitations via backend API
      final sentCount = await _repository.sendInvitations(
        institutionId: institutionId,
        role: _selectedSection == InviteSection.students ? 'student' : 'teacher',
        users: _validatedUsers,
      );

      // Store count before clearing
      final successCount = sentCount;

      setState(() {
        _isProcessing = false;
        _selectedFileName = null;
        _extractedUsers = [];
        _validatedUsers = [];
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Successfully sent invitations to $successCount ${_selectedSection == InviteSection.students ? 'students' : 'teachers'}!',
                    style: const TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.success,
            duration: const Duration(seconds: 5),
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
                    'Failed to send invitations: $e',
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

  void _showValidationResultsDialog(String targetRole) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _validatedUsers.isNotEmpty ? AppColors.success.withValues(alpha: 0.1) : AppColors.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _validatedUsers.isNotEmpty ? Icons.check_circle : Icons.error,
                color: _validatedUsers.isNotEmpty ? AppColors.success : AppColors.error,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Validation Results',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_validatedUsers.isNotEmpty) ...[
                _buildResultSection(
                  icon: Icons.check_circle,
                  title: 'Ready to Invite',
                  count: _validatedUsers.length,
                  color: AppColors.success,
                  items: _validatedUsers.map((u) => u['username'] ?? 'Unknown').toList(),
                ),
                const SizedBox(height: 16),
              ],
              if (_alreadyInvitedUsers.isNotEmpty) ...[
                _buildResultSection(
                  icon: Icons.info,
                  title: 'Already Invited',
                  count: _alreadyInvitedUsers.length,
                  color: Colors.blue,
                  items: _alreadyInvitedUsers,
                ),
                const SizedBox(height: 16),
              ],
              if (_alreadyJoinedUsers.isNotEmpty) ...[
                _buildResultSection(
                  icon: Icons.group,
                  title: 'Already in Institution',
                  count: _alreadyJoinedUsers.length,
                  color: Colors.orange,
                  items: _alreadyJoinedUsers,
                ),
                const SizedBox(height: 16),
              ],
              if (_wrongRoleUsers.isNotEmpty) ...[
                _buildResultSection(
                  icon: Icons.warning,
                  title: 'Wrong Role',
                  count: _wrongRoleUsers.length,
                  color: Colors.deepOrange,
                  items: _wrongRoleUsers,
                ),
                const SizedBox(height: 16),
              ],
              if (_invalidUsernames.isNotEmpty) ...[
                _buildResultSection(
                  icon: Icons.error,
                  title: 'Not Found in Cortexa',
                  count: _invalidUsernames.length,
                  color: AppColors.error,
                  items: _invalidUsernames,
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Close',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          if (_validatedUsers.isNotEmpty)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _sendInvitations();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                'Send ${_validatedUsers.length} Invitation${_validatedUsers.length > 1 ? 's' : ''}',
                style: const TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildResultSection({
    required IconData icon,
    required String title,
    required int count,
    required Color color,
    required List<String> items,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(
                '$title ($count)',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
          if (items.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              items.take(5).join(', ') + (items.length > 5 ? ' +${items.length - 5} more' : ''),
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
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
                          color: AppColors.textSecondary.withValues(alpha: 0.9),
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
                  final initial = (user['fullName'] ?? user['username'] ?? 'U').substring(0, 1).toUpperCase();
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
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: CircleAvatar(
                        backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                        radius: 24,
                        child: Text(
                          initial,
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      ),
                      title: Text(
                        user['fullName'] ?? 'No name',
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (user['username'] != null && user['username']!.isNotEmpty)
                              Row(
                                children: [
                                  const Icon(Icons.person_outline, size: 14, color: AppColors.textTertiary),
                                  const SizedBox(width: 4),
                                  Text(
                                    user['username']!,
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            if (user['email'] != null && user['email']!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Row(
                                  children: [
                                    const Icon(Icons.email_outlined, size: 14, color: AppColors.textTertiary),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        user['email']!,
                                        style: const TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 13,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.close, color: AppColors.error),
                        tooltip: 'Remove user',
                        onPressed: () {
                          setState(() {
                            final removedUser = _extractedUsers[index];
                            _extractedUsers.removeAt(index);
                            // Also remove from validated users if it exists there
                            _validatedUsers.removeWhere(
                              (u) => u['username'] == removedUser['username'],
                            );
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
                  : 'Send Invitations (${_validatedUsers.length})',
              onPressed: _sendInvitations,
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
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
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
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
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
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                            const Icon(Icons.check_circle, color: AppColors.success, size: 18),
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
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
                Icon(
                  Icons.info_outline,
                  color: AppColors.primary,
                  size: 16,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Format: Full Name, Email, Mobile, Year, Department, Division, Username',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
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
            
            // Two-column layout for form fields
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    children: [
                      _buildTextField(
                        controller: _fullNameController,
                        label: 'Full Name',
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Full name is required';
                          }
                          if (value.trim().length < 2) {
                            return 'Name must be at least 2 characters';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _mobileController,
                        label: 'Mobile',
                        keyboardType: TextInputType.phone,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Mobile number is required';
                          }
                          if (!RegExp(r'^\+?[\d\s\-\(\)]{10,}$').hasMatch(value)) {
                            return 'Enter a valid mobile number';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _departmentController,
                        label: 'Department',
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Department is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _usernameController,
                        label: 'Cortexa Username',
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Username is required';
                          }
                          if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value)) {
                            return 'Username can only contain letters, numbers, and underscores';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    children: [
                      _buildTextField(
                        controller: _emailController,
                        label: 'Email',
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Email is required';
                          }
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                            return 'Enter a valid email';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _yearController,
                        label: 'Year',
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Year is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTextField(
                        controller: _divisionController,
                        label: 'Division',
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Division is required';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                text: 'Add User',
                onPressed: _addManually,
                icon: Icons.person_add,
              ),
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
  }) {
    return TextFormField(
      controller: controller,
      enableInteractiveSelection: true,
      keyboardType: keyboardType,
      validator: validator,
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
          borderSide: const BorderSide(
            color: AppColors.primary,
            width: 2,
          ),
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
          borderSide: const BorderSide(
            color: AppColors.error,
            width: 2,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
    );
  }
}

