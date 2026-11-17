import appIcon from "@/assets/brand/app/icons/app-192.png";
import appIconLarge from "@/assets/brand/app/icons/app-512.png";
import { Markdown } from "../markdown";

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
  `![capy app icon](${appIcon})`,
  "",
  `![capy app icon large](${appIconLarge})`,
].join("\n");

const GALLERY_SINGLE = `![capy app icon large](${appIconLarge})`;

const VIDEO = "![screen recording](https://example.com/screen-recording.mp4)";

/** Dev harness for the markdown parts: code header, table, gallery, video. */
export function MarkdownPartsPreview() {
  return (
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
        <Markdown text={VIDEO} />
      </section>
    </div>
  );
}
