import { middleEllipsis } from "./file-kind";

export type CrumbsFit = {
  shown: number;
  branch: boolean;
  compact: boolean;
  ellipsis?: boolean;
  homeName?: string;
  file?: string;
  title?: string;
};

export function fitCrumbs(
  container: HTMLElement,
  measure: HTMLElement,
  upload: boolean,
): CrumbsFit {
  const width = (selector: string) =>
    measure.querySelector(selector)?.getBoundingClientRect().width ?? 0;
  const dirs = [...measure.querySelectorAll("[data-m=dir]")].map(
    (element) => element.getBoundingClientRect().width,
  );
  const fileNode = measure.querySelector<HTMLElement>("[data-m=file]");
  const homeNameNode = measure.querySelector<HTMLElement>("[data-home-name]");
  const branchNode = measure.querySelector("[data-home-branch]");
  const file = fileNode?.textContent ?? "";
  const homeName = homeNameNode?.textContent ?? "";
  const title = [homeName, branchNode?.textContent].filter(Boolean).join(" ");
  const sep = width("[data-m=sep]");
  const lead = upload ? 6 : sep;
  const version =
    measure.querySelector("[data-m=version]") === null
      ? 0
      : sep + width("[data-m=version]");
  const versionCompact = version === 0 ? 0 : width("[data-m=version-compact]");
  const home = width("[data-m=home]");
  const homeWithoutBranch =
    branchNode === null ? home : home - width("[data-home-branch]") - 6;
  const room = container.clientWidth - 5;
  const dirsWidth = (count: number) =>
    dirs.length === 0
      ? 0
      : (count < dirs.length ? width("[data-m=ellipsis]") + sep : 0) +
        dirs
          .slice(dirs.length - count)
          .reduce((sum, dir) => sum + dir + sep, 0);
  const fileWidth = width("[data-m=file]");
  const shown = [...dirs.keys()]
    .map((index) => dirs.length - index)
    .concat([0])
    .find(
      (count) => home + lead + dirsWidth(count) + fileWidth + version <= room,
    );
  if (shown !== undefined)
    return shown === dirs.length
      ? { shown, branch: true, compact: false }
      : { shown, branch: true, compact: false, title };
  if (homeWithoutBranch + lead + dirsWidth(0) + fileWidth + version <= room)
    return { shown: 0, branch: false, compact: false, title };
  const fixed = lead + dirsWidth(0) + versionCompact;
  if (homeWithoutBranch + fixed + fileWidth <= room)
    return { shown: 0, branch: false, compact: true, title };
  const context = document.createElement("canvas").getContext("2d");
  if (context === null || fileNode === null)
    return { shown: 0, branch: false, compact: true, title };
  const textWidth = (element: Element, text: string) => {
    const style = getComputedStyle(element);
    context.font = style.font;
    context.letterSpacing = style.letterSpacing;
    return context.measureText(text).width;
  };
  const longest = (length: number, fits: (count: number) => boolean) =>
    [...Array(length).keys()].map((index) => length - index).find(fits) ?? 1;
  const glyph =
    homeWithoutBranch - (homeNameNode?.getBoundingClientRect().width ?? 0);
  const homeRoom = room - fixed - fileWidth - glyph;
  const initial = homeName === "" ? "" : `${homeName.slice(0, 1)}…`;
  const cutHome =
    homeName === "" || homeNameNode === null
      ? undefined
      : homeRoom >= textWidth(homeNameNode, initial)
        ? `${homeName
            .slice(
              0,
              longest(
                homeName.length,
                (count) =>
                  textWidth(
                    homeNameNode,
                    `${homeName.slice(0, count).trimEnd()}…`,
                  ) <= homeRoom,
              ),
            )
            .trimEnd()}…`
        : initial;
  const cutHomeWidth =
    cutHome === undefined || homeNameNode === null
      ? 0
      : textWidth(homeNameNode, cutHome);
  if (fileWidth <= room - fixed - glyph - cutHomeWidth)
    return { shown: 0, branch: false, compact: true, homeName: cutHome, title };
  const fileRoom = room - fixed - glyph - cutHomeWidth + dirsWidth(0);
  if (fileWidth <= fileRoom)
    return {
      shown: 0,
      branch: false,
      compact: true,
      ellipsis: false,
      homeName: cutHome,
      title,
    };
  const cutFile = (limit: number) =>
    middleEllipsis(file, (text) => textWidth(fileNode, text) <= limit);
  const dropHome =
    textWidth(
      fileNode,
      middleEllipsis(file, () => false),
    ) > fileRoom;
  return {
    shown: 0,
    branch: false,
    compact: true,
    ellipsis: false,
    homeName: dropHome ? "" : cutHome,
    file: cutFile(dropHome ? fileRoom + cutHomeWidth : fileRoom),
    title,
  };
}
