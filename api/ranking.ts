import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async (req, res) => {
  const scores = await prisma.score.findMany({
    orderBy: { score: "desc" },
    take: 5,
  });

  res.status(200).json(scores);
};
