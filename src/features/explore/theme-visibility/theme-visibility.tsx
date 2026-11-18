import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { toast } from "@/primitives/toaster";
import { useExploreSession } from "./use-explore-session";
import {
  errorMessage,
  setThemeVisibilityAtom,
  themeVisibilityAtom,
  VISIBILITY_ERROR,
  visibilityLabel,
  visibilityToast,
} from "./visibility";

export type VisibilityButtonProps = {
  slug: string;
  hidden: boolean;
  "data-track-owner"?: string;
};

export function VisibilityButton({ slug, hidden }: VisibilityButtonProps) {
  const setVisibility = useAtomSet(setThemeVisibilityAtom, { mode: "promise" });
  const refresh = useAtomRefresh(themeVisibilityAtom(slug));
  const [busy, setBusy] = useState(false);
  const toggle = () => {
    setBusy(true);
    setVisibility({ params: { slug }, payload: { hidden: !hidden } }).then(
      () => {
        setBusy(false);
        refresh();
        toast.success(visibilityToast(hidden));
      },
      (error: unknown) => {
        setBusy(false);
        toast.error(errorMessage(error, VISIBILITY_ERROR));
      },
    );
  };
  return (
    <Button
      data-track-owner="features/explore/theme-visibility.tsx#VisibilityButton:Button[onClick=toggle]"
      variant="ghost"
      size="xs"
      className="-ml-2 w-fit"
      disabled={busy}
      aria-busy={busy}
      onClick={toggle}
    >
      <Icon name={hidden ? "eye-open" : "eye-slash"} />
      {visibilityLabel(hidden)}
    </Button>
  );
}

export type ThemeVisibilityProps = { slug: string; onlyHidden?: boolean };

function SuperadminVisibility({
  slug,
  onlyHidden,
}: Required<ThemeVisibilityProps>) {
  const visibility = Option.getOrUndefined(
    AsyncResult.value(useAtomValue(themeVisibilityAtom(slug))),
  );
  if (visibility === undefined || (onlyHidden && !visibility.hidden))
    return null;
  return (
    <VisibilityButton
      data-track-owner="features/explore/theme-visibility.tsx#SuperadminVisibility:VisibilityButton.1"
      slug={slug}
      hidden={visibility.hidden}
    />
  );
}

export function ThemeVisibility({
  slug,
  onlyHidden = false,
}: ThemeVisibilityProps) {
  const { signedIn, superadmin } = useExploreSession();
  if (!signedIn || !superadmin) return null;
  return <SuperadminVisibility slug={slug} onlyHidden={onlyHidden} />;
}
