"""
NLP Pipeline — Intent Classification + Entity Extraction
=========================================================
Menggunakan pendekatan dua lapis:
1. Rule-based (cepat, untuk kasus yang jelas)
2. spaCy NER (untuk entity extraction nama komoditas & kabupaten)
"""

import re
from dataclasses import dataclass, field
from typing import Optional

import spacy
from loguru import logger

from app.config import settings


# ──────────────────────────────────────────────
# Data Classes
# ──────────────────────────────────────────────

@dataclass
class NlpResult:
    intent: str = "unknown"
    confidence: float = 0.0
    commodity: str = ""
    kabupaten: str = ""
    time_expression: str = ""
    raw_entities: list[str] = field(default_factory=list)
    success: bool = True
    error_message: str = ""


# ──────────────────────────────────────────────
# Kamus Data (Rule-based untuk Lampung)
# ──────────────────────────────────────────────

COMMODITIES = {
    # Format: "kata kunci" -> "nama canonical"
    "beras medium":          "Beras Medium",
    "beras":                 "Beras Medium",
    "beras premium":         "Beras Premium",
    "jagung":                "Jagung",
    "kedelai":               "Kedelai",
    "kacang kedelai":        "Kedelai",
    "bawang merah":          "Bawang Merah",
    "bawang putih":          "Bawang Putih",
    "cabai merah":           "Cabai Merah Keriting",
    "cabe merah":            "Cabai Merah Keriting",
    "cabai keriting":        "Cabai Merah Keriting",
    "cabai rawit":           "Cabai Rawit Merah",
    "cabe rawit":            "Cabai Rawit Merah",
    "daging sapi":           "Daging Sapi",
    "sapi":                  "Daging Sapi",
    "ayam":                  "Daging Ayam Ras",
    "daging ayam":           "Daging Ayam Ras",
    "telur ayam":            "Telur Ayam Ras",
    "telur":                 "Telur Ayam Ras",
    "minyak goreng":         "Minyak Goreng",
    "minyak":                "Minyak Goreng",
    "gula pasir":            "Gula Pasir",
    "gula":                  "Gula Pasir",
    "tepung terigu":         "Tepung Terigu",
    "tepung":                "Tepung Terigu",
    "ikan kembung":          "Ikan Kembung",
    "kembung":               "Ikan Kembung",
    "ikan bandeng":          "Ikan Bandeng",
    "bandeng":               "Ikan Bandeng",
}

REGIONS = {
    # Format: "variasi nama" -> "nama canonical"
    "bandar lampung":     "Bandar Lampung",
    "bandarlampung":      "Bandar Lampung",
    "bl":                 "Bandar Lampung",
    "metro":              "Metro",
    "lampung selatan":    "Lampung Selatan",
    "lamsel":             "Lampung Selatan",
    "lampung tengah":     "Lampung Tengah",
    "lamteng":            "Lampung Tengah",
    "lampung utara":      "Lampung Utara",
    "lampura":            "Lampung Utara",
    "lamut":              "Lampung Utara",
    "lampung barat":      "Lampung Barat",
    "lambar":             "Lampung Barat",
    "lampung timur":      "Lampung Timur",
    "lamtim":             "Lampung Timur",
    "tanggamus":          "Tanggamus",
    "pringsewu":          "Pringsewu",
    "pesawaran":          "Pesawaran",
    "mesuji":             "Mesuji",
    "tulang bawang":      "Tulang Bawang",
    "tuba":               "Tulang Bawang",
    "tulang bawang barat":"Tulang Bawang Barat",
    "tubaba":             "Tulang Bawang Barat",
    "way kanan":          "Way Kanan",
    "pesisir barat":      "Pesisir Barat",
    "pesibar":            "Pesisir Barat",
}

