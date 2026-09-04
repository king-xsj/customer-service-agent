// src/knowledge-base/embeddings.ts
import "dotenv/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "@huggingface/transformers";
import type { PretrainedModelOptions } from "@huggingface/transformers";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { Chroma } from "@langchain/community/vectorstores/chroma";

// huggingface.co 国内直连不通，走镜像（作为本地模型缺失时的回退）。
// 必须在创建 pipeline 之前设置，因为 transformers.js 在加载模型时才读取 remoteHost。
if (process.env.HF_ENDPOINT) {
  env.remoteHost = process.env.HF_ENDPOINT.endsWith("/")
    ? process.env.HF_ENDPOINT
    : `${process.env.HF_ENDPOINT}/`;
}

// 模型优先从 <项目>/models 本地加载（通过 scripts/download-embedding-model.sh 预下载），
// 避免运行时依赖海外 CDN（会 302 到 us.aws.cdn.hf.co 导致连接超时）。
const MODELS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../models");
env.localModelPath = process.env.LOCAL_MODELS_DIR || MODELS_DIR;

// 默认使用中文友好的 ONNX 模型；本地 transformers 推理，无需 HF Token。
const DEFAULT_EMBEDDING_MODEL = "Xenova/bge-small-zh-v1.5";

// q8 量化：加载 onnx/model_quantized.onnx（约 24MB，比 fp32 小 4 倍）。
const PRETRAINED_OPTIONS: PretrainedModelOptions = { dtype: "q8" };

export function getEmbeddings() {
  return new HuggingFaceTransformersEmbeddings({
    model: process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL,
    pretrainedOptions: PRETRAINED_OPTIONS,
  });
}

export function getVectorStore() {
  return new Chroma(getEmbeddings(), {
    collectionName: process.env.CHROMA_COLLECTION_NAME || "knowledge_base",
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });
}
