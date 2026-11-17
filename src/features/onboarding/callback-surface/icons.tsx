import type { ComponentProps } from "react";
import linearLogo from "./logos/linear.svg";
import paperLogo from "./logos/paper.svg";
import slackLogo from "./logos/slack.svg";

export function ArrowLeftIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        d="M10 6L4 12L10 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 12H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LogoProps = Omit<ComponentProps<"img">, "src" | "alt">;

function logo(src: string) {
  return function Logo({ className, ...props }: LogoProps) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        className={["size-(--icon-base)", className].filter(Boolean).join(" ")}
        {...props}
      />
    );
  };
}

export const LinearLogo = logo(linearLogo);
export const SlackLogo = logo(slackLogo);
export const PaperLogo = logo(paperLogo);
