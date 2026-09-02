// src/knowledge-base/loader.ts
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

const knowledgeBaseDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  "policies",
);

/**
 * 加载知识库文档
 */
export async function loadKnowledgeBase(): Promise<Document[]> {
  console.log("📚 开始加载知识库文档...");

  // 加载当前目录下所有 Markdown 文件
  const loader = new DirectoryLoader(
    knowledgeBaseDirectory,
    {
      ".md": (path) => new TextLoader(path),
    },
  );

  const docs = await loader.load();
  console.log(`✅ 加载了 ${docs.length} 个文档`);

  return docs;
}

/**
 * 切割文档为 chunks
 */
export async function splitDocuments(
  docs: Document[],
): Promise<Document[]> {
  console.log("✂️ 开始切割文档...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
    separators: [
      "\n\n",
      "\n",
      "。",
      "，",
      " ",
    ],
  });

  const chunks = await splitter.splitDocuments(docs);
  console.log(`✅ 切割为 ${chunks.length} 个 chunks`);

  return chunks;
}
