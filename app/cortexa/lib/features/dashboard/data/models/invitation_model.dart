import 'package:equatable/equatable.dart';

/// Model for institution invitations (for Teachers and Students)
class InvitationModel extends Equatable {
  final String id;
  final String institutionId;
  final String institutionName;
  final String institutionLogoUrl;
  final String institutionType;
  final String invitedByName; // Name of the admin who sent the invite
  final String invitedByEmail;
  final String role; // 'student' or 'teacher'
  final DateTime invitedAt;
  final InvitationStatus status;
  final String? message; // Optional welcome message from admin

  const InvitationModel({
    required this.id,
    required this.institutionId,
    required this.institutionName,
    required this.institutionLogoUrl,
    required this.institutionType,
    required this.invitedByName,
    required this.invitedByEmail,
    required this.role,
    required this.invitedAt,
    required this.status,
    this.message,
  });

  factory InvitationModel.fromJson(Map<String, dynamic> json) {
    return InvitationModel(
      id: json['id'] ?? '',
      institutionId: json['institution_id'] ?? '',
      institutionName: json['institution_name'] ?? '',
      institutionLogoUrl: json['institution_logo_url'] ?? '',
      institutionType: json['institution_type'] ?? 'Institute',
      invitedByName: json['invited_by_name'] ?? '',
      invitedByEmail: json['invited_by_email'] ?? '',
      role: json['role'] ?? 'student',
      invitedAt: json['invited_at'] != null
          ? DateTime.parse(json['invited_at'])
          : DateTime.now(),
      status: InvitationStatus.fromString(json['status'] ?? 'pending'),
      message: json['message'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'institution_id': institutionId,
      'institution_name': institutionName,
      'institution_logo_url': institutionLogoUrl,
      'institution_type': institutionType,
      'invited_by_name': invitedByName,
      'invited_by_email': invitedByEmail,
      'role': role,
      'invited_at': invitedAt.toIso8601String(),
      'status': status.value,
      'message': message,
    };
  }

  InvitationModel copyWith({
    String? id,
    String? institutionId,
    String? institutionName,
    String? institutionLogoUrl,
    String? institutionType,
    String? invitedByName,
    String? invitedByEmail,
    String? role,
    DateTime? invitedAt,
    InvitationStatus? status,
    String? message,
  }) {
    return InvitationModel(
      id: id ?? this.id,
      institutionId: institutionId ?? this.institutionId,
      institutionName: institutionName ?? this.institutionName,
      institutionLogoUrl: institutionLogoUrl ?? this.institutionLogoUrl,
      institutionType: institutionType ?? this.institutionType,
      invitedByName: invitedByName ?? this.invitedByName,
      invitedByEmail: invitedByEmail ?? this.invitedByEmail,
      role: role ?? this.role,
      invitedAt: invitedAt ?? this.invitedAt,
      status: status ?? this.status,
      message: message ?? this.message,
    );
  }

  @override
  List<Object?> get props => [
        id,
        institutionId,
        institutionName,
        institutionLogoUrl,
        institutionType,
        invitedByName,
        invitedByEmail,
        role,
        invitedAt,
        status,
        message,
      ];
}

/// Invitation status enum
enum InvitationStatus {
  pending('pending'),
  accepted('accepted'),
  rejected('rejected'),
  expired('expired');

  final String value;
  const InvitationStatus(this.value);

  static InvitationStatus fromString(String value) {
    return InvitationStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => InvitationStatus.pending,
    );
  }

  String get displayName {
    switch (this) {
      case InvitationStatus.pending:
        return 'Pending';
      case InvitationStatus.accepted:
        return 'Accepted';
      case InvitationStatus.rejected:
        return 'Rejected';
      case InvitationStatus.expired:
        return 'Expired';
    }
  }
}
