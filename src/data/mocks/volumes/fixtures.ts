import { driveFiles, isoMinutesAgo, org, people } from "../fixtures/world.ts";

export interface DriveShare {
  readonly id: string;
  readonly fileId: string;
  readonly path: string;
  readonly scope: "organization" | "public";
  readonly permission: "view" | "edit";
  readonly url: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly revokedAt: string | null;
}

export interface DriveVersion {
  readonly id: string;
  readonly volumeId: string;
  readonly label: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly fileCount: number;
}

export interface DriveChange {
  readonly id: string;
  readonly path: string;
  readonly kind: "added" | "modified" | "deleted";
  readonly sha256: string;
  readonly updatedAt: string;
}

export const volumeId = "vol_sample_acme";
export const organizationName = org.name;
export const organizationDomain = org.domain;

export const shares: ReadonlyArray<DriveShare> = [
  {
    id: "shr_sample_spec",
    fileId: driveFiles[0].id,
    path: driveFiles[0].path,
    scope: "organization",
    permission: "view",
    url: "https://capy.example/s/shr_sample_spec",
    createdBy: people.alex.id,
    createdAt: isoMinutesAgo(2 * 24 * 60),
    revokedAt: null,
  },
  {
    id: "shr_sample_chart",
    fileId: driveFiles[1].id,
    path: driveFiles[1].path,
    scope: "public",
    permission: "view",
    url: "https://capy.example/s/shr_sample_chart",
    createdBy: people.jordan.id,
    createdAt: isoMinutesAgo(24 * 60),
    revokedAt: null,
  },
];

export const versions: ReadonlyArray<DriveVersion> = [
  {
    id: "ver_sample_2",
    volumeId,
    label: "Release 2.4 notes",
    createdAt: isoMinutesAgo(30),
    createdBy: people.sam.id,
    fileCount: driveFiles.length,
  },
  {
    id: "ver_sample_1",
    volumeId,
    label: "Before release",
    createdAt: isoMinutesAgo(24 * 60),
    createdBy: people.alex.id,
    fileCount: driveFiles.length - 1,
  },
];

export const changes: ReadonlyArray<DriveChange> = [
  {
    id: "chg_sample_1",
    path: driveFiles[2].path,
    kind: "modified",
    sha256: "sha256_sample_notes",
    updatedAt: isoMinutesAgo(30),
  },
  {
    id: "chg_sample_2",
    path: driveFiles[0].path,
    kind: "added",
    sha256: "sha256_sample_spec",
    updatedAt: isoMinutesAgo(3 * 60),
  },
  {
    id: "chg_sample_3",
    path: "notes/old-plan.md",
    kind: "deleted",
    sha256: "sha256_sample_old",
    updatedAt: isoMinutesAgo(24 * 60),
  },
];

export const skills = [
  {
    id: "skill_sample_pdf",
    name: "PDF reader",
    description: "Extract text and tables from PDF files",
    enabled: true,
  },
  {
    id: "skill_sample_sheet",
    name: "Spreadsheet reader",
    description: "Read and update workbook cells",
    enabled: true,
  },
  {
    id: "skill_sample_slides",
    name: "Slide reader",
    description: "Read slide text from presentations",
    enabled: false,
  },
] as const;

export const scopes = [
  {
    id: "scope_sample_project",
    name: "project-kiki-design",
    path: "specs",
    writable: true,
    fileCount: 1,
  },
  {
    id: "scope_sample_org",
    name: "organization",
    path: "notes",
    writable: true,
    fileCount: 1,
  },
  {
    id: "scope_sample_user",
    name: "user",
    path: "reports",
    writable: false,
    fileCount: 1,
  },
] as const;

export const fileVersions = [
  {
    id: "fver_sample_spec_2",
    fileId: driveFiles[0].id,
    version: 2,
    sha256: "sha256_sample_spec_2",
    createdAt: isoMinutesAgo(3 * 60),
    createdBy: people.alex.id,
  },
  {
    id: "fver_sample_spec_1",
    fileId: driveFiles[0].id,
    version: 1,
    sha256: "sha256_sample_spec_1",
    createdAt: isoMinutesAgo(24 * 60),
    createdBy: people.alex.id,
  },
] as const;

export const agentContext = {
  title: "Checkout retry context",
  summary:
    "The checkout test times out when the payment gateway is slow. The draft pull retries gateway timeouts.",
  sources: [
    { path: driveFiles[0].path, excerpt: "Retry gateway timeouts twice." },
    { path: driveFiles[2].path, excerpt: "Release 2.4 ships the retry." },
  ],
};
