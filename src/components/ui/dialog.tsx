/* eslint-disable @next/next/no-img-element */
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function DocumentPreviewDialog({
  triggerLabel,
  documentUrl,
}: {
  triggerLabel: string;
  documentUrl: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="min-h-[44px] min-w-[44px] text-sm text-accent underline active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-sm px-1">
          {triggerLabel}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed inset-x-4 top-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-50 overflow-auto rounded-xl bg-white p-4 focus:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(85vh,900px)] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="font-semibold text-text">
              {triggerLabel}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Close document preview"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center active:opacity-70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <img
            src={documentUrl}
            alt={triggerLabel}
            className="w-full rounded-lg"
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
