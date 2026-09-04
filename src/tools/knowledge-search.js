// src/tools/knowledge-search.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getVectorStore } from "../knowledge-base/embeddings.js";

const vectorStore = getVectorStore();

// 创建检索器
const retriever = vectorStore.asRetriever({
  k: 5,  // 返回最相关的 5 个文档
});

const RETRIEVAL_TIMEOUT_MS = 10000;

/**
 * 知识库搜索工具
 */
export const searchKnowledgeBase = tool(
  async ({ query }) => {
    console.log(`[Knowledge Search] 搜索: "${query}"`);
    
    // 执行检索，并设置超时，避免外部服务不可用时卡死
    const docs = await Promise.race([
      retriever.invoke(query),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("知识库检索超时")),
          RETRIEVAL_TIMEOUT_MS,
        ),
      ),
    ]).catch((error) => {
      console.error("[Knowledge Search] 检索失败:", error);
      return [];
    });
    
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
