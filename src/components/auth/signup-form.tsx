"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AccountType = "customer" | "carrier";

export function SignupForm({
  defaultAccountType = "customer",
  lockAccountType = false,
}: {
  defaultAccountType?: AccountType;
  lockAccountType?: boolean;
}) {
  const router = useRouter();
  const [accountType, setAccountType] =
    useState<AccountType>(defaultAccountType);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            account_type: accountType,
            full_name: fullName,
            phone,
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      router.push(
        accountType === "carrier" ? "/carrier/onboarding" : "/verify",
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign up.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">
          I am signing up as
        </span>
        <select
          value={accountType}
          onChange={(event) =>
            setAccountType(event.target.value as AccountType)
          }
          disabled={lockAccountType}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="customer">Customer</option>
          <option value="carrier">Carrier</option>
        </select>
        {lockAccountType ? (
          <span className="text-xs text-text-secondary">
            This carrier signup path is preconfigured so you land straight in
            onboarding.
          </span>
        ) : null}
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Full name</span>
        <Input
          placeholder="Lina Chen"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Phone</span>
        <Input
          placeholder="+61 400 000 000"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Email</span>
        <Input
          type="email"
          placeholder="lina@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">Password</span>
        <Input
          type="password"
          placeholder="Choose a secure password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
