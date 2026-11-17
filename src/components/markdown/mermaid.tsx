import { cva, type VariantProps } from "class-variance-authority";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { toast } from "sonner";
import { unified } from "unified";
import { PanZoomControls } from "@/components/pan-zoom/pan-zoom-controls";
import {
  clampZoom,
  type PanZoomView,
  usePanZoom,
} from "@/components/pan-zoom/use-pan-zoom";
import { Button } from "@/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import type { MarkdownMermaidProps } from "./components";
import {
  ArrowUpRightIcon,
  CheckmarkIcon,
  ClipboardIcon,
  ExpandIcon,
  WindowAppIcon,
} from "./icons";

/* ---------------------------------------------------------------- source */

type MdNode = {
  type: string;
  lang?: string | null;
  value?: string;
  children?: MdNode[];
};

const parser = unified().use(remarkParse).use(remarkGfm);

function collectMermaid(markdown: string, out: string[]) {
  const walk = (node: MdNode) => {
    if (
      node.type === "code" &&
      node.lang?.trim().split(/\s+/, 1)[0] === "mermaid"
    )
      out.push(node.value ?? "");
    if (node.type === "html" && node.value)
      collectMermaid(
        node.value.replace(/<!--[\s\S]*?(?:-->|$)|<[^>]*>?/g, "\n"),
        out,
      );
    node.children?.forEach(walk);
  };
  walk(parser.parse(markdown) as MdNode);
  return out;
}

/** Every mermaid fence in a message, in document order, including fences nested in raw HTML. */
export const extractMermaidBlocks = (markdown: string) =>
  collectMermaid(markdown, []);

/** Index of a mermaid source among a message's blocks, used in the diagram window URL. */
export const mermaidIndexOf = (markdown: string, text: string) => {
  const index = extractMermaidBlocks(markdown).indexOf(text);
  return index >= 0 ? index : undefined;
};

export const diagramHref = (jamId: string, messageId: string, index: number) =>
  `/diagram/${jamId}/${encodeURIComponent(messageId)}/${index}`;

const WINDOW_HEADER = 40;
const WINDOW_GUTTER = 64;
const WINDOW_MIN_WIDTH = 480;
const WINDOW_MIN_HEIGHT = 360;

/** Popup size for a rendered diagram, bounded by 60% x 80% of the screen like Capy's. */
export const diagramWindowSize = (
  width: number,
  height: number,
  screen: { availWidth: number; availHeight: number } = window.screen,
) => {
  const maxWidth = Math.max(
    WINDOW_MIN_WIDTH,
    Math.round(screen.availWidth * 0.6),
  );
  const maxHeight = Math.max(
    WINDOW_MIN_HEIGHT,
    Math.round(screen.availHeight * 0.8),
  );
  return {
    width: Math.round(
      Math.min(maxWidth, Math.max(WINDOW_MIN_WIDTH, width + WINDOW_GUTTER)),
    ),
    height: Math.round(
      Math.min(
        maxHeight,
        Math.max(WINDOW_MIN_HEIGHT, height + WINDOW_HEADER + WINDOW_GUTTER),
      ),
    ),
  };
};

type DesktopDiagrams = {
  open: (options: {
    href: string;
    width: number;
    height: number;
  }) => Promise<void>;
};

const desktopDiagrams = () =>
  (window as { capyDesktop?: { diagrams?: DesktopDiagrams } }).capyDesktop
    ?.diagrams;

export function openDiagramWindow(
  href: string,
  size: { width: number; height: number },
) {
  const diagrams = desktopDiagrams();
  if (diagrams === undefined) {
    const opened = window.open(
      href,
      `capy-diagram-${href.replace(/[^A-Za-z0-9]+/g, "-")}`,
      `popup,width=${size.width},height=${size.height}`,
    );
    if (opened === null)
      toast.error("Allow pop-ups to open the diagram in a new window");
    return;
  }
  diagrams
    .open({ href, width: size.width, height: size.height })
    .catch(() => toast.error("Could not open a new window"));
}

