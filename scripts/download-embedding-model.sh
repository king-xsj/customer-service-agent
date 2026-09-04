#!/usr/bin/env bash
# 预下载嵌入模型到本地 models/ 目录，避免运行时依赖海外 CDN（会 302 到 us.aws.cdn.hf.co 导致超时）。
# 用法：bash scripts/download-embedding-model.sh
set -euo pipefail

# 与 .env 的 EMBEDDING_MODEL 保持一致（ONNX / transformers.js 格式）
MODEL="Xenova/bge-small-zh-v1.5"
BASE="https://hf-mirror.com/${MODEL}/resolve/main"
DEST="models/${MODEL}"

echo "==> 下载嵌入模型 ${MODEL} 到 ${DEST}"
mkdir -p "${DEST}/onnx"

# 小文件（config / tokenizer 等）
for f in config.json tokenizer.json tokenizer_config.json special_tokens_map.json vocab.txt quantize_config.json; do
  echo "  - ${f}"
  curl -fsSL --retry 6 --retry-delay 2 --retry-all-errors -m 120 -o "${DEST}/${f}" "${BASE}/${f}"
done

# 模型权重（q8 量化，约 24MB；支持断点续传）
echo "  - onnx/model_quantized.onnx (约 24MB)"
curl -fL --retry 8 --retry-delay 3 --retry-all-errors -C - -m 300 -o "${DEST}/onnx/model_quantized.onnx" "${BASE}/onnx/model_quantized.onnx"

echo "==> 下载完成：${DEST}"
