import { readFileSync } from "fs";
import { join } from "path";
import type { IncomingMessage, ServerResponse } from "http"; // Node.js 標準型

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // 表示したいソースコードファイル (例: api/index.ts)
    const filePath = join(process.cwd(), "api", "index.ts");
    const source = readFileSync(filePath, "utf-8");

    // レスポンスを設定して返す
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.statusCode = 200;
    res.end(source); // Node.js 標準の end()
  } catch (error) {
    console.error("Error reading file:", error);
    res.statusCode = 500;
    res.end("Failed to load source code");
  }
}
