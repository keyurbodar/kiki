type ClickLike = Pick<
  MouseEvent,
  "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "defaultPrevented"
> & { preventDefault: () => void };

/**
 * A plain left click on an issue link opens it in place when the caller can; modified clicks
 * (new tab, new window) keep the link's own navigation.
 */
export function openIssueInPlace(
  event: ClickLike,
  onOpenIssue: ((code: string) => void) | undefined,
  code: string,
) {
  if (
    onOpenIssue === undefined ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }
  event.preventDefault();
  onOpenIssue(code);
  return true;
}
