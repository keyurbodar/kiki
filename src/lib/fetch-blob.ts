export const DOWNLOAD_STALL_TIMEOUT = 30_000;

export const fetchBlob = (
  url: string,
  signal?: AbortSignal,
  onProgress?: (loaded: number, total: number | undefined) => void,
) =>
  new Promise<Blob>((resolve, reject) => {
    const request = new XMLHttpRequest();
    let stall: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(stall);
      stall = setTimeout(() => {
        reject(new Error("Download failed: stalled"));
        request.abort();
      }, DOWNLOAD_STALL_TIMEOUT);
    };
    request.open("GET", url);
    request.responseType = "blob";
    request.onprogress = (event) => {
      arm();
      onProgress?.(
        event.loaded,
        event.lengthComputable ? event.total : undefined,
      );
    };
    request.onloadend = () => clearTimeout(stall);
    request.onload = () =>
      (request.status >= 200 && request.status < 300) ||
      (request.status === 0 && request.response !== null)
        ? resolve(request.response as Blob)
        : reject(new Error(`Download failed: ${request.status}`));
    request.onerror = () => reject(new Error("Download failed: network error"));
    request.onabort = () => reject(new Error("Download aborted"));
    signal?.addEventListener("abort", () => request.abort(), { once: true });
    arm();
    request.send();
  });
