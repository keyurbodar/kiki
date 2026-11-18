/**
 * A switch that makes the mock answer a chosen request with a 500, so a test can
 * force a read to fail through the real client stack instead of fabricating a
 * result or reading the code.
 *
 * The mock's other failure mode is an unknown id, which only reaches the
 * surfaces that take one. List endpoints have no such lever, and the surfaces
 * that read them render an absence when the read failed — the defect this exists
 * to catch. Keep it test-only: nothing in the app calls `failMockRequests`, and
 * with no pattern set every request takes the normal path.
 */
let failing: RegExp | null = null;

/** Makes the mock fail every request whose URL matches, or clears the switch. */
export const failMockRequests = (pattern: RegExp | null) => {
  failing = pattern;
};

/** Whether this request is one the current test asked the mock to fail. */
export const failsMockRequest = (url: string) => failing?.test(url) ?? false;
