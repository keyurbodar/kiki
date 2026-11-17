import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { SettingsLoadingCard, SettingsPage } from "@/components/settings-page";
import { themePublicationsAtom } from "@/data/atoms/appearance";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Card } from "@/primitives/card";
import { useResolvedMode } from "../model/appearance-store";
import { type UserTheme, useUserThemes } from "../model/theme-options";
import {
  pageCount,
  publicationStatus,
  publicationsFrom,
  THEMES_PER_PAGE,
  type ThemePublication,
} from "./publication";
import {
  SpecimenFrame,
  specimenFrameClass,
  ThemeSpecimen,
} from "./theme-specimen";

export function useThemePublications() {
  const result = useAtomValue(themePublicationsAtom);
  return publicationsFrom(
    AsyncResult.isSuccess(result) ? result.value : undefined,
  );
}

function ThemeTile({
  theme,
  publication,
}: {
  theme: UserTheme;
  publication: ThemePublication | undefined;
}) {
  const dark = useResolvedMode() === "dark";
  const status = publicationStatus(publication);
  const palette = dark ? theme.dark : theme.light;
  return (
    <Link
      to="/settings/appearance/themes/$themeId"
      params={{ themeId: theme.id }}
      className="group flex min-w-0 flex-col gap-2.5 rounded-(--radius-panel) outline-none focus-visible:outline-ring-inset"
    >
      <SpecimenFrame className={specimenFrameClass(false)}>
        <ThemeSpecimen palette={palette} dark={dark} wallpaper={false} lift />
      </SpecimenFrame>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {theme.name}
        </span>
        <Badge color={status.color} size="sm" className="shrink-0">
          {status.label}
        </Badge>
      </div>
      <span className="text-sm text-muted-foreground-2">{status.note}</span>
    </Link>
  );
}

export function YourThemesPage({
  page,
  onPage,
}: {
  page: number;
  onPage: (page: number) => void;
}) {
  const themes = useUserThemes();
  const publications = useThemePublications();
  const pages = pageCount(themes?.length ?? 0);
  const current = Math.min(Math.max(1, page), pages);
  return (
    <SettingsPage
      title="Your themes"
      description="Themes you made and whether they're in Explore"
      width="wide"
    >
      {themes === undefined ? (
        <SettingsLoadingCard />
      ) : themes.length === 0 ? (
        <Card className="flex flex-col items-start gap-3 p-4">
          <p className="text-sm text-muted-foreground-2">
            Save a custom theme in Appearance to publish it
          </p>
          <Button size="sm" render={<Link to="/settings/appearance" />}>
            Open Appearance
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {themes
              .slice((current - 1) * THEMES_PER_PAGE, current * THEMES_PER_PAGE)
              .map((theme) => (
                <ThemeTile
                  key={theme.id}
                  theme={theme}
                  publication={publications.get(theme.id)}
                />
              ))}
          </div>
          {pages > 1 && (
            <nav
              aria-label="Theme pages"
              className="flex items-center justify-between gap-3"
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={current === 1}
                onClick={() => onPage(current - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground-2 tabular-nums">
                {current} of {pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={current === pages}
                onClick={() => onPage(current + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </SettingsPage>
  );
}
