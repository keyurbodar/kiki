import type { ColorThemeChoice } from "@/lib/appearance";

export type ColorThemeSwatchProps = {
  theme: ColorThemeChoice;
  dark: boolean;
};

export function ColorThemeSwatch({ theme, dark }: ColorThemeSwatchProps) {
  return (
    <span
      aria-hidden
      data-color-theme={theme.kind === "preset" ? theme.id : undefined}
      data-color-theme-preview={
        theme.kind === "default" ? "default" : undefined
      }
      className={
        (dark ? "dark " : "") +
        "flex size-(--icon-sm) shrink-0 items-center justify-center overflow-hidden rounded-sm border-hairline border-border-2 text-2xs font-medium [background:var(--primary)] [color:var(--primary-text)]"
      }
    >
      C
    </span>
  );
}
