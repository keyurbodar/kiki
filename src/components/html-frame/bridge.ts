export const ARTIFACT_CHANNEL = "capy-artifact-channel";
export const ARTIFACT_GONE = "capy-artifact-gone";
export const ARTIFACT_STORAGE_LIMIT = 131072;
export const ARTIFACT_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; form-action 'none'; base-uri about:";

export type ArtifactValues = Record<string, string>;

export type ArtifactMessage =
  | { type: "capy-artifact-storage"; values: ArtifactValues }
  | { type: "capy-artifact-layout"; top: number; height: number }
  | { type: "capy-artifact-link"; href: string }
  | { type: "capy-artifact-external-link"; url: string }
  | { type: "capy-artifact-link-menu"; url: string; x: number; y: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isValues = (value: unknown): value is ArtifactValues =>
  isRecord(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

export const isChannelMessage = (data: unknown) =>
  isRecord(data) && data.type === ARTIFACT_CHANNEL;

export const isGoneMessage = (data: unknown) =>
  isRecord(data) && data.type === ARTIFACT_GONE;

export function decodeArtifactMessage(
  data: unknown,
): ArtifactMessage | undefined {
  if (!isRecord(data)) return undefined;
  switch (data.type) {
    case "capy-artifact-storage":
      return isValues(data.values)
        ? { type: data.type, values: data.values }
        : undefined;
    case "capy-artifact-layout":
      return typeof data.top === "number" && typeof data.height === "number"
        ? { type: data.type, top: data.top, height: data.height }
        : undefined;
    case "capy-artifact-link":
      return typeof data.href === "string"
        ? { type: data.type, href: data.href }
        : undefined;
    case "capy-artifact-external-link":
      return typeof data.url === "string"
        ? { type: data.type, url: data.url }
        : undefined;
    case "capy-artifact-link-menu":
      return typeof data.url === "string" &&
        isFiniteNumber(data.x) &&
        isFiniteNumber(data.y)
        ? { type: data.type, url: data.url, x: data.x, y: data.y }
        : undefined;
    default:
      return undefined;
  }
}

export const webUrl = (value: string) => {
  const url = URL.parse(value);
  return url?.protocol === "https:" || url?.protocol === "http:"
    ? url.href
    : undefined;
};

export const openInNewTab = (url: string) =>
  void window.open(url, "_blank", "noopener,noreferrer");

function artifactBridge(initial: ArtifactValues, port: MessagePort) {
  const storage = (seed: ArtifactValues, persist: boolean) => {
    const values = new Map(Object.entries(seed));
    const sync = () => {
      if (persist)
        port.postMessage({
          type: "capy-artifact-storage",
          values: Object.fromEntries(values),
        });
    };
    const api = {
      get length() {
        return values.size;
      },
      key: (index: number) => [...values.keys()][index] ?? null,
      getItem: (key: string) => values.get(String(key)) ?? null,
      setItem: (key: string, value: string) => {
        const next = new Map(values).set(String(key), String(value));
        if (JSON.stringify(Object.fromEntries(next)).length > 131072) {
          throw new DOMException(
            "Artifact storage is full",
            "QuotaExceededError",
          );
        }
        values.set(String(key), String(value));
        sync();
      },
      removeItem: (key: string) => {
        values.delete(String(key));
        sync();
      },
      clear: () => {
        values.clear();
        sync();
      },
    };
    return new Proxy(api, {
      get: (target, key) =>
        key in target ? Reflect.get(target, key) : values.get(String(key)),
      set: (_, key, value) => {
        api.setItem(String(key), String(value));
        return true;
      },
      deleteProperty: (_, key) => {
        api.removeItem(String(key));
        return true;
      },
    });
  };
  Object.defineProperty(window, "localStorage", {
    value: storage(initial, true),
  });
  Object.defineProperty(window, "sessionStorage", {
    value: storage({}, false),
  });
  let queued = false;
  const report = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const boxes = [...document.body.children]
        .filter((child) => !["SCRIPT", "STYLE", "LINK"].includes(child.tagName))
        .map((child) => child.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0);
      if (boxes.length === 0) return;
      const bounds = boxes.reduce(
        (all, box) => ({
          top: Math.min(all.top, box.top),
          bottom: Math.max(all.bottom, box.bottom),
        }),
        { top: Number.POSITIVE_INFINITY, bottom: Number.NEGATIVE_INFINITY },
      );
      const style = getComputedStyle(document.body);
      const lead =
        (Number.parseFloat(style.marginTop) || 0) +
        (Number.parseFloat(style.paddingTop) || 0);
      const frame = [
        style.marginTop,
        style.marginBottom,
        style.paddingTop,
        style.paddingBottom,
      ].reduce((sum, value) => sum + (Number.parseFloat(value) || 0), 0);
      port.postMessage({
        type: "capy-artifact-layout",
        top: Math.max(0, bounds.top - lead),
        height: bounds.bottom - bounds.top + frame,
      });
    });
  };
  window.addEventListener(
    "load",
    () => {
      const observer = new ResizeObserver(report);
      const watch = () => {
        observer.disconnect();
        observer.observe(document.body);
        for (const child of document.body.children) observer.observe(child);
        report();
      };
      watch();
      new MutationObserver(watch).observe(document.body, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
      });
    },
    { once: true },
  );
  window.addEventListener("resize", report);
  const anchorOf = (event: Event) =>
    event.target instanceof Element
      ? event.target.closest("a[href], area[href]")
      : null;
  const hrefOf = (anchor: Element) =>
    anchor instanceof SVGAElement
      ? anchor.href.baseVal
      : (anchor.getAttribute("href") ?? "");
  const urlOf = (anchor: Element) =>
    URL.parse(hrefOf(anchor), document.baseURI) ?? undefined;
  const isWeb = (url: URL | undefined) =>
    url?.protocol === "https:" || url?.protocol === "http:";
  const onClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      (event.type === "auxclick" && event.button !== 1)
    )
      return;
    const anchor = anchorOf(event);
    if (anchor === null) return;
    const href = hrefOf(anchor);
    if (!/^(?:[A-Za-z][A-Za-z\d+.-]*:|#|\/\/)/.test(href)) {
      event.preventDefault();
      if (event.type === "click")
        port.postMessage({ type: "capy-artifact-link", href });
      return;
    }
    const url = urlOf(anchor);
    if (url?.protocol === "javascript:") return;
    const bare = (value: string) => value.replace(/#.*$/s, "");
    if (
      url === undefined ||
      url.href === bare(url.href) ||
      bare(url.href) !== bare(location.href)
    ) {
      event.preventDefault();
      if (event.isTrusted && isWeb(url)) {
        port.postMessage({
          type: "capy-artifact-external-link",
          url: url?.href,
        });
      }
    }
  };
  const onMenu = (event: MouseEvent) => {
    const anchor = anchorOf(event);
    const url = anchor === null ? undefined : urlOf(anchor);
    if (!event.defaultPrevented && event.isTrusted && isWeb(url)) {
      event.preventDefault();
      port.postMessage({
        type: "capy-artifact-link-menu",
        url: url?.href,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };
  const listen = () => {
    for (const [type, listener] of [
      ["click", onClick],
      ["auxclick", onClick],
      ["contextmenu", onMenu],
    ] as const) {
      window.removeEventListener(type, listener);
      window.addEventListener(type, listener);
    }
  };
  listen();
  window.addEventListener("load", () => setTimeout(listen), { once: true });
}

export const bridgeScript = (values: ArtifactValues) =>
  `(() => { const channel = new MessageChannel(); parent.postMessage({ type: ${JSON.stringify(ARTIFACT_CHANNEL)} }, "*", [channel.port2]); addEventListener("pagehide", (event) => { if (!event.persisted) channel.port1.postMessage({ type: ${JSON.stringify(ARTIFACT_GONE)} }); }); (${artifactBridge.toString()})(JSON.parse(${JSON.stringify(JSON.stringify(values)).replace(/</g, "\\u003c")}), channel.port1); })();`;

export type ArtifactTheme = "dark" | "light";

export const detectTheme = (html: string, dark: boolean) => {
  const tag = /\[data-theme[=\]]/i.test(html)
    ? /<html(\s[^>]*)?>/i.exec(html)
    : null;
  const attribute =
    tag === null
      ? null
      : /\sdata-theme(?![\w-])(?:\s*=\s*["']?([a-z]+))?/i.exec(tag[0]);
  const declared = attribute?.[1]?.toLowerCase();
  const theme: ArtifactTheme | undefined =
    tag === null
      ? undefined
      : attribute === null
        ? dark
          ? "dark"
          : "light"
        : declared === "dark" || declared === "light"
          ? declared
          : undefined;
  const source =
    tag === null || theme === undefined || attribute !== null
      ? html
      : `${html.slice(0, tag.index)}<html data-theme="${theme}"${tag[0].slice(5)}${html.slice(tag.index + tag[0].length)}`;
  return { theme, inherits: attribute === null, source };
};

export const tokenRule = (tokens: Record<string, string>) =>
  `:root{${Object.entries(tokens)
    .flatMap(([name, value]) =>
      name.startsWith("--capy-")
        ? [`${name}:${value.replace(/[;{}<>]/g, "")}`]
        : [],
    )
    .join(";")}}`;

export const buildArtifactDocument = (options: {
  html: string;
  theme: ArtifactTheme | undefined;
  host: string;
  values: ArtifactValues;
}) =>
  `<!doctype html><meta http-equiv="Content-Security-Policy" content="${ARTIFACT_CSP}"><base href="about:srcdoc">${
    options.theme === undefined
      ? ""
      : `<meta name="color-scheme" content="${options.theme}">`
  }${options.host}<script>${bridgeScript(options.values)}</script>${options.html.replace(/^\s*<!doctype[^>]*>/i, "")}`;

export const standaloneDocument = (document: string) =>
  `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Artifact</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%}</style></head><body><iframe sandbox="allow-scripts" title="Artifact" srcdoc="${document
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")}"></iframe></body></html>`;
