import { isoMinutesAgo, people, threads, world } from "../fixtures/world.ts";

export interface FolderDetail {
  id: string;
  name: string;
  position: number;
  access: string;
  hidden: boolean;
  ownerId: string;
  sharedWith: string[];
  itemIds: string[];
  createdAt: string;
}

export interface TagDetail {
  id: string;
  name: string;
  color: string;
  deletedAt: string | null;
  usageCount: number;
}

export interface TagAssignment {
  jamId: string;
  tagId: string;
}

export const folderDetails: FolderDetail[] = [
  {
    id: world.threadFolders[0].id,
    name: world.threadFolders[0].name,
    position: world.threadFolders[0].position,
    access: "org",
    hidden: false,
    ownerId: people.alex.id,
    sharedWith: [people.sam.id, people.priya.id],
    itemIds: [threads.checkoutTest.id, threads.darkMode.id, threads.bundler.id],
    createdAt: isoMinutesAgo(14 * 24 * 60),
  },
  {
    id: world.threadFolders[1].id,
    name: world.threadFolders[1].name,
    position: world.threadFolders[1].position,
    access: "members",
    hidden: false,
    ownerId: people.priya.id,
    sharedWith: [people.alex.id],
    itemIds: [threads.gettingStarted.id, threads.incidents.id],
    createdAt: isoMinutesAgo(6 * 24 * 60),
  },
];

export const tagDetails: TagDetail[] = world.threadTags.map((tag, index) => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
  deletedAt: null,
  usageCount: index + 1,
}));

export const threadTagAssignments: TagAssignment[] = [
  { jamId: threads.checkoutTest.id, tagId: world.threadTags[0].id },
  { jamId: threads.checkoutTest.id, tagId: world.threadTags[2].id },
  { jamId: threads.darkMode.id, tagId: world.threadTags[0].id },
  { jamId: threads.paginate.id, tagId: world.threadTags[1].id },
];

export const pinnedThreads: string[] = [
  threads.checkoutTest.id,
  threads.gettingStarted.id,
];

export const boardColumns: ReadonlyArray<{
  id: string;
  name: string;
  folderIds: ReadonlyArray<string>;
  position: number;
}> = [
  {
    id: "board_sample_active",
    name: "Active",
    folderIds: [world.threadFolders[0].id],
    position: 0,
  },
  {
    id: "board_sample_research",
    name: "Research",
    folderIds: [world.threadFolders[1].id],
    position: 1,
  },
];
