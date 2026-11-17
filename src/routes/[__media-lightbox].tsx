import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { MediaContextMenu } from "@/components/media-context-menu";
import {
  lightboxImageClassName,
  lightboxThumbnailClassName,
  MediaLightbox,
  MediaLightboxActions,
} from "@/components/media-lightbox";
import gift from "@/features/onboarding/onboarding/art/gift.svg?url";
import sit from "@/features/onboarding/onboarding/art/sit.svg?url";

type Search = { items: number };

export const Route = createFileRoute("/__media-lightbox")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    items: search.items === 1 ? 1 : 3,
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound();
  },
  component: MediaLightboxHarness,
});

const entry = (url: string, name: string, key: string) => ({
  key,
  label: name,
  kind: "image" as const,
  url,
});

const ENTRIES = [
  entry(gift, "gift.svg", "gift"),
  entry(sit, "sit.svg", "sit"),
  entry(gift, "gift-2.svg", "gift-2"),
];

function MediaLightboxHarness() {
  const { items } = Route.useSearch();
  const entries = items === 1 ? ENTRIES.slice(0, 1) : ENTRIES;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const source = (item: (typeof ENTRIES)[number]) => ({
    kind: item.kind,
    name: item.label,
    url: item.url,
  });
  return (
    <div className="grid h-dvh place-items-center p-8">
      <button
        type="button"
        className="text-sm text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        Open lightbox
      </button>
      {open ? (
        <MediaLightbox
          entries={entries}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setOpen(false)}
          renderMedia={(item) => (
            <MediaContextMenu {...source(item)} preview>
              <img
                crossOrigin="anonymous"
                src={item.url}
                alt={item.label}
                draggable={false}
                className={lightboxImageClassName}
              />
            </MediaContextMenu>
          )}
          renderThumbnail={(item) => (
            <img
              crossOrigin="anonymous"
              src={item.url}
              alt=""
              draggable={false}
              className={lightboxThumbnailClassName}
            />
          )}
          renderActions={(item) => <MediaLightboxActions {...source(item)} />}
        />
      ) : null}
    </div>
  );
}
