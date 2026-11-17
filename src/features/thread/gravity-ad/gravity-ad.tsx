import { useEffect, useRef } from "react";

export type SponsoredAd = {
  clickUrl: string;
  impUrl?: string;
  url?: string;
  title?: string;
  brandName: string;
  adText: string;
};

export type SponsoredShown = { ad: SponsoredAd; icon?: string };

export const adHostname = (url: string | undefined) =>
  url !== undefined && URL.canParse(url) ? new URL(url).hostname : undefined;

const AD_BODY =
  "flex min-w-0 flex-col gap-1 px-4 py-2.5 text-xs [grid-area:1/1]";

function SponsoredContent({ ad, icon }: SponsoredShown) {
  const host = adHostname(ad.url);
  return (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {icon !== undefined && (
          <img src={icon} alt="" className="size-4 shrink-0 rounded-sm" />
        )}
        <span className="mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap [--mask-fade-ramp:--spacing(8)] text-foreground">
          {ad.title ?? ad.brandName}
        </span>
        <span className="shrink-0 text-2xs text-muted-foreground-3">Ad</span>
      </span>
      <span className="flex min-w-0 items-end gap-3 text-muted-foreground-2">
        <span className="mask-fade-r-clamp max-h-[3lh] min-w-0 flex-1 overflow-hidden [--mask-fade-ramp:--spacing(16)]">
          {ad.adText}
        </span>
        {host !== undefined && (
          <span className="shrink-0 underline underline-offset-2 transition-colors duration-hover group-hover/ad:text-muted-foreground-1">
            {host} ↗
          </span>
        )}
      </span>
    </>
  );
}

const useImpression = (
  impUrl: string | undefined,
  onImpression?: () => void,
) => {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef<string | undefined>(undefined);
  useEffect(() => {
    const node = ref.current;
    if (node === null || impUrl === undefined || fired.current === impUrl)
      return;
    const fire = () => {
      fired.current = impUrl;
      const pixel = new Image();
      pixel.src = impUrl;
      onImpression?.();
    };
    if (typeof IntersectionObserver === "undefined") {
      fire();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        fire();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [impUrl, onImpression]);
  return ref;
};

export type SponsoredCardProps = {
  shown: SponsoredShown;
  previous: SponsoredShown | null;
  onImpression?: () => void;
  onClick?: () => void;
};

export function SponsoredCard({
  shown,
  previous,
  onImpression,
  onClick,
}: SponsoredCardProps) {
  const ref = useImpression(shown.ad.impUrl, onImpression);
  return (
    <div
      ref={ref}
      data-slot="gravity-ad"
      className="pointer-events-auto relative mb-2 grid min-w-0 animate-crossfade-in [interpolate-size:allow-keywords] overflow-hidden rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card shadow-card motion-reduce:animate-none"
    >
      {previous !== null && (
        <div
          key={previous.ad.clickUrl}
          aria-hidden
          inert
          className={`${AD_BODY} absolute inset-x-0 top-0 animate-crossfade-out motion-reduce:hidden`}
        >
          <SponsoredContent {...previous} />
        </div>
      )}
      <a
        key={shown.ad.clickUrl}
        href={shown.ad.clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
        className={[
          "group/ad focus-visible:outline-ring-inset",
          AD_BODY,
          previous !== null &&
            "animate-crossfade-in motion-reduce:animate-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <SponsoredContent {...shown} />
      </a>
    </div>
  );
}
