import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { score: "desc" },
      take: 5,
    });

    res.status(200).json(scores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
