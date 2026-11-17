import { createContext, type ReactNode, useContext } from "react";
import type { DriveLocation } from "./drive-location";
import {
  BoxGlyph,
  BuildingsGlyph,
  CalendarClockGlyph,
  CloudGlyph,
  FoldersGlyph,
  GithubGlyph,
  LaptopGlyph,
  PaperclipGlyph,
  UserGlyph,
} from "./glyphs";

export const homeGlyphClass = "size-(--icon-sm) shrink-0 text-icon-muted";

export type FileHomeValue =
  | { kind: "drive"; location: DriveLocation }
  | { kind: "folder"; name: string }
  | { kind: "repo"; repo: string; branch: string | null }
  | { kind: "machine"; jamId: string; threadTitle?: string | null }
  | { kind: "device"; name: string }
  | { kind: "upload" };

export type FileHomeFit = { branch: boolean; name?: string };

export type FileHomeNames = {
  captain?: (jamId: string) => string | undefined;
  project?: (projectId: string) => string | undefined;
  organization?: string;
  automation?: (automationId: string) => string | undefined;
};

export const FileHomeFitContext = createContext<FileHomeFit>({ branch: true });
export const FileHomeNamesContext = createContext<FileHomeNames>({});

export function HomeLabel({ glyph, name }: { glyph: ReactNode; name: string }) {
  const fit = useContext(FileHomeFitContext);
  return (
    <>
      {glyph}
      <span data-home-name aria-hidden={fit.name !== undefined || undefined}>
        {fit.name ?? name}
      </span>
      {fit.name !== undefined && <span className="sr-only">{name}</span>}
    </>
  );
}

function RepoHome({ repo, branch }: { repo: string; branch: string | null }) {
  const fit = useContext(FileHomeFitContext);
  return (
    <>
      <GithubGlyph className={homeGlyphClass} />
      <span data-home-name aria-hidden={fit.name !== undefined || undefined}>
        {fit.name ?? repo}
      </span>
      {fit.name !== undefined && <span className="sr-only">{repo}</span>}
      {branch !== null && fit.branch && (
        <span data-home-branch className="text-muted-foreground-3">
          {branch}
        </span>
      )}
      {branch !== null && !fit.branch && (
        <span className="sr-only">{branch}</span>
      )}
    </>
  );
}

function DriveHome({ location }: { location: DriveLocation }) {
  const names = useContext(FileHomeNamesContext);
  switch (location.kind) {
    case "captain":
      return (
        <HomeLabel
          glyph={<UserGlyph className={homeGlyphClass} />}
          name={names.captain?.(location.jamId) ?? "Captain"}
        />
      );
    case "project":
      return location.scope === "shared" ? (
        <HomeLabel
          glyph={<BoxGlyph className={homeGlyphClass} />}
          name={names.project?.(location.projectId) ?? "Project"}
        />
      ) : (
        <HomeLabel
          glyph={<UserGlyph className={homeGlyphClass} />}
          name="Your files"
        />
      );
    case "personal":
      return (
        <HomeLabel
          glyph={<UserGlyph className={homeGlyphClass} />}
          name="Your files"
        />
      );
    case "organization":
      return (
        <HomeLabel
          glyph={<BuildingsGlyph className={homeGlyphClass} />}
          name={names.organization ?? "Organization"}
        />
      );
    case "automation":
      return (
        <HomeLabel
          glyph={<CalendarClockGlyph className={homeGlyphClass} />}
          name={names.automation?.(location.automationId) ?? "Automation"}
        />
      );
  }
}

export function FileHome({ home }: { home: FileHomeValue }) {
  switch (home.kind) {
    case "drive":
      return <DriveHome location={home.location} />;
    case "folder":
      return (
        <HomeLabel
          glyph={<FoldersGlyph className={homeGlyphClass} />}
          name={home.name}
        />
      );
    case "repo":
      return <RepoHome repo={home.repo} branch={home.branch} />;
    case "machine":
      return (
        <HomeLabel
          glyph={<CloudGlyph className={homeGlyphClass} />}
          name={
            home.threadTitle == null ? "Machine" : `${home.threadTitle} machine`
          }
        />
      );
    case "device":
      return (
        <HomeLabel
          glyph={<LaptopGlyph className={homeGlyphClass} />}
          name={home.name}
        />
      );
    case "upload":
      return (
        <>
          <PaperclipGlyph className={homeGlyphClass} />
          <span className="sr-only">Upload</span>
        </>
      );
  }
}

export type FileHomeCrumbProps = {
  home: FileHomeValue;
  fit?: FileHomeFit;
  onOpen?: () => void;
};

export function FileHomeCrumb({
  home,
  fit = { branch: true },
  onOpen,
}: FileHomeCrumbProps) {
  const label = (
    <FileHomeFitContext.Provider value={fit}>
      <FileHome home={home} />
    </FileHomeFitContext.Provider>
  );
  if (onOpen === undefined)
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground-2">
        {label}
      </span>
    );
  return (
    <button
      data-track-owner="shared/files/file-home.tsx#FileHomeCrumb:button[onClick=onOpen]"
      type="button"
      className="focus-gutter relative flex shrink-0 items-center gap-1.5 rounded text-muted-foreground-2 outline-none hover:text-foreground focus-visible:outline-ring-inset pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2"
      onClick={onOpen}
    >
      {label}
    </button>
  );
}
