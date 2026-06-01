import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _keyToken = 'access_token';
  static const _keyEmail = 'user_email';
  static const _keyRole = 'user_role';
  static const _keyName = 'user_name';

  // Token
  static Future<void> saveToken(String token) =>
      _storage.write(key: _keyToken, value: token);

  static Future<String?> getToken() => _storage.read(key: _keyToken);

  static Future<void> deleteToken() => _storage.delete(key: _keyToken);

  // User info
  static Future<void> saveUserInfo({
    required String email,
    required String role,
    String? name,
  }) async {
    await _storage.write(key: _keyEmail, value: email);
    await _storage.write(key: _keyRole, value: role);
    if (name != null) await _storage.write(key: _keyName, value: name);
  }

  static Future<String?> getUserEmail() => _storage.read(key: _keyEmail);
  static Future<String?> getUserRole() => _storage.read(key: _keyRole);
  static Future<String?> getUserName() => _storage.read(key: _keyName);

  // Clear all (logout)
  static Future<void> clearAll() => _storage.deleteAll();
}
