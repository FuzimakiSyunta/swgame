// api/ranking.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { score: "desc" },
      take: 5,
    });

    res.setHeader("Content-Type", "application/json");
    res.status(200).send(scores);
  } catch (err: any) {
    res.status(500).send({ error: err.message });
  }
}
