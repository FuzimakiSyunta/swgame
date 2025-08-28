import { readFileSync } from "fs";
import { join } from "path";
import type { IncomingMessage, ServerResponse } from "http";  // Node標準

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const filePath = join(process.cwd(), "api", "index.ts");
    const source = readFileSync(filePath, "utf-8");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(source);
  } catch (error) {
    console.error("Error reading file:", error);
    res.statusCode = 500;
    res.end("Failed to load source code");
  }
}
