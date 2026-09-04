// src/knowledge-base/indexer.ts

import { pathToFileURL } from "node:url";
import { loadKnowledgeBase, splitDocuments } from "./loader.js";
import { getVectorStore } from "./embeddings.js";

/**
 * 构建知识库索引
 */
export async function buildKnowledgeIndex() {
  console.log("🚀 开始构建知识库索引...");

  // 1. 加载文档
  const docs = await loadKnowledgeBase();

  // 2. 切割文档
  const chunks = await splitDocuments(docs);

  // 3. 初始化向量存储（本地嵌入 + Chroma）
  const vectorStore = getVectorStore();

  // 4. 将文档写入向量库
  await vectorStore.addDocuments(chunks);
  console.log(`✅ 知识库索引构建完成，已写入 ${chunks.length} 个向量`);

  return vectorStore;
}

// 直接运行本文件时执行索引构建
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildKnowledgeIndex().catch(console.error);
}
