import { afterEach, describe, expect, it } from "vitest";
import {
  autoSpeed,
  formatMediaTime,
  formatSpeed,
  isOwnKey,
  parseSpeed,
  parseVolume,
  posterSrc,
  resetVideoPreferences,
  stepSpeed,
  VIDEO_SPEED_KEY,
  VIDEO_VOLUME_KEY,
  videoKeyAction,
  volumeFromSlider,
} from "./video-player-state";

afterEach(() => {
  localStorage.clear();
  resetVideoPreferences();
});

describe("video player state", () => {
  it("formats clock and speed like Capy", () => {
    expect(formatMediaTime(0)).toBe("0:00");
    expect(formatMediaTime(65_400)).toBe("1:05");
    expect(formatMediaTime(-5)).toBe("0:00");
    expect(formatSpeed(1.5)).toBe("1.5×");
    expect(posterSrc("/a.mp4")).toBe("/a.mp4#t=0.001");
  });

  it("picks auto speed by duration", () => {
    expect(autoSpeed(undefined)).toBe(1);
    expect(autoSpeed(30)).toBe(1);
    expect(autoSpeed(31)).toBe(2);
    expect(autoSpeed(300)).toBe(4);
    expect(autoSpeed(301)).toBe(8);
  });

  it("steps speed within the list", () => {
    expect(stepSpeed(1, 1)).toBe(1.5);
    expect(stepSpeed(8, 1)).toBe(8);
    expect(stepSpeed(0.25, -1)).toBe(0.25);
  });

  it("mutes at zero and keeps the last level", () => {
    expect(volumeFromSlider(0, 0.6)).toEqual({ level: 0.6, muted: true });
    expect(volumeFromSlider(1.4, 0.6)).toEqual({ level: 1, muted: false });
    expect(volumeFromSlider(0.333, 1)).toEqual({ level: 0.33, muted: false });
  });

  it("maps keys to actions", () => {
    const ctx = { audio: true, duration: 100 };
    expect(videoKeyAction(" ", ctx)).toEqual({ type: "toggle" });
    expect(videoKeyAction("K", ctx)).toEqual({ type: "toggle" });
    expect(videoKeyAction("ArrowLeft", ctx)).toEqual({
      type: "seekBy",
      seconds: -5,
    });
    expect(videoKeyAction("l", ctx)).toEqual({ type: "seekBy", seconds: 10 });
    expect(videoKeyAction("]", ctx)).toEqual({ type: "speed", delta: 1 });
    expect(videoKeyAction("3", ctx)).toEqual({ type: "seekTo", fraction: 0.3 });
    expect(videoKeyAction("m", ctx)).toEqual({ type: "mute" });
    expect(
      videoKeyAction("m", { audio: false, duration: 100 }),
    ).toBeUndefined();
    expect(
      videoKeyAction("ArrowUp", { audio: false, duration: 1 }),
    ).toBeUndefined();
    expect(
      videoKeyAction("3", { audio: true, duration: undefined }),
    ).toBeUndefined();
    expect(videoKeyAction("x", ctx)).toBeUndefined();
  });

  it("leaves space on buttons and arrows on menus to them", () => {
    const button = document.createElement("button");
    expect(isOwnKey(button, " ")).toBe(true);
    expect(isOwnKey(button, "k")).toBe(false);
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    expect(isOwnKey(menu, "ArrowDown")).toBe(true);
    expect(isOwnKey(document.createElement("video"), " ")).toBe(false);
  });

  it("validates stored preferences", () => {
    expect(parseSpeed("auto")).toBe("auto");
    expect(parseSpeed(2)).toBe(2);
    expect(parseSpeed(3)).toBeUndefined();
    expect(parseVolume({ level: 0.5, muted: false })).toEqual({
      level: 0.5,
      muted: false,
    });
    expect(parseVolume({ level: 2, muted: false })).toBeUndefined();
    expect(parseVolume(null)).toBeUndefined();
    expect(VIDEO_SPEED_KEY).toBe("capy-web:video-speed");
    expect(VIDEO_VOLUME_KEY).toBe("capy-web:video-volume");
  });
});
