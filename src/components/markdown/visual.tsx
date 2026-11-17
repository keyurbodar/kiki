import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import interFont from "@/tokens/fonts/InterVariable.woff2?url";
import { visualKit } from "./visual-kit";

/* ------------------------------------------------------------ frame document */

const SOURCE = "capy-visual";
const HOST_SOURCE = "capy-visual-host";

export type VisualTheme = "light" | "dark";
export type VisualSkin = "web" | "ios";
export type VisualFill = "solid" | "ordered" | "fade" | "halftone";

const FONTS: Record<VisualSkin, { font: string; mono: string }> = {
  web: {
    font: '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  ios: {
    font: "-apple-system, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
};

/** Host tokens copied into the frame: visual name, then the kiki token it reads. */
export const VISUAL_TOKEN_MAP: ReadonlyArray<readonly [string, string]> = [
  ["--text", "--fg"],
  ["--muted", "--muted-foreground-1"],
  ["--faint", "--muted-foreground-3"],
  ["--border", "--border-2"],
  ["--grid", "--border-1"],
  ["--accent", "--primary"],
  ["--positive", "--success"],
  ["--negative", "--destructive"],
  ["--warning", "--warning-fg"],
  ["--surface", "--secondary"],
  ...Array.from(
    { length: 8 },
    (_, i) => [`--chart-${i + 1}`, `--chart-${i + 1}`] as const,
  ),
];

/** Semantic tokens the frame also receives verbatim as --capy-<name>. */
export const VISUAL_CAPY_TOKENS = [
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
] as const;

/** Layout tokens from src/tokens/rich-content.css the frame needs as concrete values. */
const LAYOUT_TOKENS = [
  "--visual-space-1",
  "--visual-space-2",
  "--visual-space-3",
  "--visual-space-4",
  "--visual-space-5",
  "--visual-space-6",
  "--visual-space-8",
  "--visual-space-10",
  "--visual-font-size",
  "--visual-line-height",
  "--visual-body-inline-padding",
  "--hairline",
  "--radius",
  "--radius-card",
  "--duration-fast",
  "--duration-slow",
  "--duration-slower",
] as const;

const GAPS: Record<string, string> = {
  "--visual-gap-block": "var(--visual-space-4)",
  "--visual-gap-label": "var(--visual-space-2)",
  "--visual-gap-controls": "var(--visual-space-3) var(--visual-space-4)",
  "--visual-gap-stats": "var(--visual-space-4) var(--visual-space-8)",
  "--visual-gap-stat": "var(--visual-space-1)",
  "--visual-gap-legend": "var(--visual-space-2) var(--visual-space-4)",
  "--visual-gap-head": "var(--visual-space-1) var(--visual-space-3)",
  "--visual-chart-inset-top": "var(--visual-space-2)",
  "--visual-chart-inset-right": "var(--visual-space-2)",
  "--visual-chart-inset-bottom": "var(--visual-space-6)",
  "--visual-chart-inset-left": "var(--visual-space-10)",
};

const BLOCKS =
  "svg,canvas,img,video,app-table,app-slider,p,ul,ol,figure,pre,blockquote,hr";
const INLINE =
  "app-stat,app-select,app-input,app-toggle,app-button,span,a,b,strong,em,code,small,label,i,math";
const SHOWN = ":not(script,style,link,template,[hidden])";
const FLOW = `:where(body,div:has(>:is(${BLOCKS})):not(:has(>:is(${INLINE}))))`;

/** Capy's frame base sheet, with its literal sizes swapped for the layout tokens. */
const BASE_CSS = [
  "html{height:auto;background:transparent;color-scheme:light}",
  "html.dark{color-scheme:dark}",
  "body{margin:0;padding:0 var(--visual-body-inline-padding);background:transparent;color:var(--text);font-family:var(--font);font-size:var(--visual-font-size);line-height:var(--visual-line-height);-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;overflow-wrap:anywhere}",
  `${FLOW}>:where(${SHOWN}~${SHOWN}){margin-block-start:var(--visual-gap-block)}`,
  `${FLOW}>:where(${SHOWN}:has(~${SHOWN})){margin-block-end:var(--visual-gap-block)}`,
  `${FLOW}>:where(app-tabs:not(${SHOWN}~*)){width:fit-content;max-width:100%;margin-inline-start:auto}`,
  ":where(app-legend:has(+:is(svg,canvas))){margin-block-end:var(--visual-gap-label)}",
  ":where(app-legend+:is(svg,canvas)){margin-block-start:var(--visual-gap-label)}",
  `:where(div:has(>app-tabs):not(:has(>:is(${BLOCKS})))){display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--visual-gap-head)}`,
  `:where(div:has(>app-tabs):not(:has(>:is(${BLOCKS}))))>app-tabs{order:1;margin-inline-start:auto}`,
  ":where(div:has(>:is(app-select,app-input,app-toggle,app-button))){display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--visual-gap-controls)}",
  ":where(div:has(>app-stat)){display:flex;flex-wrap:wrap;gap:var(--visual-gap-stats)}",
  "svg[viewBox],canvas,img{max-width:100%}",
  "svg{overflow:visible}",
  "*,*::before,*::after{box-sizing:border-box}",
].join("");

export const VISUAL_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'";

type BridgeConfig = {
  id: string;
  offset: number;
  channel: "parent" | "webkit";
  min: number;
  max: number;
};

/**
 * Runs inside the frame before the kit: reports height, ready, errors (with the
 * line inside the agent's HTML) and https links to the host, and applies theme
 * messages from it. Serialised with String(), so it must stay self-contained.
 */
export function visualBridge(config: BridgeConfig) {
  const post = (message: Record<string, unknown>) => {
    const data = { source: "capy-visual", id: config.id, ...message };
    const webkit = Reflect.get(window, "webkit") as
      | {
          messageHandlers?: {
            capyVisual?: { postMessage: (d: unknown) => void };
          };
        }
      | undefined;
    if (config.channel === "webkit")
      webkit?.messageHandlers?.capyVisual?.postMessage(data);
    else window.parent.postMessage(data, "*");
  };
  let last = -1;
  const measure = () => {
    const height = Math.min(
      config.max,
      Math.max(
        config.min,
        Math.ceil(document.documentElement.getBoundingClientRect().height),
      ),
    );
    if (height === last) return;
    last = height;
    post({ type: "height", height });
  };
  new ResizeObserver(measure).observe(document.documentElement);
  window.addEventListener("load", () => {
    measure();
    post({ type: "ready" });
  });
  window.addEventListener("error", (event) => {
    const line =
      event.lineno > config.offset ? event.lineno - config.offset : undefined;
    post({ type: "error", message: String(event.message), line });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    post({
      type: "error",
      message:
        reason instanceof Error
          ? reason.message
          : (JSON.stringify(reason) ?? "undefined"),
    });
  });
  document.addEventListener(
    "click",
    (event) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      event.preventDefault();
      if (/^https:\/\//i.test(anchor.href))
        post({ type: "link", href: anchor.href });
    },
    true,
  );
  document.addEventListener("submit", (event) => event.preventDefault(), true);
  const receive = (data: unknown) => {
    const message = data as {
      source?: unknown;
      type?: unknown;
      theme?: unknown;
      tokens?: Record<string, string>;
    };
    if (
      typeof message !== "object" ||
      !message ||
      message.source !== "capy-visual-host" ||
      message.type !== "theme"
    )
      return;
    const root = document.documentElement;
    const theme = message.theme === "dark" ? "dark" : "light";
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
    for (const [name, value] of Object.entries(message.tokens ?? {}))
      if (name.startsWith("--")) root.style.setProperty(name, value);
    window.dispatchEvent(new Event("themechange"));
  };
  window.addEventListener("message", (event) => {
    if (event.source === window.parent && window.parent !== window)
      receive(event.data);
  });
  Reflect.set(window, "__capyVisualReceive", receive);
  Reflect.set(window, "__capyVisualPost", post);
}

const sanitizeValue = (value: string) => value.replace(/[;{}<>]/g, "");
const rule = (selector: string, vars: Record<string, string>) =>
  `${selector}{${Object.entries(vars)
    .map(([name, value]) => `${name}:${sanitizeValue(value)}`)
    .join(";")}}`;
const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/\s+/g, " ");
const escapeScript = (value: string) =>
  value.replace(/<\/(script)/gi, "<\\/$1");
