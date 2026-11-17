import { createFileRoute, notFound } from "@tanstack/react-router";
import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { ICON_IDS, Icon } from "@/primitives/icon";
import {
  ANIMATIONS,
  COLOR_GROUPS,
  DURATIONS,
  EASINGS,
  FONT_FAMILIES,
  FONT_WEIGHTS,
  KEYFRAMES,
  RADII,
  SHADOWS,
  SIZES,
  TEXT_SIZES,
  THEME_VARIABLES,
  Z_INDEX,
} from "@/tokens/catalog";
import {
  applyColorMode,
  applyColorTheme,
  COLOR_THEME_LABELS,
  COLOR_THEMES,
  type ColorMode,
  type ColorTheme,
} from "@/tokens/theme";

type Search = { theme: ColorTheme; mode: ColorMode };

export const Route = createFileRoute("/__tokens")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    theme: COLOR_THEMES.find((t) => t === search.theme) ?? "default",
    mode:
      search.mode === "light" || search.mode === "dark"
        ? search.mode
        : "system",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: TokensPage,
});

function useResolved(names: string, version: string) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    if (version === "") return;
    const style = getComputedStyle(document.documentElement);
    setValues(
      Object.fromEntries(
        names.split(",").map((n) => [n, style.getPropertyValue(n).trim()]),
      ),
    );
  }, [names, version]);
  return values;
}

