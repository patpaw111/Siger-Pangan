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
    "beras medium":          "Beras Kualitas Medium",
    "beras":                 "Beras Kualitas Medium",
    "beras premium":         "Beras Kualitas Super",
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
            
        self.nvidia_enabled = False
        if settings.NVIDIA_API_KEY:
            self.nvidia_enabled = True
            self.nvidia_api_key = settings.NVIDIA_API_KEY
            logger.info("✅ NVIDIA API (Kimi k2.6) berhasil dikonfigurasi sebagai otak utama NLP")

    def analyze(self, text: str, language: str = "id") -> NlpResult:
        """
        Analisis teks dan kembalikan intent + entity yang diekstrak.
        """
        try:
            if self.nvidia_enabled:
                result = self._analyze_with_nvidia(text)
                if result.success and result.intent != "unknown":
                    return result
                logger.warning("⚠️ NVIDIA API gagal atau return unknown, fallback ke Rule-based")

            return self._analyze_with_rule_based(text)
        except Exception as e:
            logger.error(f"Error saat analisis NLP: {e}")
            return NlpResult(success=False, error_message=str(e))
            
    def _analyze_with_nvidia(self, text: str) -> NlpResult:
        import json
        import requests
        try:
            # Panggil model LLM dari NVIDIA NIM
            invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.nvidia_api_key}",
                "Accept": "application/json"
            }
            
            system_prompt = self._get_system_prompt()
            
            payload = {
                "model": "meta/llama-3.3-70b-instruct",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text},
                ],
                "max_tokens": 512,
                "temperature": 0.2,
                "top_p": 0.9,
                "stream": False,
            }
            
            response = requests.post(invoke_url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            
            resp_data = response.json()
            content = resp_data["choices"][0]["message"]["content"]
            
            # Parsing response JSON dari API
            json_str = content.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
            
            data = json.loads(json_str.strip())
            
            result = NlpResult()
            result.intent = data.get("intent", "unknown")
            result.confidence = 0.95 if result.intent != "unknown" else 0.5
            result.commodity = data.get("commodity", "")
            result.kabupaten = data.get("kabupaten", "")
            result.time_expression = "latest"
            
            # Khusus LLM conversational
            if "reply_text" in data and data["reply_text"]:
                setattr(result, "reply_text", data["reply_text"])
                
            result.success = True
            
            logger.info(f"🧠 [NVIDIA Output] Intent: {result.intent}, Commodity: {result.commodity}, Kabupaten: {result.kabupaten}")
            return result
            
        except Exception as e:
            logger.error(f"Error pada ekstraksi NVIDIA API: {e}")
            return NlpResult(success=False, error_message=str(e))
    
    def _get_system_prompt(self) -> str:
        """System prompt yang ringkas untuk meminimalisir latency."""
        return """Kamu adalah "Siger Pangan Bot", asisten harga pangan Provinsi Lampung. Baca pesan user, kembalikan HANYA JSON object murni (tanpa markdown/komentar).

ATURAN:
1. "intent": salah satu dari: query_price, compare_price, price_trend, list_commodity, list_region, greet, help, conversational. JANGAN PERNAH pakai "unknown".
2. Jika pesan hanya 1-2 kata benda (bawang/beras/ayam/cabe/minyak) -> intent = "query_price".
3. "commodity": petakan ke nama umum: bawang->"Bawang", minyak->"Minyak", cabe/lombok/cabai->"Cabai", beras->"Beras", ayam->"Ayam", sapi->"Sapi", telur->"Telur", gula->"Gula", tepung->"Tepung", ikan->"Ikan", jagung->"Jagung", kedelai->"Kedelai". Kosongkan "" jika tidak ada.
4. "kabupaten": petakan singkatan: lamsel->"Lampung Selatan", lamteng->"Lampung Tengah", balam->"Bandar Lampung", dll. Kosongkan "" jika tidak ada.
5. "reply_text": WAJIB DIISI. Balasan singkat, luwes, dan ramah. Untuk query_price/compare_price: beri kalimat pengantar singkat (1 kalimat). Untuk conversational: jawab dengan empati.

Contoh:
{"intent":"query_price","commodity":"Minyak","kabupaten":"","reply_text":"Ini dia daftar harga minyak goreng hari ini:"}
{"intent":"conversational","commodity":"Beras","kabupaten":"","reply_text":"Iya nih, harga beras memang lagi naik. Tetap semangat ya!"}"""

    def _analyze_with_rule_based(self, text: str) -> NlpResult:
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
