import type { ComponentProps } from "react";

export type AnnotationProps = ComponentProps<"div">;

export function Annotation(props: AnnotationProps) {
  return <div {...props} />;
}

export type AnnotationPinProps = ComponentProps<"div">;

export function AnnotationPin(props: AnnotationPinProps) {
  return <div data-slot="annotation-pin" {...props} />;
}

export type AnnotationRegionProps = ComponentProps<"div">;

export function AnnotationRegion(props: AnnotationRegionProps) {
  return <div data-slot="annotation-region" {...props} />;
}

export type AnnotationRowProps = ComponentProps<"div">;

export function AnnotationRow(props: AnnotationRowProps) {
  return <div data-slot="annotation-row" {...props} />;
}

export type AnnotationPanelProps = ComponentProps<"div">;

export function AnnotationPanel(props: AnnotationPanelProps) {
  return <div data-slot="annotation-panel" {...props} />;
}

export type AnnotationIndexProps = ComponentProps<"span">;

export function AnnotationIndex(props: AnnotationIndexProps) {
  return <span data-slot="annotation-index" {...props} />;
}
