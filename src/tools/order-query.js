// src/tools/order-query.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * 查询订单状态
 */
export const queryOrderStatus = tool(
  async ({ orderId }) => {
    console.log(`[Order Query] 查询订单: ${orderId}, 用户: `);
    
    try {
      // 调用订单系统 API
      return `订单 ${orderId} 的状态为：已发货，预计送达时间为 2024-06-15。`;
    } catch (error) {
      console.error("[Order Query] 查询失败:", error);
      return `抱歉，无法查询订单 ${orderId} 的信息。请确认订单号是否正确，或联系人工客服。`;
    }
  },
  {
    name: "query_order_status",
    description: "查询订单状态和详细信息。需要提供订单号和用户ID。当用户询问订单状态、订单详情时调用此工具。",
    schema: z.object({
      orderId: z.string().describe("订单号，例如：ORD-20250101-001"),
      userId: z.string().describe("用户ID，从会话上下文中获取"),
    }),
  }
);
