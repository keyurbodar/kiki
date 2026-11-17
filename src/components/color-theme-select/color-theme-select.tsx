import { useState } from "react";
import { toast } from "sonner";
import {
  colorThemeKey,
  colorThemeLabel,
  useAppearance,
  useColorThemePreview,
} from "@/lib/appearance";
import { Button } from "@/primitives/button";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { ColorThemeSwatch } from "./color-theme-swatch";
import { TrashCanIcon } from "./icons";
import {
  useColorThemeOptions,
  useDeleteColorTheme,
} from "./use-color-theme-options";

export type ColorThemeSelectProps = {
  className?: string;
  disabled?: boolean;
};

const stopPropagation = (event: { stopPropagation: () => void }) =>
  event.stopPropagation();

export function ColorThemeSelect({
  className,
  disabled,
}: ColorThemeSelectProps) {
  const { resolvedMode } = useAppearance();
  const { displayed, options, presets, custom, select, byKey } =
    useColorThemeOptions();
  const deleteTheme = useDeleteColorTheme();
  const preview = useColorThemePreview();
  const [deleting, setDeleting] = useState<string | null>(null);
  const dark = resolvedMode === "dark";

  return (
    <MenuSelect
      disabled={disabled}
      items={Object.fromEntries(
        options.map((option) => [
          colorThemeKey(option),
          colorThemeLabel(option),
        ]),
      )}
      value={colorThemeKey(displayed)}
      onValueChange={(key) => {
        const theme = key === null ? undefined : byKey(key);
        if (theme !== undefined) select(theme);
      }}
      onOpenChange={preview.onOpenChange}
    >
      <MenuSelectTrigger
        className={className ?? "w-40"}
        aria-label="Color theme"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ColorThemeSwatch theme={displayed} dark={dark} />
          <MenuSelectValue />
        </span>
      </MenuSelectTrigger>
      <MenuSelectContent>
        {presets.map((theme) => (
          <MenuSelectItem
            key={colorThemeKey(theme)}
            value={colorThemeKey(theme)}
            {...preview.itemProps(theme)}
          >
            <ColorThemeSwatch theme={theme} dark={dark} />
            {colorThemeLabel(theme)}
          </MenuSelectItem>
        ))}
        {custom.length > 0 ? (
          <div
            aria-hidden
            data-slot="menu-separator"
            className="-mx-1 my-1 h-px bg-border-1"
          />
        ) : null}
        {custom.map((theme) => (
          <MenuSelectItem
            key={colorThemeKey(theme)}
            value={colorThemeKey(theme)}
            {...preview.itemProps(theme)}
          >
            <ColorThemeSwatch theme={theme} dark={dark} />
            {colorThemeLabel(theme)}
            <Button
              variant="bare"
              size="icon-shrink"
              aria-label={`Delete ${theme.name}`}
              className="-my-1 p-1"
              aria-busy={deleting === theme.id}
              disabled={deleting !== null}
              onPointerDown={stopPropagation}
              onMouseUp={stopPropagation}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDeleting(theme.id);
                deleteTheme(theme).then(
                  () => {
                    setDeleting(null);
                    toast.success(`Deleted ${theme.name}`);
                  },
                  () => {
                    setDeleting(null);
                    toast.error("Could not delete the theme");
                  },
                );
              }}
            >
              <TrashCanIcon />
            </Button>
          </MenuSelectItem>
        ))}
      </MenuSelectContent>
    </MenuSelect>
  );
}
