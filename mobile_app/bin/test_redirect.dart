import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get(
      'https://news.google.com/rss/articles/CBMi3gFBVV95cUxOTllSNVlUNmF6bkhfVHhSU0c1Rm1oTFltS2lkX3Bua0lrTmtqVklCeU9lSGJGZmx3M3NoVWJUa3dadGJmS1VRb3pqa2dpeXgyaGRlZ0FlWWtiTDU2Z2J3Mmx4TEh5RGRHTGg0bVpaNkNReUZtbW5UTEJmOFRtd3UtdGs5bVBxQkhtTnQ1cVFONkJhcUp5QzJKM3RWeUlpVHptRWlJcFJmbjRyb2lPVzZtZUpveF9JMl9HeUhOS2U0b0hyVDNVWTZEdEt6NHFDTGt4VjJHaktFY0RRbWJmQVHSAeMBQVVfeXFMUGhqd3Q4a0dOT19LOEt6V3RuSnFleEN4c18wLWFueW1feVJ4ZGhpUEVMcXk3djE5eXZwdDEwODZEdXgtT2dZTm94YjdkdG5XNkhRV1psM0Fuc3R6akJjZmlWNlVwRTA2RDNYYzI4U0Z6NUZmV2dGLWVmWWs0Tkd6UGdOVmh2MFNRN2V2eklDM2YzZl9nRDdWRVkwMU9ZZTR0ZzdWeHlPNFhQR0xBdnNqbVBxQWxaVWc0WU5vSzdodHIzak9OTjJJTS1CMjJDZ2dzN3RKMmxIVFBGcU81VWFFeVprSnc?oc=5',
      options: Options(followRedirects: false, validateStatus: (status) => true)
    );
    print('Status: ${response.statusCode}');
    print('Redirect URL: ${response.headers.value("location")}');
  } catch (e) {
    print(e);
  }
}
