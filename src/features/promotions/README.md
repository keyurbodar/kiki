# features/promotions

Owner: D9. Scope: promotion, offer and code pages; vm-handoff; dither cover.

One directory per unit. A unit directory holds its component, its tests and an `index.ts`. Route files under `src/routes/` import from here; nothing here imports from `src/routes/`. See [CONTRIBUTING.md](../../../CONTRIBUTING.md).

| Unit                   | Route                                 | What it holds                                                                                                                                     |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public-promotion/`    | shared                                | Page shell (wordmark, gift illustration), claim view, organization picker, terminal states, balance and trial cards, copy formatters, plan tiers. |
| `promotion-code-page/` | `/p/$code`, `/promotion/$promotionId` | Signed-out sign-up preview, signed-in claim by code (credits, trial, deal), legacy id redirect to `/p/$code`. Deal checkout is a UI-only stub.    |
| `partner-offer/`       | `/offer/$offerId`                     | Partner credits (YC Bookface, SoloFounders) claim.                                                                                                |

Data comes from the `promotions` HttpApi group (`src/data/api/groups/promotions.ts`) through the atoms in `src/data/atoms/promotions.ts`. In mock mode, codes `WELCOME50`, `LAUNCHPRO`, `PROTRIAL`, `STARTER`, `USED`, `SOLDOUT` and `MEMBERS` exercise each state.
