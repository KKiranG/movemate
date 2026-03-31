import { NextResponse, type NextRequest } from "next/server";

import { requireSessionUser } from "@/lib/auth";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { toErrorResponse, AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createSignedPrivateUrl,
  type PrivateBucketName,
  uploadPrivateFile,
} from "@/lib/storage";

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

function isPrivateBucketName(value: string): value is PrivateBucketName {
  return allowedBuckets.includes(value as PrivateBucketName);
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const rateLimit = await enforceRateLimit(`upload:${user.id}`, 20, 60_000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit reached." },
        { status: 429 },
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);

    if (contentLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 10MB upload limit." },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket");

    if (!(file instanceof File)) {
      throw new AppError("A file is required.", 400, "file_required");
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      throw new AppError("Unsupported file type.", 400, "invalid_file_type");
    }

    if (typeof bucket !== "string" || !isPrivateBucketName(bucket)) {
      throw new AppError("A valid upload bucket is required.", 400, "bucket_required");
    }

    const safeBucket = bucket;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    await uploadPrivateFile({
      bucket: safeBucket,
      path,
      file,
    });
    const signedUrl = await createSignedPrivateUrl({ bucket: safeBucket, path });

    return NextResponse.json({ bucket: safeBucket, path, signedUrl });
  } catch (error) {
    const response = toErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.statusCode });
  }
}
