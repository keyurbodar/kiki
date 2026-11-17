export function previewDetail(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("ServicePreviewNotFound"))
    return "Port is not exposed on this thread";
  if (message.includes("InsufficientCredits"))
    return "Not enough credits to wake the machine";
  return message === "" ? "Nothing answered on the preview port" : message;
}

export function isSamePreview(
  left: { readonly machineId: string; readonly port: string } | undefined,
  right: { readonly machineId: string; readonly port: string } | undefined,
): boolean {
  return (
    left !== undefined &&
    right !== undefined &&
    left.machineId === right.machineId &&
    left.port === right.port
  );
}
