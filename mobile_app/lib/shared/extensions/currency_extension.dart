import 'package:intl/intl.dart';

extension CurrencyFormat on int? {
  /// Format angka jadi Rp14.850
  String toRupiah() {
    if (this == null) return '-';
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    );
    return formatter.format(this);
  }
}

extension DateFormat2 on DateTime {
  String toIndonesian() {
    const months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return '$day ${months[month]} $year';
  }
}
