import 'package:hive/hive.dart';
import 'package:equatable/equatable.dart';

part 'auth_token_model.g.dart';

@HiveType(typeId: 1)
class AuthTokenModel extends Equatable {
  @HiveField(0)
  final String accessToken;
  
  @HiveField(1)
  final String? refreshToken;
  
  @HiveField(2)
  final DateTime expiresAt;
  
  @HiveField(3)
  final DateTime createdAt;
  
  const AuthTokenModel({
    required this.accessToken,
    this.refreshToken,
    required this.expiresAt,
    required this.createdAt,
  });
  
  bool get isExpired => DateTime.now().isAfter(expiresAt);
  
  @override
  List<Object?> get props => [accessToken, refreshToken, expiresAt, createdAt];
}
