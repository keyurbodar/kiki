# components

Composed UI built from `src/primitives`: composer, thread row, sidebar sections, cards, settings rows. Components keep Capy's `data-slot` names and variants, take their values from `src/tokens` only, and hold no data fetching. Anything tied to one screen belongs in `src/features` instead.