const escapeStyle = (value: string) => value.replace(/<\/(style)/gi, "<\\/$1");

const OFFSET_MARK = "0000000";

export type VisualDocumentOptions = {
  id: string;
  html: string;
  title?: string;
  theme: VisualTheme;
  skin?: VisualSkin;
  channel?: "parent" | "webkit";
  /** Host token values (--text, --chart-1, --capy-fg, ...) from useVisualTheme. */
  tokens?: Record<string, string>;
  /** Layout token values (--visual-space-*, --hairline, durations) read from the host. */
  layout?: Record<string, string>;
  fontCss?: string;
  min: number;
  max: number;
  /** Inline kit source; defaults to kiki's visualKit. */
  kit?: string;
};

/** The srcdoc for one show_visual frame, in the exact shape Capy's host builds it. */
export function buildVisualDocument(options: VisualDocumentOptions) {
  const skin = options.skin ?? "web";
  const root = rule(":root", {
    "--font": FONTS[skin].font,
    "--mono": FONTS[skin].mono,
    ...options.layout,
    ...GAPS,
    "--visual-fill": "fade",
  });
  const vars = root + rule("html:root", options.tokens ?? {});
  const config = JSON.stringify({
    id: options.id,
    offset: OFFSET_MARK,
    channel: options.channel ?? "parent",
    min: options.min,
    max: options.max,
  }).replace(`"offset":"${OFFSET_MARK}"`, `"offset":${OFFSET_MARK}`);
  const kit = options.kit ?? `(${String(visualKit)})();`;
  const head = [
    "<!doctype html>",
    `<html lang="en" data-skin="${skin}" data-theme="${options.theme}"${options.theme === "dark" ? ' class="dark"' : ""}>`,
    "<head>",
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="${VISUAL_CSP}">`,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<style>${escapeStyle(options.fontCss ?? "")}${vars}${BASE_CSS}</style>`,
    `<script>(${escapeScript(String(visualBridge))})(${config});</script>`,
    `<script>${escapeScript(kit)}</script>`,
    "</head>",
    "<body>",
    ...(options.title === undefined || skin !== "web"
      ? []
      : [`<visual-head label="${escapeAttr(options.title)}"></visual-head>`]),
    "",
  ].join("\n");
  const lines = head.split("\n").length - 1;
  return `${head.replace(OFFSET_MARK, String(lines).padStart(OFFSET_MARK.length, " "))}${options.html}\n</body>\n</html>\n`;
}

