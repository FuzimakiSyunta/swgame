import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const scores = await prisma.score.findMany({
    orderBy: { score: "desc" },
    take: 5,
    include: { user: true },
  });

  const html = `
    <html>
      <head>
        <title>Score Ranking</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; background: #f9f9f9; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 300px; }
          th, td { border: 1px solid #aaa; padding: 8px; text-align: center; }
          tr:nth-child(even) { background: #eee; }
        </style>
      </head>
      <body>
        <h1>Score Ranking (Top 5)</h1>
        <table>
          <tr><th>Rank</th><th>User</th><th>Score</th></tr>
          ${scores.map((s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${s.user?.name ?? "???"}</td>
              <td>${s.score}</td>
            </tr>
          `).join("")}
        </table>
      </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
