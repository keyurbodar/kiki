export const dealTitle = (recipient: Record<string, unknown> | undefined) => {
  if (recipient === undefined) return undefined;
  const code = typeof recipient.code === "string" ? recipient.code : "";
  const trialDays = Number(recipient.trialDays ?? 0);
  const cents = Number(recipient.introPriceCents ?? 0);
  return `${code} ${cents === 0 ? `free for ${trialDays} days` : `for $${(cents / 100).toFixed(2)}`}`;
};
