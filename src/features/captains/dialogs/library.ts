export type CaptainLibraryImage = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly uploadedBy: string;
  readonly createdAt: Date;
  readonly usedBy: number;
};

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Reads the undecoded captain library response into images, dropping malformed rows. */
export function toLibraryImages(value: unknown): CaptainLibraryImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row: unknown) => {
    if (typeof row !== "object" || row === null) return [];
    const record = row as Record<string, unknown>;
    const id = text(record.id);
    const url = text(record.url);
    if (id === "" || url === "") return [];
    return [
      {
        id,
        url,
        name: text(record.name),
        uploadedBy: text(record.uploadedBy),
        createdAt: new Date(text(record.createdAt)),
        usedBy: typeof record.usedBy === "number" ? record.usedBy : 0,
      },
    ];
  });
}

export const usedByLabel = (usedBy: number) =>
  usedBy === 0
    ? "No Captain uses it"
    : `Used by ${usedBy} ${usedBy === 1 ? "Captain" : "Captains"}`;

export const removeForEveryoneDescription = (
  image: { usedBy: number } | null,
) =>
  image === null || image.usedBy === 0
    ? "No Captain uses it, and it leaves every member's picker"
    : `${image.usedBy} ${image.usedBy === 1 ? "Captain using it goes" : "Captains using it go"} back to their capybara or emoji, background kept`;
