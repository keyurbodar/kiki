import { cx } from "class-variance-authority";

const DIGIT = /\d/;

export type RollingNumberProps = {
  value: string;
  className?: string;
};

export function RollingNumber({ value, className }: RollingNumberProps) {
  const chars = value.split("");
  return (
    <span
      className={cx(
        "inline-flex items-baseline leading-[inherit] tabular-nums",
        className,
      )}
    >
      <span className="sr-only">{value}</span>
      {chars.map((char, index) => {
        const key = `rpos-${chars.length - 1 - index}`;
        return DIGIT.test(char) ? (
          <span key={key} aria-hidden className="inline-block">
            <span className="relative inline-block">
              <span
                aria-hidden
                data-d={char}
                className="before:content-[attr(data-d)]"
              />
            </span>
          </span>
        ) : (
          <span
            key={key}
            aria-hidden
            data-c={char === " " ? "\u00a0" : char}
            className="inline-block whitespace-pre before:content-[attr(data-c)]"
          />
        );
      })}
    </span>
  );
}
