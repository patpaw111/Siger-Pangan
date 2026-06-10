class PriceRecord {
  final String commodityBiId;
  final String commodityName;
  final String categoryName;
  final String denomination;
  final String regionName;
  final int marketTypeId;
  final int? price;
  final DateTime priceDate;

  const PriceRecord({
    required this.commodityBiId,
    required this.commodityName,
    required this.categoryName,
    required this.denomination,
    required this.regionName,
    required this.marketTypeId,
    this.price,
    required this.priceDate,
  });

  factory PriceRecord.fromJson(Map<String, dynamic> json) {
    return PriceRecord(
      commodityBiId: (json['commodityBiId'] ?? json['commodityId'])?.toString() ?? '',
      commodityName: json['commodityName']?.toString() ?? '',
      categoryName: json['categoryName']?.toString() ?? '',
      denomination: _parseDenomination(json['commodityName']?.toString() ?? '', json['denomination']?.toString()),
      regionName: json['regionName']?.toString() ?? '',
      marketTypeId: (json['marketTypeId'] ?? json['levelHarga'] as num?)?.toInt() ?? 1,
      price: (json['price'] as num?)?.toInt(),
      priceDate: json['priceDate'] != null
          ? DateTime.tryParse(json['priceDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  static String _parseDenomination(String name, String? provided) {
    if (provided != null && provided.isNotEmpty && provided.toLowerCase() != 'kg') {
      return provided;
    }
    final lower = name.toLowerCase();
    if (lower.contains('minyak') || lower.contains('susu')) return 'liter';
    if (lower.contains('mie') || lower.contains('indomie') || lower.contains('garam')) return 'bungkus';
    return 'kg';
  }
}
