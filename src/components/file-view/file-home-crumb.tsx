import { Icon, type IconProps } from "@/primitives/icon";
import type { FileHome } from "./file-content";

const glyphClass = "shrink-0 text-muted-foreground-3";

const homeGlyph: Record<FileHome["kind"], IconProps["name"]> = {
  repo: "git",
  machine: "server-2",
  device: "studio-display",
  folder: "folder-1",
  drive: "cloud-simple",
  upload: "folder-upload",
};

const homeName = (home: FileHome) => {
  switch (home.kind) {
    case "repo":
      return home.repo;
    case "machine":
      return home.name ?? "Machine";
    case "device":
    case "folder":
      return home.name;
    case "drive":
      return home.location;
    case "upload":
      return "";
  }
};

export type FileHomeFit = { name?: string; branch: boolean };

export type FileHomeCrumbProps = {
  home: FileHome;
  fit?: FileHomeFit;
  onOpen?: () => void;
};

function FileHomeLabel({ home, fit }: { home: FileHome; fit: FileHomeFit }) {
  if (home.kind === "upload")
    return (
      <>
        <Icon name={homeGlyph.upload} size="xs" className={glyphClass} />
        <span className="sr-only">Upload</span>
      </>
    );
  const name = fit.name ?? homeName(home);
  const branch = home.kind === "repo" ? home.branch : undefined;
  return (
    <>
      <Icon name={homeGlyph[home.kind]} size="xs" className={glyphClass} />
      {name !== "" && <span data-home-name="">{name}</span>}
      {fit.branch && branch !== undefined && branch !== null && (
        <span data-home-branch="" className="text-muted-foreground-3">
          {branch}
        </span>
      )}
    </>
  );
}

export function FileHomeCrumb({
  home,
  fit = { branch: true },
  onOpen,
}: FileHomeCrumbProps) {
  if (onOpen === undefined)
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground-2">
        <FileHomeLabel home={home} fit={fit} />
      </span>
    );
  return (
    <button
      data-track-owner="shared/files/file-home.tsx#FileHomeCrumb:button[onClick=onOpen]"
      type="button"
      className="focus-gutter relative flex shrink-0 items-center gap-1.5 rounded text-muted-foreground-2 outline-none hover:text-foreground focus-visible:outline-ring-inset pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2"
      onClick={onOpen}
    >
      <FileHomeLabel home={home} fit={fit} />
    </button>
  );
}
