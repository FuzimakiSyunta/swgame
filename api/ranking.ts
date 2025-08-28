import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export default async function handler(req: Request, res: Response) {
  try {
    const scores = await prisma.score.findMany({
      orderBy: { score: "desc" },
      take: 5,
    });

    res.status(200).json(scores);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}
