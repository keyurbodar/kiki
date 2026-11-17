import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

export const themeVisibilityAtom = Atom.family((slug: string) =>
  ApiClient.query("explore", "themeVisibility", {
    params: { slug },
    timeToLive: "1 minute",
  }),
);

export const setThemeVisibilityAtom = ApiClient.mutation(
  "explore",
  "setThemeVisibility",
);

export const visibilityLabel = (hidden: boolean) =>
  hidden ? "Show in Explore" : "Hide from Explore";

export const visibilityToast = (hidden: boolean) =>
  hidden ? "Shown in Explore again" : "Hidden from Explore";

export const VISIBILITY_ERROR = "Could not change the theme's visibility";

export const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "message" in error) {
    const { message } = error as { message: unknown };
    if (typeof message === "string" && message !== "") return message;
  }
  return fallback;
};
