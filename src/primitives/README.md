# primitives

Small, unstyled-by-default building blocks on Base UI that every component uses: icon, button, input, popover, menu, dialog, tooltip and so on. Each follows Capy's structure: a `data-slot` attribute naming the part, variants through `cva`, and styling only through token utilities from `src/tokens`.

## Icon

`icon/` holds Capy's icon set, extracted from the icon components in Capy's production bundle into one sprite (`sprite.svg`, 160 symbols on a 24px grid).

```tsx
import { Icon } from "~/primitives/icon";

<Icon name="archive" />                 // decorative, aria-hidden, --icon-base
<Icon name="check-circle-2" size="sm" /> // --icon-sm
<Icon name="search" label="Search" />    // role="img" with a <title>
```

`ICON_IDS` lists every id and `ICON_KEYWORDS` keeps Capy's search keywords for each. Icons draw with `currentColor`, so colour them with a text utility. Five ids exist twice in Capy with different art; the second copy carries an `-outline` suffix.