/* ------------------------------------------------------------- host theme */

const subscribeTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true });
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  return () => observer.disconnect();
};

const readTheme = () => {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return JSON.stringify({
    theme: root.classList.contains("dark") ? "dark" : "light",
    tokens: Object.fromEntries([
      ...VISUAL_TOKEN_MAP.flatMap(([to, from]) =>
        read(from) === "" ? [] : [[to, read(from)]],
      ),
      ...VISUAL_CAPY_TOKENS.flatMap((name) =>
        read(name) === "" ? [] : [[`--capy-${name.slice(2)}`, read(name)]],
      ),
    ]),
  });
};

const serverTheme = () => JSON.stringify({ theme: "light", tokens: {} });

export type VisualHostTheme = {
  theme: VisualTheme;
  tokens: Record<string, string>;
  key: string;
};

/** The host's theme and token values, re-read whenever <html> or the head's styles change. */
export function useVisualTheme(): VisualHostTheme {
  const key = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);
  return useMemo(() => ({ ...JSON.parse(key), key }), [key]);
}

const readLayout = () => {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    LAYOUT_TOKENS.flatMap((name) => {
      const value = style.getPropertyValue(name).trim();
      return value === "" ? [] : [[name, value]];
    }),
  );
};

const toBase64 = (bytes: Uint8Array) => {
  const CHUNK = 32768;
  let out = "";
  for (let i = 0; i < bytes.length; i += CHUNK)
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(out);
};

let fontCss: Promise<string> | undefined;

/** Inter as a data: @font-face (frames can only load fonts from data: under their CSP). */
export const loadVisualFontCss = () => {
  fontCss ??= fetch(interFont)
    .then((response) =>
      response.ok ? response.arrayBuffer() : Promise.reject(response.status),
    )
    .then(
      (buffer) =>
        `@font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:block;src:url(data:font/woff2;base64,${toBase64(new Uint8Array(buffer))}) format("woff2")}`,
    )
    .catch(() => "");
  return fontCss;
};

function useVisualFontCss() {
  const [css, setCss] = useState<string>();
  useEffect(() => {
    let live = true;
    void loadVisualFontCss().then((value) => {
      if (live) setCss(value);
    });
    return () => {
      live = false;
    };
  }, []);
  return css;
}

/* ------------------------------------------------------------------ frame */

const READY_TIMEOUT = 10000;

export type VisualFailure = "timeout" | "error";

const frameBounds = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    min: Number.parseFloat(style.getPropertyValue("--visual-frame-min")) || 0,
    max:
      Number.parseFloat(style.getPropertyValue("--visual-frame-max")) ||
      Number.POSITIVE_INFINITY,
  };
};

