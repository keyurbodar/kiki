import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { cx } from "class-variance-authority";
import { AsyncResult } from "effect/reactivity";
import { useRef, useState } from "react";
import {
  EmojiPicker,
  useEmojiGroups,
  useFrequentEmoji,
} from "@/components/emoji-picker";
import type { OrgId } from "@/data/api/schemas/ids";
import {
  captainLibraryAtom,
  captainReactivityKeys,
  uploadCaptainLibraryImageAtom,
} from "@/data/atoms/captains";
import { Button } from "@/primitives/button";
import { ColorPicker } from "@/primitives/color-picker";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuLabel,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { captainAvatarCustomSwatch } from "@/tokens/captain-avatar";
import {
  type CaptainAvatarValue,
  captainAvatarBackgrounds,
  captainAvatarPresets,
  captainLibraryLimit,
  captainPresetSrc,
  hasPrivateImage,
  isPaletteBackground,
  withoutImage,
} from "./avatar";
import { captainAvatarTileClass } from "./captain-avatar";
import {
  hasTransparency,
  isPictureFile,
  pictureAccept,
  sharedImageAccept,
  sharedImageProblem,
} from "./image-files";
import {
  type CaptainLibraryImage,
  toLibraryImages,
  usedByLabel,
} from "./library";
import { useCurrentUserId, useOrgId } from "./session";

export type AvatarEditorTab = "capybaras" | "emojis" | "custom";

const tileClass = cx(captainAvatarTileClass, "size-7 rounded-(--radius-sm)");

const swatchClass =
  "size-3.5 rounded-(--radius-inner) border-hairline border-border-2";

const uploadTileClass =
  "grid size-7 place-items-center rounded-(--radius-sm) border-hairline border-dashed border-border-3 text-muted-foreground-1";

const manageButtonClass =
  "absolute -top-0.5 -right-0.5 opacity-0 group-hover/tile:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100";

const sectionLabelClass = "px-1 text-xs text-muted-foreground-3";

function TileImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="size-full object-cover select-none"
    />
  );
}

type CustomPanelProps = {
  orgId: OrgId;
  value: CaptainAvatarValue;
  onChange: (value: CaptainAvatarValue) => void;
  onPick: (file: File) => void;
  onRemove: (image: CaptainLibraryImage) => void;
};

