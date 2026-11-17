import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileEmpty } from "@/components/csv-table";
import { FileToolbarSlot, FileZoomControls } from "@/components/html-frame";
import { fetchBlob } from "@/lib/fetch-blob";
import { Button } from "@/primitives/button";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { ScrollArea, ScrollAreaViewport } from "@/primitives/scroll-area";
import { DOCX_PAGE_GAP, pageWidth, renderDocx } from "./docx-render";

export const DOCX_SIZE_LIMIT = 25_000_000;
export const DOCX_PAGE_BATCH = 20;
export const DOCX_MIN_ZOOM = 0.25;
export const DOCX_MAX_ZOOM = 3;

export type DocxViewProps = {
  url: string;
  meta?: ReactNode;
  onViewport?: (element: HTMLDivElement | null) => void;
};

type Loaded =
  | { url: string; width: number }
  | { url: string; oversize: Blob }
  | { url: string; failed: true };

export const fitZoom = (viewportWidth: number, documentWidth: number) =>
  Math.min(
    1,
    Math.max(
      DOCX_MIN_ZOOM,
      viewportWidth / (documentWidth + 2 * DOCX_PAGE_GAP),
    ),
  );

export function DocxView({ url, meta, onViewport }: DocxViewProps) {
  const [loaded, setLoaded] = useState<Loaded>();
  const [forced, setForced] = useState<{ url: string; blob: Blob }>();
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const revealPage = useRef<((id: string) => void) | undefined>(undefined);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [fit, setFit] = useState(1);
  const [manual, setManual] = useState<{ url: string; value: number }>();
  const current = loaded?.url === url ? loaded : undefined;
  const width =
    current !== undefined && "width" in current ? current.width : undefined;
  const zoom = manual?.url === url ? manual.value : fit;

  const attachViewport = (element: HTMLDivElement | null) => {
    setViewport(element);
    onViewport?.(element);
  };

  useEffect(() => {
    if (host === null) return;
    const controller = new AbortController();
    (forced?.url === url
      ? Promise.resolve(forced.blob)
      : fetchBlob(url, controller.signal)
    )
      .then((blob) => {
        if (blob.size > DOCX_SIZE_LIMIT && forced?.url !== url) {
          if (!controller.signal.aborted) setLoaded({ url, oversize: blob });
          return;
        }
        return renderDocx(blob).then(({ sheets, nodes }) => {
          if (controller.signal.aborted) return;
          const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
          const documentWidth = pageWidth(nodes);
          const wrapper = nodes.find(
            (node): node is HTMLElement =>
              node instanceof HTMLElement &&
              node.classList.contains("docx-wrapper"),
          );
          const deferred = [
            ...(wrapper?.querySelectorAll<HTMLElement>(
              ":scope > section.docx",
            ) ?? []),
          ].slice(DOCX_PAGE_BATCH);
          for (const page of deferred) page.remove();
          const append = (count: number) => {
            observer.disconnect();
            wrapper?.append(...deferred.splice(0, count));
            const last = wrapper?.lastElementChild;
            if (deferred.length > 0 && last != null) observer.observe(last);
          };
          const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting))
              append(DOCX_PAGE_BATCH);
          });
          controller.signal.addEventListener("abort", () =>
            observer.disconnect(),
          );
          revealPage.current = (id) => {
            const index = deferred.findIndex(
              (page) =>
                page.id === id ||
                page.querySelector(`#${CSS.escape(id)}`) !== null,
            );
            if (index >= 0) append(index + 1);
          };
          root.adoptedStyleSheets = sheets;
          root.replaceChildren(...nodes);
          append(0);
          setLoaded({ url, width: documentWidth });
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ url, failed: true });
      });
    return () => {
      controller.abort();
      host.shadowRoot?.replaceChildren();
      if (host.shadowRoot !== null) host.shadowRoot.adoptedStyleSheets = [];
    };
  }, [url, forced, host]);

  useEffect(() => {
    if (viewport === null || width === undefined) return;
    const observer = new ResizeObserver(() =>
      setFit(fitZoom(viewport.clientWidth, width)),
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewport, width]);

  if (current !== undefined && "failed" in current) {
    return <FileEmpty line="Could not read this document" sub={meta} />;
  }
  if (current !== undefined && "oversize" in current) {
    const blob = current.oversize;
    return (
      <FileEmpty
        line={`${(blob.size / 1e6).toFixed(1)} MB document`}
        action={
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setLoaded(undefined);
              setForced({ url, blob });
            }}
          >
            Load anyway
          </Button>
        }
      />
    );
  }

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const href = event.nativeEvent
      .composedPath()
      .find(
        (target): target is HTMLAnchorElement =>
          target instanceof HTMLAnchorElement,
      )
      ?.getAttribute("href");
    if (href == null || !href.startsWith("#")) return;
    event.preventDefault();
    const id = decodeURIComponent(href.slice(1));
    revealPage.current?.(id);
    host?.shadowRoot?.getElementById(id)?.scrollIntoView({ block: "start" });
  };

  const controls = (
    <FileZoomControls
      zoom={zoom}
      minZoom={DOCX_MIN_ZOOM}
      maxZoom={DOCX_MAX_ZOOM}
      onZoom={(value) => setManual({ url, value })}
      onReset={() => setManual(undefined)}
    />
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-secondary">
      <ScrollArea className="min-h-0 flex-1">
        <ScrollAreaViewport ref={attachViewport} className="size-full">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: in-document anchor links are focusable inside the shadow root */}
          <div
            ref={setHost}
            role="document"
            className="w-max min-w-full contain-paint"
            style={{ "--docx-zoom": zoom } as CSSProperties}
            onClick={onClick}
          />
        </ScrollAreaViewport>
      </ScrollArea>
      {width === undefined && (
        <div className="absolute inset-0 flex items-center justify-center">
          <DotGridIcon
            size="sm"
            role="status"
            aria-hidden={false}
            aria-label="Reading document"
          />
        </div>
      )}
      {width !== undefined && (
        <FileToolbarSlot
          fallback={
            <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-(--radius) border-hairline border-border-2 bg-popover px-1 py-0.5 shadow-overlay">
              {controls}
            </div>
          }
        >
          {controls}
        </FileToolbarSlot>
      )}
    </div>
  );
}
