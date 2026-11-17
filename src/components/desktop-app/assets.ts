const assets = import.meta.glob<string>("./assets/*", {
  eager: true,
  query: "?url",
  import: "default",
});

export const desktopAssetUrl = (file: string) => assets[`./assets/${file}`];
