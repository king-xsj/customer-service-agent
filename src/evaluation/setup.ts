// src/evaluation/setup.ts
import { Client } from "langsmith";
import { evaluate } from "langsmith/evaluation";
import { customerServiceAgent } from "../agent.js";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

const client = new Client();

// 定义评估数据集
async function createEvaluationDataset() {
  const datasetName = "customer-service-eval";

  const dataset = await client.hasDataset({ datasetName })
    ? await client.readDataset({ datasetName })
    : await client.createDataset(datasetName);
  
  const testCases = [
    {
      inputs: { question: "退货政策是什么？" },
      expected_keywords: ["7天", "未使用", "包装完好"],
    },
    {
      inputs: { question: "如何查询订单？" },
      expected_keywords: ["订单号", "我的订单", "个人中心"],
    },
    {
      inputs: { question: "物流多久能到？" },
      expected_keywords: ["运单号", "物流", "配送时间"],
    },
    // ...更多测试用例
  ];
  
  let exampleCount = 0;
  for await (const _example of client.listExamples({ datasetId: dataset.id })) {
    exampleCount += 1;
  }

  if (exampleCount === 0) {
    for (const testCase of testCases) {
      await client.createExample({
        dataset_id: dataset.id,
        inputs: testCase.inputs,
        outputs: { keywords: testCase.expected_keywords },
      });
    }
  } else {
    console.log(`✅ 数据集 ${datasetName} 已存在 ${exampleCount} 个示例，直接复用`);
  }
  
  console.log(`✅ 创建了 ${testCases.length} 个评估用例`);
  return dataset;
}

// 运行评估
async function runEvaluation() {
  const results = await evaluate(
    async (inputs: { question: string }) => {
      const result = await customerServiceAgent.invoke({
        messages: [{ role: "user", content: inputs.question }],
      }, {
        configurable: {
          thread_id: `eval-${randomUUID()}`,
        },
      });
      return { answer: result.messages.at(-1)?.content };
    },
    {
      data: "customer-service-eval",
      evaluators: [
        // 关键词匹配评估器
        async ({ outputs, referenceOutputs }: {
          run: unknown;
          example: unknown;
          inputs: Record<string, unknown>;
          outputs: Record<string, unknown>;
          referenceOutputs?: Record<string, unknown>;
        }) => {
          const answer = String(outputs.answer ?? "").toLowerCase();
          const keywords = Array.isArray(referenceOutputs?.keywords)
            ? referenceOutputs.keywords.map(String)
            : [];
          
          const matchedKeywords = keywords.filter((keyword: string) =>
            answer.includes(keyword.toLowerCase())
          );
          
          const score = matchedKeywords.length / keywords.length;
          
          return {
            key: "keyword_match",
            score,
            comment: `匹配了 ${matchedKeywords.length}/${keywords.length} 个关键词`,
          };
        },
      ],
    }
  );
  
  // 输出评估报告
  const scores = results.results.flatMap((row) =>
    row.evaluationResults.results.map((result) =>
      typeof result.score === "number" ? result.score : 0,
    ),
  );
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  console.log(`\n📊 评估报告：`);
  console.log(`平均得分：${avgScore.toFixed(2)}`);
  console.log(`测试用例数：${results.results.length}`);
  
  return results;
}

// 执行
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createEvaluationDataset()
    .then(() => runEvaluation())
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
