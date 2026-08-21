import {
  Button,
  Card,
  Disclaimer,
  LanguageSwitch,
  SectionHeader,
  StatusDot,
} from "@/components/ui";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

import { TokenSwatch } from "./token-swatch";

const COLOR_TOKENS = [
  "--bg",
  "--surface",
  "--surface-2",
  "--text",
  "--text-2",
  "--border",
  "--accent",
  "--accent-ink",
];

const STATUS_TOKENS = ["--ok", "--warn", "--danger", "--info"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border py-4 last:border-b-0">
      <span className="label w-28 shrink-0">{label}</span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

/**
 * Every base component, rendered once. The parent sets data-theme, so this
 * whole tree resolves against whichever palette is being previewed.
 */
export function Specimens({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <div className="flex flex-col gap-10">
      {/* -- Tokens ------------------------------------------------------- */}
      <section>
        <SectionHeader index={1} as="h3" title="Tokens" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          {COLOR_TOKENS.map((token) => (
            <TokenSwatch key={token} name={token} />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {STATUS_TOKENS.map((token) => (
            <TokenSwatch key={token} name={token} />
          ))}
        </div>
      </section>

      {/* -- Type --------------------------------------------------------- */}
      <section>
        <SectionHeader
          index={2}
          as="h3"
          title="Type"
          description="Inter Tight for display and body. JetBrains Mono only for labels, metadata and numbers."
        />
        <div className="mt-4">
          <Row label="Display">
            <span className="text-2xl font-semibold tracking-tight text-ink">
              {dict.home.heading}
            </span>
          </Row>
          <Row label="Body">
            <span className="max-w-md text-ink-2">{dict.app.tagline}</span>
          </Row>
          <Row label="Devanagari">
            <span lang="hi" className="text-lg text-ink">
              फ़सल की तस्वीर से रोग की पहचान करें
            </span>
          </Row>
          <Row label="Mono label">
            <span className="label">Mandi price · मंडी भाव</span>
          </Row>
          <Row label="Mono numbers">
            <span className="meta">₹ 2,340 / quintal · 18.4 °C · 1.2 m</span>
          </Row>
        </div>
      </section>

      {/* -- Card --------------------------------------------------------- */}
      <section>
        <SectionHeader
          index={3}
          as="h3"
          title="Card"
          description="Flat, 1px border, 8px radius. Never a box-shadow — depth comes from the surface tokens."
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="label">Surface</p>
            <p className="mt-2 text-ink-2">Default card on --surface.</p>
          </Card>
          <Card tone="sunken">
            <p className="label">Sunken</p>
            <p className="mt-2 text-ink-2">Nested card on --surface-2.</p>
          </Card>
          <Card interactive className="sm:col-span-2">
            <p className="label">Interactive</p>
            <p className="mt-2 text-ink-2">
              Border shifts on hover and focus-within. Still no shadow.
            </p>
          </Card>
        </div>
      </section>

      {/* -- Button ------------------------------------------------------- */}
      <section>
        <SectionHeader
          index={4}
          as="h3"
          title="Button"
          description="Text + arrow is the default. Solid accent is reserved for the one primary action on a screen."
        />
        <div className="mt-4">
          <Row label="Primary">
            <Button variant="primary">{dict.app.open}</Button>
            <Button variant="primary" withArrow>
              {dict.app.open}
            </Button>
            <Button variant="primary" size="sm">
              {dict.app.open}
            </Button>
            <Button variant="primary" disabled>
              {dict.app.open}
            </Button>
          </Row>
          <Row label="Text">
            <Button>{dict.app.backToHome}</Button>
            <Button size="sm">{dict.app.backToHome}</Button>
            <Button href={`/${locale}/farmers`}>
              {dict.modules.farmers.name}
            </Button>
          </Row>
        </div>
      </section>

      {/* -- SectionHeader ------------------------------------------------ */}
      <section>
        <SectionHeader index={5} as="h3" title="SectionHeader" />
        <div className="mt-4 flex flex-col gap-6">
          <SectionHeader
            index={7}
            as="h3"
            title={dict.modules.education.name}
            description={dict.modules.education.description}
          />
          <SectionHeader
            eyebrow="No number"
            as="h3"
            title={dict.modules.vendors.name}
            action={<Button size="sm">{dict.app.open}</Button>}
          />
        </div>
      </section>

      {/* -- StatusDot ---------------------------------------------------- */}
      <section>
        <SectionHeader
          index={6}
          as="h3"
          title="StatusDot"
          description="The label carries the meaning; colour only reinforces it."
        />
        <div className="mt-4">
          <Row label="Tones">
            <StatusDot tone="ok" label="Safe to sail" />
            <StatusDot tone="warn" label="Caution" />
            <StatusDot tone="danger" label="Do not sail" />
            <StatusDot tone="info" label="Advisory" />
            <StatusDot tone="neutral" label="No data" />
          </Row>
          <Row label="Live">
            <StatusDot tone="ok" label="Model online" pulse />
          </Row>
        </div>
      </section>

      {/* -- LanguageSwitch ----------------------------------------------- */}
      <section>
        <SectionHeader
          index={7}
          as="h3"
          title="LanguageSwitch"
          description="Real links that swap the locale segment — works without JavaScript."
        />
        <div className="mt-4">
          <Row label="Default">
            <LanguageSwitch locale={locale} label={dict.app.languageLabel} />
          </Row>
          <Row label="Compact">
            <LanguageSwitch
              locale={locale}
              label={dict.app.languageLabel}
              compact
            />
          </Row>
        </div>
      </section>

      {/* -- Disclaimer --------------------------------------------------- */}
      <section>
        <SectionHeader
          index={8}
          as="h3"
          title="Disclaimer"
          description="Required on advice-type output, and on any screen showing mock data."
        />
        <div className="mt-4 flex flex-col gap-4">
          <Disclaimer
            label={dict.disclaimer.verifyLabel}
            source={dict.disclaimer.source}
          >
            {dict.disclaimer.adviceBody}
          </Disclaimer>
          <Disclaimer tone="sample" label={dict.disclaimer.sampleLabel}>
            {dict.disclaimer.sampleBody}
          </Disclaimer>
        </div>
      </section>
    </div>
  );
}
