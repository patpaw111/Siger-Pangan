import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/user_model.dart';

class AuthRepository {
  final _dio = DioClient.instance;

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post('/api/v1/auth/login', data: {
        'email': email,
        'password': password,
      });

      final token = res.data['access_token'] as String;
      final userJson = res.data['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userJson);

      // Simpan token & info user ke secure storage
      await SecureStorage.saveToken(token);
      await SecureStorage.saveUserInfo(
        email: user.email,
        role: user.role,
        name: user.name,
      );

      return user;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<UserModel> register({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final res = await _dio.post('/api/v1/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
      });

      // API mengembalikan access_token dan data user seperti halnya login
      final token = res.data['access_token'] as String;
      final userJson = res.data['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userJson);

      await SecureStorage.saveToken(token);
      await SecureStorage.saveUserInfo(
        email: user.email,
        role: user.role,
        name: user.name,
      );

      return user;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<UserModel> getProfile() async {
    try {
      final res = await _dio.get('/api/v1/auth/me');
      return UserModel.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<UserModel> loginWithGoogle(String idToken) async {
    try {
      final res = await _dio.post('/api/v1/auth/google/mobile', data: {
        'idToken': idToken,
      });

      final token = res.data['access_token'] as String;
      final userJson = res.data['user'] as Map<String, dynamic>;
      final user = UserModel.fromJson(userJson);

      await SecureStorage.saveToken(token);
      await SecureStorage.saveUserInfo(
        email: user.email,
        role: user.role,
        name: user.name,
      );

      return user;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> logout() async {
    await SecureStorage.clearAll();
  }
}
