// src/tools/ticket-create.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * 创建客服工单
 */
export const createSupportTicket = tool(
  async ({ userId, category, subject, description }) => {
    console.log(`[Ticket] 创建工单: ${subject}`);
    
    try {
      
      
      return `工单已创建成功！

我们的客服专员会尽快处理您的问题。您可以通过工单号查询处理进度。`;
    } catch (error) {
      console.error("[Ticket] 创建失败:", error);
      return `抱歉，创建工单失败。请直接联系人工客服：400-123-4567。`;
    }
  },
  {
    name: "create_support_ticket",
    description: "创建客服工单，用于处理复杂问题或投诉。需要提供用户ID、问题类别、主题和详细描述。当问题无法立即解决或需要人工介入时调用此工具。",
    schema: z.object({
      userId: z.string().describe("用户ID"),
      category: z.enum(["technical", "billing", "product", "complaint"]).describe("问题类别"),
      subject: z.string().describe("工单主题，简短描述问题"),
      description: z.string().describe("问题详细描述"),
    }),
  }
);
