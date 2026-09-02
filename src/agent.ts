// src/agent.ts
import "dotenv/config";
import { createAgent } from "langchain";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { ChatDeepSeek } from "@langchain/deepseek";
import { searchKnowledgeBase } from "./tools/knowledge-search.js";
import { queryOrderStatus } from "./tools/order-query.js";
import { trackShipment } from "./tools/tracking.js";
import { createSupportTicket } from "./tools/ticket-create.js";
import { transferToHuman } from "./tools/transfer-human.js";

// 创建持久化 checkpointer
const checkpointer = PostgresSaver.fromConnString(process.env.DATABASE_URL!);

// 初始化数据库表
await checkpointer.setup();

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  throw new Error("DEEPSEEK_API_KEY is not set");
}

const model = new ChatDeepSeek({
  model: "deepseek-v4-flash",
  apiKey,
});

// 创建基础客服 Agent
export const customerServiceAgent = createAgent({
  model,
  tools: [
    searchKnowledgeBase,
    queryOrderStatus,
    trackShipment,
    createSupportTicket,
    transferToHuman,
  ],
  checkpointer,

  systemPrompt: `你是专业的电商客服助手。

可用工具：
- search_knowledge_base：搜索产品知识库

工作流程：
1. 首先理解用户问题
2. 如果问题涉及产品、政策、FAQ，调用 search_knowledge_base 搜索相关知识
3. 基于搜索结果回答问题
4. 如果知识库中没有相关信息，如实告知用户

行为准则：
1. 用友好、专业的语气回答
2. 引用知识库内容时，标注来源
3. 保持回答简洁（不超过 3 句话）
4. 不确定时，主动提出转接人工

当前时间：${new Date().toLocaleString("zh-CN")}`,
});
