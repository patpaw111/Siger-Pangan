"""
Entry point untuk menjalankan service sebagai module:
python -m app.server
"""
import threading
from loguru import logger
from app import run_grpc_server, http_app
from app.config import settings
import uvicorn

if __name__ == "__main__":
    logger.info("🚀 Starting Siger Pangan NLP Service...")

    # Jalankan gRPC di background thread
    grpc_thread = threading.Thread(target=run_grpc_server, daemon=True)
    grpc_thread.start()

    # Jalankan HTTP server di main thread (uvicorn)
    uvicorn.run(
        http_app,
        host="0.0.0.0",
        port=settings.HTTP_PORT,
        log_level=settings.LOG_LEVEL.lower(),
    )
