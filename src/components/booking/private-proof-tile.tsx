import { FileImage, FileText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getPrivateFileDisplay, type PrivateBucketName } from "@/lib/storage";

export async function PrivateProofTile({
  bucket,
  path,
  title,
  subtitle,
}: {
  bucket: PrivateBucketName;
  path: string | null | undefined;
  title: string;
  subtitle?: string;
}) {
  if (!path) {
    return null;
  }

  const asset = await getPrivateFileDisplay({ bucket, path });

  if (!asset) {
    return null;
  }

  return (
    <Card className="overflow-hidden p-0">
      {asset.isPreviewableImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.signedUrl}
          alt={title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-black/[0.03]">
          {asset.isPdf ? (
            <FileText className="h-8 w-8 text-text-secondary" />
          ) : (
            <FileImage className="h-8 w-8 text-text-secondary" />
          )}
        </div>
      )}
      <div className="space-y-2 p-3">
        <div>
          <p className="text-sm font-medium text-text">{title}</p>
          {subtitle ? (
            <p className="text-sm text-text-secondary">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-xs text-text-secondary">
          {asset.isHeicLike
            ? "Uploaded from iPhone in HEIC/HEIF format. Use the secure link below if the browser cannot preview it inline."
            : "Private proof image"}
        </p>
        <a
          href={asset.signedUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center text-sm font-medium text-accent active:opacity-80"
        >
          Open proof
        </a>
      </div>
    </Card>
  );
}
