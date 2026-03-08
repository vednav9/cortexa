class DocumentModel {
  final String id;
  final String fileName;
  final String originalName;
  final String fileUrl;
  final String fileType;
  final int fileSize;
  final String courseId;
  final String institutionId;
  final String uploadedById;
  final String? uploadedByName;
  final bool isProcessed;
  final DateTime createdAt;

  DocumentModel({
    required this.id,
    required this.fileName,
    required this.originalName,
    required this.fileUrl,
    required this.fileType,
    required this.fileSize,
    required this.courseId,
    required this.institutionId,
    required this.uploadedById,
    this.uploadedByName,
    required this.isProcessed,
    required this.createdAt,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) {
    // Handle uploadedBy as object or string
    String? uploadedByName;
    if (json['uploadedBy'] is Map) {
      uploadedByName = json['uploadedBy']['name'] as String?;
    }

    return DocumentModel(
      id: json['_id'] as String,
      fileName: json['fileName'] as String,
      originalName: json['originalName'] as String,
      fileUrl: json['fileUrl'] as String,
      fileType: json['fileType'] as String,
      fileSize: (json['fileSize'] as num).toInt(),
      courseId: json['course'] as String,
      institutionId: json['institution'] as String,
      uploadedById: json['uploadedBy'] is Map 
          ? json['uploadedBy']['_id'] as String
          : json['uploadedBy'] as String,
      uploadedByName: uploadedByName,
      isProcessed: json['isProcessed'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'fileName': fileName,
      'originalName': originalName,
      'fileUrl': fileUrl,
      'fileType': fileType,
      'fileSize': fileSize,
      'course': courseId,
      'institution': institutionId,
      'uploadedBy': uploadedById,
      'isProcessed': isProcessed,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  String get formattedSize {
    if (fileSize < 1024) {
      return '$fileSize B';
    } else if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }

  String get formattedDate {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    } else if (difference.inHours < 24 && now.day == createdAt.day) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inDays == 1) {
      final hour = createdAt.hour.toString().padLeft(2, '0');
      final minute = createdAt.minute.toString().padLeft(2, '0');
      return 'Yesterday at $hour:$minute';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      final day = createdAt.day.toString().padLeft(2, '0');
      final month = createdAt.month.toString().padLeft(2, '0');
      final year = createdAt.year;
      return '$day/$month/$year';
    }
  }
}
