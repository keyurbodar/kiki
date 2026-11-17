# components

Capy's `shared/*` composites, one directory per composite. Each exports its component and props type with Capy's root `data-slot` where the bundle shows one. Props here are provisional: the owning package extends them additively (new optional props), never by renaming. Feature-owned building blocks (`features/thread/*` in Capy) live under `src/features/<group>/<unit>/` instead.

`route-placeholder/` renders the placeholder every route shows until its screen lands.
