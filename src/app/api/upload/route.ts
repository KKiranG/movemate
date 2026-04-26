import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { toErrorResponse, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createSignedPrivateUrl,
  getPrivateFileDisplay,
  type PrivateBucketName,
  uploadPrivateFile,
} from "@/lib/storage";
import { isHeicLikePath, isPreviewableImagePath } from "@/lib/utils";

const allowedBuckets = Object.values(PRIVATE_BUCKETS) as PrivateBucketName[];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const imageOnlyBuckets = new Set<PrivateBucketName>([
  PRIVATE_BUCKETS.itemPhotos,
  PRIVATE_BUCKETS.proofPhotos,
  PRIVATE_BUCKETS.vehiclePhotos,
]);

function hasMagicPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function detectMimeType(bytes: Uint8Array) {
  if (hasMagicPrefix(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (hasMagicPrefix(bytes, [0x89, 0x50, 0x4e, 0x47])) {
    return "image/png";
  }

  if (
    hasMagicPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    String.fromCharCode(...Array.from(bytes.slice(8, 12))) === "WEBP"
  ) {
    return "image/webp";
  }

  if (hasMagicPrefix(bytes, [0x25, 0x50, 0x44, 0x46])) {
    return "application/pdf";
  }

  const brand = String.fromCharCode(...Array.from(bytes.slice(4, 12)));

  if (brand.startsWith("ftyp")) {
    return "image/heic";
  }

  return null;
}

function isPrivateBucketName(value: string): value is PrivateBucketName {
  return allowedBuckets.includes(value as PrivateBucketName);
}

function normalizeMimeType(mimeType: string) {
  if (!mimeType) {
    return null;
  }

  if (mimeType === "image/jpg") {
    return "image/jpeg";
  }

  if (mimeType === "image/heif") {
    return "image/heic";
  }

  return mimeType;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const rateLimit = await enforceRateLimit(`upload:${user.id}`, 10, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit reached." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))),
          },
        },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);

    if (contentLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 10MB upload limit." },
        { status: 413 },
      );
    }

    const formData = (await request.formData()) as unknown as globalThis.FormData;
    const file = formData.get("file");
    const bucket = formData.get("bucket");

    if (!(file instanceof File)) {
      throw new AppError("A file is required.", 400, "file_required");
    }

    const normalizedMimeType = normalizeMimeType(file.type);

    if (normalizedMimeType && !ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
      throw new AppError("Unsupported file type.", 400, "invalid_file_type");
    }

    if (typeof bucket !== "string" || !isPrivateBucketName(bucket)) {
      throw new AppError("A valid upload bucket is required.", 400, "bucket_required");
    }

    const safeBucket = bucket;
    const sniffedBytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const detectedMimeType = detectMimeType(sniffedBytes);

    if (!detectedMimeType) {
      throw new AppError("Unsupported file content.", 415, "invalid_file_signature");
    }

    if (safeBucket !== PRIVATE_BUCKETS.carrierDocuments && detectedMimeType === "application/pdf") {
      throw new AppError("PDF uploads are only allowed for carrier documents.", 415, "invalid_file_type");
    }

    if (imageOnlyBuckets.has(safeBucket) && detectedMimeType === "application/pdf") {
      throw new AppError("Only image uploads are allowed for this bucket.", 415, "invalid_file_type");
    }

    if (!ALLOWED_MIME_TYPES.has(detectedMimeType)) {
      throw new AppError("Unsupported file content.", 415, "invalid_file_type");
    }

    if (normalizedMimeType && normalizedMimeType !== detectedMimeType) {
      throw new AppError("File type does not match file contents.", 415, "invalid_file_signature");
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    await uploadPrivateFile({
      bucket: safeBucket,
      path,
      file,
    });
    const display = await getPrivateFileDisplay({ bucket: safeBucket, path });
    const signedUrl =
      display?.signedUrl ??
      (await createSignedPrivateUrl({ bucket: safeBucket, path }));

    return NextResponse.json({
      bucket: safeBucket,
      path,
      signedUrl,
      isHeicLike: isHeicLikePath(path),
      isPreviewableImage: isPreviewableImagePath(path),
    });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
