import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from ".";

export function PreviewCardSpecimen() {
  return (
    <div className="p-6">
      <PreviewCard open>
        <PreviewCardTrigger href="#preview" className="text-sm">
          Thread
        </PreviewCardTrigger>
        <PreviewCardContent side="bottom">Preview content</PreviewCardContent>
      </PreviewCard>
    </div>
  );
}
