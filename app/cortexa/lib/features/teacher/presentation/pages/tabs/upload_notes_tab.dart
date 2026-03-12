import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../../../../../core/constants/app_colors.dart';
import '../../../../../../core/config/api_config.dart';
import '../../../../../../core/network/api_client.dart';
import '../../../../../../core/di/service_locator.dart';
import '../../../data/models/course_model.dart';
import '../../../data/models/document_model.dart';
import '../../../data/repositories/teacher_ai_repository.dart';

class UploadNotesTab extends StatefulWidget {
  const UploadNotesTab({super.key});

  @override
  State<UploadNotesTab> createState() => _UploadNotesTabState();
}

class _UploadNotesTabState extends State<UploadNotesTab> {
  final _apiClient = getIt<ApiClient>();
  late final TeacherAiRepository _aiRepository;

  List<CourseModel> _courses = [];
  List<DocumentModel> _documents = [];
  CourseModel? _selectedCourse;
  
  bool _isLoadingCourses = true;
  bool _isLoadingDocuments = false;
  bool _isUploading = false;
  String? _errorMessage;
  
  PlatformFile? _selectedFile;
  String? _displayFileName;

  @override
  void initState() {
    super.initState();
    _aiRepository = TeacherAiRepository(_apiClient);
    _loadCourses();
  }

