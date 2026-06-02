class NewsArticle {
  final String title;
  final String link;
  final String pubDate;
  final String source;
  final String? imageUrl;

  NewsArticle({
    required this.title,
    required this.link,
    required this.pubDate,
    required this.source,
    this.imageUrl,
  });

  factory NewsArticle.fromXml(String title, String link, String pubDate, String source, String? imageUrl) {
    return NewsArticle(
      title: title,
      link: link,
      pubDate: pubDate,
      source: source,
      imageUrl: imageUrl,
    );
  }
}
