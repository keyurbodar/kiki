import { useAtomSet } from "@effect/atom-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createThemeAtom,
  removeThemeAtom,
  updateThemeAtom,
  userThemeKey,
} from "@/data/atoms/appearance";
import { Button, ButtonIcon } from "@/primitives/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/primitives/collapsible";
import { Input } from "@/primitives/input";
import { Label } from "@/primitives/label";
import { ChevronDownIcon, PlusIcon } from "../icons";
import {
  appearanceActions,
  colorThemeKey,
  colorThemeLabel,
  useAppearance,
  useResolvedMode,
} from "../model/appearance-store";
import {
  COLOR_LABELS,
  type ColorKey,
  type ColorValue,
  colorValueCss,
  isHexColor,
  OPTIONAL_COLOR_KEYS,
  type Palette,
  type PaletteSide,
  REQUIRED_COLOR_KEYS,
  selfReferences,
  type ThemeColors,
} from "../model/palette";
import { readPresetPalette, toHex } from "../model/preset-palette";
import { useThemeOptions, useUserThemes } from "../model/theme-options";
import { SettingsSection } from "@/components/settings-page";
import { Card } from "@/primitives/card";
import { SettingsRow, SettingsRowLink } from "@/primitives/settings-row";
import { ThemeGrid } from "../theme-grid";

const SIDES: ReadonlyArray<PaletteSide> = ["light", "dark"];
const MAIN_KEYS: ReadonlyArray<ColorKey> = ["accent", "background", "foreground"];
const ADVANCED_KEYS: ReadonlyArray<ColorKey> = [
  "text",
  "accentText",
  "shaderInk",
  ...OPTIONAL_COLOR_KEYS,
];
const isRequired = (key: ColorKey) =>
  (REQUIRED_COLOR_KEYS as ReadonlyArray<ColorKey>).includes(key);

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message !== "" ? error.message : fallback;

