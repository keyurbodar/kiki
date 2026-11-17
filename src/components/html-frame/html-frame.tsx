import { cx } from "class-variance-authority";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/primitives/context-menu";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { MenuItem } from "@/primitives/menu";
import {
  ARTIFACT_STORAGE_LIMIT,
  type ArtifactValues,
  buildArtifactDocument,
  decodeArtifactMessage,
  detectTheme,
  isChannelMessage,
  isGoneMessage,
  openInNewTab,
  standaloneDocument,
  tokenRule,
  webUrl,
} from "./bridge";
import {
  FileToolbarButton,
  FileToolbarSlot,
  FileZoomControls,
} from "./file-toolbar";
import { ArrowShareGlyph, ArrowUpRightGlyph } from "./glyphs";
import { useArtifactFontFace, useArtifactTokens, useDarkMode } from "./theme";

export const MIN_ARTIFACT_HEIGHT = 120;
export const ARTIFACT_MIN_ZOOM = 0.25;
export const ARTIFACT_MAX_ZOOM = 4;

const MENU_ICON =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";

export type HtmlFrameProps = {
  text: string;
  name: string;
  initial: ArtifactValues;
  onStorage: (values: ArtifactValues) => void;
  onLink?: (href: string) => void;
};

type Channel = {
  element: HTMLIFrameElement;
  window: Window;
  srcDoc: string;
  port: MessagePort;
  loads: number;
};

