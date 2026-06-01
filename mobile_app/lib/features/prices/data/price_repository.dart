import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../domain/price_record.dart';

class PriceRepository {
  final _dio = DioClient.instance;

  Future<List<PriceRecord>> getLatestPrices({
    int marketTypeId = 1,
    String? kabupaten,
  }) async {
    try {
      final res = await _dio.get('/api/v1/prices/latest', queryParameters: {
        'marketTypeId': marketTypeId,
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
  }) async {
    try {
      final res = await _dio.get('/api/v1/prices/history', queryParameters: {
        'marketTypeId': marketTypeId,
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

  Future<List<String>> getRegions() async {
    try {
      final res = await _dio.get('/api/v1/prices/regions');
      return List<String>.from(res.data['data'] as List);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<Map<String, dynamic>>> getCommodities() async {
    try {
      final res = await _dio.get('/api/v1/prices/commodities');
      return List<Map<String, dynamic>>.from(res.data['data'] as List);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
