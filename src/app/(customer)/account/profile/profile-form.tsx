"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  initialFirstName,
  initialLastName,
}: {
  initialFirstName: string;
  initialLastName: string;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName, lastName }),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(body.error ?? "Profile could not be saved.");
      return;
    }

    setStatus("saved");
    setMessage("Profile saved.");
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">First name</span>
        <Input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          autoComplete="given-name"
          required
          maxLength={60}
          aria-label="First name"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Last name</span>
        <Input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          autoComplete="family-name"
          required
          maxLength={60}
          aria-label="Last name"
        />
      </label>

      {message ? (
        <p
          className={`caption ${status === "error" ? "text-[var(--danger)]" : "text-[var(--success)]"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={status === "saving"}>
        {status === "saving" ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