export type VisualFrameProps = {
  /** The show_visual tool call id; also the message channel id. */
  id: string;
  title: string;
  /** Shown above the failure line when the frame cannot render. */
  heading?: ReactNode;
  html: string;
  skin?: VisualSkin;
  /** Pin a theme instead of following the app. */
  theme?: VisualTheme;
  fill?: VisualFill;
};

/** Capy's sandboxed show_visual frame: builds the srcdoc, sizes to content, relays links and theme. */
export function VisualFrame({
  id,
  title,
  heading,
  html,
  skin = "web",
  theme,
  fill,
}: VisualFrameProps) {
  const host = useVisualTheme();
  const follows = theme === undefined && skin === "web";
  const current = follows
    ? host
    : { theme: theme ?? host.theme, tokens: undefined };
  const frame = useRef<HTMLIFrameElement>(null);
  const [initial] = useState(current);
  const [bounds] = useState(frameBounds);
  const [height, setHeight] = useState(bounds.min);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<VisualFailure>();
  const font = useVisualFontCss();
  const [layout] = useState(readLayout);

  const srcDoc =
    font === undefined
      ? undefined
      : buildVisualDocument({
          id,
          html,
          title: skin === "web" ? title : undefined,
          theme: initial.theme,
          skin,
          channel: "parent",
          tokens:
            fill === undefined
              ? initial.tokens
              : { ...initial.tokens, "--visual-fill": fill },
          layout,
          fontCss: font,
          min: bounds.min,
          max: bounds.max,
        });

  useEffect(() => {
    if (srcDoc === undefined || ready) return;
    const timer = setTimeout(
      () => setFailure((f) => f ?? "timeout"),
      READY_TIMEOUT,
    );
    return () => clearTimeout(timer);
  }, [srcDoc, ready]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data as {
        source?: unknown;
        id?: unknown;
        type?: unknown;
      } & Record<string, unknown>;
      if (
        typeof data !== "object" ||
        !data ||
        data.source !== SOURCE ||
        data.id !== id
      )
        return;
      switch (data.type) {
        case "ready":
          setReady(true);
          return;
        case "height":
          if (typeof data.height === "number")
            setHeight(
              Math.min(
                bounds.max,
                Math.max(bounds.min, Math.ceil(data.height)),
              ),
            );
          return;
        case "error":
          setFailure((f) => f ?? "error");
          return;
        case "link": {
          const url =
            typeof data.href === "string" ? URL.parse(data.href) : null;
          if (url?.protocol !== "https:") return;
          window.open(url.href, "_blank", "noopener,noreferrer");
          return;
        }
        default:
          return;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id, bounds]);

  const themeKey = follows ? host.key : undefined;
  // biome-ignore lint/correctness/useExhaustiveDependencies: themeKey carries host.theme and host.tokens
  useEffect(() => {
    if (!ready || !follows) return;
    frame.current?.contentWindow?.postMessage(
      {
        source: HOST_SOURCE,
        type: "theme",
        theme: host.theme,
        tokens: host.tokens,
      },
      "*",
    );
  }, [ready, follows, themeKey]);

  if (failure === "timeout")
    return (
      <div className="flex flex-col">
        {heading}
        <p className="py-1 text-sm text-muted-foreground-3">
          This visual could not be shown
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-1">
      {srcDoc !== undefined && (
        <iframe
          ref={frame}
          title={title}
          sandbox="allow-scripts"
          srcDoc={srcDoc}
          className="block w-full border-0 bg-transparent"
          style={{ height, colorScheme: current.theme }}
        />
      )}
      {failure === "error" && (
        <p className="text-xs text-muted-foreground-3">
          Part of this visual hit an error
        </p>
      )}
    </div>
  );
}

export type VisualRowData = { toolCallId: string; title: string; html: string };

export type VisualProps = ComponentProps<"div"> & {
  /** The show_visual row to render; without it Visual is a bare slot wrapper. */
  row?: VisualRowData;
};

/** Timeline row for a show_visual call (Capy features/thread VisualRow). */
export function Visual({ row, className, children, ...props }: VisualProps) {
  return (
    <div
      data-slot="visual"
      className={["flex min-w-0 flex-col pb-2", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {row !== undefined && (
        <VisualFrame
          id={row.toolCallId}
          title={row.title}
          html={row.html}
          heading={
            <div className="flex min-w-0 items-center text-sm text-muted-foreground-1">
              <span className="min-w-0 truncate">{row.title}</span>
            </div>
          }
        />
      )}
      {children}
    </div>
  );
}
