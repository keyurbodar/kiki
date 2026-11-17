import { cx } from "class-variance-authority";
import { type ComponentProps, useEffect, useRef } from "react";

export type ProgressEdgeProps = ComponentProps<"div"> & {
  active?: boolean;
  label?: string;
};

export function ProgressEdge({
  active = true,
  label = "Loading",
  className,
  style,
  ...props
}: ProgressEdgeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && ref.current !== null) ref.current.dataset.sweeping = "true";
  }, [active]);

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is status while active, as in Capy
    <div
      ref={ref}
      role={active ? "status" : undefined}
      aria-label={active ? label : undefined}
      aria-hidden={!active || undefined}
      data-active={active}
      data-slot="progress-edge"
      className={cx(
        "progress-edge pointer-events-none h-px bg-(--primary-soft) transition-opacity duration-fast ease-out",
        active ? "opacity-100" : "opacity-0",
        className,
      )}
      onTransitionEnd={(event) => {
        if (event.propertyName === "opacity" && !active)
          delete event.currentTarget.dataset.sweeping;
      }}
      style={{
        transitionDelay: active ? undefined : "var(--duration-fast)",
        ...style,
      }}
      {...props}
    />
  );
}
