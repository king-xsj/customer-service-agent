// src/tools/tracking.ts
import { tool } from "@langchain/core/tools";

import { z } from "zod";

/**
 * 跟踪物流信息
 */
export const trackShipment = tool(
  async ({ trackingNumber }) => {
    console.log(`[Tracking] 跟踪物流: ${trackingNumber}`);
    
    try {
      
      
      return `物流跟踪信息（运单号：${trackingNumber}）`;
    } catch (error) {
      console.error("[Tracking] 跟踪失败:", error);
      return `抱歉，无法查询运单号 ${trackingNumber} 的物流信息。请稍后重试或联系人工客服。`;
    }
  },
  {
    name: "track_shipment",
    description: "跟踪包裹物流信息。需要提供运单号。当用户询问物流状态、包裹位置时调用此工具。",
    schema: z.object({
      trackingNumber: z.string().describe("运单号，例如：SF1234567890"),
    }),
  }
);
