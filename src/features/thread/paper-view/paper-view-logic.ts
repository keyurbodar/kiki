export type PaperError = "not_connected" | "unavailable";

export function paperError(error: unknown): PaperError | undefined {
  const value = error instanceof Error ? error.message : String(error);
  if (value.includes("not_connected")) return "not_connected";
  if (value !== "" && value !== "undefined") return "unavailable";
  return undefined;
}

export function paperEmbedUrl(
  fileId: string,
  origin: string,
  pageId?: string,
): string {
  const suffix =
    pageId === undefined ? "" : `&page=${encodeURIComponent(pageId)}`;
  return `${origin}/embed/${encodeURIComponent(fileId)}?minimal${suffix}`;
}
