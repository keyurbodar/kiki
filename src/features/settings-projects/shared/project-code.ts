/** Capy derives a thread code from the repository name: letters only, four at most. */
export const deriveProjectCode = (name: string) => {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return letters.length >= 3 ? letters.slice(0, 4) : "CAPY";
};
