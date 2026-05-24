class UserModel {
  final int id;
  final String username;
  final String role;

  UserModel({required this.id, required this.username, required this.role});

  // Untuk mengubah JSON dari API menjadi objek Dart
  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      username: json['username'],
      role: json['role'],
    );
  }
}