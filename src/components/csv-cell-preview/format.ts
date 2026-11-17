export const PREVIEW_LIMIT = 100_000;

export type CellPreview = { json: boolean; cut: boolean; text: string };

const prettyJson = (text: string): string | undefined => {
  try {
    const pretty = JSON.stringify(JSON.parse(text), null, 2);
    return pretty.length <= PREVIEW_LIMIT ? pretty : undefined;
  } catch {
    return undefined;
  }
};

export function formatCellPreview(value: string): CellPreview {
  const trimmed = value.trim();
  const json =
    trimmed.length <= PREVIEW_LIMIT && /^[[{]/.test(trimmed)
      ? prettyJson(trimmed)
      : undefined;
  const text = json ?? value;
  return {
    json: json !== undefined,
    cut: text.length > PREVIEW_LIMIT,
    text: text.slice(0, PREVIEW_LIMIT),
  };
}
