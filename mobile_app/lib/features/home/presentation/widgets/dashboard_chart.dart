import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/extensions/currency_extension.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/searchable_dropdown.dart';
import '../../../prices/domain/price_record.dart';
import '../../../prices/presentation/prices_notifier.dart';

class DashboardChart extends ConsumerWidget {
  final PriceRecord commodity;

  const DashboardChart({super.key, required this.commodity});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final days = ref.watch(selectedDaysDashboardProvider);
    final region = ref.watch(selectedRegionDashboardProvider);
    final baseMarket = ref.watch(selectedMarketTypeProvider);
    final isCompareEnabled = ref.watch(isCompareEnabledProvider);
    final dataSource = ref.watch(selectedDataSourceProvider);

    final params = PriceHistoryParams(
      commodityId: commodity.commodityBiId,
      commodityName: commodity.commodityName,
      marketTypeId: baseMarket,
      days: days,
      kabupaten: region,
      dataSource: dataSource,
    );
    final historyAsync = ref.watch(priceHistoryProvider(params));
    
    AsyncValue<List<PriceRecord>>? compareAsync;
    if (isCompareEnabled) {
      final compComm = ref.watch(compareToCommodityProvider);
      final compRegion = ref.watch(compareToRegionProvider);
      final compMarket = ref.watch(compareToMarketProvider);
      
      final compParams = PriceHistoryParams(
        commodityId: compComm?.commodityBiId ?? commodity.commodityBiId,
        commodityName: compComm?.commodityName ?? commodity.commodityName,
        marketTypeId: compMarket ?? baseMarket,
        days: days,
        kabupaten: compRegion ?? region,
        dataSource: dataSource,
      );
      compareAsync = ref.watch(priceHistoryProvider(compParams));
    }

    return historyAsync.when(
      data: (data) {
        if (data.isEmpty) {
          return _buildEmptyState(context, ref, commodity);
        }
        
        if (compareAsync != null) {
          return compareAsync.when(
            data: (compareData) => _buildChartContent(context, ref, data, compareData, days),
            loading: () => _buildChartContent(context, ref, data, null, days, isLoadingCompare: true),
            error: (_, __) => _buildChartContent(context, ref, data, null, days),
          );
        }
        
        return _buildChartContent(context, ref, data, null, days);
      },
      loading: () => const SizedBox(
        height: 350,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => SizedBox(
        height: 350,
        child: ErrorView(
          message: 'Gagal memuat grafik',
          onRetry: () => ref.invalidate(priceHistoryProvider),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, WidgetRef ref, PriceRecord commodity) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tampilkan Header (Nama Komoditas & Harga Saat Ini) meskipun histori kosong
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                commodity.commodityName,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    (commodity.price ?? 0).toRupiah(),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '/ ${commodity.denomination}',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildTimeframeSelector(context, ref, ref.watch(selectedDaysDashboardProvider)),
        Container(
          height: 250,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: const Center(child: Text('Data histori tidak tersedia')),
        ),
      ],
    );
  }