  void _showStatusSnackBar({
    required String message,
    required IconData icon,
    required Color color,
    int seconds = 4,
  }) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.all(16),
        duration: Duration(seconds: seconds),
      ),
    );
  }

  Future<void> _loadCourses() async {
    setState(() {
      _isLoadingCourses = true;
      _errorMessage = null;
    });

    try {
      final response = await _apiClient.get(
        ApiConfig.teacherAuthorizedCourses,
        requiresAuth: true,
      );

      if (response['success'] == true) {
        final coursesData = response['courses'] as List? ?? [];
        final courses = coursesData
            .map((json) => CourseModel.fromJson(json))
            .toList();

        setState(() {
          _courses = courses;
          _isLoadingCourses = false;
        });
      } else {
        setState(() {
          _errorMessage = response['message'] ?? 'Failed to load courses';
          _isLoadingCourses = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading courses: ${e.toString()}';
        _isLoadingCourses = false;
      });
    }
  }

  Future<void> _loadDocuments() async {
    if (_selectedCourse == null) {
      setState(() => _documents = []);
      return;
    }

    setState(() {
      _isLoadingDocuments = true;
      _errorMessage = null;
    });

    try {
      final docs = await _aiRepository.getDocuments(_selectedCourse!.id);
      
      setState(() {
        _documents = docs.map((doc) => DocumentModel.fromJson(doc)).toList();
        _isLoadingDocuments = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading documents: ${e.toString()}';
        _isLoadingDocuments = false;
      });
    }
  }

  Future<void> _pickDocument() async {
    if (_selectedCourse == null) {
      _showStatusSnackBar(
        message: 'Please select a course first',
        icon: Icons.warning_amber_rounded,
        color: Colors.orange.shade600,
        seconds: 3,
      );
      return;
    }

    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'txt', 'docx', 'doc', 'ppt', 'pptx'],
        withData: true,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        
        // Validate file type
        final extension = file.extension?.toLowerCase();
        final allowedExtensions = ['pdf', 'txt', 'docx', 'doc', 'ppt', 'pptx'];
        if (extension == null || !allowedExtensions.contains(extension)) {
          _showStatusSnackBar(
            message: 'Invalid file type. Use PDF, Word, TXT, or PowerPoint.',
            icon: Icons.error_outline,
            color: Colors.red.shade600,
          );
          return;
        }

        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
          final sizeMB = (file.size / (1024 * 1024)).toStringAsFixed(1);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.white, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'File too large ($sizeMB MB). Maximum allowed size is 50 MB.',
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
          return;
        }
        
        // Validate file is not empty
        if (file.size == 0) {
          _showStatusSnackBar(
            message: 'The selected file is empty. Please choose a valid document.',
            icon: Icons.error_outline,
            color: Colors.red.shade600,
          );
          return;
        }

        setState(() {
          _selectedFile = file;
          _displayFileName = file.name.replaceAll(RegExp(r'\.[^.]+$'), '');
        });

        _showFileNameDialog();
      }
    } catch (e) {
      _showStatusSnackBar(
        message: 'Failed to select file: ${e.toString().replaceAll('Exception: ', '')}',
        icon: Icons.error_outline,
        color: Colors.red.shade600,
      );
    }
  }

  void _showFileNameDialog() {
    final controller = TextEditingController(text: _displayFileName);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter Display Name'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'This name will be shown to students',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                labelText: 'Display Name',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              maxLength: 100,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _selectedFile = null;
                _displayFileName = null;
              });
              Navigator.pop(context);
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final name = controller.text.trim();
              if (name.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Display name cannot be empty',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                          ),
                        ),
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
              setState(() {
                _displayFileName = name;
              });
              Navigator.pop(context);
              _uploadDocument();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Upload'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadDocument() async {
    if (_selectedFile == null || 
        _selectedCourse == null || 
        _displayFileName == null ||
        _displayFileName!.isEmpty) {
      return;
    }

    // Bytes are always present when withData: true is set in _pickDocument.
    // Path may be null on Android, so we never rely on it.
    final bytes = _selectedFile!.bytes;
    if (bytes == null || bytes.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Row(children: [
            Icon(Icons.error_outline, color: Colors.white, size: 20),
            SizedBox(width: 12),
            Expanded(child: Text('Could not read file data. Please try again.',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
          ]),
          backgroundColor: Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          margin: const EdgeInsets.all(16),
        ));
      }
      return;
    }

    setState(() => _isUploading = true);

    try {
      final result = await _aiRepository.uploadDocument(
        fileBytes: bytes,
        fileExtension: _selectedFile!.extension ?? 'pdf',
        fileName: _displayFileName!,
        courseId: _selectedCourse!.id,
      );

      final aiIndexed = result['aiIndexed'] as bool? ?? false;
      final statusSynced = result['statusSynced'] as bool? ?? false;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(
                  aiIndexed ? Icons.check_circle_outline : Icons.cloud_upload_outlined,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        aiIndexed ? 'Upload Successful!' : 'Saved (AI sync pending)',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        aiIndexed
                          ? (statusSynced
                            ? 'Document "$_displayFileName" is available and indexed for AI search'
                            : 'Indexed in AI, but status sync is pending. Pull-to-refresh in a few seconds.')
                          : 'Document saved. AI indexing will retry automatically — students may not see it in AI search yet.',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            backgroundColor: (aiIndexed && statusSynced)
              ? Colors.green.shade600
              : Colors.orange.shade700,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            margin: const EdgeInsets.all(16),
            duration: const Duration(seconds: 5),
          ),
        );
      }

      setState(() {
        _selectedFile = null;
        _displayFileName = null;
        _isUploading = false;
      });

      // Reload documents
      _loadDocuments();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Upload Failed',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        e.toString().replaceAll('Exception: ', ''),
                        style: const TextStyle(fontSize: 12),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
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
      
      setState(() => _isUploading = false);
    }
  }

  Future<void> _deleteDocument(DocumentModel document) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Document'),
        content: Text('Are you sure you want to delete "${document.fileName}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _aiRepository.deleteDocument(document.id);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Document "${document.fileName}" deleted successfully',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.green.shade600,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              margin: const EdgeInsets.all(16),
            ),
          );
        }

        // Reload documents
        _loadDocuments();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.white, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Failed to delete: ${e.toString().replaceAll('Exception: ', '')}',
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
  }

  Future<void> _refresh() async {
    setState(() {
      _selectedCourse = null;
      _selectedFile = null;
      _displayFileName = null;
    });
    await _loadCourses();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              if (_isLoadingCourses)
                _buildLoadingState()
              else if (_errorMessage != null)
                _buildErrorState()
              else if (_courses.isEmpty)
                _buildNoCoursesState()
              else ...[
                _buildCoursesInfo(),
                const SizedBox(height: 24),
                _buildCourseSelector(),
                const SizedBox(height: 24),
                if (_selectedCourse != null) ...[
                  _buildUploadArea(),
                  const SizedBox(height: 24),
                  _buildDocumentsHeader(),
                  const SizedBox(height: 16),
                  if (_isLoadingDocuments)
                    _buildLoadingState()
                  else if (_documents.isEmpty)
                    _buildNoDocumentsState()
                  else
                    _buildDocumentsList(),
                ],
              ],
            ],
          ),
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
        borderRadius: BorderRadius.circular(20),
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
              Icons.upload_file_outlined,
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
                  'Upload Notes',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Share course materials with students',
                  style: TextStyle(
                    fontSize: 14,
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

  Widget _buildLoadingState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(height: 16),
            Text(
              'Loading...',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Container(
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.only(top: 20),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(
            _errorMessage ?? 'An error occurred',
            style: TextStyle(
              color: Colors.red.shade700,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNoCoursesState() {
    return Container(
      padding: const EdgeInsets.all(32),
      margin: const EdgeInsets.only(top: 20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.textTertiary.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.school_outlined,
            size: 64,
            color: AppColors.textTertiary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Courses Assigned',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Please contact your administrator to get assigned to courses',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCoursesInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.textTertiary.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.library_books,
              color: AppColors.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Assigned Courses',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_courses.length} ${_courses.length == 1 ? "Course" : "Courses"}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select Course',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: AppColors.textTertiary.withValues(alpha: 0.2),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<CourseModel>(
              value: _selectedCourse,
              hint: const Text(
                'Choose a course to upload notes',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.2,
                ),
              ),
              isExpanded: true,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                height: 1.2,
              ),
              icon: const Icon(
                Icons.arrow_drop_down,
                color: AppColors.textSecondary,
              ),
              dropdownColor: AppColors.surface,
              items: _courses.map((course) {
                return DropdownMenuItem<CourseModel>(
                  value: course,
                  child: Text(
                    course.name,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      height: 1.2,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (CourseModel? newValue) {
                setState(() {
                  _selectedCourse = newValue;
                  _selectedFile = null;
                  _displayFileName = null;
                });
                if (newValue != null) {
                  _loadDocuments();
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUploadArea() {
    if (_isUploading) {
      return Container(
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.3),
          ),
        ),
        child: const Column(
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 16),
            Text(
              'Uploading & indexing for AI...',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'This may take up to a minute on first upload',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Center(
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.textTertiary.withValues(alpha: 0.2),
          ),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _pickDocument,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.cloud_upload_outlined,
                      size: 32,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Click to select document',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'PDF, Word, TXT, or PowerPoint (Max 50MB)',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary.withValues(alpha: 0.8),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDocumentsHeader() {
    return Row(
      children: [
        const Text(
          'Uploaded Documents',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(width: 8),
        if (_documents.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${_documents.length}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildNoDocumentsState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.textTertiary.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.description_outlined,
            size: 56,
            color: AppColors.textTertiary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'No documents uploaded yet',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Upload your first document using the button above',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary.withValues(alpha: 0.8),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsList() {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _documents.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final document = _documents[index];
        return _buildDocumentCard(document);
      },
    );
  }

  Widget _buildDocumentCard(DocumentModel document) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.textTertiary.withValues(alpha: 0.2),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.description,
                color: AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    document.fileName,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        document.formattedSize,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary.withValues(alpha: 0.8),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '•',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary.withValues(alpha: 0.8),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        document.formattedDate,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: document.isProcessed
                          ? AppColors.primary.withValues(alpha: 0.1)
                          : Colors.orange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          document.isProcessed
                              ? Icons.check_circle
                              : Icons.hourglass_empty,
                          size: 12,
                          color: document.isProcessed
                              ? AppColors.primary
                              : Colors.orange,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          document.isProcessed ? 'Processed' : 'Processing',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: document.isProcessed
                                ? AppColors.primary
                                : Colors.orange,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(
                Icons.delete_outline,
                size: 20,
              ),
              color: Colors.red,
              onPressed: () => _deleteDocument(document),
              tooltip: 'Delete',
            ),
          ],
        ),
      ),
    );
  }
}
