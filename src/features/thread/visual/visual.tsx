import { useEffect, useRef, useState } from "react";
import { VisualRow as VisualRowSchema } from "@/data/events";
import type { Schema } from "effect";

type VisualRowData = Schema.Schema.Type<typeof VisualRowSchema>;

export type VisualRowProps = {
  row: VisualRowData;
  className?: string;
  onOpenExternal?: (url: string) => void;
};

const MIN_HEIGHT = 96;
const MAX_HEIGHT = 900;

function documentFor(html: string): string {
  return `<!doctype html><html><head><meta name="color-scheme" content="dark light"><style>html,body{margin:0;background:transparent;color:inherit;font:inherit}*{box-sizing:border-box}</style></head><body>${html}</body></html>`;
}

/** Capy's visual card: the model's HTML runs in an isolated allow-scripts frame. */
export function VisualRow({ row, className, onOpenExternal }: VisualRowProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data === null || typeof data !== "object") return;
      if (!("source" in data) || data.source !== "capy-visual") return;
      if (!("id" in data) || data.id !== row.toolCallId) return;
      if (!("type" in data)) return;
      if (data.type === "ready") setFailed(false);
      if (data.type === "error") setFailed(true);
      if (data.type === "height" && typeof data.value === "number") {
        setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(data.value))));
      }
      if (data.type === "link" && typeof data.value === "string") {
        const url = URL.parse(data.value);
        if (url?.protocol === "https:") {
          if (onOpenExternal === undefined) window.open(url.href, "_blank", "noopener,noreferrer");
          else onOpenExternal(url.href);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [row.toolCallId, onOpenExternal]);

  return (
    <div
      data-slot="visual"
      className={`flex min-w-0 flex-col pb-2 ${className ?? ""}`}
    >
      <div className="flex min-h-7 w-full items-center gap-1.5 py-1 text-xs font-medium text-muted-foreground-1">
        <span className="min-w-0 truncate">{row.title}</span>
      </div>
      {failed ? (
        <p className="py-1 text-sm text-muted-foreground-3">This visual could not be shown</p>
      ) : (
        <iframe
          ref={frame}
          title={row.title}
          sandbox="allow-scripts"
          srcDoc={documentFor(row.html)}
          className="block w-full border-0 bg-transparent"
          style={{ height, colorScheme: "light dark" }}
        />
      )}
    </div>
  );
}
