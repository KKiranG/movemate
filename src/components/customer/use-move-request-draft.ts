"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearMoveRequestDraft,
  createDefaultMoveRequestDraft,
  readMoveRequestDraft,
  type MoveRequestDraft,
  writeMoveRequestDraft,
} from "@/components/customer/move-request-draft";

type DraftUpdater =
  | MoveRequestDraft
  | Partial<MoveRequestDraft>
  | ((current: MoveRequestDraft) => MoveRequestDraft);

export function useMoveRequestDraft() {
  const [draft, setDraftState] = useState<MoveRequestDraft>(createDefaultMoveRequestDraft());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setDraftState(readMoveRequestDraft());
    setIsHydrated(true);
  }, []);

  const setDraft = useCallback((nextValue: DraftUpdater) => {
    setDraftState((current) => {
      const nextDraft =
        typeof nextValue === "function"
          ? nextValue(current)
          : { ...current, ...nextValue };

      writeMoveRequestDraft(nextDraft);
      return nextDraft;
    });
  }, []);

  const resetDraft = useCallback(() => {
    const nextDraft = createDefaultMoveRequestDraft();
    clearMoveRequestDraft();
    setDraftState(nextDraft);
  }, []);

  return {
    draft,
    setDraft,
    resetDraft,
    isHydrated,
  };
}
