export type ClassValue = string | false | null | undefined;

export const cn = (...values: ReadonlyArray<ClassValue>) =>
  values.filter((value) => typeof value === "string" && value !== "").join(" ");
