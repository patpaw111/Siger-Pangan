"""
gRPC Servicer — Implementasi NlpService dari .proto
====================================================
File ini adalah implementasi konkret dari contract yang didefinisikan di nlp.proto
"""

from loguru import logger
from prometheus_client import Counter, Histogram
import time

from app.grpc_generated import nlp_pb2, nlp_pb2_grpc
from app.services.nlp_pipeline import get_pipeline

# ──────────────────────────────────────────────
# Prometheus Metrics
# ──────────────────────────────────────────────

INFERENCE_DURATION = Histogram(
    "nlp_inference_duration_seconds",
    "Durasi proses NLP inference per request",
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0],
)

INTENT_COUNTER = Counter(
    "nlp_intent_classification_total",
    "Total request per intent yang terdeteksi",
    labelnames=["intent"],
)

REQUEST_COUNTER = Counter(
    "nlp_grpc_requests_total",
    "Total gRPC request yang masuk ke NLP service",
    labelnames=["method", "status"],
)


# ──────────────────────────────────────────────
# gRPC Servicer
# ──────────────────────────────────────────────

class NlpServicer(nlp_pb2_grpc.NlpServiceServicer):
    """Implementasi NlpService gRPC server."""

    def __init__(self):
        # Load pipeline saat server startup
        self.pipeline = get_pipeline()
        logger.info("✅ NlpServicer siap menerima request gRPC")

    def AnalyzeMessage(self, request, context):
        """
        Menerima teks dari NestJS, proses NLP, kembalikan hasil.

        Args:
            request: NlpRequest { session_id, text, language }
            context: gRPC context

        Returns:
            NlpResponse dengan intent, commodity, kabupaten, dll.
        """
        start_time = time.time()
        REQUEST_COUNTER.labels(method="AnalyzeMessage", status="attempt").inc()

        logger.info(f"[{request.session_id}] Menerima teks: '{request.text[:50]}...'")

        try:
            # Jalankan NLP pipeline
            result = self.pipeline.analyze(
                text=request.text,
                language=request.language or "id",
            )

            # Rekam metrics
            duration = time.time() - start_time
            INFERENCE_DURATION.observe(duration)
            INTENT_COUNTER.labels(intent=result.intent).inc()
            REQUEST_COUNTER.labels(method="AnalyzeMessage", status="success").inc()

            logger.info(
                f"[{request.session_id}] Intent: {result.intent} "
                f"| Commodity: {result.commodity} "
                f"| Kabupaten: {result.kabupaten} "
                f"| Durasi: {duration:.3f}s"
            )

            return nlp_pb2.NlpResponse(
                intent=result.intent,
                confidence=result.confidence,
                commodity=result.commodity,
                kabupaten=result.kabupaten,
                time_expression=result.time_expression,
                raw_entities=result.raw_entities,
                success=result.success,
                error_message=result.error_message,
            )

        except Exception as e:
            REQUEST_COUNTER.labels(method="AnalyzeMessage", status="error").inc()
            logger.error(f"[{request.session_id}] Error: {e}")

            return nlp_pb2.NlpResponse(
                intent="unknown",
                confidence=0.0,
                success=False,
                error_message=str(e),
            )

    def HealthCheck(self, request, context):
        """Health check untuk monitoring."""
        return nlp_pb2.HealthCheckResponse(
            is_healthy=True,
            model_version="1.0.0",
            status="ok",
        )
