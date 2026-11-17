import type { ComponentProps } from "react";

export type ModelPickerProps = ComponentProps<"div">;

export function ModelPicker(props: ModelPickerProps) {
  return <div {...props} />;
}

export type PickerLabRailProps = ComponentProps<"div">;

export function PickerLabRail(props: PickerLabRailProps) {
  return <div data-slot="picker-lab-rail" {...props} />;
}

export type PickerLabCardProps = ComponentProps<"div">;

export function PickerLabCard(props: PickerLabCardProps) {
  return <div data-slot="picker-lab-card" {...props} />;
}

export type ModelPinProps = ComponentProps<"button">;

export function ModelPin(props: ModelPinProps) {
  return <button data-slot="model-pin" {...props} />;
}

export type ModelStageProps = ComponentProps<"div">;

export function ModelStage(props: ModelStageProps) {
  return <div data-slot="model-stage" {...props} />;
}
