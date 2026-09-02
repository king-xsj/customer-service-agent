// src/tools/knowledge-search.ts
import { tool } from "@langchain/core/tools";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { z } from "zod";

const embeddings = new HuggingFaceInferenceEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });
  
  // 4. 初始化向量存储
  const vectorStore = new Chroma(embeddings, {
    collectionName: process.env.CHROMA_COLLECTION_NAME || "knowledge_base",
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });

// 创建检索器
const retriever = vectorStore.asRetriever({
  k: 5,  // 返回最相关的 5 个文档
});

/**
 * 知识库搜索工具
 */
export const searchKnowledgeBase = tool(
  async ({ query }) => {
    console.log(`[Knowledge Search] 搜索: "${query}"`);
    
    // 执行检索
    const docs = await retriever.invoke(query);
    
    if (docs.length === 0) {
      return "未在知识库中找到相关信息。";
    }
    
    // 格式化结果
    const formattedDocs = docs.map((doc, index) => {
      const source = doc.metadata.source || "未知来源";
      return `【文档 ${index + 1}】来源：${source}\n${doc.pageContent}\n`;
    }).join("\n---\n");
    
    return formattedDocs;
  },
  {
    name: "search_knowledge_base",
    description: "搜索产品知识库，包括产品信息、退货政策、物流政策、常见问题等。当用户询问产品相关、政策相关或常见问题时调用此工具。",
    schema: z.object({
      query: z.string().describe("搜索关键词或问题描述"),
    }),
  }
);
