import {
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import appIconLarge from "@/assets/brand/app/icons/app-512.png";
import { MarkdownComponentsProvider } from "../components";
import { MarkdownGallery } from "../gallery";
import { Markdown } from "../markdown";
import landscape from "./markdown-parts-landscape.webp";

const fixtureSizes = new Map([
  [appIconLarge, { width: 512, height: 512 }],
  [landscape, { width: 1280, height: 900 }],
] as const);

function SpecimenGallery({ children }: { children?: ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).map(
    (item) => {
      if (!isValidElement<{ src?: unknown }>(item)) return item;
      const src = item.props.src;
      const size = typeof src === "string" ? fixtureSizes.get(src) : undefined;
      return size === undefined
        ? item
        : cloneElement(item as ReactElement<ComponentProps<"img">>, size);
    },
  );
  return <MarkdownGallery>{items}</MarkdownGallery>;
}

const CODE_AND_TABLE = [
  "Fenced code and a table in Capy's message column.",
  "",
  "```ts",
  "export function sum(a: number, b: number) {",
  "  return a + b;",
  "}",
  "",
  "console.log(sum(2, 3));",
  "```",
  "",
  "| Surface | Fill | Notes |",
  "| --- | --- | --- |",
  "| code header | panel | full-width bar |",
  "| table frame | border-1 | radius-card |",
  "| gallery | none | margin only |",
].join("\n");

const GALLERY = [
  `![app icon](${appIconLarge})`,
  "",
  `![landscape screenshot](${landscape})`,
].join("\n");

const GALLERY_SINGLE = `![landscape screenshot](${landscape})`;

/** Dev harness for the markdown parts: code header, table, gallery, video. */
export function MarkdownPartsPreview() {
  const video = new URL(
    "/art/markdown-video-fixture.mp4",
    window.location.origin,
  );
  video.hostname = "localhost";
  const videoMarkdown = `![screen recording](${video.href})`;
  return (
    <MarkdownComponentsProvider value={{ gallery: SpecimenGallery }}>
      <div className="mx-auto flex w-full max-w-(--container-3xl) flex-col gap-6 p-(--spacing-page-padding) font-sans text-foreground">
        <section data-harness="code-and-table">
          <Markdown text={CODE_AND_TABLE} />
        </section>
        <section data-harness="gallery">
          <Markdown text={GALLERY} gallery />
        </section>
        <section data-harness="gallery-single">
          <Markdown text={GALLERY_SINGLE} gallery />
        </section>
        <section data-harness="video">
          <Markdown text={videoMarkdown} />
        </section>
      </div>
    </MarkdownComponentsProvider>
  );
}
