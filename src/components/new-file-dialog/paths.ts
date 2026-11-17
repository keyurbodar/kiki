export const joinPath = (directory: string, name: string) =>
  directory === "" ? name : `${directory}/${name}`;

export const pathCollisions = (existing: Iterable<string>, path: string) =>
  [...existing].filter(
    (candidate) =>
      candidate === path ||
      candidate.startsWith(`${path}/`) ||
      path.startsWith(`${candidate}/`),
  );

export const isValidSegment = (segment: string) =>
  segment !== "" && segment !== "." && segment !== "..";

export type NewFileCheck = {
  path: string;
  collides: boolean;
  valid: boolean;
};

export function checkNewFile(
  directory: string,
  existing: Iterable<string>,
  input: string,
): NewFileCheck {
  const name = input.trim().replace(/^\/+/, "");
  const path = joinPath(directory, name);
  const collides = name !== "" && pathCollisions(existing, path).length > 0;
  return {
    path,
    collides,
    valid: name !== "" && !collides && name.split("/").every(isValidSegment),
  };
}
