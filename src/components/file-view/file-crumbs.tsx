import {
  Fragment,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@/primitives/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { type CrumbsFit, fitCrumbs } from "./crumbs-fit";
import type { FileHome } from "./file-content";
import { FileHomeCrumb } from "./file-home-crumb";
import { crumbDirs } from "./file-kind";

export const crumbSeparatorClass =
  "mx-0.5 inline shrink-0 align-[-0.15em] text-muted-foreground-3";

export function CrumbSeparator() {
  return (
    <Icon name="chevron-right" size="xs" className={crumbSeparatorClass} />
  );
}

const prefixes = (parts: string[]) =>
  parts.map((part, index) => ({
    part,
    first: index === 0,
    prefix: parts.slice(0, index + 1).join("/"),
  }));

function PathTitle({ path }: { path: string }) {
  return prefixes(path.split("/")).map(({ part, first, prefix }) => (
    <Fragment key={prefix}>
      {!first && (
        <>
          /<wbr />
        </>
      )}
      {part}
    </Fragment>
  ));
}

export type FileCrumbsVersion = {
  label: string;
  render: (compact: boolean) => ReactNode;
};

export type FileCrumbsProps = {
  home: FileHome;
  path: string;
  name: string;
  meta?: ReactNode;
  onCrumb?: (path: string) => void;
  version?: FileCrumbsVersion;
};

const coarsePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(pointer: coarse)").matches === true;

export function FileCrumbs({
  home,
  path,
  name,
  meta,
  onCrumb,
  version,
}: FileCrumbsProps) {
  const [open, setOpen] = useState(false);
  const [fit, setFit] = useState<CrumbsFit>();
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const dirs = crumbDirs(path, name);
  const upload = home.kind === "upload";

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (container === null || measure === null) return;
    const update = () => {
      const next = fitCrumbs(container, measure, upload);
      setFit((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [upload]);

  const shown = fit?.shown ?? dirs.length;
  const lead = upload ? (
    <span aria-hidden className="w-1.5 shrink-0" />
  ) : (
    <CrumbSeparator />
  );

  return (
    <div
      ref={containerRef}
      className="relative flex min-w-0 flex-1 items-center overflow-hidden"
    >
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 flex items-center text-xs whitespace-nowrap"
      >
        <span data-m="home" className="flex">
          <FileHomeCrumb home={home} />
        </span>
        <span data-m="sep" className="flex">
          <CrumbSeparator />
        </span>
        <span data-m="ellipsis">…</span>
        {prefixes(dirs).map(({ part, prefix }) => (
          <span key={prefix} data-m="dir">
            {part}
          </span>
        ))}
        <span data-m="file">{name}</span>
        {version !== undefined && (
          <>
            <span data-m="version" className="flex items-center gap-0.5">
              {version.label}
              <Icon name="chevron-grabber-vertical" size="xs" />
            </span>
            <span data-m="version-compact" className="flex items-center pl-1">
              <Icon name="chevron-grabber-vertical" size="xs" />
            </span>
          </>
        )}
      </span>
      <Tooltip
        open={open}
        onOpenChange={(next, details) =>
          setOpen(
            next &&
              details.reason === "trigger-hover" &&
              !coarsePointer() &&
              (meta !== undefined || fit?.title !== undefined),
          )
        }
      >
        <TooltipTrigger
          data-track-owner="shared/files/file-view.tsx#FileCrumbs:TooltipTrigger.1"
          render={
            <span className="ml-1 flex shrink-0 items-center text-xs whitespace-nowrap">
              <FileHomeCrumb
                home={home}
                fit={{ name: fit?.homeName, branch: fit?.branch ?? true }}
                onOpen={onCrumb === undefined ? undefined : () => onCrumb("")}
              />
              {fit?.homeName !== "" && lead}
              {shown < dirs.length && fit?.ellipsis !== false && (
                <>
                  <span className="text-muted-foreground-3">…</span>
                  <CrumbSeparator />
                </>
              )}
              {prefixes(dirs).map(({ part: dir, prefix }, index) =>
                index < dirs.length - shown ? null : (
                  <span
                    key={prefix}
                    className="flex items-center text-muted-foreground-3"
                  >
                    {onCrumb === undefined ? (
                      dir
                    ) : (
                      <button
                        data-track-owner="shared/files/file-view.tsx#FileCrumbs:button.1"
                        type="button"
                        className="focus-gutter relative rounded outline-none hover:text-foreground focus-visible:outline-ring-inset pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2"
                        onClick={() => onCrumb(prefix)}
                      >
                        {dir}
                      </button>
                    )}
                    <CrumbSeparator />
                  </span>
                ),
              )}
              <span className="text-muted-foreground-1">
                {fit?.file ?? name}
              </span>
            </span>
          }
        />
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-md [overflow-wrap:anywhere]"
        >
          {fit?.title !== undefined && <div>{fit.title}</div>}
          <PathTitle path={path} />
          {meta !== undefined && (
            <div className="text-muted-foreground-3">{meta}</div>
          )}
        </TooltipContent>
      </Tooltip>
      {version !== undefined && (
        <>
          {fit?.compact !== true && <CrumbSeparator />}
          {version.render(fit?.compact ?? false)}
        </>
      )}
    </div>
  );
}
