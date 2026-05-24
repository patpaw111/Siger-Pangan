import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/network/api_endpoints.dart';
import '../models/user_model.dart';

class AuthService {
  // Fungsi login terintegrasi dengan endpoint API Gateway Siger Pangan
  Future<UserModel?> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse(ApiEndpoints.login),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        return UserModel.fromJson(responseData['data']);
      } else {
        return null;
      }
    } catch (e) {
      print("Error Auth Service: $e");
      return null;
    }
  }
}