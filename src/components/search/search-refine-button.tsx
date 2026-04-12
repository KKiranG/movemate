"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function SearchRefineButton({
  targetId = "search-form",
}: {
  targetId?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsVisible(window.scrollY > window.innerHeight);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] right-4 z-20 min-h-[44px] shadow-sm lg:right-6"
      onClick={() =>
        document.getElementById(targetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    >
      Refine search
    </Button>
  );
}
