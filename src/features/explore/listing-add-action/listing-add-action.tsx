import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { type ExploreCard, ExploreListing } from "@/data/api/schemas/explore";
import { createThemeAtom, userThemeKey } from "@/data/atoms/appearance";
import {
  appearanceActions,
  DEFAULT_BACKGROUND_ADJUSTMENTS,
} from "@/features/settings-appearance/model/appearance-store";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { toast } from "@/primitives/toaster";
import { errorMessage } from "../dialogs/error-message";
import {
  useExploreIndex,
  useOrgId,
  useRecentlyAdded,
  useSignedIn,
} from "../listing-detail/explore-session";
import { CheckmarkGlyph, RotateGlyph } from "../listing-detail/glyphs";
import { useSignInHref } from "../listing-detail/sign-in-link";
import { SkillScopeDialog } from "../skill-scope-dialog";
import { useThemeWallpaper } from "../theme-detail";
import { addState, addTarget } from "./add-state";
import { useRecordAdded } from "./recently-added";
import { themeFromListing } from "./theme-from-listing";

export type ListingAddActionProps = {
  listing: ExploreCard | ExploreListing;
  added?: boolean;
  size?: "xs" | "sm" | "base";
};

export function ListingAddAction({
  listing,
  added,
  size = "xs",
}: ListingAddActionProps) {
  const card = listing instanceof ExploreListing ? listing.card : listing;
  const navigate = useNavigate();
  const signInHref = useSignInHref();
  const signedIn = useSignedIn();
  const orgId = useOrgId();
  const recent = useRecentlyAdded(orgId);
  const index = useExploreIndex();
  const createTheme = useAtomSet(createThemeAtom, { mode: "promise" });
  const recordAdded = useRecordAdded(orgId);
  const [dialog, setDialog] = useState<ExploreCard["kind"] | null>(null);
  const wallpaper = useThemeWallpaper(
    card.kind === "theme" ? card.slug : null,
    card.versionId,
  );
  const { state, isAdded, hasUpdate } = addState({
    card,
    recent,
    added,
    indexAdded: index?.added,
    indexUpdates: index?.updates,
  });
  const iconSize = size === "base" ? "base" : size;

  const open = () => {
    const target = addTarget(card, signedIn, isAdded, hasUpdate);
    switch (target.kind) {
      case "sign-in":
        return void navigate({ href: signInHref });
      case "href":
        return void navigate({ href: target.href });
      case "settings-mcp":
        return void navigate({ to: "/settings/mcp" });
      case "marketplace":
        return void navigate({
          to: "/settings/mcp/marketplace/$name",
          params: { name: target.name },
        });
      case "appearance":
        return void navigate({ to: "/settings/appearance" });
      case "dialog":
        if (target.dialog === "theme") return void addTheme();
        return setDialog(target.dialog);
    }
  };

  // Adding a theme makes it a user theme, the way Capy turns a listing into one
  // of yours; the button turning into "Added" is the receipt.
  const addTheme = () => {
    const theme = card.theme as Parameters<typeof themeFromListing>[0] | null;
    const next = theme === null ? undefined : themeFromListing(theme);
    if (next === undefined) {
      toast.error(`Could not add ${card.displayName}`);
      return;
    }
    // Capy downloads a listing's wallpaper and puts it behind the dashboard as
    // part of adding it, so the theme arrives the way its preview looks.
    if (wallpaper !== undefined) {
      appearanceActions.updatePreferences({
        background: {
          name: card.displayName,
          url: wallpaper,
          appearance: DEFAULT_BACKGROUND_ADJUSTMENTS,
        },
      });
    }
    createTheme({
      payload: {
        name: card.displayName.slice(0, 40),
        light: next.light,
        dark: next.dark,
        background: null,
        effect: next.effect,
        listingVersionId: card.versionId,
      },
      reactivityKeys: [userThemeKey()],
    }).then(
      (created) => {
        // Capy picks the theme as part of adding it, and picks it through the
        // same writer the appearance page uses — a second writer is how the two
        // surfaces drift apart.
        const saved = created as { id?: unknown; name?: unknown };
        appearanceActions.selectColorTheme({
          kind: "custom",
          id: typeof saved.id === "string" ? saved.id : card.slug,
          name:
            typeof saved.name === "string"
              ? saved.name
              : card.displayName.slice(0, 40),
          light: next.light,
          dark: next.dark,
        });
        appearanceActions.updatePreferences({ effect: next.effect });
        recordAdded([
          { kind: "theme", slug: card.slug, versionId: card.versionId },
        ]);
      },
      (error: unknown) =>
        toast.error(errorMessage(error, `Could not add ${card.displayName}`)),
    );
  };

  return (
    <>
      {state === "update" ? (
        <Button size={size} onClick={open}>
          <RotateGlyph size="sm" />
          Update
        </Button>
      ) : state === "added" ? (
        <Button variant="ghost" size={size} onClick={open}>
          <CheckmarkGlyph size={iconSize} />
          Added
        </Button>
      ) : state === "add" ? (
        <Button size={size} onClick={open}>
          {card.kind === "theme" && <Icon name="color-palette" size="sm" />}
          Add
        </Button>
      ) : (
        <Button variant="ghost" size={size} onClick={open}>
          Settings
          <Icon name="chevron-right" size={iconSize} />
        </Button>
      )}
      {dialog === "skill" && (
        <SkillScopeDialog
          slug={card.slug}
          name={card.displayName}
          replacing={hasUpdate}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