function TokensPage() {
  const { theme, mode } = Route.useSearch();
  const navigate = Route.useNavigate();

  useLayoutEffect(() => {
    applyColorTheme(theme);
    applyColorMode(mode);
  }, [theme, mode]);

  const version = `${theme}:${mode}`;
  const themeValues = useResolved(THEME_VARIABLES.join(","), version);

  return (
    <div className="flex flex-col gap-10 p-(--spacing-page-padding) font-sans text-base text-foreground">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="font-semibold text-2xl">Tokens</h1>
        <select
          className="h-(--h-control-sm) rounded-button border border-border-2 bg-button px-2 text-sm"
          value={theme}
          onChange={(e) =>
            navigate({ search: { theme: e.target.value as ColorTheme, mode } })
          }
        >
          {COLOR_THEMES.map((t) => (
            <option key={t} value={t}>
              {COLOR_THEME_LABELS[t]}
            </option>
          ))}
        </select>
        {(["system", "light", "dark"] as const).map((m) => (
          <button
            key={m}
            type="button"
            data-active={m === mode}
            className="h-(--h-control-sm) rounded-button bg-secondary px-3 text-sm transition-colors duration-(--duration-hover) hover:bg-secondary-hover data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            onClick={() => navigate({ search: { theme, mode: m } })}
          >
            {m}
          </button>
        ))}
      </header>

      {Object.entries(COLOR_GROUPS).map(([group, names]) => (
        <Section key={group} title={`Colour · ${group}`}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*40),1fr))] gap-3">
            {names.map((n) => (
              <Swatch key={n} name={`--color-${n}`} version={version} />
            ))}
          </div>
        </Section>
      ))}

      <Section title="Theme variables">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*64),1fr))] gap-x-6 gap-y-1 font-mono text-xs">
          {THEME_VARIABLES.map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span
                className="size-(--icon-sm) shrink-0 rounded-xs shadow-card"
                style={{ background: `var(${n})` }}
              />
              <span className="text-muted-foreground-1">{n}</span>
              <span className="truncate text-muted-foreground-3">
                {themeValues[n]}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-2">
          {TEXT_SIZES.map((s) => (
            <div key={s} className="flex items-baseline gap-4">
              <span className="w-(--container-3xs) shrink-0 font-mono text-muted-foreground-2 text-xs">
                text-{s}
              </span>
              <span
                style={{
                  fontSize: `var(--text-${s})`,
                  lineHeight: `var(--text-${s}--line-height, normal)`,
                  letterSpacing: `var(--text-${s}--letter-spacing, normal)`,
                }}
              >
                Capy runs your agents
              </span>
            </div>
          ))}
          <div className="flex flex-wrap gap-6 pt-4">
            {FONT_WEIGHTS.map((w) => (
              <span key={w} style={{ fontWeight: `var(--font-weight-${w})` }}>
                {w}
              </span>
            ))}
            <span className="italic">italic</span>
          </div>
          <div className="flex flex-col gap-1 pt-4">
            {FONT_FAMILIES.map((f) => (
              <span key={f} style={{ fontFamily: `var(--font-${f})` }}>
                --font-{f}: The quick brown fox 0123456789 {"{}"} =&gt;
              </span>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Radius, elevation, size">
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <Labelled key={r} label={`radius-${r}`}>
              <div
                className="size-(--h-palette-row) border border-border-3 bg-card"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
            </Labelled>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 pt-6">
          {SHADOWS.map((s) => (
            <Labelled key={s} label={s}>
              <div
                className="h-(--h-palette-row) w-(--container-3xs) rounded-card bg-card"
                style={{ boxShadow: `var(${s})` }}
              />
            </Labelled>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4 pt-6">
          {SIZES.map((s) => (
            <Labelled key={s} label={s}>
              <div
                className="rounded-xs bg-primary-20"
                style={{ width: `var(${s})`, height: `var(${s})` }}
              />
            </Labelled>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-6 font-mono text-muted-foreground-2 text-xs">
          {Z_INDEX.map((z) => (
            <ZValue key={z} name={z} />
          ))}
        </div>
      </Section>

      <Section title="Motion">
        <div className="flex flex-col gap-2">
          {DURATIONS.map((d) => (
            <MotionRow
              key={d}
              label={`--duration-${d}`}
              duration={`var(--duration-${d})`}
              easing="var(--ease-out-quint)"
            />
          ))}
          {EASINGS.map((e) => (
            <MotionRow
              key={e}
              label={`--ease-${e}`}
              duration="var(--duration-slower)"
              easing={`var(--ease-${e})`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-6 pt-6">
          {ANIMATIONS.map((a) => (
            <Labelled key={a} label={`animate-${a}`}>
              <div className="relative size-(--h-control-lg) overflow-hidden rounded-card bg-card shadow-card">
                <div
                  className={
                    a === "text-shimmer"
                      ? "text-shimmer p-2 text-sm"
                      : "absolute inset-2 rounded-sm bg-primary"
                  }
                  style={
                    a === "text-shimmer"
                      ? undefined
                      : {
                          animation: `var(--animate-${a})`,
                          animationIterationCount: "infinite",
                        }
                  }
                >
                  {a === "text-shimmer" ? "Working" : null}
                </div>
              </div>
            </Labelled>
          ))}
        </div>
        <p className="pt-4 font-mono text-muted-foreground-2 text-xs">
          {KEYFRAMES.length} keyframes: {KEYFRAMES.join(" · ")}
        </p>
      </Section>

      <Section title={`Icons · ${ICON_IDS.length}`}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*12),1fr))] gap-2 text-muted-foreground-1">
          {ICON_IDS.map((id) => (
            <div
              key={id}
              title={id}
              className="grid h-(--h-control-lg) place-items-center rounded-button hover:bg-secondary"
            >
              <Icon name={id} size="lg" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Effects">
        <div className="flex flex-wrap gap-4">
          {(["grain", "vignette"] as const).map((effect) => (
            <Labelled key={effect} label={effect}>
              <div className="relative h-(--media-box-h) w-(--media-box-w) max-w-full overflow-hidden rounded-card bg-panel shadow-card">
                <div
                  data-slot="background-effect"
                  data-effect={effect}
                  className="pointer-events-none absolute inset-0"
                />
              </div>
            </Labelled>
          ))}
          <Labelled label="gradient-panel-air">
            <div
              className="h-(--media-box-h) w-(--container-3xs) rounded-card shadow-card"
              style={{ background: "var(--gradient-panel-air)" }}
            />
          </Labelled>
          <Labelled label="gradient-plan-*">
            <div className="flex h-(--media-box-h) w-(--container-3xs) flex-col gap-2">
              {(["lite", "pro", "max"] as const).map((p) => (
                <div
                  key={p}
                  className="flex-1 rounded-card shadow-card"
                  style={{ background: `var(--gradient-plan-${p})` }}
                />
              ))}
            </div>
          </Labelled>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium text-muted-foreground-1 text-sm">{title}</h2>
      {children}
    </section>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {children}
      <span className="font-mono text-2xs text-muted-foreground-2">
        {label}
      </span>
    </div>
  );
}

function Swatch({ name, version }: { name: string; version: string }) {
  const value = useResolved(name, version)[name];
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-(--h-control-lg) rounded-card shadow-card"
        style={{ background: `var(${name})` }}
      />
      <span className="font-mono text-2xs text-muted-foreground-1">
        {name.replace("--color-", "")}
      </span>
      <span className="truncate font-mono text-2xs text-muted-foreground-3">
        {value}
      </span>
    </div>
  );
}

function ZValue({ name }: { name: string }) {
  const value = useResolved(`--z-${name}`, "static")[`--z-${name}`];
  return (
    <span>
      z-{name}: {value}
    </span>
  );
}

function MotionRow({
  label,
  duration,
  easing,
}: {
  label: string;
  duration: string;
  easing: string;
}) {
  return (
    <div className="group flex items-center gap-4">
      <span className="w-(--container-3xs) shrink-0 font-mono text-muted-foreground-2 text-xs">
        {label}
      </span>
      <div className="relative h-(--h-badge-xs) flex-1 rounded-full bg-section">
        <div
          className="absolute top-0 left-0 size-(--h-badge-xs) rounded-full bg-primary transition-[left] group-hover:left-[calc(100%-var(--h-badge-xs))]"
          style={{
            transitionDuration: duration,
            transitionTimingFunction: easing,
          }}
        />
      </div>
    </div>
  );
}