/** Capy's CustomPanel: this Captain's private picture and the shared library. */
function CustomPanel({
  orgId,
  value,
  onChange,
  onPick,
  onRemove,
}: CustomPanelProps) {
  const libraryResult = useAtomValue(captainLibraryAtom(orgId));
  const library = AsyncResult.isSuccess(libraryResult)
    ? toLibraryImages(libraryResult.value)
    : [];
  const upload = useAtomSet(uploadCaptainLibraryImageAtom, { mode: "promise" });
  const userId = useCurrentUserId();
  const pictureInput = useRef<HTMLInputElement>(null);
  const sharedInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const privateImage = hasPrivateImage(value);
  const full = library.length >= captainLibraryLimit;
  const status =
    error ??
    (uploading === null
      ? full
        ? "Library full, remove one to upload"
        : null
      : `Uploading ${uploading}`);

  const pickPicture = (file: File) => {
    if (!isPictureFile(file)) {
      setError("Choose a GIF, JPEG, PNG, or WebP up to 10 MB");
      return;
    }
    setError(null);
    onPick(file);
  };

  const uploadShared = (file: File) => {
    setUploading(file.name);
    const payload = new FormData();
    payload.append("image", file, file.name);
    upload({
      params: { orgId },
      payload,
      reactivityKeys: [captainReactivityKeys.library(orgId)],
    })
      .then((result) => {
        const [image] = toLibraryImages([result]);
        if (image !== undefined)
          onChange({
            ...withoutImage(value),
            image: image.url,
            library: image.id,
          });
      })
      .catch(() => setError("Could not upload this image"))
      .finally(() => setUploading(null));
  };

  const pickShared = (file: File) => {
    const problem = sharedImageProblem(file);
    if (problem !== undefined) {
      setError(problem);
      return;
    }
    setError(null);
    hasTransparency(file)
      .then((transparent) =>
        transparent
          ? uploadShared(file)
          : setError("Shared images need a transparent background"),
      )
      .catch(() => setError("Could not read this image"));
  };

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <input
        ref={pictureInput}
        type="file"
        accept={pictureAccept}
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file !== undefined) pickPicture(file);
        }}
      />
      <input
        ref={sharedInput}
        type="file"
        accept={sharedImageAccept}
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file !== undefined) pickShared(file);
        }}
      />
      <div className="flex flex-col gap-0.5">
        {/* biome-ignore lint/a11y/useSemanticElements: Capy groups these tiles in a div, not a fieldset */}
        <div
          role="group"
          aria-label="Private"
          className="flex flex-col items-start gap-0.5"
        >
          <span className={sectionLabelClass}>Private</span>
          {privateImage && value.image !== undefined ? (
            <span className="group/tile relative flex">
              <Button
                variant="ghost"
                size="icon-shrink"
                className="p-1"
                aria-label="This Captain's picture"
                data-selected
              >
                <span className={tileClass}>
                  <TileImage src={value.image} />
                </span>
              </Button>
              <ResponsiveMenu>
                <ResponsiveMenuTrigger
                  render={
                    <Button
                      variant="soft"
                      size="icon-shrink"
                      aria-label="Manage this Captain's picture"
                      className={manageButtonClass}
                    >
                      <Icon name="dot-grid-1x3-horizontal" className="size-3" />
                    </Button>
                  }
                />
                <ResponsiveMenuContent align="start" className="w-60">
                  <ResponsiveMenuItem
                    onClick={() => pictureInput.current?.click()}
                  >
                    Replace
                  </ResponsiveMenuItem>
                  <ResponsiveMenuItem
                    onClick={() => onChange(withoutImage(value))}
                  >
                    Remove
                  </ResponsiveMenuItem>
                </ResponsiveMenuContent>
              </ResponsiveMenu>
            </span>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-shrink"
                    className="p-1"
                    aria-label="Upload a private picture"
                    onClick={() => pictureInput.current?.click()}
                  >
                    <span className={uploadTileClass}>
                      <Icon name="plus-large" className="size-3" />
                    </span>
                  </Button>
                }
              />
              <TooltipContent side="top">
                <span className="block">
                  Any image, cropped to fill the tile
                </span>
                <span className="block">Only this Captain wears it</span>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: Capy groups these tiles in a div, not a fieldset */}
        <div role="group" aria-label="Shared" className="flex flex-col gap-0.5">
          <span className={sectionLabelClass}>Shared</span>
          <div className="flex flex-wrap">
            {library.map((image) => {
              const tile = (
                <Button
                  variant="ghost"
                  size="icon-shrink"
                  className="p-1"
                  aria-label={image.name}
                  data-selected={value.library === image.id || undefined}
                  onClick={() =>
                    onChange({
                      ...withoutImage(value),
                      image: image.url,
                      library: image.id,
                    })
                  }
                >
                  <span
                    className={tileClass}
                    style={{ background: value.background }}
                  >
                    <TileImage src={image.url} />
                  </span>
                </Button>
              );
              if (image.uploadedBy !== userId)
                return <span key={image.id}>{tile}</span>;
              return (
                <span key={image.id} className="group/tile relative flex">
                  {tile}
                  <ResponsiveMenu>
                    <ResponsiveMenuTrigger
                      render={
                        <Button
                          variant="soft"
                          size="icon-shrink"
                          aria-label={`Manage ${image.name}`}
                          className={manageButtonClass}
                        >
                          <Icon
                            name="dot-grid-1x3-horizontal"
                            className="size-3"
                          />
                        </Button>
                      }
                    />
                    <ResponsiveMenuContent align="start" className="w-60">
                      <ResponsiveMenuLabel>
                        {`Uploaded by ${image.uploadedBy}, ${image.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                      </ResponsiveMenuLabel>
                      <ResponsiveMenuLabel>
                        {usedByLabel(image.usedBy)}
                      </ResponsiveMenuLabel>
                      <ResponsiveMenuItem
                        data-intent="danger"
                        onClick={() => onRemove(image)}
                      >
                        Remove from library
                      </ResponsiveMenuItem>
                    </ResponsiveMenuContent>
                  </ResponsiveMenu>
                </span>
              );
            })}
            {uploading === null ? null : (
              <Button
                variant="ghost"
                size="icon-shrink"
                className="p-1"
                aria-label={`Uploading ${uploading}`}
                disabled
              >
                <span className="size-7" />
              </Button>
            )}
            {full ? null : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-shrink"
                      className="p-1"
                      aria-label="Upload a shared image"
                      disabled={uploading !== null}
                      onClick={() => sharedInput.current?.click()}
                    >
                      <span className={uploadTileClass}>
                        <Icon name="plus-large" className="size-3" />
                      </span>
                    </Button>
                  }
                />
                <TooltipContent side="top">
                  <span className="block">
                    Transparent PNG or WebP, up to 5 MB
                  </span>
                  <span className="block">
                    Every Captain in the organization can wear it
                  </span>
                  <span className="block text-muted-foreground-2 tabular-nums">
                    {library.length} of {captainLibraryLimit}
                  </span>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      {status === null ? null : (
        <span
          role={error === null ? undefined : "alert"}
          className={cx(
            "px-1 text-xs",
            error === null ? "text-muted-foreground-2" : "text-destructive",
          )}
        >
          {status}
        </span>
      )}
    </div>
  );
}

export type AvatarEditorProps = {
  value: CaptainAvatarValue;
  onChange: (value: CaptainAvatarValue) => void;
  initialTab?: AvatarEditorTab;
  onPick: (file: File) => void;
  onRemove: (image: CaptainLibraryImage) => void;
};

/** Capy's AvatarEditor: Capy presets, emoji or custom images, then a background. */
export function AvatarEditor({
  value,
  onChange,
  initialTab,
  onPick,
  onRemove,
}: AvatarEditorProps) {
  const orgId = useOrgId();
  const [tab, setTab] = useState<AvatarEditorTab>(
    initialTab ?? (value.image === undefined ? "capybaras" : "custom"),
  );
  const groups = useEmojiGroups(tab === "emojis");
  const { frequent, remember } = useFrequentEmoji();
  const privateImage = hasPrivateImage(value);
  const custom = !isPaletteBackground(value.background);
  const tabs: ReadonlyArray<[AvatarEditorTab, string]> = [
    ["capybaras", "Capy"],
    ["emojis", "Emojis"],
    ["custom", "Custom"],
  ];
  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        {tabs.map(([id, label]) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            data-selected={tab === id || undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "capybaras" ? (
        <div className="flex shrink-0 items-center justify-between">
          {captainAvatarPresets.map((preset) => (
            <Button
              key={preset}
              variant="ghost"
              size="icon-shrink"
              className="p-1"
              aria-label={preset}
              data-selected={
                (value.image === undefined &&
                  value.kind === "preset" &&
                  value.value === preset) ||
                undefined
              }
              onClick={() =>
                onChange({
                  kind: "preset",
                  value: preset,
                  background: value.background,
                })
              }
            >
              <span
                className={tileClass}
                style={{ background: value.background }}
              >
                <TileImage src={captainPresetSrc(preset)} />
              </span>
            </Button>
          ))}
        </div>
      ) : tab === "emojis" ? (
        <EmojiPicker
          groups={groups}
          frequent={frequent}
          onPick={(emoji) => {
            remember(emoji);
            onChange({
              kind: "emoji",
              value: emoji,
              background: value.background,
            });
          }}
        />
      ) : orgId === undefined ? null : (
        <CustomPanel
          orgId={orgId}
          value={value}
          onChange={onChange}
          onPick={onPick}
          onRemove={onRemove}
        />
      )}
      {/* biome-ignore lint/a11y/useSemanticElements: Capy groups these tiles in a div, not a fieldset */}
      <div
        role="group"
        aria-label="Background"
        aria-disabled={privateImage || undefined}
        className={cx(
          "flex shrink-0 items-center justify-between border-t-hairline border-border-1 pt-2",
          privateImage && "pointer-events-none opacity-40",
        )}
      >
        {captainAvatarBackgrounds.map((color) => (
          <Tooltip key={color.value}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-shrink"
                  className="p-1"
                  aria-label={color.label}
                  data-selected={
                    (!privateImage &&
                      value.background.toLowerCase() ===
                        color.value.toLowerCase()) ||
                    undefined
                  }
                  onClick={() =>
                    onChange({ ...value, background: color.value })
                  }
                >
                  <span
                    aria-hidden
                    className={swatchClass}
                    style={{ background: color.value }}
                  />
                </Button>
              }
            />
            <TooltipContent side="top">{color.label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="flex">
                <ColorPicker
                  label="Background"
                  value={value.background}
                  onValueChange={(background) =>
                    onChange({ ...value, background })
                  }
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-shrink"
                      className="p-1"
                      aria-label="Custom background"
                      data-selected={(!privateImage && custom) || undefined}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          swatchClass,
                          "grid place-items-center text-overlay-fg",
                        )}
                        style={{
                          background: custom
                            ? value.background
                            : captainAvatarCustomSwatch,
                        }}
                      >
                        <Icon name="plus-large" className="size-2" />
                      </span>
                    </Button>
                  }
                />
              </span>
            }
          />
          <TooltipContent side="top">Custom</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
