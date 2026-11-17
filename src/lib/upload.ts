/** A `.invalid` host marks a mock upload target: nothing to PUT. */
export const isMockUploadUrl = (url: string) =>
  new URL(url).hostname.endsWith(".invalid");

/** PUTs a file to a presigned upload URL. */
export const putFile = (url: string, file: Blob, mediaType: string) =>
  new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", mediaType);
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Upload failed: ${request.status}`));
    request.onerror = () => reject(new Error("Upload failed"));
    request.send(file);
  });

export type AvatarUploadTarget = { uploadUrl: string; avatarKey: string };

/** Reads an avatar presign response; the endpoint is still undecoded. */
export const readAvatarUploadTarget = (
  value: unknown,
): AvatarUploadTarget | undefined => {
  if (typeof value !== "object" || value === null) return undefined;
  const { uploadUrl, avatarKey } = value as Record<string, unknown>;
  return typeof uploadUrl === "string" && typeof avatarKey === "string"
    ? { uploadUrl, avatarKey }
    : undefined;
};

/** Uploads an image through a presigned target unless the target is a mock. */
export const uploadToTarget = async (
  target: AvatarUploadTarget,
  file: File,
) => {
  if (!isMockUploadUrl(target.uploadUrl))
    await putFile(target.uploadUrl, file, file.type);
};
