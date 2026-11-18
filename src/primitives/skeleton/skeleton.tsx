import {
  type SkeletonBoxProps,
  type SkeletonProps,
  type SkeletonSuspenseProps,
  Skeleton as SkulletSkeleton,
  SkeletonBox as SkulletSkeletonBox,
  SkeletonSuspense as SkulletSkeletonSuspense,
} from "skullet/react";

/**
 * Measured skeletons, ported from skullet (MIT, dependency-free). The content
 * itself renders from sample data, skullet lays it out unseen and draws a
 * skeleton in exactly that shape — a bar for every line of text, a block for
 * every image and control — then crossfades the real content in when it lands,
 * so nothing moves. The whole look is themed through the `--skullet-*` tokens
 * in src/tokens/components.css; nothing adjustable lives here.
 *
 * Like the toaster, this is the one import site: everything uses this
 * primitive, and a raw `skullet` import anywhere else is a red test in
 * skeleton.test.tsx.
 */

export function Skeleton<T>({ label = "Loading", ...props }: SkeletonProps<T>) {
  return <SkulletSkeleton label={label} {...props} />;
}

/** One hand-placed bar, for the rare shape a measured skeleton cannot draw. */
export function SkeletonBox(props: SkeletonBoxProps) {
  return <SkulletSkeletonBox {...props} />;
}

/** A Suspense boundary whose fallback is a measured skeleton. */
export function SkeletonSuspense({
  label = "Loading",
  ...props
}: SkeletonSuspenseProps) {
  return <SkulletSkeletonSuspense label={label} {...props} />;
}

export type { SkeletonBoxProps, SkeletonProps, SkeletonSuspenseProps };
