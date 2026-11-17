import { cx } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { Button } from "@/primitives/button";
import { Icon, type IconId, isIconId } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverContentVariants,
} from "@/primitives/popover";
import {
  maxRecentIcons,
  projectEmojis,
  projectIcons,
  randomEmoji,
  randomIcon,
  recentIcons,
} from "./icons";

export type ProjectIconTab = "icons" | "emojis" | "image";

const isIconName = (value: string): value is IconId => isIconId(value);

export type ProjectIconValue = {
  readonly icon: string;
  readonly logoUrl: string | null;
};

export type ProjectIconTriggerProps = Omit<
  ComponentProps<"button">,
  "value"
> & {
  readonly icon: string;
  readonly logoUrl: string | null;
  readonly size?: "sm" | "md";
};

const tileClass =
  "grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-md bg-secondary transition-colors duration-100 select-none hover:bg-secondary-hover outline-none focus-visible:outline-ring-inset";

/** The round tile that opens the picker. */
export function ProjectIconTrigger({
  icon,
  logoUrl,
  size = "md",
  className,
  ...props
}: ProjectIconTriggerProps) {
  const box = size === "sm" ? "size-5" : "size-6";
  return (
    <button
      type="button"
      aria-label="Change project icon"
      className={cx(tileClass, className)}
      {...props}
    >
      {logoUrl !== null ? (
        <img src={logoUrl} alt="" className={box} />
      ) : isIconName(icon) ? (
        <Icon name={icon} className={box} />
      ) : (
        <span className="text-base leading-none">{icon}</span>
      )}
    </button>
  );
}

export type ProjectIconPickerProps = Omit<
  ComponentProps<"div">,
  "children" | "onSelect"
> & {
  readonly value: ProjectIconValue;
  readonly onSelect: (icon: string) => void;
  readonly onClear?: () => void;
  readonly children?: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly initialTab?: ProjectIconTab;
  readonly icons?: ReadonlyArray<string>;
  readonly image?: {
    readonly upload?: (file: File) => void;
    readonly remove?: () => void;
  };
};

export function ProjectIconPicker({
  value,
  onSelect,
  onClear,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  initialTab,
  icons = projectIcons,
  image,
  ...props
}: ProjectIconPickerProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = openProp ?? uncontrolled;
  const setOpen = (next: boolean) => {
    setUncontrolled(next);
    onOpenChange?.(next);
  };
  const [tab, setTab] = useState<ProjectIconTab>(
    initialTab ?? (value.logoUrl === null ? "icons" : "image"),
  );
  const [history, setHistory] = useState<ReadonlyArray<string>>(
    recentIcons(value.icon, []),
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const fileId = useId();

  const choose = (icon: string) => {
    if (!icons.includes(icon))
      setHistory((current) => recentIcons(icon, current));
    onSelect(icon);
    setOpen(false);
  };

  const tabs: ReadonlyArray<{ id: ProjectIconTab; label: string }> = [
    { id: "icons", label: "Icons" },
    { id: "emojis", label: "Emojis" },
    ...(image === undefined ? [] : [{ id: "image" as const, label: "Image" }]),
  ];
  const tileLabel = (icon: string) => icon;
  const visible = tab === "icons" ? history.slice(0, maxRecentIcons) : [];

  return (
    <div data-slot="project-icon-picker" {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <ProjectIconTrigger
              icon={value.icon}
              logoUrl={value.logoUrl}
              aria-label="Change project icon"
            />
          }
        />
        {children}
        <PopoverContent
          align="start"
          className={cx(popoverContentVariants(), "w-80 gap-2 p-2")}
        >
          <div className="flex items-center gap-1">
            {tabs.map((entry) => (
              <Button
                key={entry.id}
                variant="ghost"
                size="sm"
                data-selected={tab === entry.id || undefined}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </Button>
            ))}
            <span className="flex-1" />
            {tab !== "image" && onClear !== undefined && value.icon !== "" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                Remove
              </Button>
            )}
          </div>
          {tab === "icons" && (
            <div
              role="group"
              aria-label="Project icons"
              className="grid grid-cols-8 gap-1"
            >
              {visible.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  aria-label={tileLabel(icon)}
                  aria-pressed={value.icon === icon}
                  className="grid size-8 place-items-center rounded bg-transparent text-muted-foreground-1 outline-none select-none transition-colors duration-100 hover:bg-secondary hover:text-foreground focus-visible:outline-ring-inset data-[selected]:bg-secondary data-[selected]:text-foreground"
                  data-selected={value.icon === icon || undefined}
                  onClick={() => choose(icon)}
                >
                  {isIconName(icon) && <Icon name={icon} className="size-4" />}
                </button>
              ))}
            </div>
          )}
          {tab === "emojis" && (
            <div
              role="group"
              aria-label="Project emojis"
              className="grid grid-cols-8 gap-1"
            >
              {projectEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={emoji}
                  aria-pressed={value.icon === emoji}
                  className="grid size-8 place-items-center rounded text-sm leading-none outline-none select-none transition-colors duration-100 hover:bg-secondary focus-visible:outline-ring-inset data-[selected]:bg-secondary"
                  data-selected={value.icon === emoji || undefined}
                  onClick={() => choose(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          {tab === "image" && image !== undefined && (
            <div className="flex flex-col gap-2">
              <div className="flex h-24 shrink-0 flex-col items-center justify-center gap-2 rounded border-[0.03125rem] border-border-2 bg-input">
                {value.logoUrl === null ? (
                  <span className="text-xs text-muted-foreground-2">
                    No image yet
                  </span>
                ) : (
                  <img src={value.logoUrl} alt="" className="size-12" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <input
                  id={fileId}
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file !== undefined) image.upload?.(file);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                >
                  Upload image
                </Button>
                {value.logoUrl !== null && image.remove !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      image.remove?.();
                      setOpen(false);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1 border-t-hairline border-border-1 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                choose(
                  tab === "emojis"
                    ? randomEmoji(projectEmojis)
                    : randomIcon(projectIcons),
                )
              }
            >
              <Icon name="shuffle" className="size-(--icon-sm)" />
              Randomize
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export type ProjectIconPickerInputProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
};

/** The free-text field Capy shows beside the picker when a project has no icons to pick from. */
export function ProjectIconField({
  label,
  value,
  onChange,
  placeholder,
}: ProjectIconPickerInputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
