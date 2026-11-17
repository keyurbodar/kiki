export const inviteDailyLimit = 10;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidInviteEmail = (email: string) => emailPattern.test(email);

export function splitEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function addEmails(current: string[], incoming: string[]): string[] {
  const seen = new Set(current.map((e) => e.toLowerCase()));
  const next = [...current];
  for (const email of incoming) {
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(email);
  }
  return next;
}

export const invitedSummary = (sent: number, total: number) =>
  sent === total
    ? `${sent} ${sent === 1 ? "friend" : "friends"} invited`
    : `${sent} of ${total} friends invited, some could not be reached so avoid resending the full list`;

export const inviteLabel = (count: number) =>
  count > 1 ? `Invite ${count} friends` : "Invite friend";