  Widget _buildChartContent(BuildContext context, WidgetRef ref, List<PriceRecord> data, List<PriceRecord>? compareData, int days, {bool isLoadingCompare = false}) {
    final Set<DateTime> allDates = {};
    final Map<DateTime, List<int>> byDate = {};
    for (final r in data) {
      if (r.price != null) {
        final key = DateTime(r.priceDate.year, r.priceDate.month, r.priceDate.day);
        byDate.putIfAbsent(key, () => []).add(r.price!);
        allDates.add(key);
      }
    }
    
    final Map<DateTime, List<int>> compareByDate = {};
    if (compareData != null) {
      for (final r in compareData) {
        if (r.price != null) {
          final key = DateTime(r.priceDate.year, r.priceDate.month, r.priceDate.day);
          compareByDate.putIfAbsent(key, () => []).add(r.price!);
          allDates.add(key);
        }
      }
    }

    final sorted = allDates.toList()..sort();
    
    final spots = <FlSpot>[];
    for (var i = 0; i < sorted.length; i++) {
      final date = sorted[i];
      if (byDate.containsKey(date)) {
        final avg = byDate[date]!.reduce((a, b) => a + b) / byDate[date]!.length;
        spots.add(FlSpot(i.toDouble(), avg));
      }
    }
    
    final compareSpots = <FlSpot>[];
    if (compareData != null) {
      for (var i = 0; i < sorted.length; i++) {
        final date = sorted[i];
        if (compareByDate.containsKey(date)) {
          final avg = compareByDate[date]!.reduce((a, b) => a + b) / compareByDate[date]!.length;
          compareSpots.add(FlSpot(i.toDouble(), avg));
        }
      }
    }

    if (spots.isEmpty) return _buildEmptyState(context, ref, commodity);

    var minY = spots.map((s) => s.y).reduce((a, b) => a < b ? a : b);
    var maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    
    if (compareSpots.isNotEmpty) {
      final compMinY = compareSpots.map((s) => s.y).reduce((a, b) => a < b ? a : b);
      final compMaxY = compareSpots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
      if (compMinY < minY) minY = compMinY;
      if (compMaxY > maxY) maxY = compMaxY;
    }

    double chartMinY = minY * 0.95;
    double chartMaxY = maxY * 1.05;
    if (chartMinY >= chartMaxY) {
      final padding = (chartMinY * 0.05).clamp(500.0, 5000.0);
      chartMinY -= padding;
      chartMaxY += padding;
    }
    final yRange = chartMaxY - chartMinY;
    final yInterval = yRange / 4;

    final latestPrice = spots.last.y.toInt();
    final firstPrice = spots.first.y.toInt();
    final diff = latestPrice - firstPrice;
    final isUp = diff > 0;
    final isFlat = diff == 0;
    
    final cryptoColor = isFlat ? AppColors.textSecondary : (isUp ? const Color(0xFF10B981) : const Color(0xFFEF4444));
    final compareColor = Colors.orange;

    // Hitung rata-rata, tertinggi, terendah (hanya untuk data utama)
    final allPrices = data.where((e) => e.price != null).map((e) => e.price!).toList();
    final high = allPrices.isNotEmpty ? allPrices.reduce((a, b) => a > b ? a : b) : 0;
    final low = allPrices.isNotEmpty ? allPrices.reduce((a, b) => a < b ? a : b) : 0;
    final avg = allPrices.isNotEmpty ? (allPrices.reduce((a, b) => a + b) / allPrices.length).round() : 0;
    final monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    final denomination = data.isNotEmpty ? data.first.denomination : 'kg';

    // Pembanding stats
    final allCompPrices = compareData?.where((e) => e.price != null).map((e) => e.price!).toList() ?? <int>[];
    final compHigh = allCompPrices.isNotEmpty ? allCompPrices.reduce((a, b) => a > b ? a : b) : null;
    final compLow = allCompPrices.isNotEmpty ? allCompPrices.reduce((a, b) => a < b ? a : b) : null;
    final compAvg = allCompPrices.isNotEmpty ? (allCompPrices.reduce((a, b) => a + b) / allCompPrices.length).round() : null;
    final compDenomination = (compareData != null && compareData.isNotEmpty) ? compareData.first.denomination : 'kg';

    final baseMarket = ref.watch(selectedMarketTypeProvider);
    final region = ref.watch(selectedRegionDashboardProvider);
    final isCompareEnabled = ref.watch(isCompareEnabledProvider);
    final dataSource = ref.watch(selectedDataSourceProvider);
    final compComm = ref.watch(compareToCommodityProvider);
    final compRegion = ref.watch(compareToRegionProvider);
    final compMarket = ref.watch(compareToMarketProvider);
    
    final marketTypes = dataSource == 'BI' 
        ? {1: 'Tradisional', 2: 'Modern', 3: 'Grosir'}
        : {1: 'Produsen', 3: 'Eceran'};

    final baseLabel = '${commodity.commodityName} • ${region ?? 'Semua Wilayah'} • ${marketTypes[baseMarket]}';
    final compareLabel = isCompareEnabled
        ? '${compComm?.commodityName ?? commodity.commodityName} • ${compRegion ?? region ?? 'Semua Wilayah'} • ${marketTypes[compMarket ?? baseMarket]}'
        : '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Huge Price Text
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                commodity.commodityName,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    latestPrice.toRupiah(),
                    style: const TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      letterSpacing: -1,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6, left: 4),
                    child: Text(
                      '/ $denomination',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textTertiary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (!isFlat)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: cryptoColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isUp ? Icons.arrow_upward : Icons.arrow_downward,
                            color: cryptoColor,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${(diff / firstPrice * 100).abs().toStringAsFixed(1)}%',
                            style: TextStyle(
                              color: cryptoColor,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              if (compareData != null || isLoadingCompare) ...[
                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(margin: const EdgeInsets.only(top: 4), width: 8, height: 8, decoration: BoxDecoration(color: cryptoColor, shape: BoxShape.circle)),
                        const SizedBox(width: 8),
                        Expanded(child: Text(baseLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textSecondary))),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(margin: const EdgeInsets.only(top: 4), width: 8, height: 8, decoration: BoxDecoration(color: compareColor, shape: BoxShape.circle)),
                        const SizedBox(width: 8),
                        Expanded(child: Text('$compareLabel${isLoadingCompare ? ' (Memuat...)' : ''}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textSecondary))),
                      ],
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        
        const SizedBox(height: 20),
        _buildTimeframeSelector(context, ref, days),
        const SizedBox(height: 24),

        // Big Clean Chart Crypto Style
        SizedBox(
          height: 250,
          child: Padding(
            padding: const EdgeInsets.only(left: 16),
            child: LineChart(
            LineChartData(
              lineTouchData: LineTouchData(
                enabled: true,
                getTouchedSpotIndicator: (LineChartBarData barData, List<int> spotIndexes) {
                  return spotIndexes.map((index) {
                    return TouchedSpotIndicatorData(
                      const FlLine(color: AppColors.textTertiary, strokeWidth: 1, dashArray: [4, 4]),
                      FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
                          radius: 5,
                          color: cryptoColor,
                          strokeWidth: 2,
                          strokeColor: Colors.white,
                        ),
                      ),
                    );
                  }).toList();
                },
                touchTooltipData: LineTouchTooltipData(
                  fitInsideHorizontally: true,
                  fitInsideVertically: true,
                  tooltipPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  tooltipRoundedRadius: 8,
                  getTooltipItems: (touchedSpots) {
                    return touchedSpots.map((spot) {
                      final date = sorted[spot.x.toInt()];
                      final dateStr = '${date.day} ${monthNames[date.month - 1]} ${date.year}';
                      final isCompare = spot.barIndex == 1;
                      final color = isCompare ? compareColor : cryptoColor;
                      final denom = isCompare ? compDenomination : denomination;
                      return LineTooltipItem(
                        '${isCompare ? 'Pembanding: ' : ''}${spot.y.toInt().toRupiah()} / $denom\n',
                        TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13),
                        children: [
                          TextSpan(
                            text: dateStr,
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.normal, fontSize: 11),
                          ),
                        ],
                      );
                    }).toList();
                  },
                ),
              ),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: yInterval,
                getDrawingHorizontalLine: (_) => const FlLine(color: Color(0xFFF3F4F6), strokeWidth: 1, dashArray: [5, 5]),
              ),
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 30,
                    interval: (spots.length / 4).ceilToDouble().clamp(1.0, 100.0),
                    getTitlesWidget: (val, _) {
                      final index = val.toInt();
                      if (index < 0 || index >= sorted.length) return const SizedBox.shrink();
                      final date = sorted[index];
                      return Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          '${date.day} ${monthNames[date.month - 1]}',
                          style: const TextStyle(fontSize: 10, color: AppColors.textTertiary),
                        ),
                      );
                    },
                  ),
                ),
                rightTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 50,
                    interval: yInterval,
                    getTitlesWidget: (val, meta) {
                      if (val == meta.max) {
                        final lastInterval = (meta.max / meta.appliedInterval).floor() * meta.appliedInterval;
                        if (meta.max - lastInterval < meta.appliedInterval * 0.5) {
                          return const SizedBox.shrink();
                        }
                      }
                      if (val == meta.min) {
                        final firstInterval = (meta.min / meta.appliedInterval).ceil() * meta.appliedInterval;
                        if (firstInterval - meta.min < meta.appliedInterval * 0.5) {
                          return const SizedBox.shrink();
                        }
                      }
                      final isSmallRange = yRange < 3000;
                      return Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Text(
                          '${(val / 1000).toStringAsFixed(isSmallRange ? 1 : 0)}k',
                          style: const TextStyle(fontSize: 10, color: AppColors.textTertiary),
                        ),
                      );
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              minY: chartMinY,
              maxY: chartMaxY,
              lineBarsData: [
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  color: cryptoColor,
                  barWidth: 2.5,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      colors: [cryptoColor.withValues(alpha: 0.15), cryptoColor.withValues(alpha: 0.0)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
                if (compareSpots.isNotEmpty)
                  LineChartBarData(
                    spots: compareSpots,
                    isCurved: true,
                    color: compareColor,
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [compareColor.withValues(alpha: 0.15), compareColor.withValues(alpha: 0.0)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        ),
        
        const SizedBox(height: 24),

        // Clean Stats Row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Row(
            children: [
              _buildStatCard(context, 'Tertinggi', '${high.toRupiah()}/$denomination', Icons.trending_up, const Color(0xFF10B981), compareValue: compHigh != null ? '${compHigh.toRupiah()}/$compDenomination' : null, compareColor: compareColor),
              const SizedBox(width: 12),
              _buildStatCard(context, 'Rata-rata', '${avg.toRupiah()}/$denomination', Icons.stacked_line_chart, AppColors.primary, compareValue: compAvg != null ? '${compAvg.toRupiah()}/$compDenomination' : null, compareColor: compareColor),
              const SizedBox(width: 12),
              _buildStatCard(context, 'Terendah', '${low.toRupiah()}/$denomination', Icons.trending_down, const Color(0xFFEF4444), compareValue: compLow != null ? '${compLow.toRupiah()}/$compDenomination' : null, compareColor: compareColor),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTimeframeSelector(BuildContext context, WidgetRef ref, int currentDays) {
    final options = {7: '7H', 14: '14H', 30: '1B', 90: '3B', 365: '1T'};
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Expanded(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: options.entries.map((e) {
                  final isSelected = currentDays == e.key;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => ref.read(selectedDaysDashboardProvider.notifier).state = e.key,
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: isSelected
                              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))]
                              : [],
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          e.value,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? AppColors.textPrimary : AppColors.textTertiary,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            // Divider
            Container(
              height: 20,
              width: 1,
              color: AppColors.textTertiary.withValues(alpha: 0.3),
              margin: const EdgeInsets.symmetric(horizontal: 8),
            ),
            // Filter Icon
            GestureDetector(
              onTap: () => _showFilterSheet(context, ref),
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.tune, size: 18, color: AppColors.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Consumer(
          builder: (context, sheetRef, child) {
            final marketType = sheetRef.watch(selectedMarketTypeProvider);
            final rawPricesAsync = sheetRef.watch(latestPricesProvider(marketType));
            final regionsAsync = sheetRef.watch(regionsProvider);
            final isCompareEnabled = sheetRef.watch(isCompareEnabledProvider);
            final dataSource = sheetRef.watch(selectedDataSourceProvider);

            final marketTypesFull = dataSource == 'BI'
                ? {1: 'Pasar Tradisional', 2: 'Pasar Modern', 3: 'Pasar Grosir'}
                : {1: 'Harga Produsen', 3: 'Harga Eceran'};

            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 24, right: 24, top: 24,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Filter Utama', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                      const SizedBox(height: 16),
                      
                      // Filter Sumber Data
                      const Text('Sumber Data', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        initialValue: dataSource,
                        decoration: _dropdownDecoration(),
                        isExpanded: true,
                        items: const [
                          DropdownMenuItem(value: 'BI', child: Text('Bank Indonesia (BI)', style: TextStyle(fontSize: 14))),
                          DropdownMenuItem(value: 'SiPangan', child: Text('Badan Pangan Nasional (SiPangan)', style: TextStyle(fontSize: 14))),
                        ],
                        onChanged: (val) {
                          if (val != null) sheetRef.read(selectedDataSourceProvider.notifier).state = val;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Filter Komoditas Utama
                      const Text('Komoditas', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 8),
                      rawPricesAsync.when(
                        data: (prices) {
                          final uniquePricesMap = <String, PriceRecord>{};
                          for (final p in prices) uniquePricesMap[p.commodityBiId] = p;
                          final uniquePrices = uniquePricesMap.values.toList();
                          uniquePrices.sort((a, b) => a.commodityName.compareTo(b.commodityName));
                          if (uniquePrices.isEmpty) return const Text('Data komoditas kosong');

                          var selected = sheetRef.watch(selectedDashboardCommodityProvider);
                          if (selected == null || !uniquePricesMap.containsKey(selected.commodityBiId)) {
                            selected = uniquePrices.firstWhere((p) => p.commodityName.toLowerCase() == 'bawang merah', orElse: () => uniquePrices.firstWhere((p) => p.commodityName.toLowerCase().contains('bawang merah'), orElse: () => uniquePrices.first));
                            Future.microtask(() => sheetRef.read(selectedDashboardCommodityProvider.notifier).state = selected);
                          }

                          return SearchableDropdown<PriceRecord>(
                            items: uniquePrices,
                            value: uniquePricesMap.containsKey(selected.commodityBiId) ? uniquePricesMap[selected.commodityBiId] : null,
                            itemAsString: (p) => p.commodityName,
                            hint: 'Pilih Komoditas',
                            onChanged: (val) {
                              if (val != null) sheetRef.read(selectedDashboardCommodityProvider.notifier).state = val;
                            },
                          );
                        },
                        loading: () => const CircularProgressIndicator(),
                        error: (e, _) => const Text('Gagal memuat'),
                      ),
                      
                      const SizedBox(height: 16),
                      // Filter Wilayah Utama
                      const Text('Wilayah', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 8),
                      regionsAsync.when(
                        data: (regions) {
                          final uniqueRegions = regions.toSet().toList();
                          var selected = sheetRef.watch(selectedRegionDashboardProvider);
                          if (selected != null && !uniqueRegions.contains(selected)) selected = null;
                          
                          return DropdownButtonFormField<String?>(
                            initialValue: selected,
                            decoration: _dropdownDecoration(),
                            isExpanded: true,
                            items: [
                              const DropdownMenuItem(value: null, child: Text('Semua Wilayah', style: TextStyle(fontSize: 14))),
                              ...uniqueRegions.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 14)))),
                            ],
                            onChanged: (val) => sheetRef.read(selectedRegionDashboardProvider.notifier).state = val,
                          );
                        },
                        loading: () => const CircularProgressIndicator(),
                        error: (e, _) => const Text('Gagal memuat'),
                      ),

                      const SizedBox(height: 16),
                      // Filter Jenis Pasar / Level Harga Utama
                      Text(dataSource == 'BI' ? 'Jenis Pasar' : 'Level Harga', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<int>(
                        initialValue: marketType,
                        decoration: _dropdownDecoration(),
                        isExpanded: true,
                        items: marketTypesFull.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontSize: 14)))).toList(),
                        onChanged: (val) {
                          if (val != null) sheetRef.read(selectedMarketTypeProvider.notifier).state = val;
                        },
                      ),

                      const SizedBox(height: 32),
                      const Divider(),
                      const SizedBox(height: 16),
                      
                      // Opsi Perbandingan
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Aktifkan Perbandingan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                          Switch(
                            value: isCompareEnabled,
                            activeColor: AppColors.primary,
                            onChanged: (val) {
                              sheetRef.read(isCompareEnabledProvider.notifier).state = val;
                            },
                          ),
                        ],
                      ),
                      
                      if (isCompareEnabled) ...[
                        const SizedBox(height: 16),
                        const Text('Komoditas Pembanding', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        const SizedBox(height: 8),
                        rawPricesAsync.when(
                          data: (prices) {
                            final uniquePricesMap = <String, PriceRecord>{};
                            for (final p in prices) uniquePricesMap[p.commodityBiId] = p;
                            final uniquePrices = uniquePricesMap.values.toList();
                            uniquePrices.sort((a, b) => a.commodityName.compareTo(b.commodityName));
                            var selected = sheetRef.watch(compareToCommodityProvider);
                            if (selected == null || !uniquePricesMap.containsKey(selected.commodityBiId)) {
                              selected = uniquePrices.first;
                              Future.microtask(() => sheetRef.read(compareToCommodityProvider.notifier).state = selected);
                            }
                            return SearchableDropdown<PriceRecord>(
                              items: uniquePrices,
                              value: (selected != null && uniquePricesMap.containsKey(selected.commodityBiId)) ? uniquePricesMap[selected.commodityBiId] : null,
                              itemAsString: (p) => p.commodityName,
                              hint: 'Pilih Komoditas Pembanding',
                              onChanged: (val) {
                                if (val != null) sheetRef.read(compareToCommodityProvider.notifier).state = uniquePricesMap[val.commodityBiId];
                              },
                            );
                          },
                          loading: () => const CircularProgressIndicator(),
                          error: (e, _) => const Text('Gagal memuat'),
                        ),

                        const SizedBox(height: 16),
                        const Text('Wilayah Pembanding', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        const SizedBox(height: 8),
                        regionsAsync.when(
                          data: (regions) {
                            final uniqueRegions = regions.toSet().toList();
                            var selected = sheetRef.watch(compareToRegionProvider);
                            if (selected != null && !uniqueRegions.contains(selected)) selected = null;
                            return DropdownButtonFormField<String?>(
                              initialValue: selected,
                              decoration: _dropdownDecoration(),
                              isExpanded: true,
                              items: [
                                const DropdownMenuItem(value: null, child: Text('Semua Wilayah', style: TextStyle(fontSize: 14))),
                                ...uniqueRegions.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 14)))),
                              ],
                              onChanged: (val) => sheetRef.read(compareToRegionProvider.notifier).state = val,
                            );
                          },
                          loading: () => const CircularProgressIndicator(),
                          error: (e, _) => const Text('Gagal memuat'),
                        ),

                        const SizedBox(height: 16),
                        Text(dataSource == 'BI' ? 'Jenis Pasar Pembanding' : 'Level Harga Pembanding', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<int>(
                          initialValue: sheetRef.watch(compareToMarketProvider) ?? (dataSource == 'BI' ? 2 : 1),
                          decoration: _dropdownDecoration(),
                          isExpanded: true,
                          items: marketTypesFull.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(fontSize: 14)))).toList(),
                          onChanged: (val) {
                            if (val != null) sheetRef.read(compareToMarketProvider.notifier).state = val;
                          },
                        ),
                      ],

                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: const Text('Selesai', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  InputDecoration _dropdownDecoration() {
    return InputDecoration(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color, {String? compareValue, Color? compareColor}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 12, color: color),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(title, style: const TextStyle(fontSize: 10, color: AppColors.textTertiary), maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (compareValue != null && compareColor != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Container(width: 6, height: 6, decoration: BoxDecoration(color: compareColor, shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      compareValue,
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: compareColor),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
