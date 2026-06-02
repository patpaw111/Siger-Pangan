import 'package:workmanager/workmanager.dart';

// Callback ini diperlukan untuk keperluan mendatang (mis. sinkronisasi data di background).
// Untuk notifikasi, kita sudah menggunakan zonedSchedule yang lebih efisien.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    // Placeholder: bisa diisi logika sinkronisasi data di masa mendatang
    return Future.value(true);
  });
}

class BackgroundWorker {
  static Future<void> init() async {
    await Workmanager().initialize(callbackDispatcher);
  }
}
