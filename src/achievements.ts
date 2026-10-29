import type { Torrent } from "@/api";
import { bytes, days, rate } from "@/format";
import {
  Dumbbell,
  Gauge,
  HeartPulse,
  Hourglass,
  Sprout,
  TrendingUp,
  Upload,
  Zap,
  type LucideIcon,
} from "lucide-react";

// What a torrent has earned, worked out from its status alone: porla keeps no
// history. Only things that don't go away count (totals, age, the ratio),
// except the upload speed and Last one standing, which are about right now and
// say so. Times come from timestamps, not the status durations, which stop
// while a torrent is idle (BUG-62).

export type Tier = "bronze" | "silver" | "gold" | "platinum";

const tierRank: Record<Tier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
};

export type Earned = {
  id: string;
  title: string;
  detail: string;
  tier: Tier;
  icon: LucideIcon;
};

// A ladder of levels for one measure; the highest level reached is earned.
type Ladder = {
  id: string;
  icon: LucideIcon;
  name: string;
  value: (t: Torrent, now: number) => number | null;
  format: (n: number) => string;
  // The earned badge's line; "<name> <min>+" unless set.
  detail?: (min: number) => string;
  levels: { min: number; title: string; tier: Tier }[];
};

// One-off achievements: earned or not.
type Single = {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  tier: Tier;
  hint: string;
  earned: (t: Torrent, now: number) => boolean;
};

const DAY = 86400;
const GB = 1e9;
const MB = 1e6;

// Below 1% of the size downloaded: the data was already here (porla's ratio
// then counts copies of the torrent uploaded).
export const isOriginalSeed = (t: Torrent) =>
  t.is_finished && t.total > 0 && t.all_time_download < t.total / 100;

const seededFor = (t: Torrent, now: number) =>
  t.is_finished && t.completed_time > 0 ? now - t.completed_time : null;

const ladders: Ladder[] = [
  {
    id: "ratio",
    icon: TrendingUp,
    name: "Ratio",
    value: (t) => t.ratio,
    format: (n) => `${n}`,
    // In step with the list's ratio colours: gold from 3, glowing from 5.
    levels: [
      { min: 1, title: "Fair share", tier: "bronze" },
      { min: 2, title: "Paying it forward", tier: "silver" },
      { min: 3, title: "Generous soul", tier: "gold" },
      { min: 5, title: "Community pillar", tier: "gold" },
      { min: 10, title: "Local legend", tier: "platinum" },
    ],
  },
  {
    id: "uploaded",
    icon: Upload,
    name: "Uploaded",
    value: (t) => t.all_time_upload,
    format: bytes,
    levels: [
      { min: 1 * GB, title: "Sharing is caring", tier: "bronze" },
      { min: 100 * GB, title: "Heavy lifter", tier: "silver" },
      { min: 1000 * GB, title: "Bandwidth hero", tier: "gold" },
      { min: 10000 * GB, title: "Philanthropist", tier: "platinum" },
    ],
  },
  {
    id: "speed",
    icon: Gauge,
    name: "Upload at",
    value: (t) => t.upload_payload_rate,
    format: rate,
    detail: (min) => `${rate(min)}+ right now`,
    levels: [
      { min: 1 * MB, title: "Picking up speed", tier: "bronze" },
      { min: 10 * MB, title: "Full throttle", tier: "silver" },
      { min: 50 * MB, title: "Firehose", tier: "gold" },
      { min: 100 * MB, title: "Light speed", tier: "platinum" },
    ],
  },
  {
    id: "endurance",
    icon: Hourglass,
    name: "Seeding",
    value: seededFor,
    format: days,
    levels: [
      { min: 7 * DAY, title: "Stuck around", tier: "bronze" },
      { min: 30 * DAY, title: "In it for the long haul", tier: "silver" },
      { min: 365 * DAY, title: "Old friend", tier: "gold" },
      { min: 3 * 365 * DAY, title: "Keeper of the flame", tier: "platinum" },
    ],
  },
  {
    id: "size",
    icon: Dumbbell,
    name: "Size",
    value: (t) => (t.has_metadata ? t.total : null),
    format: bytes,
    levels: [
      { min: 100 * GB, title: "Big one", tier: "silver" },
      { min: 1000 * GB, title: "Absolute unit", tier: "gold" },
    ],
  },
];

const singles: Single[] = [
  {
    id: "original",
    icon: Sprout,
    title: "Where it started",
    detail: "Had it before anyone",
    tier: "gold",
    hint: "Seed something you already had",
    earned: (t) => isOriginalSeed(t),
  },
  {
    id: "speedrun",
    icon: Zap,
    title: "In a flash",
    detail: "1 GB+ in under 10 minutes",
    tier: "gold",
    hint: "Download 1 GB+ in under 10 minutes, from adding it",
    // From adding it, so time in the queue counts against it.
    earned: (t) =>
      t.completed_time > 0 &&
      t.total >= GB &&
      t.all_time_download >= t.total / 2 &&
      t.completed_time - t.added_time <= 600,
  },
  {
    id: "lifeline",
    icon: HeartPulse,
    title: "Last one standing",
    detail: "The only seed right now",
    tier: "platinum",
    hint: "Be the only seed left in the swarm",
    // The tracker's scrape counts us; -1 is unknown.
    earned: (t) => t.is_seeding && t.num_complete >= 0 && t.num_complete <= 1,
  },
];

export type Progress = {
  id: string;
  icon: LucideIcon;
  earned: Earned | null;
  // What's next: a title, what it takes, and how far along (0–1).
  next: { title: string; tier: Tier; need: string; progress: number } | null;
};

// Every achievement, earned or not, for the full list.
export function progress(t: Torrent, now: number): Progress[] {
  const fromLadders = ladders.map((l): Progress => {
    const v = l.value(t, now);
    const reached = v === null ? [] : l.levels.filter((x) => v >= x.min);
    const top = reached.at(-1);
    const next = l.levels[reached.length];

    return {
      id: l.id,
      icon: l.icon,
      earned: top
        ? {
            id: l.id,
            title: top.title,
            detail: l.detail?.(top.min) ?? `${l.name} ${l.format(top.min)}+`,
            tier: top.tier,
            icon: l.icon,
          }
        : null,
      next: next
        ? {
            title: next.title,
            tier: next.tier,
            need: `${l.name} ${l.format(next.min)}`,
            progress: v === null ? 0 : Math.min(1, v / next.min),
          }
        : null,
    };
  });

  const fromSingles = singles.map(
    (s): Progress => ({
      id: s.id,
      icon: s.icon,
      earned: s.earned(t, now)
        ? {
            id: s.id,
            title: s.title,
            detail: s.detail,
            tier: s.tier,
            icon: s.icon,
          }
        : null,
      next: s.earned(t, now)
        ? null
        : { title: s.title, tier: s.tier, need: s.hint, progress: 0 },
    }),
  );

  return [...fromLadders, ...fromSingles];
}

// The best earned, highest tier first; one-offs before ladders on a tie.
export function earned(t: Torrent, now: number): Earned[] {
  const order = [...singles.map((s) => s.id), ...ladders.map((l) => l.id)];

  return progress(t, now)
    .flatMap((p) => (p.earned ? [p.earned] : []))
    .sort(
      (a, b) =>
        tierRank[b.tier] - tierRank[a.tier] ||
        order.indexOf(a.id) - order.indexOf(b.id),
    );
}
