import express from "express";
import { PrismaClient} from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import config from "./config";


const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).json({ message: "Hello from swgame API on Vercel!" });
});
// ----------------------------------------
// ユーザー登録
// ----------------------------------------
app.post("/users/new", async (req, res) => {
  try {
    const name = req.body.name;
    const salt = randomBytes(8).toString("hex");
    const password = createHash("sha256")
      .update(req.body.password + salt + config.pepper, "utf8")
      .digest("hex");

    const result = await prisma.user.create({
      data: {
        name,
        password,
        salt,
      },
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "ユーザー作成に失敗しました" });
  }
});

// ----------------------------------------
// ログイン
// ----------------------------------------
app.post("/users/login", async (req, res) => {
  const name = req.body.name;

  const saltres: any = await prisma.user.findFirst({
    where: { name: name },
  });

  if (saltres != null) {
    const salt: any = saltres.salt;
    const password = createHash("sha256")
      .update(req.body.password + salt + config.pepper, "utf8")
      .digest("hex");

    const result: any = await prisma.user.findFirst({
      where: { name: name, password: password },
    });

    if (result != null) {
      const token = jwt.sign({ name: name }, config.jwt_secret || "", {
        expiresIn: "1h",
      });
      res.json({ login_status: "success", token: token });
    } else {
      res.json({ login_status: "faild" });
    }
  } else {
    res.json({ login_status: "No User found." });
  }
});

// ----------------------------------------
// 認証ミドルウェア
// ----------------------------------------
async function VerifyToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers["authorization"];
  if (authHeader !== undefined) {
    if (authHeader.split(" ")[0] === "Bearer") {
      try {
        const token = jwt.verify(
          authHeader.split(" ")[1],
          config.jwt_secret || ""
        ) as jwt.JwtPayload;

        const result = await prisma.user.findFirst({
          where: { name: token.name },
        });

        if (result != null && token.exp && Date.now() < token.exp * 1000) {
          // 認証OK
          (req as any).user_name = token.name;
          next();
        } else {
          res.status(401).json({ error: "auth error" });
        }
      } catch (e: any) {
        console.error(e.message);
        res.status(401).json({ error: e.message });
      }
    } else {
      res.status(401).json({ error: "header format error" });
    }
  } else {
    res.status(401).json({ error: "header error" });
  }
}

// ----------------------------------------s
// スコア一覧取得 (認証必要)
// ----------------------------------------
app.get("/scores", VerifyToken, async (_req, res) => {
  try {
    const scores = await prisma.score.findMany({
      orderBy: [{ score: "desc" }],
      include: { user: true }, // ← ユーザー情報も返す
      take: 5,
    });
    res.json(scores);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to fetch scores" });
  }
});

// ----------------------------------------
// スコア登録 (認証必要)
// ----------------------------------------
app.post("/scores", VerifyToken, async (req, res) => {
  const name = (req as any).user_name;
  const scoreRaw = req.body.score;

  if (typeof scoreRaw === "undefined") {
    return res.status(400).json({ error: "score is required" });
  }

  const score = Number(scoreRaw);
  if (!Number.isFinite(score)) {
    return res.status(400).json({ error: "score must be a number" });
  }

  try {
    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const result = await prisma.score.create({
      data: {
        userId: user.id, // ← userId を入れる
        score: score,
      },
    });

    res.json({ status: "success", data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed to save score" });
  }
});


// ----------------------------------------
// エラーハンドラ
// ----------------------------------------
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
);

// ----------------------------------------
// サーバー起動
// ----------------------------------------
app.listen(config.port, () => {
  console.log(`API server running on http://localhost:${config.port}`);
});

export default app;