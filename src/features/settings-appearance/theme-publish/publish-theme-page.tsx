import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { toast } from "sonner";
import {
  SettingsLoadingCard,
  SettingsPage,
  SettingsSection,
} from "@/components/settings-page";
import {
  publishThemeAtom,
  unpublishThemeAtom,
  userThemeKey,
  wallpapersAtom,
} from "@/data/atoms/appearance";
import { Alert, AlertDescription, AlertTitle } from "@/primitives/alert";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { Icon } from "@/primitives/icon";
import { Input } from "@/primitives/input";
import { SettingsRow } from "@/primitives/settings-row";
import { CheckIcon, ChevronRightIcon } from "../icons";
import {
  BACKGROUND_EFFECT_LABELS,
  useAppearance,
} from "../model/appearance-store";
import { type UserTheme, useUserThemes } from "../model/theme-options";
import { SelectField } from "../select-field";
import {
  listedVersionId,
  publicationStatus,
  type ReviewStep,
  reviewSteps,
  submittedDate,
  type ThemePublication,
} from "./publication";
import {
  SpecimenFrame,
  specimenFrameClass,
  ThemeSpecimen,
} from "./theme-specimen";
import { useThemePublications } from "./your-themes-page";

const NONE = "none";
const CURRENT = "current";