function ColorRow({
  colorKey,
  value,
  field,
  invalid,
  disabled,
  onFieldChange,
  onReset,
}: {
  colorKey: ColorKey;
  value: ColorValue | undefined;
  field: string | undefined;
  invalid: boolean;
  disabled: boolean;
  onFieldChange: (value: string) => void;
  onReset: () => void;
}) {
  const required = isRequired(colorKey);
  const hex = value?.kind === "literal" ? value.hex : undefined;
  const malformed =
    field !== undefined && !isHexColor(field) && (required || field !== "");
  const id = `theme-color-${colorKey}`;
  const label = COLOR_LABELS[colorKey];
  return (
    <SettingsRow
      label={<Label htmlFor={id}>{label}</Label>}
      description={
        invalid
          ? "Refers to itself"
          : malformed
            ? "Use a six-digit hex color"
            : undefined
      }
    >
      {required ? null : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Reset ${label.toLowerCase()} to automatic`}
          disabled={disabled || (value === undefined && !malformed)}
          onClick={onReset}
        >
          <ChevronDownIcon className="size-(--icon-sm) rotate-180" />
        </Button>
      )}
      <div className="flex items-center gap-2">
        <label
          data-slot="popover-trigger"
          aria-label={`Pick ${label.toLowerCase()} color`}
          className="relative inline-flex cursor-pointer items-center justify-center"
        >
          <span
            className="color-picker__swatch"
            style={{
              backgroundColor:
                hex ?? (value === undefined ? undefined : colorValueCss(value)),
            }}
          />
          <input
            type="color"
            className="sr-only"
            value={hex ?? toHex("black") ?? ""}
            disabled={disabled}
            onChange={(event) => onFieldChange(event.currentTarget.value)}
          />
        </label>
        <Input
          id={id}
          size="sm"
          className="w-24"
          value={field ?? hex ?? ""}
          placeholder={value !== undefined && hex === undefined ? "Derived" : "Automatic"}
          aria-invalid={invalid || malformed}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => onFieldChange(event.currentTarget.value)}
        />
      </div>
    </SettingsRow>
  );
}

export function ThemeSection() {
  const { colorTheme, preferences } = useAppearance();
  const mode = useResolvedMode();
  const { options } = useThemeOptions();
  const userThemes = useUserThemes();
  const createTheme = useAtomSet(createThemeAtom, { mode: "promise" });
  const updateTheme = useAtomSet(updateThemeAtom, { mode: "promise" });
  const removeTheme = useAtomSet(removeThemeAtom, { mode: "promise" });
  const reactivityKeys = [userThemeKey()];

  const isCopy = colorTheme.kind !== "custom";
  const label = colorThemeLabel(colorTheme);
  const [editing, setEditing] = useState<PaletteSide>(mode);
  const [name, setName] = useState(colorTheme.kind === "custom" ? colorTheme.name : "");
  const [fields, setFields] = useState<Record<PaletteSide, Partial<Record<ColorKey, string>>>>({
    light: {},
    dark: {},
  });
  const [pending, setPending] = useState<"create" | "delete" | null>(null);
  const sourceKey = colorThemeKey(colorTheme);
  const lastSource = useRef(sourceKey);
  if (lastSource.current !== sourceKey) {
    lastSource.current = sourceKey;
    setName(colorTheme.kind === "custom" ? colorTheme.name : "");
    setFields({ light: {}, dark: {} });
  }

  const presetId = colorTheme.kind === "preset" ? colorTheme.id : "default";
  const presetColors = useMemo<ThemeColors>(
    () => ({
      light: readPresetPalette(presetId, "light"),
      dark: readPresetPalette(presetId, "dark"),
    }),
    [presetId],
  );
  const colors: ThemeColors =
    colorTheme.kind === "custom" ? colorTheme : presetColors;
  const palette = colors[editing];
  const invalid = selfReferences(palette);
  const trimmed = name.trim();
  const nameValid = trimmed.length > 0 && trimmed.length <= 40;
  const brokenSides = SIDES.filter(
    (side) =>
      selfReferences(colors[side]).length > 0 ||
      Object.entries(fields[side]).some(
        ([key, value]) =>
          value !== undefined &&
          !isHexColor(value) &&
          (value !== "" || isRequired(key as ColorKey)),
      ),
  );

  const create = (next: ThemeColors, select: boolean) => {
    setPending("create");
    return createTheme({
      payload: {
        name: `${label.slice(0, 33)} custom`,
        light: next.light,
        dark: next.dark,
        background: null,
        effect: preferences.effect,
      },
      reactivityKeys,
    }).then(
      (created) => {
        setPending(null);
        const theme = created as { id: string; name: string } & ThemeColors;
        if (select) {
          appearanceActions.selectColorTheme({
            kind: "custom",
            id: theme.id,
            name: theme.name,
            light: theme.light,
            dark: theme.dark,
          });
        } else {
          toast.success(`Created ${theme.name}`);
        }
      },
      (error: unknown) => {
        setPending(null);
        throw error;
      },
    );
  };

  const save = (next: ThemeColors, nextName?: string) => {
    if (colorTheme.kind !== "custom") {
      create(next, true).catch((error: unknown) =>
        toast.error(errorMessage(error, "Could not save the theme")),
      );
      return;
    }
    const themeName = nextName ?? (nameValid ? trimmed : colorTheme.name);
    appearanceActions.selectColorTheme({
      kind: "custom",
      id: colorTheme.id,
      name: themeName,
      light: next.light,
      dark: next.dark,
    });
    updateTheme({
      params: { themeId: colorTheme.id },
      payload: { name: themeName, light: next.light, dark: next.dark },
      reactivityKeys,
    }).catch((error: unknown) =>
      toast.error(errorMessage(error, "Could not save the theme")),
    );
  };

  const setColor = (key: ColorKey, value: ColorValue | undefined) => {
    const side: Record<string, ColorValue> = { ...colors[editing] };
    if (value === undefined) delete side[key];
    else side[key] = value;
    save({ ...colors, [editing]: side as unknown as Palette });
  };

  const saveName = useRef<() => void>(() => {});
  saveName.current = () => {
    if (colorTheme.kind === "custom" && nameValid && trimmed !== colorTheme.name) {
      save(colorTheme, trimmed);
    }
  };
  useEffect(() => {
    if (!nameValid) return;
    const timer = setTimeout(() => saveName.current(), 500);
    return () => clearTimeout(timer);
  }, [nameValid]);

  const source =
    colorTheme.kind === "custom"
      ? userThemes?.find((theme) => theme.id === colorTheme.id)
      : undefined;

  const remove = () => {
    if (colorTheme.kind !== "custom" || pending !== null) return;
    setPending("delete");
    const removed = colorTheme;
    removeTheme({ params: { themeId: removed.id }, reactivityKeys }).then(
      () => {
        setPending(null);
        appearanceActions.selectColorTheme({ kind: "default" });
        toast.success(`Deleted ${removed.name}`);
      },
      (error: unknown) => {
        setPending(null);
        toast.error(errorMessage(error, "Could not delete the theme"));
      },
    );
  };

  const colorRow = (key: ColorKey) => (
    <ColorRow
      key={`${editing}-${key}`}
      colorKey={key}
      value={palette[key]}
      field={fields[editing][key]}
      invalid={invalid.includes(key)}
      disabled={pending !== null}
      onFieldChange={(value) => {
        setFields((current) => ({
          ...current,
          [editing]: { ...current[editing], [key]: value },
        }));
        if (isHexColor(value)) setColor(key, { kind: "literal", hex: value.toLowerCase() });
        if (value === "" && !isRequired(key)) setColor(key, undefined);
      }}
      onReset={() => {
        setColor(key, undefined);
        setFields((current) => ({
          ...current,
          [editing]: { ...current[editing], [key]: undefined },
        }));
      }}
    />
  );

  return (
    <>
      <SettingsSection
        id="color-theme"
        title="Theme"
        description={
          isCopy
            ? `Editing creates your own copy of ${label}`
            : `Changes save to ${nameValid ? trimmed : label}`
        }
        action={
          <Button
            variant="ghost"
            size="sm"
            disabled={pending !== null}
            onClick={() => {
              create(colors, false).catch((error: unknown) =>
                toast.error(errorMessage(error, "Could not create the theme")),
              );
            }}
          >
            <ButtonIcon className="inline-flex shrink-0 items-center justify-center -ml-0.5">
              <PlusIcon />
            </ButtonIcon>
            Create theme
          </Button>
        }
      >
        <Card rows className="@container">
          <ThemeGrid
            options={options}
            value={sourceKey}
            side={mode}
            disabled={pending !== null}
            onSelect={(option) => appearanceActions.selectColorTheme(option)}
          />
          {colorTheme.kind === "custom" ? (
            <>
              <SettingsRow label={<Label htmlFor="theme-name">Name</Label>}>
                <Input
                  id="theme-name"
                  size="sm"
                  className="w-48"
                  value={name}
                  maxLength={40}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              </SettingsRow>
              <SettingsRowLink
                to="/settings/appearance/themes/$themeId"
                params={{ themeId: colorTheme.id }}
                label="Submit to Explore"
                description={
                  source?.listingVersionId ? "Added from Explore" : "Explore listing"
                }
              />
              <SettingsRow
                label="Delete theme"
                description={`Removes ${colorTheme.name} from your themes`}
              >
                <Button
                  variant="ghost"
                  intent="danger"
                  size="sm"
                  disabled={pending !== null}
                  onClick={remove}
                >
                  Delete
                </Button>
              </SettingsRow>
            </>
          ) : null}
        </Card>
      </SettingsSection>
      <SettingsSection
        title="Colors"
        action={
          <div
            role="group"
            aria-label="Palette"
            className="relative flex items-center gap-0.5 rounded-lg border-[length:--spacing(0.125)] border-border-2 bg-secondary p-0.5"
          >
            {SIDES.map((side) => (
              <Button
                key={side}
                variant="segmented"
                size="sm"
                aria-pressed={editing === side}
                data-selected={editing === side || undefined}
                onClick={() => setEditing(side)}
              >
                {side === "light" ? "Light" : "Dark"}
              </Button>
            ))}
          </div>
        }
      >
        <Card rows>{MAIN_KEYS.map(colorRow)}</Card>
        {brokenSides.length > 0 ? (
          <p role="alert" className="px-4 text-sm text-destructive">
            Check the colors in the {brokenSides.join(" and ")} palette
          </p>
        ) : null}
        <Collapsible>
          <div className="px-4">
            <CollapsibleTrigger className="group/collapsible flex cursor-pointer items-center gap-1.5 rounded text-left font-medium outline-none select-none focus-visible:outline-ring-inset w-fit text-sm text-muted-foreground-1 hover:text-foreground">
              Advanced colors
              <ChevronDownIcon className="size-(--icon-sm) -rotate-90 text-muted-foreground-3 group-data-[panel-open]/collapsible:rotate-0" />
            </CollapsibleTrigger>
          </div>
          <CollapsiblePanel>
            <div className="pt-3">
              <Card rows>{ADVANCED_KEYS.map(colorRow)}</Card>
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </SettingsSection>
      <SettingsSection title="Explore">
        <Card rows>
          <SettingsRowLink
            to="/settings/appearance/themes"
            label="Your themes"
            description="Submit your themes to Explore and follow their review"
          />
        </Card>
      </SettingsSection>
    </>
  );
}
