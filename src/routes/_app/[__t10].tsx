import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { ChatMinimap, type ChatMinimapItem } from "@/features/thread/minimap";
import {
  defaultTiles,
  MAIN_TILE,
  SIDE_TILE,
  setTileRatio,
  TileGroup,
  TileSurface,
} from "@/features/thread-panes/tile-surface";

type Search = { state: "baseline" | "closed" | "expanded" };

export const Route = createFileRoute("/_app/__t10")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    state: s.state === "closed" || s.state === "expanded" ? s.state : "baseline",
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: Specimen,
});

const SAMPLE = `Here is a short sample reply. It walks through the plan in two steps and links to [the docs](https://example.com).

1. **Set up** the project and install dependencies.
2. **Run** the checks and review the output.

That should cover it.`;

const items = ["First question", "Second question", "Third question"].map(
  (text, i): ChatMinimapItem => ({
    id: `m${i}`,
    jumpKey: `m${i}`,
    rowIndex: i,
    text,
    answer: "A short answer.",
    viewer: true,
    actor: { type: "system", service: "system" },
    origin: { type: "system" },
  }),
);

function Specimen() {
  const { state } = Route.useSearch();
  const [node, setNode] = useState(defaultTiles);
  const [ticks] = useState(() => new Map<string, HTMLElement>());
  const [expanded, setExpanded] = useState<string | undefined>(
    state === "expanded" ? SIDE_TILE : undefined,
  );
  const [sideOpen, setSideOpen] = useState(state !== "closed");
  return (
    <TileSurface
      node={node}
      home={MAIN_TILE}
      shown={(id) => id !== SIDE_TILE || sideOpen}
      expanded={expanded}
      onExpand={setExpanded}
      onRatio={(path, ratio) => setNode((n) => setTileRatio(n, path, ratio))}
      renderGroup={(id) =>
        id === MAIN_TILE ? (
          <TileGroup
            id={id}
            strip={<span className="px-2 text-sm">Sample thread</span>}
            trailing={
              <button
                type="button"
                className="ml-auto px-2 text-sm"
                onClick={() => setSideOpen((o) => !o)}
              >
                Toggle pane
              </button>
            }
          >
            <div className="relative flex-1 overflow-y-auto px-4 py-6">
              <ChatMinimap items={items} tickMap={ticks} onSelect={() => {}} />
              <Markdown text={SAMPLE} />
            </div>
          </TileGroup>
        ) : (
          <TileGroup
            id={id}
            strip={<span className="px-2 text-sm">Overview</span>}
          >
            <div className="p-2 text-sm text-muted-foreground-2">Nothing here yet</div>
          </TileGroup>
        )
      }
    />
  );
}
