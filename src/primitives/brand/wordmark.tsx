import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import { wordmarkSprite } from "@/assets/brand";

/** Capy cycles through these faces while the pointer rests on the wordmark. */
export const WORDMARK_FACE_COUNT = 5;
const FACE_STEP = 250;
const LIGHT_FACE_TRANSFORM = "matrix(1.0311 0 0 1.0208 -3.3941 -3.3694)";

export type WordmarkProps = {
  className?: string;
  /** Cycle the capybara's face on hover, as Capy's sidebar wordmark does. */
  faces?: boolean;
  /** Pin a face (1-5) instead of hovering; for specimens and tests. */
  face?: number;
};

function WordmarkArt({
  scheme,
  face,
  className,
}: {
  scheme: "light" | "dark";
  face: number;
  className: string;
}) {
  const ref = (id: string) => `${wordmarkSprite}#${id}`;
  const faceUse = face > 0 ? <use href={ref(`face-${face}`)} /> : null;
  return (
    <svg
      viewBox="0 0 212 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      data-scheme={scheme}
      className={className}
    >
      <use href={ref(`${scheme}-under`)} />
      {scheme === "light" && faceUse ? (
        <g transform={LIGHT_FACE_TRANSFORM}>{faceUse}</g>
      ) : (
        faceUse
      )}
      <use href={ref(`${scheme}-over`)} />
    </svg>
  );
}

export function Wordmark({ className, faces = false, face }: WordmarkProps) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step === 0) return;
    const timer = setTimeout(
      () => setStep(step === WORDMARK_FACE_COUNT ? 0 : step + 1),
      FACE_STEP,
    );
    return () => clearTimeout(timer);
  }, [step]);
  const shown = face ?? step;
  return (
    <span
      role="img"
      aria-label="Capy"
      data-slot="wordmark"
      data-face={shown || undefined}
      className={cx("inline-flex h-6 items-center", className)}
      onPointerEnter={faces ? () => setStep(1) : undefined}
      onPointerLeave={faces ? () => setStep(0) : undefined}
    >
      <WordmarkArt
        scheme="light"
        face={shown}
        className="h-full w-auto dark:hidden"
      />
      <WordmarkArt
        scheme="dark"
        face={shown}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}
