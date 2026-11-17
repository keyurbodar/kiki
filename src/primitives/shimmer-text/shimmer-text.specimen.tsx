import { ShimmerText } from "./shimmer-text";

export function ShimmerTextSpecimen() {
  return (
    <div className="flex flex-col gap-3 p-6 text-sm text-muted-foreground-1">
      <ShimmerText>Reviewing the latest changes</ShimmerText>
      <ShimmerText state="settling">Settling</ShimmerText>
      <ShimmerText state="rest">Resting</ShimmerText>
    </div>
  );
}
