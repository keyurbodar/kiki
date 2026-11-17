import { Effect, Ref } from "effect";
import {
  type ClaimOutcome,
  DealRecipient,
  PartnerOfferNotFound,
  PartnerOfferRecipient,
  PromotionNotFound,
  PromotionRecipient,
} from "../../api/schemas/promotion.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type SamplePromotion,
  samplePartnerOffers,
  samplePromotions,
  toCodePreview,
} from "./fixtures.ts";

const sameCode = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const outcomeOf = (
  sample: SamplePromotion,
  alreadyDelivered: boolean,
): ClaimOutcome => {
  switch (sample.outcome) {
    case "already_claimed":
      return { kind: "already_claimed" };
    case "exhausted":
      return { kind: "rejected", reason: "exhausted" };
    case "ineligible":
      return { kind: "ineligible", reason: "membership" };
    case "delivered": {
      const trialOutcome =
        !(sample.recipient instanceof DealRecipient) &&
        sample.recipient.trial !== null
          ? ("started" as const)
          : undefined;
      return {
        kind: alreadyDelivered ? "already_delivered" : "delivered",
        trialOutcome,
      };
    }
  }
};

export const PromotionsMock = mockGroup("promotions", (handlers) =>
  Effect.gen(function* () {
    const delivered = yield* Ref.make(new Set<string>());
    const offers = yield* Ref.make(samplePartnerOffers);

    const byCode = (code: string) =>
      samplePromotions.find((sample) => sameCode(sample.recipient.code, code));
    const byRef = (ref: string) =>
      samplePromotions.find(
        (sample) =>
          sample.recipient.id === ref || sameCode(sample.recipient.code, ref),
      );
    const notFound = (promotionId: string) =>
      Effect.fail(new PromotionNotFound({ promotionId }));

    return handlers
      .handle("getByCode", ({ params }) => {
        const sample = byCode(params.code);
        return sample
          ? Effect.succeed(toCodePreview(sample.recipient))
          : notFound(params.code);
      })
      .handle("getRecipientByCode", ({ params }) => {
        const sample = byCode(params.code);
        return sample
          ? Effect.succeed(sample.recipient)
          : notFound(params.code);
      })
      .handle("getRecipient", ({ params }) => {
        const recipient = byRef(params.promotionId)?.recipient;
        return recipient instanceof PromotionRecipient
          ? Effect.succeed(recipient)
          : notFound(params.promotionId);
      })
      .handle("claim", ({ params, payload }) => {
        const sample = byRef(params.promotionId);
        if (!sample) return notFound(params.promotionId);
        const key = `${sample.recipient.id}/${payload.orgId}`;
        return Ref.modify(delivered, (set) => [
          outcomeOf(sample, set.has(key)),
          sample.outcome === "delivered" ? new Set([...set, key]) : set,
        ]);
      })
      .handle("getPartnerOffer", ({ params }) =>
        Ref.get(offers).pipe(
          Effect.flatMap((list) => {
            const offer = list.find(
              (candidate) => candidate.id === params.offerId,
            );
            return offer
              ? Effect.succeed(offer)
              : Effect.fail(
                  new PartnerOfferNotFound({ offerId: params.offerId }),
                );
          }),
        ),
      )
      .handle("claimPartnerOffer", ({ params }) =>
        Ref.modify(
          offers,
          (
            list,
          ): readonly [
            ClaimOutcome | undefined,
            ReadonlyArray<PartnerOfferRecipient>,
          ] => {
            const offer = list.find(
              (candidate) => candidate.id === params.offerId,
            );
            if (!offer) return [undefined, list];
            if (offer.availability === "claimed")
              return [{ kind: "ineligible", reason: "claimed" }, list];
            if (offer.availability === "email_mismatch")
              return [{ kind: "ineligible", reason: "email" }, list];
            return [
              { kind: "delivered" },
              list.map((candidate) =>
                candidate.id === offer.id
                  ? new PartnerOfferRecipient({
                      ...candidate,
                      availability: "claimed",
                    })
                  : candidate,
              ),
            ];
          },
        ).pipe(
          Effect.flatMap((outcome) =>
            outcome
              ? Effect.succeed(outcome)
              : Effect.fail(
                  new PartnerOfferNotFound({ offerId: params.offerId }),
                ),
          ),
        ),
      );
  }),
);
