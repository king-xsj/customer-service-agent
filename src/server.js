 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/server.ts
import express from "express";
import cors from "cors";
import { customerServiceAgent } from "./agent.js";

const app = express();
app.use(cors());
app.use(express.json());

// 聊天接口
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json({ 
        error: "缺少必要参数：message 和 sessionId" 
      });
    }
    
    // 配置 thread_id
    const config = {
      configurable: {
        thread_id: `session-${sessionId}`,
      },
    };
    
    // 调用 Agent
    const result = await customerServiceAgent.invoke(
      {
        messages: [{ role: "user", content: message }],
      },
      config
    );
    
    // 返回回复
    const response = _optionalChain([result, 'access', _ => _.messages, 'access', _2 => _2.at, 'call', _3 => _3(-1), 'optionalAccess', _4 => _4.content]);
    
    res.json({
      success: true,
      response,
      sessionId,
    });
  } catch (error) {
    console.error("聊天接口错误:", error);
    res.status(500).json({
      success: false,
      error: "服务器内部错误",
    });
  }
});

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 客服服务器运行在 http://localhost:${PORT}`);
});
