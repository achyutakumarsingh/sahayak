"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useSession } from "@/components/providers";
import { formatPhone } from "@/components/shell/account-panel";
import { Button, Card, Disclaimer } from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { localePath } from "@/lib/routes";

const PHONE = /^\d{10}$/;
const OTP = /^\d{4,6}$/;

const FIELD =
  "w-full rounded-chip border border-border bg-surface px-3 py-2 font-mono text-ink " +
  "placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-accent";

export function SignInForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const { signIn } = useSession();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const digitsOnly = (value: string, max: number) =>
    value.replace(/\D/g, "").slice(0, max);

  function submitPhone(event: FormEvent) {
    event.preventDefault();
    if (!PHONE.test(phone)) {
      setError(dict.auth.errorPhone);
      return;
    }
    setError(null);
    setStep("code");
  }

  function submitCode(event: FormEvent) {
    event.preventDefault();
    if (!OTP.test(code)) {
      setError(dict.auth.errorOtp);
      return;
    }
    setError(null);
    // No network call: the stub trusts any well-formed code by design.
    signIn(phone);
    router.push(localePath(locale));
  }

  return (
    <div className="flex flex-col gap-6">
      <Disclaimer tone="sample" label={dict.auth.demoLabel}>
        {dict.auth.demoBody}
      </Disclaimer>

      <Card as="section" padding="lg">
        {step === "phone" ? (
          <form onSubmit={submitPhone} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="font-medium text-ink">
                {dict.auth.phoneLabel}
              </label>
              <p id="phone-hint" className="text-xs text-ink-2">
                {dict.auth.phoneHint}
              </p>
              <div className="flex items-center gap-2">
                <span className="meta shrink-0 text-ink-2" aria-hidden="true">
                  +91
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(digitsOnly(e.target.value, 10))}
                  placeholder={dict.auth.phonePlaceholder}
                  aria-describedby={error ? "phone-hint form-error" : "phone-hint"}
                  aria-invalid={error ? true : undefined}
                  className={FIELD}
                />
              </div>
            </div>

            <div>
              <Button type="submit" variant="primary" withArrow>
                {dict.auth.sendCode}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitCode} noValidate className="flex flex-col gap-4">
            <p className="text-xs text-ink-2">
              {dict.auth.codeSentTo}{" "}
              <span className="meta text-ink" dir="ltr">
                +91 {formatPhone(phone)}
              </span>
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="font-medium text-ink">
                {dict.auth.otpLabel}
              </label>
              <p id="code-hint" className="text-xs text-ink-2">
                {dict.auth.otpHint}
              </p>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(digitsOnly(e.target.value, 6))}
                placeholder={dict.auth.otpPlaceholder}
                aria-describedby={error ? "code-hint form-error" : "code-hint"}
                aria-invalid={error ? true : undefined}
                className={`${FIELD} max-w-40 tracking-[0.3em]`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" variant="primary" withArrow>
                {dict.auth.verify}
              </Button>
              <Button
                type="button"
                size="sm"
                withArrow={false}
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
              >
                {dict.auth.changeNumber}
              </Button>
            </div>
          </form>
        )}

        {/* Always in the tree so screen readers announce the change. */}
        <p
          id="form-error"
          role="alert"
          aria-live="polite"
          className="mt-4 min-h-5 text-xs text-danger"
        >
          {error}
        </p>
      </Card>
    </div>
  );
}
