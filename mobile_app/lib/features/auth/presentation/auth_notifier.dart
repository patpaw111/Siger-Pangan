import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../core/config/env.dart';
import '../../../core/storage/secure_storage.dart';
import '../data/auth_repository.dart';
import '../domain/user_model.dart';

// State
class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;

  AuthState({this.user, this.isLoading = false, this.error});

  AuthState copyWith({UserModel? user, bool? isLoading, String? error}) =>
      AuthState(
        user: user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

// Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(AuthState()) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    final token = await SecureStorage.getToken();
    if (token == null) return;

    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repository.getProfile();
      state = state.copyWith(user: user, isLoading: false);
    } catch (e) {
      // Token tidak valid atau expired
      await SecureStorage.deleteToken();
      state = state.copyWith(isLoading: false, error: null);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repository.login(email: email, password: password);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repository.register(name: name, email: email, password: password);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> signInWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email'],
        serverClientId: Env.googleWebClientId.isNotEmpty ? Env.googleWebClientId : null,
      );

      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        state = state.copyWith(isLoading: false);
        return false;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        throw Exception('Tidak mendapatkan ID Token dari Google');
      }

      final user = await _repository.loginWithGoogle(idToken);
      state = state.copyWith(user: user, isLoading: false);
      return true;
    } on PlatformException catch (e) {
      String errorMessage = 'Login Google dibatalkan atau gagal.';
      if (e.code == 'sign_in_failed') {
        if (e.message != null && e.message!.contains('ApiException: 10')) {
          errorMessage = 'Konfigurasi Sistem Salah: SHA-1 atau Package Name belum terdaftar di Google Cloud Console.';
        } else {
          errorMessage = 'Gagal terhubung ke Google. Silakan coba lagi.';
        }
      } else if (e.code == 'network_error') {
        errorMessage = 'Tidak ada koneksi internet. Periksa jaringan Anda.';
      } else {
        errorMessage = 'Terjadi kesalahan sistem: ${e.code}';
      }
      state = state.copyWith(isLoading: false, error: errorMessage);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Terjadi kesalahan sistem: ${e.toString()}');
      return false;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = AuthState();
  }

  Future<void> loadProfile() async {
    try {
      final user = await _repository.getProfile();
      state = state.copyWith(user: user);
    } catch (_) {
      // Token kadaluarsa atau tidak valid
      await logout();
    }
  }
}

// Providers
final authRepositoryProvider = Provider((ref) => AuthRepository());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref.read(authRepositoryProvider)),
);
