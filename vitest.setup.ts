import { configure } from "@testing-library/react";

configure({ asyncUtilTimeout: 5_000 });

/**
 * torph cancels its animation when the text changes again or the component
 * unmounts, and never handles the rejection that cancel produces: a browser's
 * `finished` promise rejects with an AbortError on cancel. In the app that is
 * console noise; here it is an unhandled rejection that fails a shard, which is
 * how #585 went red on a thread view that renders a cost chip and unmounts
 * mid-morph. Take the rejection on every animation the suite creates, so the
 * morph keeps its real markup (the accessible copy the tests assert) and the
 * cancel is not reported as a failure.
 */
const animate = Element.prototype.animate;
if (animate !== undefined) {
  Element.prototype.animate = function patchedAnimate(
    ...args: Parameters<typeof animate>
  ) {
    const animation = animate.apply(this, args);
    animation.finished.catch(() => {});
    return animation;
  };
}
