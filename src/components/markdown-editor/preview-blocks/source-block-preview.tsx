import { useLayoutEffect, useRef, useState } from "react";
import type { SourceKind } from "../nodes";
import { DefinitionMarker } from "./definition-marker";
import { renderMarkdown } from "./render-markdown";

const VISIBLE_CONTENT = "svg, img, video, hr, details, table, iframe, .katex";

export const previewSource = (
  kind: SourceKind,
  text: string,
  definitions: string,
) =>
  (kind === "footnote" || kind === "reference") && definitions.length > 0
    ? `${text}\n\n${definitions}`
    : text;

export type SourceBlockPreviewProps = {
  kind: SourceKind;
  text: string;
  definitions: string;
};

export function SourceBlockPreview({
  kind,
  text,
  definitions,
}: SourceBlockPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState(false);
  const source = previewSource(kind, text, definitions);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the rendered source changes
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    setEmpty(
      (element.textContent ?? "").trim().length === 0 &&
        element.querySelector(VISIBLE_CONTENT) === null,
    );
  }, [source]);

  return (
    <>
      <div
        ref={ref}
        data-slot="preview"
        data-preview-kind={kind}
        hidden={empty}
      >
        {renderMarkdown(source)}
      </div>
      {empty ? <DefinitionMarker text={text} /> : null}
    </>
  );
}
