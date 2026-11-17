import { DateTime } from "effect";
import { minutesAgo } from "../fixtures/time.ts";
import { devices, isoMinutesAgo, people, threads } from "../fixtures/world.ts";

export interface MobileSession {
  readonly id: string;
  readonly jamId: string;
  readonly threadTitle: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly ownerId: string;
  readonly status: "active" | "stopped";
  readonly startedAt: string;
  readonly stoppedAt: string | null;
  readonly lastHeartbeatAt: string;
  readonly stepsCompleted: number;
}

export const sampleSessions: ReadonlyArray<MobileSession> = [
  {
    id: "mobses_sample_1",
    jamId: threads.checkoutTest.id,
    threadTitle: threads.checkoutTest.title,
    deviceId: devices[0].id,
    deviceName: devices[0].name,
    ownerId: people.alex.id,
    status: "active",
    startedAt: isoMinutesAgo(22),
    stoppedAt: null,
    lastHeartbeatAt: isoMinutesAgo(1),
    stepsCompleted: 3,
  },
  {
    id: "mobses_sample_2",
    jamId: threads.darkMode.id,
    threadTitle: threads.darkMode.title,
    deviceId: devices[1].id,
    deviceName: devices[1].name,
    ownerId: people.sam.id,
    status: "active",
    startedAt: isoMinutesAgo(48),
    stoppedAt: null,
    lastHeartbeatAt: isoMinutesAgo(2),
    stepsCompleted: 5,
  },
  {
    id: "mobses_sample_3",
    jamId: threads.checkoutTest.id,
    threadTitle: threads.checkoutTest.title,
    deviceId: devices[2].id,
    deviceName: devices[2].name,
    ownerId: people.jordan.id,
    status: "stopped",
    startedAt: isoMinutesAgo(6 * 60),
    stoppedAt: isoMinutesAgo(5 * 60),
    lastHeartbeatAt: isoMinutesAgo(5 * 60),
    stepsCompleted: 2,
  },
];

export const stoppedAt = () => DateTime.formatIso(minutesAgo(0));
