import express from "express";
import { PrismaClient, User } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import config from "./config.js";
import * as fs from "fs";
import * as path from "path";


const app = express();
const prisma = new PrismaClient();

app.get("/", (_, res) => {
  const filePath = path.join(process.cwd(), "api/index.ts"); // プロジェクト直下の api/index.ts
  const source = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(source);
});


async function VeriFyToken(req: express.Request, res: express.Response, next: any) {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts[0] === "Bearer" && parts[1]) {
      try {
        const token = jwt.verify(parts[1], config.jwt_secret || "") as jwt.JwtPayload;
        const result = await prisma.user.findFirst({ where: { name: token.name } });
        if (result && token.exp && Date.now() < token.exp * 1000) {
          next();
        } else {
          res.json({ error: "auth error" });
        }
      } catch (e: any) {
        res.json({ error: e.message });
      }
    } else {
      res.json({ error: "header format error" });
    }
  } else {
    res.json({ error: "header error" });
  }
}

async function GetUser(req: express.Request): Promise<User | {}> {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.split(" ")[0] === "Bearer") {
    try {
      const token = jwt.verify(authHeader.split(" ")[1], config.jwt_secret || "") as jwt.JwtPayload;
      const result: any = await prisma.user.findFirst({ where: { name: token.name } });
      if (result && token.exp && Date.now() < token.exp * 1000) return result;
    } catch (e: any) {
      console.log(e.message);
    }
  }
  return {};
}

app.use(express.json());

// スコア取得
app.get("/scores", VeriFyToken, async (_, res) => {
  const scores = await prisma.score.findMany({
    orderBy: { score: "desc" },
    include: { user: true },
    take: 5,
  });
  res.json(scores);
});

// スコア登録
app.post("/scores", VeriFyToken, async (req, res) => {
  const { score } = req.body;
  const user: any = await GetUser(req);

  const result = await prisma.score.create({ data: { userId: user.id, score } });
  res.json(result ? { status_code: 200 } : { status_code: 500 });
});

// ✅ 公開ランキング（認証なし）
app.get("/ranking", async (_, res) => {
  const scores = await prisma.score.findMany({
    orderBy: { score: "desc" },
    include: { user: true },
    take: 5,
  });
  res.json(scores);
});
// 誰でも見れるランキング（発表・先生確認用）
app.get("/public/scores", async (_, res) => {
  const scores = await prisma.score.findMany({
    orderBy: { score: "desc" },
    include: { user: true },
    take: 5,
  });
  res.json(scores);
});


// ユーザー登録
app.post("/users/new", async (req, res) => {
  console.log("Request hit /api/users/new", req.method, req.body);
  
  const name = req.body.name;
  const salt = randomBytes(8).toString("hex");
  const password = createHash("sha256").update(req.body.password + salt + config.pepper, "utf8").digest("hex");

  const result = await prisma.user.create({ data: { name, password, salt } });
  res.json(result);
});

// ログイン
app.post("/users/login", async (req, res) => {
  const name = req.body.name;
  const saltres: any = await prisma.user.findFirst({ where: { name } });

  if (saltres) {
    const password = createHash("sha256").update(req.body.password + saltres.salt + config.pepper, "utf8").digest("hex");
    const result: any = await prisma.user.findFirst({ where: { name, password } });
    if (result) {
      const token = jwt.sign({ name }, config.jwt_secret || "", { expiresIn: "1h" });
      res.json({ login_status: "success", token });
    } else {
      res.json({ login_status: "failed" });
    }
  } else {
    res.json({ login_status: "No User found." });
  }
});




// --- ローカル開発用サーバー起動 ---
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
