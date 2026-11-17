export const errorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) return fallback;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message !== "" ? message : fallback;
};
