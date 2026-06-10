import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../domain/price_record.dart';

class PriceRepository {
  final _dio = DioClient.instance;

  Future<List<PriceRecord>> getLatestPrices({
    int marketTypeId = 1,
    String? kabupaten,
    String dataSource = 'BI',
  }) async {
    final basePath = dataSource == 'BI' ? '/api/v1/prices' : '/api/v1/sipangan-scraper/prices';
    final marketTypeParam = dataSource == 'BI' ? 'marketTypeId' : 'levelHargaId';
    try {
      final res = await _dio.get('$basePath/latest', queryParameters: {
        marketTypeParam: marketTypeId,
        if (kabupaten != null && kabupaten.isNotEmpty) 'kabupaten': kabupaten,
      });
      final list = res.data['data'] as List;
      return list.map((e) => PriceRecord.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<PriceRecord>> getPriceHistory({
    String? commodityId,
    String? commodityName,
    int marketTypeId = 1,
    String? kabupaten,
    int days = 30,
    String dataSource = 'BI',
  }) async {
    final basePath = dataSource == 'BI' ? '/api/v1/prices' : '/api/v1/sipangan-scraper/prices';
    final marketTypeParam = dataSource == 'BI' ? 'marketTypeId' : 'levelHargaId';
    try {
      final res = await _dio.get('$basePath/history', queryParameters: {
        marketTypeParam: marketTypeId,
        'days': days,
        if (commodityId != null) 'commodityId': commodityId,
        if (commodityName != null) 'commodityName': commodityName,
        if (kabupaten != null) 'kabupaten': kabupaten,
      });
      final list = res.data['data'] as List;
      return list.map((e) => PriceRecord.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<String>> getRegions({String dataSource = 'BI'}) async {
    final basePath = dataSource == 'BI' ? '/api/v1/prices' : '/api/v1/sipangan-scraper/prices';
    try {
      final res = await _dio.get('$basePath/regions');
      return List<String>.from(res.data['data'] as List);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<Map<String, dynamic>>> getCommodities({String dataSource = 'BI'}) async {
    final basePath = dataSource == 'BI' ? '/api/v1/prices' : '/api/v1/sipangan-scraper/prices';
    try {
      final res = await _dio.get('$basePath/commodities');
      return List<Map<String, dynamic>>.from(res.data['data'] as List);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