const DIAGRAM_TITLES: Record<string, string> = {
  flowchart: "Flowchart",
  graph: "Flowchart",
  sequenceDiagram: "Sequence diagram",
  classDiagram: "Class diagram",
  stateDiagram: "State diagram",
  "stateDiagram-v2": "State diagram",
  erDiagram: "ER diagram",
  gantt: "Gantt chart",
  pie: "Pie chart",
  mindmap: "Mindmap",
  journey: "User journey",
  timeline: "Timeline",
  gitGraph: "Git graph",
  quadrantChart: "Quadrant chart",
};

/** Title for a diagram: front-matter `title:`, else the diagram kind, else "Mermaid diagram". */
export function mermaidTitle(text: string) {
  const front = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const title = front?.[1]?.match(/^\s*title:\s*(.+)$/m)?.[1]?.trim();
  if (title) return title;
  const kind = (front ? text.slice(front[0].length) : text)
    .split("\n")
    .find((line) => line.trim() && !line.trim().startsWith("%%"))
    ?.trim()
    .match(/^[\w-]+/)?.[0];
  return (kind && DIAGRAM_TITLES[kind]) || "Mermaid diagram";
}

/* ---------------------------------------------------------------- render */

const FILL = /(?:^|;)\s*fill\s*:\s*([^;]+)/;
const OPACITY = /(?:^|;)\s*(?:fill-)?opacity\s*:/;
const LABEL_INKS = [
  "--mermaid-label-ink-dark",
  "--mermaid-label-ink-light",
] as const;

