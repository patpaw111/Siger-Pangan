import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

// Provider untuk layanan AuthService
final authServiceProvider = Provider((ref) => AuthService());

// StateProvider untuk menyimpan data user yang sedang login
final userProvider = StateProvider<UserModel?>((ref) => null);

// StateProvider untuk status loading saat proses login
final authLoadingProvider = StateProvider<bool>((ref) => false);