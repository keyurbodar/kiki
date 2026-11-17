import { Icon } from "@/primitives/icon";
import { MenuContent, MenuItem, MenuTrigger } from "@/primitives/menu";
import { ResponsiveMenu } from "@/primitives/responsive-menu";
import type { FileVersion } from "./file-content";
import { PreviewMarker } from "./file-view";

const track = (owner: string) =>
  `shared/files/file-view.tsx#VersionPicker:${owner}`;

export type VersionPickerProps = {
  list: readonly FileVersion[];
  value: string;
  label: string;
  compact?: boolean;
  onPick: (value: string) => void;
};

export function VersionPicker({
  list,
  value,
  label,
  compact = false,
  onPick,
}: VersionPickerProps) {
  const selected = list.find((version) => version.value === value);
  return (
    <ResponsiveMenu>
      <MenuTrigger
        data-track-owner={track("ResponsiveMenuTrigger.1")}
        render={
          <button
            data-track-owner={track("button.1")}
            type="button"
            aria-label={label}
            className={[
              "focus-gutter relative flex shrink-0 items-center gap-0.5 rounded text-xs whitespace-nowrap text-muted-foreground-2 outline-none hover:text-foreground focus-visible:outline-ring-inset data-[popup-open]:text-foreground pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
              compact ? "ml-1" : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
          />
        }
      >
        {!compact && (selected?.label ?? label)}
        <Icon name="chevron-grabber-vertical" size="xs" />
      </MenuTrigger>
      <MenuContent align="start" className="w-64">
        {list.map((version, index) => (
          <MenuItem
            key={version.value}
            data-track-owner={track("ResponsiveMenuItem.1")}
            density={version.detail === undefined ? undefined : "rich"}
            onClick={() => onPick(version.value)}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{version.label}</span>
              {version.detail !== undefined && (
                <span className="truncate text-xs text-muted-foreground-2">
                  {version.detail}
                </span>
              )}
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground-3">
              {index === 0 && <PreviewMarker>Live</PreviewMarker>}
              {version.value === value && (
                <Icon
                  name="checkmark-1"
                  size="sm"
                  className="shrink-0 text-foreground"
                />
              )}
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </ResponsiveMenu>
  );
}

export function initialCompare(
  list: readonly FileVersion[],
  current: string,
): { base: string; head: string } | undefined {
  const index = Math.max(
    0,
    list.findIndex((version) => version.value === current),
  );
  const older = list[index + 1];
  const head = older === undefined ? list[index - 1] : list[index];
  const base = older ?? list[index];
  return head === undefined || base === undefined
    ? undefined
    : { base: base.value, head: head.value };
}
