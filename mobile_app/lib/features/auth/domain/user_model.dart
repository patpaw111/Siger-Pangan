class UserModel {
  final String id;
  final String email;
  final String role;
  final String? name;
  final String? picture;

  const UserModel({
    required this.id,
    required this.email,
    required this.role,
    this.name,
    this.picture,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id']?.toString() ?? '',
        email: json['email'] ?? '',
        role: json['role'] ?? 'USER',
        name: json['name'],
        picture: json['picture'],
      );

  bool get isSuperAdmin => role == 'SUPER_ADMIN';
  bool get isSurveyor => role == 'SURVEYOR';
}
