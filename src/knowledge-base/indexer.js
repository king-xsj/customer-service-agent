// src/knowledge-base/indexer.ts

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { pathToFileURL } from "node:url";
import { loadKnowledgeBase, splitDocuments } from "./loader.js";

/**
 * 构建知识库索引
 */
export async function buildKnowledgeIndex() {
  console.log("🚀 开始构建知识库索引...");
  
  // 1. 加载文档
  const docs = await loadKnowledgeBase();
  
  // 2. 切割文档
  const chunks = await splitDocuments(docs);
  
  // 3. 初始化 Embedding 模型
  console.log("🔤 初始化 Embedding 模型...");
  const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });
  
  // 4. 初始化向量存储
  const vectorStore = new Chroma(embeddings, {
    collectionName: process.env.CHROMA_COLLECTION_NAME || "knowledge_base",
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });
  
  console.log(`✅ 知识库索引构建完成，共 ${chunks.length} 个向量`);
  
  return vectorStore;
}

// 直接运行本文件时执行索引构建
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildKnowledgeIndex().catch(console.error);
}
