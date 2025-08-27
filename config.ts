import dotenv from "dotenv";

dotenv.config();

type NonEmptyString = string & { __brand: "non-empty" };

const config = {
  port: Number(process.env.PORT ?? 3000),
  jwt_secret: (process.env.JWT_SECRET ?? "dev-secret") as NonEmptyString,
  pepper: process.env.PEPPER ?? "",
} as const;

export default config;
