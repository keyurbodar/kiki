# primitives

Capy's `ui/*` layer: Base UI parts plus cva, one directory per primitive. Every file already exports the final API: component names, props types, cva variant keys and defaults read from Capy's bundle, and Capy's `data-slot` names. The class strings are empty and get filled in by A4 (controls), A5 (overlays), A6 (menus and pickers) and A7 (data and layout).

- `intent/` holds the shared intent list (neutral, accent, danger, warning, success, info, purple, pink, orange, lime) used by Button, Badge and Alert.
- `icon/` belongs to the assets package (A1/KIKI-10).
- Values only through tokens. No raw px, hex or ms here.
- Parts whose Base UI mapping was a judgement call: PreviewCard (`preview-card` on the positioner), CommandMenu (Dialog + Autocomplete), DialogPages, CopyField, OtpInput, ColorPicker, SortableList, VirtualList, Chart, DiffSurface. Owners may change the internals; the exported names and slots stay.
