import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/custom_button.dart';

enum InviteSection { teachers, students }

class InvitePeoplePage extends StatefulWidget {
  const InvitePeoplePage({super.key});

  @override
  State<InvitePeoplePage> createState() => _InvitePeoplePageState();
}

class _InvitePeoplePageState extends State<InvitePeoplePage> {
  InviteSection _selectedSection = InviteSection.teachers;
  String? _selectedFileName;
  List<String> _uploadedUsernames = [];
  bool _isProcessing = false;

  Future<void> _pickExcelFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'xls', 'csv'],
      );

      if (result != null) {
        setState(() {
          _selectedFileName = result.files.single.name;
          // TODO: Parse Excel file and extract usernames
          // For now, mock data
          _uploadedUsernames = [
            'user1',
            'user2',
            'user3',
            'teacher_john',
            'student_jane',
          ];
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('File selected: $_selectedFileName'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking file: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _sendInvitations() async {
    if (_uploadedUsernames.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload an Excel file first'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    // TODO: Implement API call to send invitations
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      _isProcessing = false;
      _selectedFileName = null;
      _uploadedUsernames = [];
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Invitations sent to ${_uploadedUsernames.length} ${_selectedSection == InviteSection.teachers ? 'teachers' : 'students'}',
          ),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Page title and description
          const Text(
            'Invite People',
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Upload an Excel file with Cortexa usernames to send invitations',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),

          // Section selector (Teachers/Students)
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.borderDark.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildSectionButton(
                    'Teachers',
                    InviteSection.teachers,
                    Icons.school_outlined,
                  ),
                ),
                Expanded(
                  child: _buildSectionButton(
                    'Students',
                    InviteSection.students,
                    Icons.person_outline,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Instructions card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: AppColors.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Excel File Format',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text(
                  '• First column should contain Cortexa usernames\n'
                  '• Supported formats: .xlsx, .xls, .csv\n'
                  '• Maximum 100 usernames per upload\n'
                  '• Invalid usernames will be skipped',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // File upload section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.borderDark.withValues(alpha: 0.3),
                width: 2,
                style: BorderStyle.solid,
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.upload_file_outlined,
                  size: 64,
                  color: AppColors.primary.withValues(alpha: 0.7),
                ),
                const SizedBox(height: 16),
                if (_selectedFileName != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.insert_drive_file,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            _selectedFileName!,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedFileName = null;
                              _uploadedUsernames = [];
                            });
                          },
                          child: const Icon(
                            Icons.close,
                            color: AppColors.error,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${_uploadedUsernames.length} usernames found',
                    style: TextStyle(
                      color: AppColors.textSecondary.withValues(alpha: 0.8),
                      fontSize: 14,
                    ),
                  ),
                ] else ...[
                  const Text(
                    'No file selected',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                CustomButton(
                  text: _selectedFileName != null
                      ? 'Change File'
                      : 'Select Excel File',
                  onPressed: _pickExcelFile,
                  icon: Icons.folder_open,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Send invitations button
          if (_selectedFileName != null && _uploadedUsernames.isNotEmpty)
            CustomButton(
              text: _isProcessing
                  ? 'Sending Invitations...'
                  : 'Send Invitations',
              onPressed: _sendInvitations,
              isLoading: _isProcessing,
              icon: Icons.send,
            ),
        ],
      ),
    );
  }

  Widget _buildSectionButton(
    String label,
    InviteSection section,
    IconData icon,
  ) {
    final isSelected = _selectedSection == section;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedSection = section;
          _selectedFileName = null;
          _uploadedUsernames = [];
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
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
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
