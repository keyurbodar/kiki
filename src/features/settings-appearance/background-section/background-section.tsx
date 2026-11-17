import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  removeWallpaperAtom,
  uploadWallpaperAtom,
  wallpapersAtom,
  wallpapersKey,
} from "@/data/atoms/appearance";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { SkeletonPanel } from "@/primitives/skeleton-panel";
import { DashboardBackdrop } from "../background-effect";
import {
  ArrowUpIcon,
  CloudUploadIcon,
  PlusSmallIcon,
  ReplaceImageIcon,
  TrashIcon,
} from "../icons";
import {
  appearanceActions,
  BACKGROUND_EFFECT_LABELS,
  type BackgroundAdjustments,
  type BackgroundEffect,
  DEFAULT_BACKGROUND_ADJUSTMENTS,
  useAppearance,
} from "../model/appearance-store";
import { RangeField } from "../range-field";
import { SelectField } from "../select-field";
import { SettingsSection } from "@/components/settings-page";
import { Card } from "@/primitives/card";
import { SettingsRow } from "@/primitives/settings-row";

const ADJUSTMENTS: ReadonlyArray<{
  key: keyof BackgroundAdjustments;
  label: string;
  max: number;
  unit: string;
}> = [
  { key: "brightness", label: "Brightness", max: 200, unit: "%" },
  { key: "blur", label: "Blur", max: 24, unit: "px" },
  { key: "opacity", label: "Image opacity", max: 100, unit: "%" },
  { key: "fade", label: "Bottom fade", max: 100, unit: "%" },
  { key: "overlay", label: "Overlay opacity", max: 100, unit: "%" },
  { key: "inputOpacity", label: "Input opacity", max: 100, unit: "%" },
];

const WALLPAPER_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Wallpaper {
  readonly id: string;
  readonly name: string;
  readonly mimeType?: string;
  readonly url?: string;
  readonly thumbnailUrl?: string;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message !== "" ? error.message : fallback;

function HomeBackgroundControl() {
  const { preferences } = useAppearance();
  const background = preferences.background;
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Dashboard background file"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file === undefined) return;
          const reader = new FileReader();
          reader.onload = () =>
            appearanceActions.updatePreferences({
              background: {
                name: file.name,
                url: String(reader.result),
                appearance:
                  background?.appearance ?? DEFAULT_BACKGROUND_ADJUSTMENTS,
              },
            });
          reader.onerror = () => toast.error("Could not read the file");
          reader.readAsDataURL(file);
        }}
      />
      {background === null ? (
        <span className="flex size-8 items-center justify-center rounded-md border-[length:--spacing(0.125)] border-border-2 bg-muted text-muted-foreground-2">
          <Icon name="screen-capture" size="sm" />
        </span>
      ) : (
        <>
          <img
            src={background.url}
            alt={background.name}
            title={background.name}
            className="size-8 rounded-md border-[length:--spacing(0.125)] border-border-2 object-cover"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Adjust dashboard background"
          >
            <Icon name="auto-crop" size="sm" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={
          background === null
            ? "Upload dashboard background"
            : "Replace dashboard background"
        }
        onClick={() => input.current?.click()}
      >
        <ReplaceImageIcon />
      </Button>
      {background === null ? null : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Remove dashboard background"
          onClick={() => appearanceActions.updatePreferences({ background: null })}
        >
          <TrashIcon />
        </Button>
      )}
    </div>
  );
}

function BackgroundControls() {
  const { preferences } = useAppearance();
  const background = preferences.background;
  const [draft, setDraft] = useState<BackgroundAdjustments | null>(null);
  if (background === null) return null;
  const appearance = draft ?? background.appearance;
  const commit = (next: BackgroundAdjustments) => {
    setDraft(null);
    appearanceActions.updatePreferences({
      background: { ...background, appearance: next },
    });
  };
  return (
    <>
      <div className="p-4">
        <div
          aria-label="Dashboard background preview"
          className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-(--radius-card) bg-panel p-6"
        >
          <DashboardBackdrop
            image={background.url}
            effect={preferences.effect}
            appearance={appearance}
          />
          <div
            className="relative w-full max-w-sm rounded-(--radius-card) p-3 shadow-composer"
            style={{
              backgroundColor:
                appearance.inputOpacity === 100
                  ? "var(--popover)"
                  : `color-mix(in srgb, var(--popover) ${appearance.inputOpacity}%, transparent)`,
            }}
          >
            <div className="min-h-14 text-sm text-muted-foreground-2">
              Ask anything
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none -mx-1 -mb-1 flex items-center justify-between pt-1"
            >
              <Button variant="ghost" size="icon-sm" render={<span />}>
                <PlusSmallIcon />
              </Button>
              <Button intent="accent" size="icon-sm" render={<span />}>
                <ArrowUpIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {ADJUSTMENTS.map(({ key, label, max, unit }) => (
        <SettingsRow key={key} label={label}>
          <RangeField
            label={label}
            value={appearance[key]}
            max={max}
            unit={unit}
            onChange={(value) => setDraft({ ...appearance, [key]: value })}
            onCommit={() => {
              if (draft !== null) commit(draft);
            }}
          />
        </SettingsRow>
      ))}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={ADJUSTMENTS.every(
            ({ key }) => appearance[key] === DEFAULT_BACKGROUND_ADJUSTMENTS[key],
          )}
          onClick={() => commit(DEFAULT_BACKGROUND_ADJUSTMENTS)}
        >
          Reset to defaults
        </Button>
      </div>
    </>
  );
}

