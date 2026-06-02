import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/price_repository.dart';
import '../domain/price_record.dart';

// Providers
final priceRepositoryProvider = Provider((_) => PriceRepository());

// Latest prices
final latestPricesProvider = FutureProvider.family<List<PriceRecord>, int>(
  (ref, marketTypeId) =>
      ref.read(priceRepositoryProvider).getLatestPrices(marketTypeId: marketTypeId),
);

// Dashboard Mode State
final selectedDashboardCommodityProvider = StateProvider<PriceRecord?>((ref) => null);
final selectedDaysDashboardProvider = StateProvider<int>((ref) => 14);
final selectedRegionDashboardProvider = StateProvider<String?>((ref) => null);

// Compare Mode State
final isCompareEnabledProvider = StateProvider<bool>((ref) => false);
final compareToCommodityProvider = StateProvider<PriceRecord?>((ref) => null);
final compareToRegionProvider = StateProvider<String?>((ref) => null);
final compareToMarketProvider = StateProvider<int?>((ref) => null);

// Price history
class PriceHistoryParams {
  final String? commodityId;
  final String? commodityName;
  final int marketTypeId;
  final int days;
  final String? kabupaten;

  const PriceHistoryParams({
    this.commodityId,
    this.commodityName,
    this.marketTypeId = 1,
    this.days = 30,
    this.kabupaten,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PriceHistoryParams &&
          runtimeType == other.runtimeType &&
          commodityId == other.commodityId &&
          commodityName == other.commodityName &&
          marketTypeId == other.marketTypeId &&
          days == other.days &&
          kabupaten == other.kabupaten;

  @override
  int get hashCode =>
      commodityId.hashCode ^
      commodityName.hashCode ^
      marketTypeId.hashCode ^
      days.hashCode ^
      kabupaten.hashCode;
}

final priceHistoryProvider =
    FutureProvider.family<List<PriceRecord>, PriceHistoryParams>(
  (ref, params) => ref.read(priceRepositoryProvider).getPriceHistory(
        commodityId: params.commodityId,
        commodityName: params.commodityName,
        marketTypeId: params.marketTypeId,
        days: params.days,
        kabupaten: params.kabupaten,
      ),
);

// Regions
final regionsProvider = FutureProvider<List<String>>(
  (ref) => ref.read(priceRepositoryProvider).getRegions(),
);

// Selected market type (persisted via StateProvider)
final selectedMarketTypeProvider = StateProvider<int>((ref) => 1);
