// src/tools/transfer-human.ts
import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

/**
 * 转接人工客服
 */
export const transferToHuman = tool(
  async ({ reason, userId }) => {
    console.log(`[Transfer] 转人工: ${reason}`);
    
    // 记录转人工原因
    await logTransferRequest(userId, reason);
    
    // 发起中断，等待人工接入
    const humanAgentId = await interrupt({
      question: `用户请求转人工客服。\n原因：${reason}\n\n是否现在转接？`,
      type: "confirm",
    });
    
    if (humanAgentId) {
      return `已为您转接人工客服（工号：${humanAgentId}）。请稍候，客服专员即将与您对话。`;
    } else {
      return `抱歉，当前人工客服繁忙。您可以：\n1. 留下联系方式，我们会回电\n2. 创建工单，24小时内回复\n3. 稍后再试`;
    }
  },
  {
    name: "transfer_to_human",
    description: "转接人工客服。当用户明确要求转人工、问题过于复杂、或用户情绪激动时调用此工具。",
    schema: z.object({
      reason: z.string().describe("转人工的原因"),
      userId: z.string().describe("用户ID"),
    }),
  }
);

// 辅助函数：记录转人工请求
async function logTransferRequest(userId, reason) {
  // 保存到数据库或发送到监控系统
  console.log(`[Transfer Log] 用户 ${userId} 请求转人工，原因：${reason}`);
}
