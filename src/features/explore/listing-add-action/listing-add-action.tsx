import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { type ExploreCard, ExploreListing } from "@/data/api/schemas/explore";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  useExploreIndex,
  useOrgId,
  useRecentlyAdded,
  useSignedIn,
} from "../listing-detail/explore-session";
import { CheckmarkGlyph, RotateGlyph } from "../listing-detail/glyphs";
import { useSignInHref } from "../listing-detail/sign-in-link";
import { SkillScopeDialog } from "../skill-scope-dialog";
import { addState, addTarget } from "./add-state";

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
  const [dialog, setDialog] = useState<ExploreCard["kind"] | null>(null);
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
        return setDialog(target.dialog);
    }
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
