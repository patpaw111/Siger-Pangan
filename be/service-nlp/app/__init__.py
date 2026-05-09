"""
Siger Pangan — NLP Service Entry Point
=======================================
Menjalankan dua server secara bersamaan:
1. gRPC Server (port 50051) — untuk komunikasi dengan NestJS
2. HTTP Server (port 8000)  — untuk health check & metrics Prometheus
"""

import asyncio
import threading
from concurrent import futures
from loguru import logger

import grpc
from fastapi import FastAPI
from prometheus_client import make_asgi_app
import uvicorn

from app.grpc_generated import nlp_pb2_grpc
from app.services.nlp_servicer import NlpServicer
from app.config import settings


# ──────────────────────────────────────────────
# FastAPI App (HTTP — Health Check & Metrics)
# ──────────────────────────────────────────────
http_app = FastAPI(
    title="Siger Pangan NLP Service",
    description="NLP Processor for Siger Pangan chatbot (gRPC internal service)",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
)

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
http_app.mount("/metrics", metrics_app)


@http_app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "siger-pangan-nlp",
        "version": "1.0.0",
        "grpc_port": settings.GRPC_PORT,
    }


# ──────────────────────────────────────────────
# gRPC Server
# ──────────────────────────────────────────────
def run_grpc_server():
    """Jalankan gRPC server di thread terpisah."""
    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        options=[
            ("grpc.max_send_message_length", 10 * 1024 * 1024),   # 10MB
            ("grpc.max_receive_message_length", 10 * 1024 * 1024), # 10MB
        ],
    )
    nlp_pb2_grpc.add_NlpServiceServicer_to_server(NlpServicer(), server)

    listen_addr = f"[::]:{settings.GRPC_PORT}"
    server.add_insecure_port(listen_addr)
    server.start()

    logger.info(f"✅ gRPC Server berjalan di {listen_addr}")
    server.wait_for_termination()


# ──────────────────────────────────────────────
# Main Entry Point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    logger.info("🚀 Starting Siger Pangan NLP Service...")

    # Jalankan gRPC di background thread
    grpc_thread = threading.Thread(target=run_grpc_server, daemon=True)
    grpc_thread.start()

    # Jalankan HTTP server di main thread
    uvicorn.run(
        http_app,
        host="0.0.0.0",
        port=settings.HTTP_PORT,
        log_level=settings.LOG_LEVEL.lower(),
    )
