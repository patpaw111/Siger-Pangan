# Folder ini berisi file Python yang di-generate dari nlp.proto
# File-file ini dibuat secara otomatis saat Docker build:
#
#   python -m grpc_tools.protoc \
#     -I./proto \
#     --python_out=./app/grpc_generated \
#     --grpc_python_out=./app/grpc_generated \
#     ./proto/nlp.proto
#
# Hasilnya:
#   nlp_pb2.py      — Message classes (NlpRequest, NlpResponse, dll)
#   nlp_pb2_grpc.py — Service classes (NlpServiceServicer, NlpServiceStub)
#
# JANGAN commit file _pb2.py ke Git! Sudah ada di .gitignore

__path__ = __import__('pkgutil').extend_path(__path__, __name__)
