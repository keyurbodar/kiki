/** Capy's payloads carry ISO timestamps; the page works in epoch milliseconds. */
export const epochMs = (value: Date) => value.getTime();
