import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/extensions/currency_extension.dart';
import '../../../shared/widgets/loading_indicator.dart';
import 'prices_notifier.dart';
import '../domain/price_record.dart';

class PriceChartScreen extends ConsumerStatefulWidget {
  final String commodityId;
  final String commodityName;

  const PriceChartScreen({
    super.key,
    required this.commodityId,
    required this.commodityName,
  });

  @override
  ConsumerState<PriceChartScreen> createState() => _PriceChartScreenState();
}

class _PriceChartScreenState extends ConsumerState<PriceChartScreen> {
  int _selectedDays = 30;

  @override
  Widget build(BuildContext context) {
    final params = PriceHistoryParams(
      commodityId: widget.commodityId,
      marketTypeId: ref.watch(selectedMarketTypeProvider),
      days: _selectedDays,
    );
    final historyAsync = ref.watch(priceHistoryProvider(params));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.commodityName, maxLines: 1, overflow: TextOverflow.ellipsis),
        backgroundColor: AppColors.surface,
      ),
      body: Column(
        children: [
          // Day selector
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                for (final d in [7, 30, 90])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('$d Hari'),
                      selected: _selectedDays == d,
                      onSelected: (_) => setState(() => _selectedDays = d),
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: _selectedDays == d ? Colors.white : AppColors.textSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: historyAsync.when(
              data: (data) => data.isEmpty
                  ? const Center(child: Text('Tidak ada data tersedia'))
                  : _ChartContent(data: data, days: _selectedDays),
              loading: () => const LoadingIndicator(),
              error: (e, _) => ErrorView(
                message: 'Gagal memuat histori harga',
                onRetry: () => ref.invalidate(priceHistoryProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChartContent extends StatelessWidget {
  final List<PriceRecord> data;
  final int days;

  const _ChartContent({required this.data, required this.days});

  @override
  Widget build(BuildContext context) {
    // Kelompokkan berdasarkan tanggal & ambil rata-rata harga
    final Map<DateTime, List<int>> byDate = {};
    for (final r in data) {
      if (r.price != null) {
        final key = DateTime(r.priceDate.year, r.priceDate.month, r.priceDate.day);
        byDate.putIfAbsent(key, () => []).add(r.price!);
      }
    }

    final sorted = byDate.keys.toList()..sort();
    final spots = sorted.asMap().entries.map((e) {
      final avg = byDate[e.value]!.reduce((a, b) => a + b) / byDate[e.value]!.length;
      return FlSpot(e.key.toDouble(), avg);
    }).toList();

    if (spots.isEmpty) {
      return const Center(child: Text('Tidak ada data harga'));
    }

    final minY = spots.map((s) => s.y).reduce((a, b) => a < b ? a : b);
    final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    final latestPrice = spots.last.y.toInt();
    final firstPrice = spots.first.y.toInt();
    final diff = latestPrice - firstPrice;
    final isUp = diff > 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Harga Terkini', style: Theme.of(context).textTheme.bodyMedium),
                      const SizedBox(height: 4),
                      Text(
                        latestPrice.toRupiah(),
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: (isUp ? AppColors.priceUp : AppColors.priceDown).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isUp ? Icons.trending_up : Icons.trending_down,
                        color: isUp ? AppColors.priceUp : AppColors.priceDown,
                        size: 18,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${isUp ? '+' : ''}${diff.toRupiah()}',
                        style: TextStyle(
                          color: isUp ? AppColors.priceUp : AppColors.priceDown,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Chart
          Text('Tren Harga $days Hari Terakhir', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          Container(
            height: 220,
            padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: (maxY - minY) / 4,
                  getDrawingHorizontalLine: (_) => const FlLine(
                    color: Color(0xFFE5E7EB),
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 60,
                      getTitlesWidget: (val, _) => Text(
                        val.toInt().toRupiah(),
                        style: const TextStyle(fontSize: 9, color: AppColors.textTertiary),
                      ),
                    ),
                  ),
                  bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                minY: minY * 0.97,
                maxY: maxY * 1.03,
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: AppColors.primary,
                    barWidth: 2.5,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppColors.primary.withOpacity(0.08),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
