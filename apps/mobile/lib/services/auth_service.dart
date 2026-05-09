import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  // Ganti URL dengan endpoint API pengerjaanmu
  final String baseUrl = "http://localhost:3000"; 

  Future<bool> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      body: {'username': username, 'password': password},
    );

    if (response.statusCode == 200) {
      // Simpan token atau data user di sini jika perlu
      return true;
    } else {
      return false;
    }
  }
}