export function HtmlFrame({
  text,
  name,
  initial,
  onStorage,
  onLink,
}: HtmlFrameProps) {
  const dark = useDarkMode();
  const tokens = useArtifactTokens();
  const fontFace = useArtifactFontFace();
  const frame = useRef<HTMLIFrameElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const blobUrl = useRef<string | undefined>(undefined);
  const menuTrigger = useRef<HTMLDivElement>(null);
  const deferred = useRef<(() => void) | undefined>(undefined);
  const [menuUrl, setMenuUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<{
    text: string;
    top: number;
    height: number;
  }>();
  const height =
    layout?.text === text
      ? Math.min(size.height, Math.max(MIN_ARTIFACT_HEIGHT, layout.height))
      : size.height;
  const offset =
    layout?.text === text
      ? Math.min(layout.top, Math.max(0, size.height - height))
      : 0;

  useLayoutEffect(() => {
    const element = container.current;
    if (element === null) return;
    const measure = () => {
      const width = element.clientWidth;
      const next = element.clientHeight;
      setSize((previous) =>
        previous.width === width && previous.height === next
          ? previous
          : { width, height: next },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, []);

  const { theme, inherits, source } = detectTheme(text, dark);
  const font = theme === undefined ? "" : fontFace;
  const host =
    theme === undefined
      ? ""
      : `<style>${font ?? ""}${inherits ? tokenRule(tokens) : ""}</style>`;
  const [frozen, setFrozen] = useState({ text, theme, host, values: initial });
  if (frozen.text !== text || frozen.theme !== theme || frozen.host !== host) {
    setFrozen({ text, theme, host, values: initial });
  }
  const srcDoc = buildArtifactDocument({
    html: source,
    theme,
    host,
    values: frozen.values,
  });

  const channel = useRef<Channel | undefined>(undefined);
  const loaded = useRef<{ window: Window | null; srcDoc: string } | undefined>(
    undefined,
  );
  const seen = useRef(new WeakSet<Window>());
  const handle = useRef<(data: unknown) => void>(() => {});

  useLayoutEffect(() => {
    handle.current = (data) => {
      const whenFocused = (action: () => void) => {
        if (window.document.activeElement === frame.current) action();
        else deferred.current = action;
      };
      const message = decodeArtifactMessage(data);
      if (message === undefined) return;
      switch (message.type) {
        case "capy-artifact-external-link": {
          const url = webUrl(message.url);
          if (url !== undefined && navigator.userActivation.isActive)
            whenFocused(() => openInNewTab(url));
          return;
        }
        case "capy-artifact-link-menu": {
          const url = webUrl(message.url);
          if (url === undefined || !navigator.userActivation.isActive) return;
          whenFocused(() => {
            const box = frame.current?.getBoundingClientRect();
            if (box === undefined) return;
            setMenuUrl(url);
            menuTrigger.current?.dispatchEvent(
              new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: true,
                clientX: box.left + message.x * zoom,
                clientY: box.top + message.y * zoom,
              }),
            );
          });
          return;
        }
        case "capy-artifact-layout": {
          const { top, height: next } = message;
          if (
            !Number.isFinite(top) ||
            !Number.isFinite(next) ||
            top < 0 ||
            next <= 0
          )
            return;
          setLayout((previous) =>
            previous?.text === text &&
            previous.top === top &&
            previous.height === next
              ? previous
              : { text, top, height: next },
          );
          return;
        }
        case "capy-artifact-link":
          onLink?.(message.href);
          return;
        case "capy-artifact-storage":
          if (JSON.stringify(message.values).length <= ARTIFACT_STORAGE_LIMIT)
            onStorage(message.values);
          return;
      }
    };
  });

  useEffect(() => {
    const onBlur = () => {
      const action = deferred.current;
      deferred.current = undefined;
      if (
        action !== undefined &&
        window.document.activeElement === frame.current &&
        navigator.userActivation.isActive
      ) {
        action();
      }
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  useLayoutEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const element = frame.current;
      const target = element?.contentWindow;
      const port = event.ports[0];
      if (
        element === null ||
        target == null ||
        event.source !== target ||
        event.origin !== "null" ||
        port === undefined ||
        !isChannelMessage(event.data)
      ) {
        return;
      }
      if (seen.current.has(target)) {
        port.close();
        return;
      }
      seen.current.add(target);
      channel.current?.port.close();
      channel.current = { element, window: target, srcDoc, port, loads: 0 };
      port.onmessage = (portEvent) => {
        if (isGoneMessage(portEvent.data)) port.close();
        else handle.current(portEvent.data);
      };
    };
    window.addEventListener("message", onMessage);
    const element = frame.current;
    const last = loaded.current;
    const open = channel.current;
    if (
      element !== null &&
      element.contentWindow !== null &&
      last?.window === element.contentWindow &&
      last.srcDoc === srcDoc &&
      (open?.window !== element.contentWindow || open.srcDoc !== srcDoc)
    ) {
      loaded.current = undefined;
      element.srcdoc = srcDoc;
    }
    return () => {
      window.removeEventListener("message", onMessage);
      const active = channel.current;
      if (active !== undefined) {
        window.setTimeout(() => {
          if (!active.element.isConnected) active.port.close();
        });
      }
    };
  }, [srcDoc]);

  useEffect(
    () => () => {
      if (blobUrl.current !== undefined) URL.revokeObjectURL(blobUrl.current);
    },
    [],
  );

  const openStandalone = () => {
    if (blobUrl.current !== undefined) URL.revokeObjectURL(blobUrl.current);
    const fresh = buildArtifactDocument({
      html: source,
      theme,
      host,
      values: initial,
    });
    blobUrl.current = URL.createObjectURL(
      new Blob([standaloneDocument(fresh)], { type: "text/html" }),
    );
    window.open(blobUrl.current, "_blank", "noopener,noreferrer");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl).then(
      () => toast.success("Link copied", { description: menuUrl }),
      () => toast.error("Could not copy link", { description: menuUrl }),
    );
  };

  let body: ReactNode;
  if (size.width === 0 || size.height === 0 || font === undefined) {
    body = (
      <div className="grid h-full place-items-center">
        <DotGridIcon
          role="status"
          aria-hidden={false}
          aria-label="Loading artifact"
        />
      </div>
    );
  } else {
    body = (
      <div
        className={cx(
          "relative mx-auto overflow-hidden",
          zoom < 1 && "rounded-(--radius-card) shadow-card",
        )}
        style={{ width: size.width * zoom, height: height * zoom }}
      >
        <iframe
          key={srcDoc}
          ref={frame}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          title={name}
          onLoad={(event) => {
            const target = event.currentTarget.contentWindow;
            loaded.current = { window: target, srcDoc };
            const open = channel.current;
            if (open?.window === target && open.srcDoc === srcDoc) {
              open.loads += 1;
              if (open.loads >= 2) open.port.close();
            }
          }}
          className={cx(
            "absolute left-0 block origin-top-left border-0",
            theme === undefined ? "bg-white" : "bg-card",
          )}
          style={{
            top: -offset * zoom,
            width: size.width,
            height: size.height,
            transform: `scale(${zoom})`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <FileToolbarSlot>
        <FileZoomControls
          zoom={zoom}
          minZoom={ARTIFACT_MIN_ZOOM}
          maxZoom={ARTIFACT_MAX_ZOOM}
          onZoom={setZoom}
          onReset={() => setZoom(1)}
        />
        <FileToolbarButton label="Open in new tab" onClick={openStandalone}>
          <ArrowUpRightGlyph />
        </FileToolbarButton>
      </FileToolbarSlot>
      <div
        ref={container}
        className={cx(
          "min-h-0 min-w-0 flex-1 overflow-auto bg-panel",
          zoom < 1 && "grid place-items-center",
        )}
      >
        {body}
      </div>
      <ContextMenu>
        <ContextMenuTrigger
          ref={menuTrigger}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 size-0"
        />
        <ContextMenuContent className="w-52">
          <MenuItem onClick={() => openInNewTab(menuUrl)}>
            <span className={MENU_ICON}>
              <ArrowUpRightGlyph />
            </span>
            Open in new tab
          </MenuItem>
          <MenuItem onClick={copyLink}>
            <span className={MENU_ICON}>
              <ArrowShareGlyph />
            </span>
            Copy link
          </MenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

export type HtmlDocumentProps = {
  text: string;
  name: string;
  onLink?: (href: string) => void;
};

export function HtmlDocument({ text, name, onLink }: HtmlDocumentProps) {
  const [values, setValues] = useState<ArtifactValues>({});
  return (
    <HtmlFrame
      text={text}
      name={name}
      initial={values}
      onStorage={setValues}
      onLink={onLink}
    />
  );
}
