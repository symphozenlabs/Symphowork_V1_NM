import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url(),
  EMAIL_PROVIDER: z.string().default("console"),
  EMAIL_FROM: z.string().email(),
  OBJECT_STORAGE_PROVIDER: z.string().default("local"),
  OBJECT_STORAGE_BUCKET: z.string().min(1),
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),
  AI_PROVIDER: z.string().default("stub"),
  REDIS_URL: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("SymphoWork"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  APP_URL: process.env.APP_URL,
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
  EMAIL_FROM: process.env.EMAIL_FROM,
  OBJECT_STORAGE_PROVIDER: process.env.OBJECT_STORAGE_PROVIDER,
  OBJECT_STORAGE_BUCKET: process.env.OBJECT_STORAGE_BUCKET,
  OBJECT_STORAGE_ENDPOINT: process.env.OBJECT_STORAGE_ENDPOINT || undefined,
  OBJECT_STORAGE_ACCESS_KEY: process.env.OBJECT_STORAGE_ACCESS_KEY || undefined,
  OBJECT_STORAGE_SECRET_KEY: process.env.OBJECT_STORAGE_SECRET_KEY || undefined,
  AI_PROVIDER: process.env.AI_PROVIDER,
  REDIS_URL: process.env.REDIS_URL || undefined,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

export type Environment = typeof env;