function WallpaperTile({
  wallpaper,
  onRemoved,
}: {
  wallpaper: Wallpaper;
  onRemoved: () => void;
}) {
  const remove = useAtomSet(removeWallpaperAtom, { mode: "promise" });
  const [removing, setRemoving] = useState(false);
  const { preferences } = useAppearance();
  const image = wallpaper.thumbnailUrl ?? wallpaper.url;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <button
        type="button"
        aria-label={`Use ${wallpaper.name} as the dashboard background`}
        disabled={image === undefined || removing}
        onClick={() => {
          if (image === undefined) return;
          appearanceActions.updatePreferences({
            background: {
              name: wallpaper.name,
              url: image,
              appearance:
                preferences.background?.appearance ??
                DEFAULT_BACKGROUND_ADJUSTMENTS,
            },
          });
        }}
        className="aspect-video w-full cursor-pointer overflow-hidden rounded-md border-[length:--spacing(0.125)] border-border-2 bg-muted outline-none transition-opacity duration-100 hover:opacity-90 focus-visible:outline-ring-inset disabled:cursor-default"
      >
        {image === undefined ? null : (
          <img src={image} alt="" className="size-full object-cover" />
        )}
      </button>
      <span className="flex min-w-0 items-center gap-1">
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground-1">
          {wallpaper.name}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${wallpaper.name}`}
          disabled={removing}
          onClick={() => {
            setRemoving(true);
            remove({
              params: { wallpaperId: wallpaper.id },
              reactivityKeys: [wallpapersKey()],
            }).then(
              () => {
                onRemoved();
                toast.success("Wallpaper removed", { description: wallpaper.name });
              },
              (error: unknown) => {
                setRemoving(false);
                toast.error(errorMessage(error, "Could not remove the wallpaper"));
              },
            );
          }}
        >
          <TrashIcon className="size-(--icon-xs)" />
        </Button>
      </span>
    </div>
  );
}

function WallpaperSyncRows() {
  const result = useAtomValue(wallpapersAtom);
  const upload = useAtomSet(uploadWallpaperAtom, { mode: "promise" });
  const { preferences } = useAppearance();
  const [saving, setSaving] = useState(false);
  const background = preferences.background;
  const contentType = background?.url.match(/^data:([^;,]+)/)?.[1];
  const supported =
    background !== null &&
    (contentType === undefined || WALLPAPER_TYPES.includes(contentType));
  const wallpapers = AsyncResult.isSuccess(result)
    ? (result.value as ReadonlyArray<Wallpaper>)
    : undefined;
  return (
    <>
      <SettingsRow
        label="Account wallpapers"
        description={
          background !== null && !supported
            ? "Account wallpapers support JPEG, PNG, and WebP"
            : "Synced to every device you sign in on"
        }
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={!supported || saving}
          onClick={() => {
            if (background === null) return;
            setSaving(true);
            upload({
              payload: {
                name: background.name.slice(0, 60),
                url: background.url,
                mimeType: contentType ?? "image/png",
              },
              reactivityKeys: [wallpapersKey()],
            })
              .then((saved) =>
                toast.success("Saved to your account", {
                  description: (saved as Wallpaper).name,
                }),
              )
              .catch((error: unknown) =>
                toast.error(errorMessage(error, "Could not save the wallpaper")),
              )
              .finally(() => setSaving(false));
          }}
        >
          <CloudUploadIcon />
          Save current
        </Button>
      </SettingsRow>
      <div className="p-4">
        {wallpapers === undefined ? (
          AsyncResult.isFailure(result) ? (
            <span className="text-sm font-normal text-muted-foreground-2">
              Wallpapers unavailable
            </span>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SkeletonPanel className="aspect-video w-full" />
              <SkeletonPanel className="aspect-video w-full" />
            </div>
          )
        ) : wallpapers.length === 0 ? (
          <span className="text-sm font-normal text-muted-foreground-2">
            No wallpapers yet, save the current one or add one from Explore
          </span>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {wallpapers.map((wallpaper) => (
              <WallpaperTile
                key={wallpaper.id}
                wallpaper={wallpaper}
                onRemoved={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function BackgroundSection() {
  const { preferences } = useAppearance();
  return (
    <SettingsSection title="Background">
      <Card rows>
        <SettingsRow
          id="home-background"
          label="Dashboard background"
          description="Custom image or gif for home dashboard"
        >
          <HomeBackgroundControl />
        </SettingsRow>
        <SettingsRow id="background-effect" label="Background effect">
          <SelectField<BackgroundEffect>
            label="Background effect"
            className="w-32"
            value={preferences.effect}
            items={BACKGROUND_EFFECT_LABELS}
            onChange={(effect) => appearanceActions.updatePreferences({ effect })}
          />
        </SettingsRow>
        <BackgroundControls />
        <WallpaperSyncRows />
      </Card>
    </SettingsSection>
  );
}
