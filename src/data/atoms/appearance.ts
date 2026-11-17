import { ApiClient } from "../client/ApiClient.ts";
import { sampleUser } from "../mocks/users/fixtures.ts";
import { queryTimeToLive } from "./conventions.ts";

/** Capy keys every theme query and mutation on `user_theme:<userId>`. */
export const userThemeKey = (userId: string = sampleUser.id) =>
  `user_theme:${userId}`;

export const wallpapersKey = (userId: string = sampleUser.id) =>
  `wallpapers:${userId}`;

export const themesAtom = ApiClient.query("themes", "list", {
  reactivityKeys: [userThemeKey()],
  timeToLive: queryTimeToLive,
});

export const themePublicationsAtom = ApiClient.query("themes", "publications", {
  reactivityKeys: [userThemeKey()],
  timeToLive: queryTimeToLive,
});

export const wallpapersAtom = ApiClient.query("wallpapers", "list", {
  reactivityKeys: [wallpapersKey()],
  timeToLive: queryTimeToLive,
});

export const createThemeAtom = ApiClient.mutation("themes", "create");
export const updateThemeAtom = ApiClient.mutation("themes", "update");
export const removeThemeAtom = ApiClient.mutation("themes", "remove");
export const publishThemeAtom = ApiClient.mutation("themes", "publish");
export const unpublishThemeAtom = ApiClient.mutation("themes", "unpublish");
export const uploadWallpaperAtom = ApiClient.mutation("wallpapers", "upload");
export const removeWallpaperAtom = ApiClient.mutation("wallpapers", "remove");
