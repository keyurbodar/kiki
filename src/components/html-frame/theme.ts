import { useSyncExternalStore } from "react";
import { fetchBlob } from "@/lib/fetch-blob";
import interFontUrl from "@/tokens/fonts/InterVariable.woff2?url";

export const ARTIFACT_TOKENS = [
  "--bg",
  "--panel",
  "--card",
  "--popover",
  "--popover-hover",
  "--input",
  "--button",
  "--button-hover",
  "--secondary",
  "--secondary-hover",
  "--section",
  "--card-hover",
  "--muted",
  "--muted-foreground-1",
  "--muted-foreground-2",
  "--muted-foreground-3",
  "--icon-muted",
  "--fg",
  "--text",
  "--border-1",
  "--border-2",
  "--border-3",
  "--primary",
  "--primary-ink",
  "--primary-text",
  "--destructive",
  "--success",
  "--warning-fg",
  "--info",
];

const subscribeClass = (listener: () => void) => {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
};

export const useDarkMode = () =>
  useSyncExternalStore(
    subscribeClass,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );

const subscribeTokens = (listener: () => void) => {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true });
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  return () => observer.disconnect();
};

const readTokens = () => {
  const style = getComputedStyle(document.documentElement);
  return JSON.stringify(
    Object.fromEntries(
      ARTIFACT_TOKENS.flatMap((name) => {
        const value = style.getPropertyValue(name).trim();
        return value === "" ? [] : [[`--capy-${name.slice(2)}`, value]];
      }),
    ),
  );
};

export const useArtifactTokens = (): Record<string, string> =>
  JSON.parse(useSyncExternalStore(subscribeTokens, readTokens, () => "{}"));

const toBase64 = (bytes: Uint8Array) =>
  btoa(
    Array.from({ length: Math.ceil(bytes.length / 32768) }, (_, index) =>
      String.fromCharCode(
        ...bytes.subarray(index * 32768, (index + 1) * 32768),
      ),
    ).join(""),
  );

let fontFace: string | undefined;
let fontLoad: Promise<string> | undefined;
const fontListeners = new Set<() => void>();

const loadFontFace = () => {
  fontLoad ??= fetchBlob(new URL(interFontUrl, window.location.href).href)
    .then((blob) => blob.arrayBuffer())
    .then(
      (buffer) =>
        `@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:block;src:url(data:font/woff2;base64,${toBase64(new Uint8Array(buffer))}) format("woff2")}`,
    )
    .catch(() => "")
    .then((css) => {
      fontFace = css;
      for (const listener of fontListeners) listener();
      return css;
    });
  return fontLoad;
};

export const useArtifactFontFace = () =>
  useSyncExternalStore(
    (listener) => {
      fontListeners.add(listener);
      void loadFontFace();
      return () => fontListeners.delete(listener);
    },
    () => fontFace,
    () => undefined,
  );
