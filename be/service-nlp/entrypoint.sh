#!/bin/bash
# ============================================================
# entrypoint.sh ??? Generate gRPC bindings & fix imports
# ============================================================
set -e

echo "???? Generating gRPC Python bindings dari proto/nlp.proto..."
python -m grpc_tools.protoc \
    -I./proto \
    --python_out=./app/grpc_generated \
    --grpc_python_out=./app/grpc_generated \
    ./proto/nlp.proto

# Fix import: grpc_tools menghasilkan 'import nlp_pb2' (absolut),
# tapi karena kita pakai package, perlu 'from app.grpc_generated import nlp_pb2'
echo "???? Fixing import di nlp_pb2_grpc.py..."
sed -i 's/^import nlp_pb2 as nlp__pb2$/from app.grpc_generated import nlp_pb2 as nlp__pb2/' \
    ./app/grpc_generated/nlp_pb2_grpc.py

echo "??? gRPC bindings siap. Menjalankan server..."
exec python -m app.server