class UserModel {
  final String id;
  final String username;
  final String token;

  UserModel({required this.id, required this.username, required this.token});

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      username: json['username'],
      token: json['token'],
    );
  }
}