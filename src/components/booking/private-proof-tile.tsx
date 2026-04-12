import { FileImage, FileText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { getPrivateFileDisplay, type PrivateBucketName } from "@/lib/storage";

export async function PrivateProofTile({
  bucket,
  path,
  title,
  subtitle,
  metadata,
}: {
  bucket: PrivateBucketName;
  path: string | null | undefined;
  title: string;
  subtitle?: string;
  metadata?: {
    capturedAt?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
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
          {subtitle ? <p className="text-sm text-text-secondary">{subtitle}</p> : null}
          {metadata?.capturedAt ? (
            <p className="text-xs text-text-secondary">
              Proof captured {new Date(metadata.capturedAt).toLocaleString("en-AU")}
            </p>
          ) : null}
          {typeof metadata?.latitude === "number" && typeof metadata?.longitude === "number" ? (
            <p className="text-xs text-text-secondary">
              GPS {metadata.latitude.toFixed(5)}, {metadata.longitude.toFixed(5)}
            </p>
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
          className="inline-flex min-h-[44px] items-center rounded-lg text-sm font-medium text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 active:opacity-80"
        >
          Open proof
        </a>
      </div>
    </Card>
  );
}
