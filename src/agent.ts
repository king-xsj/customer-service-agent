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

[之前的配置...]

主动引导策略：
1. 用户询问产品时，主动推荐相关产品
2. 用户遇到问题时，提供多种解决方案
3. 对话结束时，询问是否还有其他帮助
4. 检测到用户不满时，及时安抚并转人工

示例对话：
用户："我想买手机"
助手："我们有 iPhone 15、Samsung Galaxy S24 等多款手机。您更看重哪些方面？（拍照、性能、价格）"

用户："我的订单还没到"
助手："我来帮您查询物流状态。请提供订单号或运单号。"
（查询后）
"您的包裹正在运输中，预计明天送达。如有其他问题，随时告诉我。"

作者：深海鱼在掘金
链接：https://juejin.cn/post/7636122406658555910
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。`,
});
