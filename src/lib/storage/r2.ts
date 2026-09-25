import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider } from "@/lib/providers";
import { AppError } from "@/lib/errors";

export type R2StorageConfig = {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type StorageClient = Pick<S3Client, "send">;

const MAX_KEY_LENGTH = 500;

export function validateStorageKey(key: string) {
  if (!key || key.length > MAX_KEY_LENGTH || key.startsWith("/") || key.includes("\\") || key.includes("//")) {
    throw new AppError("VALIDATION_ERROR", "The storage key is invalid.", 400);
  }

  const segments = key.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new AppError("VALIDATION_ERROR", "The storage key is invalid.", 400);
  }

  if ([...key].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) {
    throw new AppError("VALIDATION_ERROR", "The storage key is invalid.", 400);
  }

  return key;
}

export function createR2StorageProvider(config: R2StorageConfig, client?: StorageClient): StorageProvider & { healthCheck(): Promise<void> } {
  if (!config.bucket || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    throw new AppError("PROVISIONING_FAILED", "Object storage is not configured.", 503);
  }

  const s3 = client ?? new S3Client({
    endpoint: config.endpoint,
    region: "auto",
    forcePathStyle: true,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });

  const commandKey = (key: string) => validateStorageKey(key);

  return {
    async upload(key, body, contentType) {
      await s3.send(new PutObjectCommand({ Bucket: config.bucket, Key: commandKey(key), Body: body, ContentType: contentType }));
    },
    async download(key) {
      const response = await s3.send(new GetObjectCommand({ Bucket: config.bucket, Key: commandKey(key) }));
      if (!response.Body) throw new AppError("PROVISIONING_FAILED", "Object storage returned an empty object body.", 503);
      return response.Body.transformToByteArray();
    },
    async delete(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: commandKey(key) }));
    },
    async getSignedUrl(key, expiresInSeconds = 300) {
      const expiresIn = Math.max(1, Math.min(expiresInSeconds, 900));
      return getSignedUrl(s3 as S3Client, new GetObjectCommand({ Bucket: config.bucket, Key: commandKey(key) }), { expiresIn });
    },
    async healthCheck() {
      await s3.send(new HeadBucketCommand({ Bucket: config.bucket }));
    },
  };
}

export function r2ConfigFromEnvironment(): R2StorageConfig {
  const config = {
    bucket: process.env.OBJECT_STORAGE_BUCKET,
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
    accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY,
  };
  if (!config.bucket || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    throw new AppError("PROVISIONING_FAILED", "Object storage is not configured.", 503);
  }
  return config as R2StorageConfig;
}
