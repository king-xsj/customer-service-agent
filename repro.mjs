// 一次性复现脚本：触发转人工 interrupt，再在同一个 thread 发新消息
import { customerServiceAgent } from "./src/agent.js";

const thread = "repro-thread-1";

async function run() {
  // 1) 触发 transfer_to_human（内部会 interrupt，图上会留下悬空的 tool_calls）
  const r1 = await customerServiceAgent.invoke(
    { messages: [{ role: "user", content: "我要转人工客服。userId: U123，原因：问题太复杂了" }] },
    { configurable: { thread_id: thread } }
  );
  console.log("== 第1轮结束 ==");
  console.log("最后一条消息类型:", r1.messages.at(-1)?.constructor?.name);
  console.log("最后一条消息内容(截断):", JSON.stringify(r1.messages.at(-1)?.content)?.slice(0, 300));

  // 2) 同一 thread 再发新用户消息 → 复现 400
  try {
    const r2 = await customerServiceAgent.invoke(
      { messages: [{ role: "user", content: "还在吗？" }] },
      { configurable: { thread_id: thread } }
    );
    console.log("== 第2轮正常返回 ==");
    console.log(JSON.stringify(r2.messages.at(-1)?.content)?.slice(0, 300));
  } catch (e) {
    console.log("== 第2轮抛出错误 ==");
    console.log(String(e?.message).slice(0, 2000));
  }

  // 3) 打印当前 thread 的状态快照，看看消息序列
  const state = await customerServiceAgent.getState?.({ configurable: { thread_id: thread } });
  if (state?.values?.messages) {
    console.log("== 消息序列 ==");
    for (const m of state.values.messages) {
      const tc = m.tool_calls?.length ? ` tool_calls=${m.tool_calls.map((c) => c.name).join(",")}` : "";
      const tcid = m.tool_call_id ? ` [tool_call_id=${m.tool_call_id}]` : "";
      console.log(`[${m.constructor.name}]${tc}${tcid}: ${String(m.content).slice(0, 80)}`);
    }
  }
  process.exit(0);
}

run().catch((e) => {
  console.error("脚本异常:", e);
  process.exit(1);
});
