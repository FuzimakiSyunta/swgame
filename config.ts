// api/config/index.ts
import 'dotenv/config';

type NonEmptyString = string & { __brand: 'non-empty' };

// 必ず string を返すようにしつつ、開発用のデフォルトも用意
const config = {
  port: Number(process.env.PORT ?? 3000),
  jwt_secret: (process.env.JWT_SECRET ?? 'dev-secret') as NonEmptyString,
  pepper: process.env.PEPPER ?? '',
} as const;

export default config;
