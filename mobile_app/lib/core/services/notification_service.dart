import 'dart:math';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz_data;

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  // Channel config
  static const _channelId = 'siger_pangan_daily';
  static const _channelName = 'Siger Pangan';
  static const _channelDesc = 'Info harga & berita pasar harian';

  Future<void> init() async {
    // Inisialisasi timezone untuk Indonesia
    tz_data.initializeTimeZones();
    tz.setLocalLocation(tz.getLocation('Asia/Jakarta'));

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: android);
    await _plugin.initialize(settings: initSettings);

    // Minta izin notifikasi (Android 13+)
    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  /// Jadwalkan 2 notifikasi harian (07:00 & 10:00 WIB).
  /// Dipanggil saat toggle ON di Settings.
  Future<void> scheduleDailyNotifications() async {
    // Hapus jadwal lama dulu
    await _plugin.cancelAll();

    // Jadwal 1 — Pagi jam 07:00
    final morningTemplate = NotificationTemplates.getRandomMorning();
    await _scheduleAtTime(
      id: 1,
      hour: 7,
      minute: 0,
      title: morningTemplate['title']!,
      body: morningTemplate['body']!,
    );

    // Jadwal 2 — Waktu belanja jam 10:00
    final shoppingTemplate = NotificationTemplates.getRandomShopping();
    await _scheduleAtTime(
      id: 2,
      hour: 10,
      minute: 0,
      title: shoppingTemplate['title']!,
      body: shoppingTemplate['body']!,
    );
  }

  /// Batalkan semua notifikasi terjadwal.
  /// Dipanggil saat toggle OFF di Settings.
  Future<void> cancelAllScheduled() async {
    await _plugin.cancelAll();
  }

  Future<void> _scheduleAtTime({
    required int id,
    required int hour,
    required int minute,
    required String title,
    required String body,
  }) async {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);

    // Kalau waktu sudah lewat hari ini, jadwalkan besok
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }

    const androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDesc,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );
    const notifDetails = NotificationDetails(android: androidDetails);

    await _plugin.zonedSchedule(
      id: id,
      title: title,
      body: body,
      scheduledDate: scheduled,
      notificationDetails: notifDetails,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time, // Ulangi tiap hari di jam yang sama
    );
  }

  /// Tampilkan notifikasi instan (untuk testing di Settings).
  Future<void> showTestNotification() async {
    const androidDetails = AndroidNotificationDetails(
      _channelId, _channelName,
      channelDescription: _channelDesc,
      importance: Importance.max,
      priority: Priority.high,
    );
    final template = NotificationTemplates.getRandomShopping();
    await _plugin.show(
      id: 99,
      title: template['title'],
      body: template['body'],
      notificationDetails: const NotificationDetails(android: androidDetails),
    );
  }
}

// ─── Template Pesan Santai ────────────────────────────────────────────────
class NotificationTemplates {
  static final _rng = Random();

  // ── Pagi (07:00) — Motivasi & Info Sebelum Rencanain Belanja ──────────
  static const _morningTitles = [
    'Selamat Pagi! ☀️',
    'Mulai Hari Ini Yuk! 🌤️',
    'Pagi-pagi Cek Harga Dulu! ☕',
  ];
  static const _morningBodies = [
    'Rencanain belanja lebih pinter hari ini. Cek harga komoditas terkini di Siger Pangan!',
    'Sebelum ke pasar, intip dulu harga sembako hari ini yuk. Biar nggak kaget di kasir!',
    'Good morning! Harga pasar hari ini sudah update. Cek sekarang biar belanja makin hemat 🛒',
  ];

  // ── Jam Belanja (10:00) — Motivasi Aktif Belanja ──────────────────────
  static const _shoppingTitles = [
    'Waktunya Belanja Nih! 🛒',
    'Cek Harga Dulu Sebelum Beli! 💡',
    'Pasar Lagi Rame, Cek Harga Yuk! 🏪',
  ];
  static const _shoppingBodies = [
    'Jangan sampai kemahalan! Pantau harga sembako terkini biar belanja makin pinter.',
    'Pstt.. ada komoditas yang harganya berubah hari ini. Cek dulu di Siger Pangan sebelum belanja!',
    'Belanja cerdas dimulai dari info yang tepat. Buka Siger Pangan sekarang yuk kak! 🌿',
  ];

  static Map<String, String> getRandomMorning() => {
    'title': _morningTitles[_rng.nextInt(_morningTitles.length)],
    'body': _morningBodies[_rng.nextInt(_morningBodies.length)],
  };

  static Map<String, String> getRandomShopping() => {
    'title': _shoppingTitles[_rng.nextInt(_shoppingTitles.length)],
    'body': _shoppingBodies[_rng.nextInt(_shoppingBodies.length)],
  };
}
