import { ThemePreview } from "../theme-preview";
import {
  type ThemeOption,
  themeOptionKey,
  themeOptionLabel,
} from "../model/theme-options";

export function ThemeGrid({
  options,
  value,
  side,
  disabled,
  onSelect,
}: {
  options: ReadonlyArray<ThemeOption>;
  value: string;
  side: "light" | "dark";
  disabled?: boolean;
  onSelect: (option: ThemeOption) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-4 p-4 @md:grid-cols-4 @2xl:grid-cols-6"
    >
      {options.map((option) => {
        const key = themeOptionKey(option);
        const label = themeOptionLabel(option);
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={key === value}
            aria-label={label}
            disabled={disabled}
            onClick={() => onSelect(option)}
            className="group flex min-w-0 cursor-pointer flex-col items-center gap-2 outline-none disabled:pointer-events-none disabled:opacity-55"
          >
            <span className="relative block aspect-[3/2] w-full overflow-hidden rounded-(--radius-card) border-[length:--spacing(0.125)] border-border-2 group-focus-visible:outline-ring-inset group-aria-checked:border-primary">
              <ThemePreview
                side={side}
                source={
                  option.kind === "custom"
                    ? { kind: "palette", palette: option[side] }
                    : option
                }
              />
            </span>
            <span className="max-w-full truncate text-xs text-muted-foreground-1 group-aria-checked:font-medium group-aria-checked:text-foreground">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
