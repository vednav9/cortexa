import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../../../../core/constants/app_colors.dart';
import '../../../../../core/network/api_client.dart';
import '../../../../../core/di/service_locator.dart';
import '../../../../../core/services/hive_storage_service.dart';
import '../../data/repositories/teacher_ai_repository.dart';

class TeacherDocumentUploadPage extends StatefulWidget {
  const TeacherDocumentUploadPage({super.key});

  @override
  State<TeacherDocumentUploadPage> createState() => _TeacherDocumentUploadPageState();
}

class _TeacherDocumentUploadPageState extends State<TeacherDocumentUploadPage> {
  final TeacherAiRepository _repository = getIt<TeacherAiRepository>();
  
  String? _selectedCourseId;
  List<Map<String, dynamic>> _authorizedCourses = [];
  List<Map<String, dynamic>> _uploadedDocuments = [];
  bool _isLoading = false;
  bool _isUploading = false;
  File? _selectedFile;
  String? _selectedFileName;

  @override
  void initState() {
    super.initState();
    _loadAuthorizedCourses();
  }

  void _loadAuthorizedCourses() async {
    final storage = getIt<HiveStorageService>();
    final courses = storage.getAuthorizedCourses() ?? [];
    setState(() {
      _authorizedCourses = courses;
      if (courses.isNotEmpty) {
        _selectedCourseId = courses.first['_id'] ?? courses.first['id'];
      }
    });

    if (_selectedCourseId != null) {
      _loadDocuments();
    }
  }

  Future<void> _loadDocuments() async {
    if (_selectedCourseId == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final documents = await _repository.getDocuments(_selectedCourseId!);
      setState(() {
        _uploadedDocuments = documents;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        final errorMessage = e is ApiException ? e.message : e.toString();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx'],
      );

      if (result != null && result.files.isNotEmpty) {
        final filePath = result.files.first.path;
        if (filePath != null) {
          setState(() {
            _selectedFile = File(filePath);
            _selectedFileName = result.files.first.name;
          });
        }
      }
    } catch (e) {
      final errorMessage = e is ApiException ? e.message : 'Failed to pick file';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _uploadDocument() async {
    if (_selectedFile == null || _selectedCourseId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a file and course')),
      );
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      await _repository.uploadDocument(
        filePath: _selectedFile!.path,
        fileName: _selectedFileName!,
        courseId: _selectedCourseId!,
      );

      setState(() {
        _isUploading = false;
        _selectedFile = null;
        _selectedFileName = null;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Document uploaded successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }

      // Reload documents
      _loadDocuments();
    } catch (e) {
      setState(() {
        _isUploading = false;
      });
      if (mounted) {
        final errorMessage = e is ApiException ? e.message : 'Upload failed. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteDocument(String documentId, String fileName) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Document'),
        content: Text('Are you sure you want to delete "$fileName"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _repository.deleteDocument(documentId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Document deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }

      _loadDocuments();
    } catch (e) {
      if (mounted) {
        final errorMessage = e is ApiException ? e.message : 'Delete failed. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _getFileIcon(String fileName) {
    final extension = fileName.split('.').last.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'txt':
        return '📋';
      default:
        return '📁';
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Documents'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Course selection
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.surface,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Select Course',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.divider),
                    borderRadius: BorderRadius.circular(12),
                    color: Colors.white,
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedCourseId,
                      isExpanded: true,
                      hint: const Text('Select Course'),
                      icon: const Icon(Icons.arrow_drop_down),
                      items: _authorizedCourses.map((course) {
                        final id = course['_id'] ?? course['id'];
                        final name = course['name'] ?? 'Unnamed Course';
                        return DropdownMenuItem<String>(
                          value: id,
                          child: Text(name),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCourseId = value;
                        });
                        _loadDocuments();
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),

          // File picker section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.divider),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Selected file display
                if (_selectedFile != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Text(
                          _getFileIcon(_selectedFileName ?? ''),
                          style: const TextStyle(fontSize: 24),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _selectedFileName ?? '',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _formatFileSize(_selectedFile!.lengthSync()),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () {
                            setState(() {
                              _selectedFile = null;
                              _selectedFileName = null;
                            });
                          },
                        ),
                      ],
                    ),
                  ),

                // Pick file button
                OutlinedButton.icon(
                  onPressed: _pickFile,
                  icon: const Icon(Icons.attach_file),
                  label: const Text('Select File'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Upload button
                ElevatedButton.icon(
                  onPressed: _selectedFile == null || _isUploading
                      ? null
                      : _uploadDocument,
                  icon: _isUploading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.cloud_upload),
                  label: Text(_isUploading ? 'Uploading...' : 'Upload Document'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),

                const SizedBox(height: 8),
                Text(
                  'Supported formats: PDF, DOC, DOCX, TXT, PPT, PPTX',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),

          // Uploaded documents list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _uploadedDocuments.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.folder_open,
                              size: 64,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No documents uploaded yet',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _uploadedDocuments.length,
                        itemBuilder: (context, index) {
                          final doc = _uploadedDocuments[index];
                          final fileName = doc['filename'] ?? 'Unknown';
                          final docId = doc['_id'] ?? doc['id'] ?? '';
                          final uploadDate = doc['uploadedAt'] ?? '';
                          final fileSize = doc['size'] ?? 0;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              leading: CircleAvatar(
                                backgroundColor: AppColors.primary.withOpacity(0.1),
                                child: Text(
                                  _getFileIcon(fileName),
                                  style: const TextStyle(fontSize: 24),
                                ),
                              ),
                              title: Text(
                                fileName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(_formatFileSize(fileSize)),
                                  if (uploadDate.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      'Uploaded: ${_formatDate(uploadDate)}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _deleteDocument(docId, fileName),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inDays == 0) {
        return 'Today';
      } else if (diff.inDays == 1) {
        return 'Yesterday';
      } else if (diff.inDays < 7) {
        return '${diff.inDays} days ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateStr;
    }
  }
}
