import { UserId } from "../../api/schemas/ids.ts";
import { UserProfile } from "../../api/schemas/user.ts";
import { minutesAgo } from "../fixtures/time.ts";
import { isoMinutesAgo, people } from "../fixtures/world.ts";

export const sampleUser = new UserProfile({
  id: UserId.make(people.alex.id),
  email: people.alex.email,
  firstName: people.alex.firstName,
  lastName: people.alex.lastName,
  imageUrl: null,
  superadmin: false,
  preferences: {
    theme: "system",
    codeFont: "mono",
    notifications: "mentions",
  },
  clientAppearance: { density: "comfortable" },
  onboardedAt: minutesAgo(60 * 24 * 30),
  createdAt: minutesAgo(60 * 24 * 31),
  updatedAt: minutesAgo(60 * 24),
});

export const sampleAccount = {
  id: people.alex.id,
  firstName: people.alex.firstName,
  lastName: people.alex.lastName,
  imageUrl: null,
  primaryEmailId: "email_sample_alex",
  emails: [
    {
      id: "email_sample_alex",
      email: people.alex.email,
      primary: true,
      verified: true,
    },
    {
      id: "email_sample_work",
      email: "alex.work@example.com",
      primary: false,
      verified: true,
    },
  ],
  createdAt: isoMinutesAgo(0),
} as const;

export const sampleAppearanceChanges = [
  {
    id: "change_sample_theme",
    field: "theme",
    from: "light",
    to: "system",
    source: "account",
    createdAt: isoMinutesAgo(0),
  },
  {
    id: "change_sample_font",
    field: "codeFont",
    from: "serif",
    to: "mono",
    source: "device",
    createdAt: isoMinutesAgo(0),
  },
] as const;

export const sampleAppearanceFiles = [
  {
    id: "appearance_file_sample_logo",
    name: "workspace-logo.png",
    mimeType: "image/png",
    size: 48_000,
    url: "https://static.example.com/appearance/workspace-logo.png",
    uploadedAt: isoMinutesAgo(0),
  },
] as const;

export const samplePasskeys = [
  {
    id: "passkey_sample_laptop",
    name: "Alex's laptop",
    deviceId: "machine_sample_laptop",
    createdAt: isoMinutesAgo(0),
    lastUsedAt: isoMinutesAgo(60),
    trusted: true,
  },
  {
    id: "passkey_sample_phone",
    name: "Alex's phone",
    deviceId: "machine_sample_desktop",
    createdAt: isoMinutesAgo(0),
    lastUsedAt: isoMinutesAgo(0),
    trusted: false,
  },
] as const;

export const sampleGitSigning = {
  enabled: true,
  keyId: "signing_sample_alex",
  publicKey: "ssh-ed25519 AAAAEXAMPLE alex@example.com",
  createdAt: isoMinutesAgo(0),
  rotatedAt: null,
} as const;
