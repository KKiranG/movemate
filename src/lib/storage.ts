import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { PRIVATE_BUCKETS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { isHeicLikePath, isPreviewableImagePath } from "@/lib/utils";

export type PrivateBucketName =
  (typeof PRIVATE_BUCKETS)[keyof typeof PRIVATE_BUCKETS];

export async function uploadPrivateFile(params: {
  bucket: PrivateBucketName;
  path: string;
  file: File;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Storage is not configured.", 503, "storage_unavailable");
  }

  const supabase = createAdminClient();
  const arrayBuffer = await params.file.arrayBuffer();
  const { error } = await supabase.storage
    .from(params.bucket)
    .upload(params.path, arrayBuffer, {
      contentType: params.file.type || "application/octet-stream",
      upsert: true,
    });

  if (error) {
    throw new AppError(error.message, 500, "storage_upload_failed");
  }

  return {
    bucket: params.bucket,
    path: params.path,
  };
}

export async function createSignedPrivateUrl(params: {
  bucket: PrivateBucketName;
  path: string;
  expiresInSeconds?: number;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new AppError("Storage is not configured.", 503, "storage_unavailable");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(params.path, params.expiresInSeconds ?? 60 * 10);

  if (error) {
    throw new AppError(error.message, 500, "storage_signed_url_failed");
  }

  return data.signedUrl;
}

export async function getPrivateFileDisplay(params: {
  bucket: PrivateBucketName;
  path: string | null | undefined;
  expiresInSeconds?: number;
}) {
  if (!params.path) {
    return null;
  }

  const signedUrl = await createSignedPrivateUrl({
    bucket: params.bucket,
    path: params.path,
    expiresInSeconds: params.expiresInSeconds,
  });

  return {
    path: params.path,
    signedUrl,
    isHeicLike: isHeicLikePath(params.path),
    isPreviewableImage: isPreviewableImagePath(params.path),
    isPdf: /\.pdf$/i.test(params.path),
  };
}
