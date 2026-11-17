export function DefinitionMarker({ text }: { text: string }) {
  return <pre data-slot="preview-marker">{text.split("\n")[0]}</pre>;
}
