import { type ExploreCard, listingKey } from "@/data/api/schemas/explore";
import { unversionedKey, versionedKey } from "./recently-added";

export type AddState = "update" | "added" | "add" | "settings";

export type AddStateInput = {
  card: ExploreCard;
  recent: ReadonlyArray<string>;
  added: boolean | undefined;
  indexAdded: ReadonlyArray<string> | undefined;
  indexUpdates: ReadonlyArray<string> | undefined;
};

export const addState = ({
  card,
  recent,
  added,
  indexAdded,
  indexUpdates,
}: AddStateInput) => {
  const key = listingKey(card);
  const justAdded = recent.includes(versionedKey(card));
  const isAdded =
    recent.some((entry) => unversionedKey(entry) === key) ||
    (added ?? indexAdded?.includes(key) === true);
  const hasUpdate =
    isAdded &&
    !justAdded &&
    card.kind !== "plugin" &&
    indexUpdates?.includes(key) === true;
  const state: AddState = hasUpdate
    ? "update"
    : isAdded
      ? "added"
      : card.builtIn === null
        ? "add"
        : "settings";
  return { state, isAdded, hasUpdate };
};

export type AddTarget =
  | { kind: "sign-in" }
  | { kind: "href"; href: string }
  | { kind: "settings-mcp" }
  | { kind: "marketplace"; name: string }
  | { kind: "appearance" }
  | { kind: "dialog"; dialog: ExploreCard["kind"] };

export const addTarget = (
  card: ExploreCard,
  signedIn: boolean,
  isAdded: boolean,
  hasUpdate: boolean,
): AddTarget => {
  if (!signedIn) return { kind: "sign-in" };
  if (card.builtIn !== null)
    return { kind: "href", href: card.builtIn.settingsPath };
  if (card.kind === "plugin")
    return isAdded
      ? { kind: "settings-mcp" }
      : { kind: "marketplace", name: card.slug };
  if (card.kind === "theme" && isAdded && !hasUpdate)
    return { kind: "appearance" };
  return { kind: "dialog", dialog: card.kind };
};
