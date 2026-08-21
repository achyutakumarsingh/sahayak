"use client";

import { useSession } from "@/components/providers";
import { Button } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { localePath } from "@/lib/routes";

/** 9876543210 -> 98765 43210. Grouping only; the digits are untouched. */
export function formatPhone(phone: string): string {
  return phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone;
}

export function AccountPanel({
  locale,
  dict,
  onNavigate,
  className,
}: {
  locale: Locale;
  dict: Dictionary;
  onNavigate?: () => void;
  className?: string;
}) {
  const { session, signOut } = useSession();

  return (
    <section aria-labelledby="account-heading" className={cn("flex flex-col gap-2", className)}>
      <h2 id="account-heading" className="label">
        {dict.auth.account}
      </h2>

      {session ? (
        <>
          <p className="text-xs text-ink-2">
            {dict.auth.signedInAs}{" "}
            <span className="meta text-ink" dir="ltr">
              +91 {formatPhone(session.phone)}
            </span>
          </p>
          <p>
            <Button
              size="sm"
              withArrow={false}
              onClick={() => {
                signOut();
                onNavigate?.();
              }}
            >
              {dict.auth.signOut}
            </Button>
          </p>
        </>
      ) : (
        <>
          <p className="text-xs text-ink-2">{dict.auth.signInPrompt}</p>
          <p>
            <Button
              size="sm"
              href={localePath(locale, "sign-in")}
              onClick={onNavigate}
            >
              {dict.auth.signIn}
            </Button>
          </p>
        </>
      )}
    </section>
  );
}
