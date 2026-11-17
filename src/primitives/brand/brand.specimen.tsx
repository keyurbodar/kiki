import { APP_ASSETS, CAPY_ILLUSTRATION_NAMES } from "@/assets/brand";
import { CapyLogo, CapyMark } from "@/components/capy-logo";
import {
  AppIcon,
  CapyIllustration,
  WORDMARK_FACE_COUNT,
  Wordmark,
} from "./index";

const FACES = Array.from({ length: WORDMARK_FACE_COUNT }, (_, i) => i + 1);

export function BrandSpecimen() {
  return (
    <div
      data-specimen="brand"
      className="flex flex-col gap-8 p-8 text-foreground"
    >
      <section className="flex flex-wrap items-center gap-6">
        <Wordmark faces className="h-15" />
        {FACES.map((face) => (
          <Wordmark key={face} face={face} className="h-10" />
        ))}
      </section>
      <section className="flex flex-wrap items-center gap-6">
        <CapyMark className="h-12" />
        <CapyLogo className="h-12" />
        <AppIcon />
        <img
          src={APP_ASSETS["/favicon.svg"]}
          alt="favicon"
          className="size-8"
        />
      </section>
      <section className="flex flex-wrap items-end gap-6">
        {CAPY_ILLUSTRATION_NAMES.map((name) => (
          <CapyIllustration
            key={name}
            name={name}
            alt={name}
            className="size-20"
          />
        ))}
      </section>
    </div>
  );
}
