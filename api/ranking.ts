// api/ranking.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  const scores = await prisma.score.findMany({
    orderBy: { score: "desc" },
    take: 5,
  });

  let text = "Score Ranking (Top 5)\n";
  scores.forEach((s, i) => {
    text += `${i + 1}. ${s.score}\n`;
  });

  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(text);
}
