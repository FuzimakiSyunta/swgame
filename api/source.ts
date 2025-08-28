import { readFileSync } from "fs";
import { join } from "path";
import type { IncomingMessage, ServerResponse } from "http"; // Node.jsのreq,res型

export default async (req: IncomingMessage, res: ServerResponse) => {
  try {
    // 表示したいファイルを指定（例: api/index.ts）
    const filePath = join(process.cwd(), "api", "index.ts");
    const source = readFileSync(filePath, "utf-8");

    // レスポンス設定
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.statusCode = 200;
    res.end(source); // Node.js標準
  } catch (error) {
    console.error("Error reading file:", error);
    res.statusCode = 500;
    res.end("Failed to load source code");
  }
};
