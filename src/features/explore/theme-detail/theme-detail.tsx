import type { ReactNode } from "react";
import { Icon } from "@/primitives/icon";
import {
  ScrollArea,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@/primitives/scroll-area";
import { ThemeVisibility, useExploreSession } from "../theme-visibility";
import { cx } from "./class-names";
import {
  lightDarkCaption,
  type ThemeFact,
  themeFacts,
  trimDescription,
} from "./format";
import { SignInButton } from "./sign-in-button";
import {
  ThemeSpecimen,
  ThemeStage,
  themeStageClassName,
  useThemeWallpaper,
  WallpaperFrame,
} from "./theme-specimen";
import type {
  ExploreCrumb,
  ExploreTheme,
  ThemeDetailSlots,
  ThemeListing,
} from "./types";
import { useDarkMode } from "./use-dark-mode";

type ThemePreviewProps = { listing: ThemeListing; theme: ExploreTheme };

function ThemeHero({ listing, theme }: ThemePreviewProps) {
  const dark = useDarkMode();
  const image = useThemeWallpaper(listing.card.slug, listing.card.versionId);
  const wallpaper = theme.wallpaper !== undefined && image !== undefined;
  return (
    <WallpaperFrame
      image={wallpaper ? image : undefined}
      background={theme[dark ? "dark" : "light"]["--bg"]}
      className={cx(
        themeStageClassName(wallpaper),
        "rounded-none border-0 border-b-(length:--border-width-hairline) sm:aspect-[2/1]",
      )}
    >
      <ThemeStage
        wallpaper={wallpaper}
        palette={dark ? theme.dark : theme.light}
        dark={dark}
      />
    </WallpaperFrame>
  );
}

function ThemeModePreview({
  listing,
  theme,
  mode,
}: ThemePreviewProps & { mode: "light" | "dark" }) {
  const image = useThemeWallpaper(listing.card.slug, listing.card.versionId);
  return (
    <WallpaperFrame
      image={image}
      background={theme[mode]["--bg"]}
      className="flex items-end justify-center px-[6%] pt-[6%]"
    >
      <ThemeSpecimen
        palette={theme[mode]}
        dark={mode === "dark"}
        className="rounded-b-none border-b-0 shadow-overlay"
      />
    </WallpaperFrame>
  );
}

function Fact([label, value]: ThemeFact) {
  return (
    <div key={label} className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm text-muted-foreground-2">{label}</dt>
      <dd className="text-sm break-words text-foreground">{value}</dd>
    </div>
  );
}

const MODES = ["light", "dark"] as const;

export type ThemeDetailProps = ThemeDetailSlots & {
  listing: ThemeListing;
  theme: ExploreTheme;
  crumbs: ReadonlyArray<ExploreCrumb>;
  admin?: ReactNode;
};

export function ThemeDetail({
  listing,
  theme,
  admin,
  header,
  addAction,
  signInToAdd,
  report,
}: ThemeDetailProps) {
  const { card } = listing;
  const { signedIn } = useExploreSession();
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      {header}
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport className="size-full overscroll-contain">
          <div className="mx-auto flex w-full max-w-229 flex-col gap-10 px-6 pt-10 pb-18 lg:px-0">
            <section className="overflow-hidden rounded-(--radius-panel) border-(length:--border-width-hairline) border-border-1 bg-card shadow-card">
              <ThemeHero listing={listing} theme={theme} />
              <div className="flex flex-col gap-1 p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h1 className="min-w-32 flex-1 text-xl font-medium text-foreground">
                    {card.displayName}
                  </h1>
                  <div className="flex shrink-0 items-center gap-2">
                    {signedIn || card.builtIn !== null
                      ? addAction
                      : (signInToAdd ?? (
                          <SignInButton
                            data-track-owner="features/explore/theme-detail.tsx#ThemeDetail:SignInLink[Sign in to add]"
                            size="base"
                          >
                            <Icon
                              name="plus-large"
                              className="size-(--icon-sm)"
                            />
                            Sign in to add
                          </SignInButton>
                        ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground-1">
                  {trimDescription(card.description)}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t-(length:--border-width-hairline) border-border-1 p-4 sm:grid-cols-5">
                {themeFacts(listing, theme).map(Fact)}
              </dl>
            </section>
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-medium text-foreground">
                  Light and dark
                </h2>
                <p className="text-sm text-muted-foreground-2">
                  {lightDarkCaption(theme)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {MODES.map((mode) => (
                  <figure key={mode} className="flex flex-col gap-2">
                    <ThemeModePreview
                      listing={listing}
                      theme={theme}
                      mode={mode}
                    />
                    <figcaption className="flex items-center gap-1.5 text-sm text-muted-foreground-2 [&_svg]:size-(--icon-sm)">
                      <Icon name={mode === "light" ? "sun" : "moon"} />
                      {mode === "light" ? "Light" : "Dark"}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
            <div className="flex flex-col gap-1">
              {report}
              {card.source === "user" && <ThemeVisibility slug={card.slug} />}
            </div>
            {card.source !== "user" && admin}
          </div>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar>
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
      </ScrollArea>
    </div>
  );
}
