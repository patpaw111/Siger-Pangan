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

  factory PriceRecord.fromJson(Map<String, dynamic> json) => PriceRecord(
        commodityBiId: (json['commodityBiId'] ?? json['commodityId'])?.toString() ?? '',
        commodityName: json['commodityName']?.toString() ?? '',
        categoryName: json['categoryName']?.toString() ?? '',
        denomination: json['denomination']?.toString() ?? 'kg',
        regionName: json['regionName']?.toString() ?? '',
        marketTypeId: (json['marketTypeId'] ?? json['levelHarga'] as num?)?.toInt() ?? 1,
        price: (json['price'] as num?)?.toInt(),
        priceDate: json['priceDate'] != null
            ? DateTime.tryParse(json['priceDate'].toString()) ?? DateTime.now()
            : DateTime.now(),
      );
}