interface Wallpaper {
  readonly id: string;
  readonly name: string;
  readonly url?: string;
  readonly thumbnailUrl?: string;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message !== "" ? error.message : fallback;

function ReviewTimeline({ steps }: { steps: ReadonlyArray<ReviewStep> }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
          {index < steps.length - 1 && (
            <span className="absolute top-6 bottom-0 left-2.25 w-px bg-border-2" />
          )}
          <span
            className={
              step.state === "done"
                ? "relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[length:--spacing(0.125)] border-transparent bg-foreground text-background"
                : step.state === "failed"
                  ? "relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[length:--spacing(0.125)] border-transparent bg-destructive text-destructive-text"
                  : "relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[length:--spacing(0.125)] border-foreground bg-card"
            }
          >
            {step.state === "done" ? (
              <CheckIcon className="size-3" />
            ) : step.state === "current" ? (
              <span className="size-1.5 rounded-full bg-foreground" />
            ) : (
              <span className="h-0.5 w-2 rounded-full bg-destructive-text" />
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm text-foreground">{step.label}</span>
            <span className="text-sm text-muted-foreground-2">{step.note}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PublishPreview({
  theme,
  image,
}: {
  theme: UserTheme;
  image: string | undefined;
}) {
  return (
    <>
      {(["light", "dark"] as const).map((side) => (
        <SpecimenFrame
          key={side}
          image={image}
          className={specimenFrameClass(image !== undefined)}
        >
          <ThemeSpecimen
            palette={theme[side]}
            dark={side === "dark"}
            wallpaper={image !== undefined}
          />
        </SpecimenFrame>
      ))}
    </>
  );
}

function versionBadge(
  version: ThemePublication["versions"][number],
  listedId: string | undefined,
  listed: boolean,
) {
  if (version.removed)
    return (
      <Badge color="danger" size="sm">
        Not approved
      </Badge>
    );
  if (version.id === listedId && listed)
    return (
      <Badge color="neutral" size="sm">
        In Explore
      </Badge>
    );
  if (version.reviewed) return null;
  return (
    <Badge color="warning" size="sm">
      In review
    </Badge>
  );
}

function PublishTheme({
  theme,
  publication,
}: {
  theme: UserTheme;
  publication: ThemePublication | undefined;
}) {
  const navigate = useNavigate();
  const { preferences, syncMode, diffColors } = useAppearance();
  const wallpapersResult = useAtomValue(wallpapersAtom);
  const wallpapers = AsyncResult.isSuccess(wallpapersResult)
    ? (wallpapersResult.value as ReadonlyArray<Wallpaper>)
    : [];
  const publish = useAtomSet(publishThemeAtom, { mode: "promise" });
  const unpublish = useAtomSet(unpublishThemeAtom, { mode: "promise" });
  const [description, setDescription] = useState<string>();
  const [chosen, setChosen] = useState<string>();
  const [pending, setPending] = useState<"publish" | "unpublish" | null>(null);

  const background = preferences.background;
  const wallpaper = chosen ?? (background === null ? NONE : CURRENT);
  const status = publicationStatus(publication);
  const live =
    publication !== undefined && !publication.withdrawn && !publication.removed;
  const listed = publication?.listed === true;
  const listedId = listedVersionId(publication);
  const synced = syncMode === "synced";
  const reactivityKeys = [userThemeKey()];
  const busy = pending !== null;

  const submit = () => {
    if (!synced || busy) return;
    setPending("publish");
    const note = (description ?? "").trim();
    publish({
      params: { themeId: theme.id },
      payload: {
        description: note === "" ? undefined : note,
        wallpaperId:
          wallpaper === NONE || wallpaper === CURRENT ? undefined : wallpaper,
        background: wallpaper === CURRENT ? "current" : undefined,
      },
      reactivityKeys,
    }).then(
      (result) => {
        setPending(null);
        const versions = (
          result as { versions?: ReadonlyArray<{ version: number }> }
        ).versions;
        toast.success(
          `Submitted version ${versions?.[0]?.version ?? ""} for review`,
        );
      },
      (error: unknown) => {
        setPending(null);
        toast.error(errorMessage(error, "Could not publish the theme"));
      },
    );
  };

  const withdraw = () => {
    if (busy) return;
    setPending("unpublish");
    unpublish({ params: { themeId: theme.id }, reactivityKeys }).then(
      () => {
        setPending(null);
        toast.success("Unpublished from Explore");
      },
      (error: unknown) => {
        setPending(null);
        toast.error(errorMessage(error, "Could not unpublish the theme"));
      },
    );
  };

  const wallpaperItems: Record<string, string> = {
    ...(background === null
      ? {}
      : { [CURRENT]: `Current background, ${background.name}` }),
    [NONE]: "None",
    ...Object.fromEntries(wallpapers.map((item) => [item.id, item.name])),
  };
  const selectedWallpaper = wallpapers.find((item) => item.id === wallpaper);
  const previewImage =
    wallpaper === CURRENT
      ? background?.url
      : (selectedWallpaper?.thumbnailUrl ?? selectedWallpaper?.url);
  const codeFontSize = preferences.codeFontSize;

  return (
    <SettingsPage title={theme.name} description={status.note} width="wide">
      <div className="flex flex-col gap-10 lg:flex-row lg:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-10">
          {!synced && (
            <Alert>
              <Icon name="circle-info" size="sm" />
              <AlertTitle>Publishing needs synced appearance</AlertTitle>
              <AlertDescription>
                Switch Appearance sync to Synced to publish this theme
              </AlertDescription>
            </Alert>
          )}
          {publication?.removed !== true && (
            <>
              <SettingsSection title="Listing">
                <Card rows>
                  <div className="flex flex-col gap-2 p-4">
                    <label data-slot="label" htmlFor="theme-description">
                      Description
                    </label>
                    <Input
                      id="theme-description"
                      size="sm"
                      value={description ?? ""}
                      maxLength={1000}
                      placeholder="Optional, one line"
                      disabled={busy}
                      onChange={(event) =>
                        setDescription(event.currentTarget.value)
                      }
                    />
                  </div>
                  <SettingsRow
                    label="Wallpaper"
                    description={
                      wallpaper === CURRENT
                        ? "The original image becomes public too, including areas outside the crop"
                        : undefined
                    }
                  >
                    <SelectField
                      label="Wallpaper"
                      value={wallpaper}
                      items={wallpaperItems}
                      disabled={busy}
                      onChange={setChosen}
                    />
                  </SettingsRow>
                </Card>
              </SettingsSection>
              <SettingsSection
                title="Included"
                description="Taken from your appearance settings when you publish"
              >
                <Card rows>
                  <SettingsRow label="Colors" description="Light and dark" />
                  <SettingsRow
                    label="Background effect"
                    description={BACKGROUND_EFFECT_LABELS[preferences.effect]}
                  />
                  <SettingsRow
                    label="Diffs"
                    description={`${preferences.diffStyle === "split" ? "Split" : "Unified"}, ${diffColors === "blue-orange" ? "blue and orange" : "red and green"}`}
                  />
                  <SettingsRow
                    label="Code"
                    description={`${codeFontSize === "default" ? "Default size" : `${codeFontSize}px`}, wrapped`}
                  />
                </Card>
              </SettingsSection>
            </>
          )}
          {publication !== undefined && !publication.withdrawn && (
            <SettingsSection title="Review">
              <Card className="p-4">
                <ReviewTimeline steps={reviewSteps(publication)} />
              </Card>
            </SettingsSection>
          )}
          {publication !== undefined && (
            <SettingsSection title="Versions">
              <Card rows>
                {publication.versions.map((version) => (
                  <SettingsRow
                    key={version.id}
                    label={`Version ${version.version}`}
                    description={`Submitted ${submittedDate.format(new Date(version.createdAt))}`}
                  >
                    {versionBadge(version, listedId, listed)}
                  </SettingsRow>
                ))}
              </Card>
            </SettingsSection>
          )}
          {live && (
            <Alert>
              <Icon name="circle-info" size="sm" />
              <AlertTitle>Submitting again adds a new version</AlertTitle>
              <AlertDescription>
                Capy approves it before it replaces the one in Explore, and
                people who added an earlier version keep their copy
              </AlertDescription>
            </Alert>
          )}
        </div>
        <aside className="flex flex-col gap-3 lg:w-80 lg:shrink-0">
          <span className="text-sm text-muted-foreground-2">Preview</span>
          <PublishPreview theme={theme} image={previewImage} />
          {publication?.removed !== true && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button
                intent="accent"
                size="base"
                disabled={!synced || busy}
                aria-busy={pending === "publish"}
                onClick={submit}
              >
                {live ? "Submit new version" : "Submit to Explore"}
              </Button>
              {live &&
                (listed || publication.versions[0]?.removed !== true) && (
                  <Button
                    variant="ghost"
                    size="base"
                    disabled={busy}
                    aria-busy={pending === "unpublish"}
                    onClick={withdraw}
                  >
                    {listed ? "Unpublish" : "Withdraw from review"}
                  </Button>
                )}
            </div>
          )}
          {listed && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 w-fit"
              onClick={() =>
                void navigate({
                  to: "/explore/$kind/$slug",
                  params: { kind: "themes", slug: publication.slug },
                })
              }
            >
              View in Explore
              <ChevronRightIcon className="size-(--icon-sm)" />
            </Button>
          )}
        </aside>
      </div>
    </SettingsPage>
  );
}

export function PublishThemePage({ themeId }: { themeId: string }) {
  const themes = useUserThemes();
  const publications = useThemePublications();
  if (themes === undefined)
    return (
      <SettingsPage title="Theme" width="wide">
        <SettingsLoadingCard />
      </SettingsPage>
    );
  const theme = themes.find((item) => item.id === themeId);
  if (theme === undefined)
    return (
      <SettingsPage
        title="Theme"
        description="This theme isn't in your library"
      >
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          render={<Link to="/settings/appearance/themes" />}
        >
          Back to your themes
        </Button>
      </SettingsPage>
    );
  return (
    <PublishTheme theme={theme} publication={publications.get(theme.id)} />
  );
}
