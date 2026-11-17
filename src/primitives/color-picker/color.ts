export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const CHANNEL = /^\d{1,3}$/;

export type Channels = [string, string, string];

const byte = (value: number) => value.toString(16).padStart(2, "0");

export function toHex(red: number, green: number, blue: number): string {
  return `#${byte(red)}${byte(green)}${byte(blue)}`;
}

export function hexChannels(hex: string): Channels {
  return [1, 3, 5].map((start) =>
    String(Number.parseInt(hex.slice(start, start + 2), 16)),
  ) as Channels;
}

export function isChannel(value: string): boolean {
  return CHANNEL.test(value) && Number(value) <= 255;
}

export function replaceChannel(
  channels: Channels,
  index: number,
  value: string,
): Channels {
  return channels.map((channel, at) =>
    at === index ? value : channel,
  ) as Channels;
}

export function withChannel(hex: string, index: number, value: string): string {
  return `#${[0, 1, 2]
    .map((channel) =>
      channel === index
        ? byte(Number(value))
        : hex.slice(1 + channel * 2, 3 + channel * 2),
    )
    .join("")}`;
}
