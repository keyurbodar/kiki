import { joinDrivePath, skillNamePattern } from "./authoring";

/** Capy refuses one upload over 32 MB in total. */
export const maxUploadBytes = 33554432;

export interface UploadFile {
  readonly path: string;
  readonly file: File;
}

export interface UploadChange {
  readonly path: string;
  readonly contentBase64: string;
}

const readBase64 = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });

/** Whether a dropped folder is one skill: a valid name holding SKILL.md, dropped at the root. */
export function isSkillUpload(
  files: ReadonlyArray<UploadFile>,
  directory: string,
) {
  const top = files[0]?.path.split("/")[0];
  return (
    directory === "" &&
    top !== undefined &&
    files.every((file) => file.path.startsWith(`${top}/`)) &&
    files.some((file) => file.path === `${top}/SKILL.md`) &&
    skillNamePattern.test(top)
  );
}

/** Write changes for an upload into `directory`, or undefined when it is over the limit. */
export async function buildUpload(
  files: ReadonlyArray<UploadFile>,
  directory: string,
) {
  const total = files.reduce((sum, file) => sum + file.file.size, 0);
  if (total > maxUploadBytes) return undefined;
  const skill = isSkillUpload(files, directory);
  const changes: ReadonlyArray<UploadChange> = await Promise.all(
    files.map(async (file) => ({
      path: joinDrivePath(skill ? "skills" : directory, file.path),
      contentBase64: await readBase64(file.file),
    })),
  );
  return { changes, skill };
}

/** Files from a file input, keeping folder-relative paths. */
export const filesFromList = (list: FileList | null): Array<UploadFile> =>
  list === null
    ? []
    : [...list].map((file) => ({
        path:
          file.webkitRelativePath === "" ? file.name : file.webkitRelativePath,
        file,
      }));

const readEntries = (reader: FileSystemDirectoryReader) =>
  new Promise<Array<FileSystemEntry>>((resolve, reject) =>
    reader.readEntries(resolve, reject),
  );

async function walk(entry: FileSystemEntry, into: Array<UploadFile>) {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    into.push({ path: entry.fullPath.replace(/^\//, ""), file });
    return;
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  for (;;) {
    const entries = await readEntries(reader);
    if (entries.length === 0) return;
    for (const child of entries) await walk(child, into);
  }
}

/** Files from a drop, walking dropped folders. */
export async function filesFromDrop(
  transfer: DataTransfer,
): Promise<Array<UploadFile>> {
  const entries = [...transfer.items].flatMap((item) => {
    const entry = item.webkitGetAsEntry();
    return entry === null ? [] : [entry];
  });
  if (entries.length === 0) {
    return [...transfer.files].map((file) => ({ path: file.name, file }));
  }
  const files: Array<UploadFile> = [];
  for (const entry of entries) await walk(entry, files);
  return files;
}

/** The success toast for an upload. */
export const uploadedMessage = (
  count: number,
  upload: {
    readonly skill: boolean;
    readonly changes: ReadonlyArray<UploadChange>;
  },
) =>
  upload.skill
    ? `Skill uploaded to skills/${upload.changes[0]?.path.split("/")[1]}`
    : `${count} ${count === 1 ? "file" : "files"} uploaded`;