const luminance = (rgb: ArrayLike<number>) => {
  const [r = 0, g = 0, b = 0] = Array.from(rgb, (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Capy's post-pass over pele's SVG: user-styled node fills get the readable
 * label ink, and pele's block rects are pulled into the theme's lightness band.
 */
export function recolorMermaidSvg(svg: string) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  if (ctx === null || doc.querySelector("parsererror") !== null) return svg;
  const sample = (color: string) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "transparent";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
  };
  const root = getComputedStyle(document.documentElement);
  const inks = LABEL_INKS.map((token) => ({
    token,
    rgb: sample(root.getPropertyValue(token).trim()).subarray(0, 3),
  }));
  const styled = Array.from(
    doc.querySelectorAll(
      "g > :is(rect, path, polygon, ellipse, circle)[style]",
    ),
  ).flatMap((shape) => {
    const fill = shape.getAttribute("style")?.match(FILL)?.[1]?.trim();
    const labels = Array.from(shape.parentElement?.children ?? []).filter(
      (el) =>
        el.tagName === "text" && !FILL.test(el.getAttribute("style") ?? ""),
    );
    if (fill === undefined || labels.length === 0) return [];
    const px = sample(fill);
    if (px[3] !== 255 || OPACITY.test(shape.getAttribute("style") ?? ""))
      return [];
    const l = luminance(px.subarray(0, 3));
    const contrast = (ink: ArrayLike<number>) => {
      const k = luminance(ink);
      return (Math.max(l, k) + 0.05) / (Math.min(l, k) + 0.05);
    };
    const [dark, light] = inks;
    if (dark === undefined || light === undefined) return [];
    const ink = contrast(dark.rgb) >= contrast(light.rgb) ? dark : light;
    return [{ shape, labels, color: `var(${ink.token})` }];
  });
  const blocks = Array.from(doc.querySelectorAll(".pele-rect[style]"));
  if (styled.length === 0 && blocks.length === 0) return svg;
  for (const block of blocks) {
    const style = block.getAttribute("style") ?? "";
    const color = style.match(FILL)?.[1]?.trim();
    if (color === undefined) continue;
    block.setAttribute("data-mermaid-block", "");
    block.setAttribute(
      "style",
      `${style.replace(FILL, "")};--mermaid-block-fill:${color}`,
    );
  }
  for (const { shape, labels, color } of styled) {
    shape.removeAttribute("fill-opacity");
    for (const label of labels)
      label.setAttribute(
        "style",
        [label.getAttribute("style"), `fill:${color}`]
          .filter(Boolean)
          .join(";"),
      );
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}

export type MermaidDiagram = { svg: string; width: number; height: number };

const loadPele = () => import("pele/lazy");

const RENDER_DEBOUNCE = 250;
const SEQUENCE_ACTOR_EMS = 12;
const SEQUENCE_ACTOR_GAP = 32;
const SEQUENCE_PADDING = 24;

export type UseMermaidOptions = {
  host: RefObject<HTMLElement | null>;
  text: string;
  complete: boolean;
  active: boolean;
  width: number;
};

/** Renders mermaid source with pele (lazy-loaded), debounced while the message streams. */
export function useMermaid({
  host,
  text,
  complete,
  active,
  width,
}: UseMermaidOptions) {
  const [diagram, setDiagram] = useState<MermaidDiagram>();
  const [error, setError] = useState<string>();
  const idPrefix = useId();

  useEffect(() => {
    const element = host.current;
    if (!active || !text || !element || width === 0) return;
    let cancelled = false;
    const run = async () => {
      const pele = await loadPele();
      if (cancelled) return;
      const style = getComputedStyle(element);
      const fontSize = Number.parseFloat(style.fontSize);
      const result = await Promise.resolve()
        .then(() => pele.load(pele.detectType(text)))
        .then(() => {
          const model = pele.parse(text);
          const actors =
            model.type === "sequence" && "actors" in model
              ? (model.actors as { size: number }).size
              : undefined;
          return pele.render(model, {
            idPrefix,
            fontFamily: style.fontFamily,
            fontSize,
            maxWidth:
              actors === undefined
                ? width
                : Math.max(
                    width,
                    actors *
                      (fontSize * SEQUENCE_ACTOR_EMS + SEQUENCE_ACTOR_GAP) +
                      SEQUENCE_PADDING,
                  ),
            directionBreakpoint: Number.POSITIVE_INFINITY,
            padding: 12,
            links: false,
            images: false,
          });
        })
        .then(
          (rendered) => ({
            diagram: {
              svg: recolorMermaidSvg(rendered.svg),
              width: rendered.width,
              height: rendered.height,
            },
            error: undefined,
          }),
          (cause: unknown) => ({
            diagram: undefined,
            error: cause instanceof Error ? cause.message : String(cause),
          }),
        );
      if (cancelled) return;
      if (result.diagram === undefined) {
        setError(result.error);
        if (complete) setDiagram(undefined);
      } else {
        setDiagram(result.diagram);
        setError(undefined);
      }
    };
    if (complete) {
      void run();
      return () => {
        cancelled = true;
      };
    }
    const timer = setTimeout(() => void run(), RENDER_DEBOUNCE);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [host, text, complete, active, idPrefix, width]);

  return { diagram, error };
}

/* ---------------------------------------------------------------- stage */

export const mermaidStageVariants = cva(
  "relative min-h-0 flex-1 overflow-hidden bg-panel",
  {
    variants: {
      placement: {
        dialog:
          "mx-5 mt-3 mb-4 rounded-(--radius-card) border-hairline border-border-1",
        window: "focus-visible:outline-ring-inset",
      },
    },
    defaultVariants: { placement: "dialog" },
  },
);

export type MermaidStageProps = ComponentProps<"div"> &
  VariantProps<typeof mermaidStageVariants> & {
    /** Rendered SVG markup to pan and zoom. */
    svg?: string;
    /** Pan-zoom state from usePanZoom; the stage creates its own when omitted. */
    view?: PanZoomView;
  };

/** Pannable, zoomable diagram surface with Capy's floating zoom controls. */
export function MermaidStage({
  svg,
  view: external,
  placement,
  className,
  style,
  children,
  ...props
}: MermaidStageProps) {
  const own = usePanZoom();
  const view = external ?? own;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a pan surface; Capy's stage has no role either
    <div
      ref={view.setStage}
      data-slot="mermaid-stage"
      tabIndex={placement === "window" ? 0 : undefined}
      className={mermaidStageVariants({ placement, className })}
      style={{
        touchAction: "none",
        cursor: view.panning ? "grabbing" : "grab",
        ...style,
      }}
      onKeyDown={placement === "window" ? view.onKeyDown : undefined}
      onPointerDown={view.onPointerDown}
      onPointerMove={view.onPointerMove}
      onPointerUp={view.onPointerUp}
      onPointerCancel={view.onPointerUp}
      {...props}
    >
      {svg !== undefined && (
        <div
          className="flex h-full w-full items-center justify-center motion-reduce:transition-none!"
          style={{
            transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})`,
            willChange: view.panning ? "transform" : undefined,
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: pele output, sanitised by pele (links and images off)
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
      <PanZoomControls view={view}>{children}</PanZoomControls>
    </div>
  );
}

const FIT_MARGIN = 0.95;

/** Fit the stage's SVG into view once, the way Capy's dialog does on open. */
export function useFitStage(view: PanZoomView, deps: unknown[] = []) {
  const { stage, setPan, setZoom, maxZoom, minZoom } = view;
  // biome-ignore lint/correctness/useExhaustiveDependencies: refit when the caller's inputs change
  useLayoutEffect(() => {
    if (!stage) return;
    setPan({ x: 0, y: 0 });
    const svg = stage.querySelector("svg");
    if (!svg || svg.clientWidth === 0 || svg.clientHeight === 0) {
      setZoom(1);
      return;
    }
    setZoom(
      clampZoom(
        Math.min(
          stage.clientWidth / svg.clientWidth,
          stage.clientHeight / svg.clientHeight,
        ) * FIT_MARGIN,
        maxZoom,
        minZoom,
      ),
    );
  }, [stage, setPan, setZoom, ...deps]);
}

/* ---------------------------------------------------------------- block */

export type MermaidExpandRegistry = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Registers the block's "open in new window" action; returns an unregister. */
  register: (detach: (() => void) | undefined) => (() => void) | undefined;
};

/** Lets a message (or the diagram shortcut) open a block's expanded view. */
export const MermaidExpandContext = createContext<
  MermaidExpandRegistry | undefined
>(undefined);

export type MermaidMessage = { jamId: string; messageId: string; text: string };

/** The agent message a block sits in, so "Open in new window" can address it. */
export const MermaidMessageContext = createContext<MermaidMessage | undefined>(
  undefined,
);

function HeaderButton({
  label,
  size = "icon-xs",
  onClick,
  children,
}: {
  label: string;
  size?: "icon-xs" | "icon-sm";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={size}
            aria-label={label}
            onClick={onClick}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

const COPIED_FOR = 2000;

/** Copy-source button shared by the block header, dialog and diagram window. */
export function MermaidCopyButton({
  text,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "children"> & {
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Button
      {...props}
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "Copied" : "Copy code"}
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_FOR);
      }}
    >
      {copied ? <CheckmarkIcon /> : <ClipboardIcon />}
    </Button>
  );
}

function MermaidDialog({
  open,
  onOpenChange,
  onDetach,
  text,
  svg,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetach: (() => void) | undefined;
  text: string;
  svg: string;
}) {
  const view = usePanZoom();
  useFitStage(view);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[calc(100dvh-3rem)] w-[calc(100dvw-3rem)] max-w-none overflow-hidden"
        onKeyDown={view.onKeyDown}
      >
        <DialogHeader>
          <div className="col-start-1 row-start-1 flex min-w-0 items-center justify-between gap-2">
            <DialogTitle>{mermaidTitle(text)}</DialogTitle>
            {onDetach !== undefined && (
              <HeaderButton
                label="Open in new window"
                size="icon-sm"
                onClick={() => {
                  onDetach();
                  onOpenChange(false);
                }}
              >
                <WindowAppIcon />
              </HeaderButton>
            )}
          </div>
        </DialogHeader>
        <MermaidStage svg={svg} view={view} placement="dialog">
          <MermaidCopyButton text={text} />
        </MermaidStage>
      </DialogContent>
    </Dialog>
  );
}

export type MarkdownMermaidDiagramProps = ComponentProps<"div">;

/** Wrapper around a rendered diagram; scrolls horizontally when the SVG is wider than the message. */
export function MarkdownMermaidDiagram(props: MarkdownMermaidDiagramProps) {
  return <div data-slot="markdown-mermaid-diagram" {...props} />;
}

export type MarkdownMermaidErrorProps = ComponentProps<"div">;

/** One-line parse error shown above the source when a finished block cannot be drawn. */
export function MarkdownMermaidError(props: MarkdownMermaidErrorProps) {
  return <div data-slot="markdown-mermaid-error" {...props} />;
}

const MIN_WIDTH_RATIO = 0.85;

/** Capy's shared/markdown MermaidBlock: header (language, expand, open in window, copy), diagram or source fallback. */
export function MarkdownMermaid({ text, complete }: MarkdownMermaidProps) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const expand = useContext(MermaidExpandContext);
  const message = useContext(MermaidMessageContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = localOpen || expand?.open === true;
  const setOpen = (next: boolean) => {
    setLocalOpen(next);
    if (!next) expand?.setOpen(false);
  };
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!element || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      {
        rootMargin:
          getComputedStyle(element)
            .getPropertyValue("--mermaid-lazy-margin")
            .trim() || undefined,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  const { diagram, error } = useMermaid({
    host,
    text,
    complete,
    active: visible || !complete,
    width,
  });

  const index =
    message === undefined ? undefined : mermaidIndexOf(message.text, text);
  const detach =
    message === undefined || index === undefined || diagram === undefined
      ? undefined
      : () =>
          openDiagramWindow(
            diagramHref(message.jamId, message.messageId, index),
            diagramWindowSize(diagram.width, diagram.height),
          );
  const detachRef = useRef(detach);
  useEffect(() => {
    detachRef.current = detach;
  });
  const drawn = diagram !== undefined;
  const canDetach = detach !== undefined;
  const register = expand?.register;
  useEffect(
    () =>
      drawn && register !== undefined
        ? register(canDetach ? () => detachRef.current?.() : undefined)
        : undefined,
    [drawn, canDetach, register],
  );

  return (
    <div data-component="markdown-mermaid" ref={host}>
      <div data-slot="markdown-code-header">
        <span data-slot="markdown-code-language">mermaid</span>
        <div className="flex items-center gap-0.5">
          {diagram !== undefined && (
            <HeaderButton label="Expand" onClick={() => setOpen(true)}>
              <ExpandIcon />
            </HeaderButton>
          )}
          {detach !== undefined && (
            <HeaderButton label="Open in new window" onClick={detach}>
              <WindowAppIcon />
            </HeaderButton>
          )}
          <Tooltip>
            <TooltipTrigger render={<MermaidCopyButton text={text} />} />
            <TooltipContent side="bottom">Copy code</TooltipContent>
          </Tooltip>
        </div>
      </div>
      {diagram === undefined ? (
        <>
          {error !== undefined && complete && (
            <MarkdownMermaidError title={error}>
              {error.split("\n")[0]?.replace(/:$/, "")}
            </MarkdownMermaidError>
          )}
          <pre
            data-mermaid-fallback={
              error !== undefined && complete ? "" : undefined
            }
          >
            <code>{text}</code>
          </pre>
        </>
      ) : (
        <MarkdownMermaidDiagram>
          <div
            style={{ minWidth: Math.round(diagram.width * MIN_WIDTH_RATIO) }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: pele output, links and images disabled
            dangerouslySetInnerHTML={{ __html: diagram.svg }}
          />
        </MarkdownMermaidDiagram>
      )}
      {diagram !== undefined && (
        <MermaidDialog
          open={open}
          onOpenChange={setOpen}
          onDetach={detach}
          text={text}
          svg={diagram.svg}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- window */

const WINDOW_RENDER_WIDTH = 960;

function Spinner({ label }: { label: string }) {
  return <DotGridIcon size="xs" role="status" aria-label={label} />;
}

function WindowStage({ svg }: { svg: string }) {
  const view = usePanZoom();
  const { stage, setPan, setZoom, zoom, pan } = view;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [fitted, setFitted] = useState<number>();
  useEffect(() => {
    if (!stage) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect)
        setSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stage]);
  const untouched =
    fitted === undefined || (zoom === fitted && pan.x === 0 && pan.y === 0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refit when the SVG changes
  useLayoutEffect(() => {
    if (!stage || !untouched || size.width === 0) return;
    const element = stage.querySelector("svg");
    if (!element || element.clientWidth === 0 || element.clientHeight === 0)
      return;
    const fit = clampZoom(
      Math.min(
        1,
        (size.width / element.clientWidth) * FIT_MARGIN,
        (size.height / element.clientHeight) * FIT_MARGIN,
      ),
    );
    setFitted(fit);
    setPan({ x: 0, y: 0 });
    setZoom(fit);
  }, [stage, svg, size, untouched, setPan, setZoom]);
  return <MermaidStage svg={svg} view={view} placement="window" />;
}

export type DiagramWindowProps = ComponentProps<"div"> & {
  /** Thread title shown after the diagram title. */
  threadTitle?: string;
  /** Mermaid source of the diagram; undefined when it is not (yet) in the message. */
  text?: string;
  /** True once the message settled or a later block exists; errors show only then. */
  complete?: boolean;
  /** The message loaded and has no diagram at this index. */
  notFound?: boolean;
  /** Opens the thread the diagram came from. */
  onOpenThread?: () => void;
};

/** Capy's features/thread/diagram-window: one diagram in its own window, pannable, with copy and open-thread. */
export function DiagramWindow({
  threadTitle,
  text,
  complete = false,
  notFound = false,
  onOpenThread,
  className,
  ...props
}: DiagramWindowProps) {
  const host = useRef<HTMLDivElement>(null);
  const title = text === undefined ? "Diagram" : mermaidTitle(text);
  useEffect(() => {
    document.title = title;
  }, [title]);
  const { diagram, error } = useMermaid({
    host,
    text: text ?? "",
    complete,
    active: true,
    width: WINDOW_RENDER_WIDTH,
  });
  return (
    <div
      ref={host}
      data-slot="diagram-window"
      className={[
        "flex h-dvh w-dvw flex-col overflow-hidden bg-background text-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <header className="flex h-10 shrink-0 items-center gap-2 border-b-hairline border-border-1 pr-2 pl-3">
        <span className="shrink-0 font-medium text-foreground">{title}</span>
        <span className="min-w-0 truncate text-muted-foreground-1">
          {threadTitle ?? "Untitled thread"}
        </span>
        {text !== undefined && !complete && (
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground-1">
            <Spinner label="Updating" />
            Updating
          </span>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <Button variant="ghost" size="xs" onClick={onOpenThread}>
            Open thread
            <ArrowUpRightIcon />
          </Button>
          {text !== undefined && (
            <Tooltip>
              <TooltipTrigger render={<MermaidCopyButton text={text} />} />
              <TooltipContent side="bottom">Copy code</TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>
      {notFound ? (
        <div className="grid min-h-0 flex-1 place-items-center bg-panel text-muted-foreground-1">
          Diagram not found
        </div>
      ) : diagram === undefined ? (
        <div className="grid min-h-0 flex-1 place-items-center bg-panel text-muted-foreground-1">
          {error !== undefined && complete ? (
            <span title={error}>Could not draw this diagram</span>
          ) : (
            <Spinner label="Loading diagram" />
          )}
        </div>
      ) : (
        <WindowStage svg={diagram.svg} />
      )}
    </div>
  );
}