INTENT_PATTERNS = {
    "query_price": [
        r"berapa harga",
        r"harga .+ berapa",
        r"harga .+ sekarang",
        r"harga .+ hari ini",
        r"info harga",
        r"cek harga",
        r"harga terkini",
    ],
    "compare_price": [
        r"bandingkan harga",
        r"perbandingan harga",
        r"lebih murah",
        r"lebih mahal",
        r"mana yang lebih",
        r"banding.+harga",
    ],
    "price_trend": [
        r"naik.+turun",
        r"turun.+naik",
        r"tren harga",
        r"harga minggu",
        r"harga bulan",
        r"apakah harga",
        r"fluktuasi",
    ],
    "list_commodity": [
        r"komoditas apa",
        r"apa saja komoditas",
        r"daftar komoditas",
        r"komoditas yang dipantau",
        r"ada komoditas apa",
    ],
    "list_region": [
        r"kabupaten apa",
        r"daerah apa saja",
        r"wilayah yang tercakup",
        r"daerah mana saja",
    ],
    "greet": [
        r"^halo",
        r"^hai",
        r"^hi\b",
        r"selamat pagi",
        r"selamat siang",
        r"selamat sore",
        r"selamat malam",
        r"^apa kabar",
    ],
    "help": [
        r"bisa bantu apa",
        r"cara pakai",
        r"cara penggunaan",
        r"fitur apa",
        r"help",
        r"bantuan",
    ],
}

TIME_EXPRESSIONS = {
    "hari ini":   "today",
    "kemarin":    "yesterday",
    "minggu ini": "this_week",
    "minggu lalu":"last_week",
    "bulan ini":  "this_month",
    "bulan lalu": "last_month",
    "terbaru":    "latest",
    "sekarang":   "today",
    "terkini":    "latest",
}


# ──────────────────────────────────────────────
# NLP Pipeline Class
# ──────────────────────────────────────────────

class NlpPipeline:
    def __init__(self):
        try:
            self.nlp = spacy.load(settings.NLP_MODEL)
            logger.info(f"✅ spaCy model '{settings.NLP_MODEL}' berhasil dimuat")
        except OSError:
            logger.warning(f"⚠️ Model '{settings.NLP_MODEL}' tidak ditemukan, menggunakan rule-based saja")
            self.nlp = None

    def analyze(self, text: str, language: str = "id") -> NlpResult:
        """
        Analisis teks dan kembalikan intent + entity yang diekstrak.
        """
        try:
            text_lower = text.lower().strip()
            result = NlpResult()

            # 1. Classify Intent
            result.intent, result.confidence = self._classify_intent(text_lower)

            # 2. Extract Commodity
            result.commodity = self._extract_commodity(text_lower)

            # 3. Extract Kabupaten
            result.kabupaten = self._extract_kabupaten(text_lower)

            # 4. Extract Time Expression
            result.time_expression = self._extract_time(text_lower)

            # 5. spaCy NER (sebagai backup jika rule-based tidak menemukan)
            if self.nlp and (not result.commodity or not result.kabupaten):
                spacy_entities = self._spacy_extract(text)
                result.raw_entities = spacy_entities

            result.success = True
            return result

        except Exception as e:
            logger.error(f"Error saat analisis NLP: {e}")
            return NlpResult(success=False, error_message=str(e))

    def _classify_intent(self, text: str) -> tuple[str, float]:
        """Klasifikasi intent menggunakan regex patterns."""
        for intent, patterns in INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text):
                    return intent, 0.90
        return "unknown", 0.30

    def _extract_commodity(self, text: str) -> str:
        """Ekstrak nama komoditas dari teks (terpanjang dulu untuk akurasi)."""
        # Sort by length descending agar "beras medium" cocok sebelum "beras"
        for keyword in sorted(COMMODITIES.keys(), key=len, reverse=True):
            if keyword in text:
                return COMMODITIES[keyword]
        return ""

    def _extract_kabupaten(self, text: str) -> str:
        """Ekstrak nama kabupaten dari teks."""
        for keyword in sorted(REGIONS.keys(), key=len, reverse=True):
            if keyword in text:
                return REGIONS[keyword]
        return ""

    def _extract_time(self, text: str) -> str:
        """Ekstrak ekspresi waktu dari teks."""
        for expression in sorted(TIME_EXPRESSIONS.keys(), key=len, reverse=True):
            if expression in text:
                return TIME_EXPRESSIONS[expression]
        return "latest"

    def _spacy_extract(self, text: str) -> list[str]:
        """Gunakan spaCy NER sebagai tambahan."""
        if not self.nlp:
            return []
        doc = self.nlp(text)
        return [f"{ent.text} ({ent.label_})" for ent in doc.ents]


# Singleton instance
_pipeline: Optional[NlpPipeline] = None


def get_pipeline() -> NlpPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = NlpPipeline()
    return _pipeline
