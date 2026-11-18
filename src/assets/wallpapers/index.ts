/**
 * Capy's Explore wallpapers, one per theme that ships one.
 *
 * The files are Capy's own, downloaded from its public Explore API
 * (`/explore/themes/:slug/wallpaper`) and kept byte-identical: every
 * `digest` below is the sha256 of the file, which is the value Capy's
 * listing serves for that wallpaper.
 */

import absolutelyCustomT7w8m5 from "./absolutely-custom-t7w8m5.jpeg";
import akane from "./akane.webp";
import bananaTvr8gc from "./banana-tvr8gc.jpeg";
import capyCustomZfs3va from "./capy-custom-zfs3va.jpeg";
import capyUnit01Ke7emg from "./capy-unit-01-ke7emg.png";
import classic1pdtkp from "./classic-1pdtkp.jpeg";
import evernightRain from "./evernight-rain.webp";
import fuji from "./fuji.webp";
import holyNight from "./holy-night.webp";
import kiki from "./kiki.webp";
import lavenderNightsPg0pdq from "./lavender-nights-pg0pdq.jpeg";
import ninetailsXb3av4 from "./ninetails-xb3av4.png";
import redWgnj65 from "./red-wgnj65.jpeg";
import tPkxg2x from "./t-pkxg2x.jpeg";

export type WallpaperAsset = {
  readonly url: string;
  /** The name Capy stores for the image. */
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
  /** sha256 of the file, as the listing declares it. */
  readonly digest: string;
};

/** Keyed by the listing slug, the way Capy keys a theme's wallpaper. */
export const WALLPAPERS: Readonly<Record<string, WallpaperAsset>> = {
  akane: {
    url: akane,
    name: "Akane Kurokawa",
    contentType: "image/webp",
    size: 77876,
    digest: "c5908841dec520305956dc9863d8b1aa0f0022642de380f29717ba4733e59293",
  },
  "evernight-rain": {
    url: evernightRain,
    name: "Evernight by qianqianjie",
    contentType: "image/webp",
    size: 380046,
    digest: "7908464e06d235d7ad1d95964f513351be321c8996cfac5fff9570a05d7c746b",
  },
  fuji: {
    url: fuji,
    name: "Mount Fuji",
    contentType: "image/webp",
    size: 191608,
    digest: "ca91d871ca36b5d40e58e023a1e3e9dc3ed18311929282d1ddb135ca061382f2",
  },
  "holy-night": {
    url: holyNight,
    name: "Witch on the Holy Night",
    contentType: "image/webp",
    size: 365606,
    digest: "8c0cd7184fb8d439af90c1b71192a87b1e08ea28287db8f13dc5c02de5329a87",
  },
  kiki: {
    url: kiki,
    name: "Kiki's Delivery Service",
    contentType: "image/webp",
    size: 231622,
    digest: "1879ad088a2342f51d832fcc61e22a805dfe92d8a6f18450c091d8105ac90320",
  },
  "classic-1pdtkp": {
    url: classic1pdtkp,
    name: "889038782731741140.jpg",
    contentType: "image/jpeg",
    size: 434090,
    digest: "d468236aeedb9e8814155bfbc6687de6476a62f67f4025e11a2ca330966f3dc4",
  },
  "capy-unit-01-ke7emg": {
    url: capyUnit01Ke7emg,
    name: "nge.png",
    contentType: "image/png",
    size: 72326,
    digest: "d5b86160efd1dd53c9ca389762ecb7268b006d9824a95c9df8938708803f9837",
  },
  "capy-custom-zfs3va": {
    url: capyCustomZfs3va,
    name: "SpaceX Starship HD Wallpaper.jpeg",
    contentType: "image/jpeg",
    size: 1975819,
    digest: "7884e15f00c9be66c229fdbeefdcac580a85c372243a15ea4817bc4f73408f20",
  },
  "ninetails-xb3av4": {
    url: ninetailsXb3av4,
    name: "Vertical_layout_plan_for_a_169_app_theme_banner_-17932706335",
    contentType: "image/png",
    size: 1761747,
    digest: "b46fb3c6b9601de88c741c558fa24eb9cb21f9518542e050ac0f94d9bdd84518",
  },
  "absolutely-custom-t7w8m5": {
    url: absolutelyCustomT7w8m5,
    name: "图像-(286).jpeg",
    contentType: "image/jpeg",
    size: 999769,
    digest: "88c9dd9f511a0ef0ec1d1a8789966940aff52e0d1ba07c04eeec19d41cdf5452",
  },
  "t-pkxg2x": {
    url: tPkxg2x,
    name: "1D9CE39D-CDA7-4B35-95B4-601B09586A0B.jpeg",
    contentType: "image/jpeg",
    size: 44613,
    digest: "bd032312598bd42aa3b5eaf37e2480ab274ecb2156f225f4eb75b66eb628cda3",
  },
  "red-wgnj65": {
    url: redWgnj65,
    name: "zenitsu-agatsuma-5120x2880-26520.jpg",
    contentType: "image/jpeg",
    size: 1361413,
    digest: "b0e716f8ca45f1913681c6a14fbeb1d040bc323648bf2e308b416df23f190a17",
  },
  "lavender-nights-pg0pdq": {
    url: lavenderNightsPg0pdq,
    name: "980658.jpg",
    contentType: "image/jpeg",
    size: 1148968,
    digest: "cbbdfdf4145ab0951d2de99bbcc8ce0538e181d147fa203cd43dd672df3dc184",
  },
  "banana-tvr8gc": {
    url: bananaTvr8gc,
    name: "a45244455753ae84e441ed4cf21c3d78.jpg",
    contentType: "image/jpeg",
    size: 125681,
    digest: "80ff8684756f421ded1a70db6dd8da738879274f0454d68dd123113ccbfd2327",
  },
};

/**
 * Three filler listings in the fixtures describe the Zenitsu wallpaper without
 * existing in Capy's catalogue, so they resolve to the image they name.
 */
const FILLER_SLUGS = new Set(["ember-fade", "paper-lantern", "cold-porcelain"]);

export const wallpaperAsset = (slug: string): WallpaperAsset | undefined =>
  WALLPAPERS[slug] ??
  (FILLER_SLUGS.has(slug) ? WALLPAPERS["red-wgnj65"] : undefined);
