# ============================================================
# Dockerfile — FastAPI NLP Service (Python gRPC Server)
# ============================================================

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies yang dibutuhkan spaCy dan grpcio
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies terlebih dahulu (layer caching)
COPY be/service-nlp/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Download model spaCy multilingual (support Bahasa Indonesia)
# Pakai pip direct install agar versi match dengan spaCy 3.7.x
RUN pip install --no-cache-dir \
    https://github.com/explosion/spacy-models/releases/download/xx_ent_wiki_sm-3.7.0/xx_ent_wiki_sm-3.7.0-py3-none-any.whl

# Copy source code dan proto
COPY be/service-nlp/ ./
COPY proto/ ./proto/

# Generate gRPC Python bindings dari .proto
RUN python -m grpc_tools.protoc \
    -I./proto \
    --python_out=./app/grpc_generated \
    --grpc_python_out=./app/grpc_generated \
    ./proto/nlp.proto && \
    sed -i 's/^import nlp_pb2 as nlp__pb2$/from app.grpc_generated import nlp_pb2 as nlp__pb2/' \
    ./app/grpc_generated/nlp_pb2_grpc.py

# Copy entrypoint script
COPY be/service-nlp/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV GRPC_PORT=50051
ENV HTTP_PORT=8000

# Expose ports: 50051 (gRPC), 8000 (HTTP health check)
EXPOSE 50051 8000

# Jalankan entrypoint: generate pb2 + fix import + start server
CMD ["./entrypoint.sh"]
