"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareTripButton({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setMessage("Trip link shared.");
        return;
      }

      await navigator.clipboard.writeText(url);
      setMessage("Trip link copied to clipboard.");
    } catch {
      setMessage("Unable to share this trip right now.");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share trip
      </Button>
      {message ? <p className="text-sm text-text-secondary">{message}</p> : null}
    </div>
  );
}
