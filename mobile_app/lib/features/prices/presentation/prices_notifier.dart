import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/price_repository.dart';
import '../domain/price_record.dart';

// Providers
final priceRepositoryProvider = Provider((_) => PriceRepository());

// Data Source State
final selectedDataSourceProvider = StateProvider<String>((ref) => 'BI');

// Latest prices
final latestPricesProvider = FutureProvider.family<List<PriceRecord>, int>(
  (ref, marketTypeId) {
    final ds = ref.watch(selectedDataSourceProvider);
    return ref.read(priceRepositoryProvider).getLatestPrices(marketTypeId: marketTypeId, dataSource: ds);
  }
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
  final String dataSource;

  const PriceHistoryParams({
    this.commodityId,
    this.commodityName,
    this.marketTypeId = 1,
    this.days = 30,
    this.kabupaten,
    this.dataSource = 'BI',
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
          kabupaten == other.kabupaten &&
          dataSource == other.dataSource;

  @override
  int get hashCode =>
      commodityId.hashCode ^
      commodityName.hashCode ^
      marketTypeId.hashCode ^
      days.hashCode ^
      kabupaten.hashCode ^
      dataSource.hashCode;
}

final priceHistoryProvider =
    FutureProvider.family<List<PriceRecord>, PriceHistoryParams>(
  (ref, params) => ref.read(priceRepositoryProvider).getPriceHistory(
        commodityId: params.commodityId,
        commodityName: params.commodityName,
        marketTypeId: params.marketTypeId,
        days: params.days,
        kabupaten: params.kabupaten,
        dataSource: params.dataSource,
      ),
);

// Regions
final regionsProvider = FutureProvider<List<String>>(
  (ref) {
    final ds = ref.watch(selectedDataSourceProvider);
    return ref.read(priceRepositoryProvider).getRegions(dataSource: ds);
  }
);

// Selected market type (persisted via StateProvider)
final selectedMarketTypeProvider = StateProvider<int>((ref) => 1);
