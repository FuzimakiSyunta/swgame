import express from "express";
import { PrismaClient, User } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import config from "./config";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// --- /api 配下に集約するルーター ---
const api = express.Router();

// 認証ミドルウェア
async function VerifyToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "header error" });
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "header format error" });

  try {
    const payload = jwt.verify(token, config.jwt_secret || "") as jwt.JwtPayload; // ← ここ！jwt_secret
    const user = await prisma.user.findFirst({ where: { name: payload.name } });
    if (!user || !payload.exp || Date.now() >= payload.exp * 1000) {
      return res.status(401).json({ error: "auth error" });
    }
    (req as any).user_name = user.name;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: e.message });
  }
}

async function GetUser(req: express.Request): Promise<User | null> {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  try {
    const payload = jwt.verify(token, config.jwt_secret || "") as jwt.JwtPayload; // ← ここも
    if (!payload?.name) return null;
    return await prisma.user.findFirst({ where: { name: payload.name } });
  } catch {
    return null;
  }
}

// Hello（動作確認用）
api.get("/", (_req, res) => {
  res.status(200).json({ message: "Hello from swgame API on Vercel!" });
});

// スコア取得
api.get("/scores", VerifyToken, async (_req, res) => {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { score: "desc" },
      include: { user: true },
      take: 5,
    });
    res.json(scores);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to fetch scores" });
  }
});

// スコア登録
api.post("/scores", VerifyToken, async (req, res) => {
  try {
    const score = Number(req.body?.score);
    if (!Number.isFinite(score)) return res.status(400).json({ error: "score must be a number" });

    const user = await GetUser(req);
    if (!user) return res.status(401).json({ error: "auth error" });

    const saved = await prisma.score.create({ data: { userId: user.id, score } });
    res.json({ status: "success", data: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to save score" });
  }
});

// ユーザー登録
api.post("/users/new", async (req, res) => {
  try {
    const name = req.body?.name;
    const raw = req.body?.password;
    if (!name || !raw) return res.status(400).json({ error: "name と password は必須です" });

    const salt = randomBytes(16).toString("hex");
    const password = createHash("sha256").update(raw + salt + (config.pepper || ""), "utf8").digest("hex");

    const result = await prisma.user.create({ data: { name, password, salt } });
    res.status(201).json({ ok: true, id: result.id, name: result.name });
  } catch (e: any) {
    if (e?.code === "P2002") return res.status(409).json({ error: "そのユーザー名は既に存在します" });
    console.error(e);
    res.status(500).json({ error: "ユーザー作成に失敗しました" });
  }
});

// ログイン
api.post("/users/login", async (req, res) => {
  const name = req.body?.name;
  const raw = req.body?.password;
  if (!name || !raw) return res.json({ login_status: "faild" });

  const user = await prisma.user.findFirst({ where: { name } });
  if (!user) return res.json({ login_status: "No User found." });

  const hash = createHash("sha256").update(raw + user.salt + (config.pepper || ""), "utf8").digest("hex");
  if (hash !== user.password) return res.json({ login_status: "failed" });

  const token = jwt.sign({ name }, config.jwt_secret || "", { expiresIn: "1h" }); // ← ここも
  res.json({ login_status: "success", token });
});

// ルート一覧（デバッグ）
api.get("/__routes", (_req, res) => {
  // @ts-ignore
  const routes = (api._router?.stack || [])
    .filter((l: any) => l.route)
    .map((l: any) => `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`);
  res.json({ routes });
});

// /api にマウント
app.use("/api", api);

// ローカル開発用
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

export default app;
