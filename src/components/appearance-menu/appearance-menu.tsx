import type { ComponentProps } from "react";
import {
  CheckmarkIcon,
  ColorThemeSwatch,
  ContrastIcon,
  useColorThemeOptions,
} from "@/components/color-theme-select";
import {
  colorThemeKey,
  colorThemeLabel,
  sameColorTheme,
  setColorMode,
  useAppearance,
  useColorThemePreview,
} from "@/lib/appearance";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { menuCheckClassName, menuIconClassName } from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSub,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import type { ColorMode } from "@/tokens/theme";

const menuLabelClassName =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";

export const COLOR_MODE_OPTIONS = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "studio-display" },
] as const satisfies ReadonlyArray<{
  value: ColorMode;
  label: string;
  icon: "sun" | "moon" | "studio-display";
}>;

export const colorModeOption = (mode: ColorMode) =>
  COLOR_MODE_OPTIONS.find((option) => option.value === mode) ??
  COLOR_MODE_OPTIONS[2];

export function AppearanceMenuItems() {
  const { mode, resolvedMode } = useAppearance();
  const { displayed, options, select } = useColorThemeOptions();
  const preview = useColorThemePreview();
  const current = colorModeOption(mode);
  const dark = resolvedMode === "dark";

  return (
    <>
      <ResponsiveMenuSub
        icon={<Icon name={current.icon} size="sm" />}
        label="Mode"
        value={current.label}
        contentClassName="w-44"
      >
        {COLOR_MODE_OPTIONS.map((option) => (
          <ResponsiveMenuItem
            key={option.value}
            onClick={() => setColorMode(option.value)}
          >
            <span className={menuIconClassName}>
              <Icon name={option.icon} size="sm" />
            </span>
            {option.label}
            {mode === option.value ? (
              <CheckmarkIcon className={`ml-auto ${menuCheckClassName}`} />
            ) : null}
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenuSub>
      <ResponsiveMenuSub
        icon={<ColorThemeSwatch theme={displayed} dark={dark} />}
        label="Color theme"
        value={colorThemeLabel(displayed)}
        valueClassName="max-w-22"
        contentClassName="w-44"
        onOpenChange={preview.onOpenChange}
      >
        {options.map((theme) => (
          <ResponsiveMenuItem
            key={colorThemeKey(theme)}
            onClick={() => select(theme)}
            {...preview.itemProps(theme)}
          >
            <span className={menuIconClassName}>
              <ColorThemeSwatch theme={theme} dark={dark} />
            </span>
            <span className={menuLabelClassName}>{colorThemeLabel(theme)}</span>
            {sameColorTheme(displayed, theme) ? (
              <CheckmarkIcon className={`ml-auto ${menuCheckClassName}`} />
            ) : null}
          </ResponsiveMenuItem>
        ))}
      </ResponsiveMenuSub>
    </>
  );
}

export type AppearanceMenuProps = ComponentProps<"div">;

export function AppearanceMenu(props: AppearanceMenuProps) {
  return (
    <div {...props}>
      <ResponsiveMenu>
        <ResponsiveMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Appearance" />
          }
        >
          <ContrastIcon />
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent align="end" className="w-60">
          <AppearanceMenuItems />
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    </div>
  );
}
