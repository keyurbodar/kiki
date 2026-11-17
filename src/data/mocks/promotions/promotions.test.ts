import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { OrgId } from "../../api/schemas/ids.ts";
import {
  DealRecipient,
  PromotionRecipient,
} from "../../api/schemas/promotion.ts";
import { ApiClient, makeApiClientLayer } from "../../client/ApiClient.ts";
import { MockTransport } from "../MockServices.ts";
import { samplePartnerOffers } from "./fixtures.ts";

const orgId = OrgId.make("org_sample_acme");

layer(makeApiClientLayer(MockTransport))("promotions mock", (it) => {
  it.effect("resolves codes case-insensitively and fails unknown ones", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const recipient = yield* client.promotions.getRecipientByCode({
        params: { code: "welcome50" },
      });
      assert.instanceOf(recipient, PromotionRecipient);
      const deal = yield* client.promotions.getRecipientByCode({
        params: { code: "STARTER" },
      });
      assert.instanceOf(deal, DealRecipient);
      const missing = yield* client.promotions
        .getByCode({ params: { code: "NOPE" } })
        .pipe(Effect.flip);
      assert.strictEqual(missing._tag, "capy/PromotionNotFound");
    }),
  );

  it.effect("delivers once, then reports already delivered", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const claim = client.promotions.claim({
        params: { promotionId: "prom_welcome" },
        payload: { orgId, code: "WELCOME50" },
      });
      assert.strictEqual((yield* claim).kind, "delivered");
      assert.strictEqual((yield* claim).kind, "already_delivered");
      const soldOut = yield* client.promotions.claim({
        params: { promotionId: "prom_soldout" },
        payload: { orgId },
      });
      assert.deepStrictEqual(soldOut, {
        kind: "rejected",
        reason: "exhausted",
      });
    }),
  );

  it.effect("claims a partner offer once", () =>
    Effect.gen(function* () {
      const client = yield* ApiClient;
      const offerId = samplePartnerOffers[0]?.id;
      assert.isDefined(offerId);
      if (offerId === undefined) return;
      const claim = client.promotions.claimPartnerOffer({
        params: { offerId },
        payload: { orgId },
      });
      assert.strictEqual((yield* claim).kind, "delivered");
      const offer = yield* client.promotions.getPartnerOffer({
        params: { offerId },
      });
      assert.strictEqual(offer.availability, "claimed");
      assert.deepStrictEqual(yield* claim, {
        kind: "ineligible",
        reason: "claimed",
      });
    }),
  );
});
