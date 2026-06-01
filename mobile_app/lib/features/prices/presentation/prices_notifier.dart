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

// Price history
class PriceHistoryParams {
  final String? commodityId;
  final String? commodityName;
  final int marketTypeId;
  final int days;

  const PriceHistoryParams({
    this.commodityId,
    this.commodityName,
    this.marketTypeId = 1,
    this.days = 30,
  });
}

final priceHistoryProvider =
    FutureProvider.family<List<PriceRecord>, PriceHistoryParams>(
  (ref, params) => ref.read(priceRepositoryProvider).getPriceHistory(
        commodityId: params.commodityId,
        commodityName: params.commodityName,
        marketTypeId: params.marketTypeId,
        days: params.days,
      ),
);

// Regions
final regionsProvider = FutureProvider<List<String>>(
  (ref) => ref.read(priceRepositoryProvider).getRegions(),
);

// Selected market type (persisted via StateProvider)
final selectedMarketTypeProvider = StateProvider<int>((ref) => 1);
