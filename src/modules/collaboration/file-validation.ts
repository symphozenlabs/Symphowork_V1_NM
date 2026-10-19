import path from "node:path";
import { AppError } from "@/lib/errors";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type AttachmentCategory = "image" | "document" | "audio";

export interface ValidatedFileMetadata {
  category: AttachmentCategory;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

export function detectAttachmentCategory(mimeType: string, extension: string): AttachmentCategory | null {
  const ext = extension.toLowerCase();
  const mime = mimeType.toLowerCase();

  if (
    mime.startsWith("image/") ||
    [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
  ) {
    return "image";
  }

  if (
    mime === "application/pdf" ||
    ext === ".pdf"
  ) {
    return "document";
  }

  if (
    mime.startsWith("audio/") ||
    mime === "video/webm" || // MediaRecorder in Chrome can report audio/webm or video/webm
    [".webm", ".ogg", ".mp3", ".wav", ".m4a", ".mp4"].includes(ext)
  ) {
    return "audio";
  }

  return null;
}

export function validateMagicBytes(
  buffer: Uint8Array,
  category: AttachmentCategory
): boolean {
  if (buffer.length < 4) return false;

  // 1. JPEG: 0xFF, 0xD8, 0xFF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // 2. PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // 3. WebP: "RIFF" (0..3) ... "WEBP" (8..11)
  const isWebP =
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50; // P

  // 4. PDF: "%PDF" (0x25, 0x50, 0x44, 0x46)
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  // 5. Audio:
  // WebM / EBML: 0x1A, 0x45, 0xDF, 0xA3
  const isWebM =
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3;

  // OggS: 0x4F, 0x67, 0x67, 0x53
  const isOgg =
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53;

  // MP4 / M4A: offset 4..7 is "ftyp"
  const isMp4 =
    buffer.length >= 8 &&
    buffer[4] === 0x66 && // f
    buffer[5] === 0x74 && // t
    buffer[6] === 0x79 && // y
    buffer[7] === 0x70; // p

  // WAV: "RIFF" (0..3) ... "WAVE" (8..11)
  const isWav =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45;

  // MP3: "ID3" (0x49, 0x44, 0x33) or frame sync 0xFF 0xFB/F3/F2/E3
  const isMp3 =
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);

  if (category === "image") {
    return isJpeg || isPng || isWebP;
  }

  if (category === "document") {
    return isPdf;
  }

  if (category === "audio") {
    return isWebM || isOgg || isMp4 || isWav || isMp3;
  }

  return false;
}

export function validateUploadedFile(file: {
  buffer: Uint8Array;
  fileName: string;
  mimeType: string;
}): ValidatedFileMetadata {
  const { buffer, fileName, mimeType } = file;
  const ext = path.extname(fileName).toLowerCase();

  const category = detectAttachmentCategory(mimeType, ext);
  if (!category) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Unsupported file format. Only JPEG, PNG, WebP images, PDF documents, and Audio recordings are supported.",
      400
    );
  }

  // Size limit validation
  if (category === "image" && buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Image file exceeds the 5MB size limit (got ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      400
    );
  }

  if (category === "document" && buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    throw new AppError(
      "VALIDATION_ERROR",
      `PDF document exceeds the 10MB size limit (got ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      400
    );
  }

  if (category === "audio" && buffer.length > MAX_AUDIO_SIZE_BYTES) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Audio recording exceeds the 5MB size limit (got ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      400
    );
  }

  // Magic bytes inspection
  const isValidContent = validateMagicBytes(buffer, category);
  if (!isValidContent) {
    throw new AppError(
      "VALIDATION_ERROR",
      "File content does not match the expected format.",
      400
    );
  }

  // Clean and normalize MIME type
  let normalizedMime = mimeType.toLowerCase();
  if (category === "image") {
    if (ext === ".jpg" || ext === ".jpeg") normalizedMime = "image/jpeg";
    else if (ext === ".png") normalizedMime = "image/png";
    else if (ext === ".webp") normalizedMime = "image/webp";
  } else if (category === "document") {
    normalizedMime = "application/pdf";
  } else if (category === "audio") {
    if (ext === ".webm") normalizedMime = "audio/webm";
    else if (ext === ".ogg") normalizedMime = "audio/ogg";
    else if (ext === ".mp4" || ext === ".m4a") normalizedMime = "audio/mp4";
    else if (ext === ".mp3") normalizedMime = "audio/mpeg";
    else if (ext === ".wav") normalizedMime = "audio/wav";
  }

  return {
    category,
    mimeType: normalizedMime,
    fileName: fileName.slice(0, 240),
    fileSize: buffer.length,
  };
}
