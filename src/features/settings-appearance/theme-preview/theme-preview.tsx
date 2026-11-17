import type { CSSProperties } from "react";
import type { PresetColorTheme } from "@/tokens/theme";
import { type Palette, paletteStyle } from "../model/palette";

export type ThemePreviewSource =
  | { readonly kind: "default" }
  | { readonly kind: "preset"; readonly id: PresetColorTheme }
  | { readonly kind: "palette"; readonly palette: Palette };

/**
 * Capy's miniature app (sidebar strip, panel with message lines, composer with
 * an accent send dot) rendered in another theme's variables.
 */
export function ThemePreview({
  source,
  side,
}: {
  source: ThemePreviewSource;
  side: "light" | "dark";
}) {
  const style =
    source.kind === "palette"
      ? (paletteStyle(source.palette) as CSSProperties)
      : undefined;
  return (
    <span
      data-color-theme={source.kind === "preset" ? source.id : "editor-preview"}
      data-color-theme-preview={
        source.kind === "default" ? "default" : undefined
      }
      data-theme-preview={side}
      className={
        side === "dark"
          ? "dark relative flex h-full w-full bg-(--bg)"
          : "relative flex h-full w-full bg-(--bg)"
      }
      style={style}
    >
      <span className="flex w-[22%] shrink-0 flex-col px-[3.5%] pt-[9%]">
        <span className="h-[9%] w-full rounded-sm bg-(--secondary)" />
      </span>
      <span className="my-[5%] mr-[4%] flex min-w-0 flex-1 flex-col justify-between rounded border-[length:--spacing(0.125)] border-(--border-1) bg-(--panel) p-[6%]">
        <span className="flex flex-col gap-0.5">
          <span className="h-1.5 w-[42%] self-end rounded-sm bg-(--secondary)" />
          <span className="mt-0.5 h-0.5 w-[72%] rounded-full bg-(--muted-foreground-3)" />
          <span className="h-0.5 w-[48%] rounded-full bg-(--muted-foreground-3)" />
        </span>
        <span className="flex h-[26%] items-center justify-end rounded border-[length:--spacing(0.125)] border-(--border-2) bg-(--card) pr-[4%]">
          <span className="size-1.5 shrink-0 rounded-(--radius-inner) bg-(--primary)" />
        </span>
      </span>
    </span>
  );
}
