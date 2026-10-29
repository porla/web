import {
  earned,
  isOriginalSeed,
  progress,
  type Earned,
  type Tier,
} from "@/achievements";
import { useRPC, type InfoHash, type Torrent } from "@/api";
import { prefixPath } from "@/base";
import type { ModalProps } from "@/components/modal";
import { bytes, days, duration, rate, ratio } from "@/format";
import clsx from "clsx";
import { DateTime } from "luxon";
import { ArrowUp, ExternalLink, type LucideIcon } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type TorrentStatsModalProps = {
  info_hash: InfoHash;
  session_id: number;
};

// The image is the card alone: the shine, the options and the buttons sit
// outside it.
export default function TorrentStatsModal({
  info_hash,
  session_id,
  close,
}: TorrentStatsModalProps & ModalProps) {
  const torrent = useRPC(
    "torrents.get",
    { info_hash, session_id },
    { refetchInterval: 2000, meta: { silent: true } },
  );

  const card = useRef<HTMLDivElement>(null);
  const [showName, setShowName] = useState(true);

  if (!torrent.isFetchedAfterMount && !torrent.data) {
    return <span className="loading loading-spinner"></span>;
  }

  if (!torrent.data) {
    return (
      <>
        <h3 className="font-bold text-lg">Share stats</h3>
        <p className="py-2">{torrent.error?.message ?? "Torrent not found"}</p>
        <div className="modal-action">
          <button type="button" className="btn" onClick={() => close()}>
            Close
          </button>
        </div>
      </>
    );
  }

  const t = torrent.data.torrent;
  // When the stats were read, for the times measured from now.
  const now = torrent.dataUpdatedAt / 1000;

  return (
    <>
      <h3 className="font-bold text-lg mb-3">Share stats</h3>
      <Fit width={CARD_WIDTH} max={SHOWN_WIDTH}>
        <div className="relative">
          <StatsCard ref={card} torrent={t} now={now} showName={showName} />
          <Shine />
        </div>
      </Fit>
      <AchievementList torrent={t} now={now} />
      <StatsActions card={card} onClose={() => close()}>
        {/* Next to Open image, since it changes what that makes. */}
        <label className="label text-sm">
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={showName}
            onChange={(e) => setShowName(e.target.checked)}
          />
          Show name
        </label>
      </StatsActions>
    </>
  );
}

const CARD_WIDTH = 560;
const SHOWN_WIDTH = 400;

// The card is laid out at one width, so every image looks the same; it's shown
// zoomed out to at most max, or to what fits.
function Fit({
  width,
  max,
  children,
}: {
  width: number;
  max: number;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    const el = outer.current!;
    const fit = () => setZoom(Math.min(max, el.clientWidth) / width);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, max]);

  return (
    <div ref={outer} className="w-full">
      <div className="mx-auto" style={{ width, zoom }}>
        {children}
      </div>
    </div>
  );
}

// A sweep of light over the card as it opens; not part of the image.
function Shine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]"
    >
      <div className="absolute inset-y-0 -left-1/2 w-1/3 bg-linear-to-r from-transparent via-white/15 to-transparent opacity-0 motion-safe:animate-[stats-shine_1.4s_ease-out_0.3s_both]" />
    </div>
  );
}

// The list's ratio steps (components/ratio.tsx) in their dark-mode shades:
// the card is always dark, whatever the theme.
const accents: [number, string][] = [
  [0.2, "#f87171"],
  [0.5, "#fb923c"],
  [0.8, "#fbbf24"],
  [1, "#a3e635"],
  [1.25, "#4ade80"],
  [1.5, "#34d399"],
  [2, "#2dd4bf"],
  [Infinity, "#fde047"],
];

const accentOf = (r: number) => accents.find(([max]) => r < max)![1];

// Gold glows from 3, brighter from 5, like the list.
const glowOf = (r: number, accent: string) =>
  r >= 5
    ? `0 0 28px ${accent}99, 0 0 64px ${accent}55`
    : r >= 3
      ? `0 0 24px ${accent}66, 0 0 48px ${accent}33`
      : "none";

function StatsCard({
  ref,
  torrent: t,
  now,
  showName,
}: {
  ref: RefObject<HTMLDivElement | null>;
  torrent: Torrent;
  now: number;
  showName: boolean;
}) {
  const [today] = useState(() => DateTime.now().toFormat("LLL d, yyyy"));

  const original = isOriginalSeed(t);
  const accent = accentOf(t.ratio);
  const badges = earned(t, now).slice(0, 3);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-[28px] p-8 text-slate-100"
      style={{
        width: CARD_WIDTH,
        background: [
          `radial-gradient(60% 45% at 50% 40%, ${accent}30, transparent 70%)`,
          "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.05) 1px, transparent 0) 0 0 / 18px 18px",
          "linear-gradient(160deg, #111827, #030712)",
        ].join(", "),
        boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <img src={prefixPath("/porla.svg")} alt="porla" className="size-9" />
        <span className="text-sm tabular-nums text-slate-400">{today}</span>
      </div>

      {showName && (
        <div className="mt-6 line-clamp-2 wrap-break-word text-2xl font-semibold leading-tight">
          {t.name}
        </div>
      )}

      <div className="mt-7 text-center">
        <div
          className="text-[104px] font-bold leading-none tracking-tight tabular-nums"
          style={{ color: accent, textShadow: glowOf(t.ratio, accent) }}
        >
          {ratio(t.ratio)}
          {original && <span className="text-6xl">×</span>}
        </div>
        <div className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-400">
          {original ? "Copies shared" : "Ratio"}
        </div>
        {t.upload_payload_rate > 0 && <Speed rate={t.upload_payload_rate} />}
      </div>

      {badges.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          {badges.map((b) => (
            <Badge key={b.id} badge={b} />
          ))}
        </div>
      )}

      <dl
        className={clsx(
          "grid grid-cols-3 gap-x-6 gap-y-5 border-t border-white/10 pt-6",
          badges.length > 0 ? "mt-6" : "mt-8",
        )}
      >
        {stats(t, now, original).map(([label, value, sub]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] uppercase tracking-widest text-slate-400">
              {label}
            </dt>
            <dd className="truncate text-lg font-semibold tabular-nums">
              {value}
            </dd>
            {sub && <dd className="truncate text-xs text-slate-400">{sub}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}

// Upload speed has a colour of its own, apart from the ratio's.
const SPEED = "#38bdf8";

// The upload speed right now, under the ratio; glowing from 10 MB/s.
function Speed({ rate: r }: { rate: number }) {
  return (
    <div
      className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2"
      style={{
        color: SPEED,
        background: `${SPEED}14`,
        boxShadow: `inset 0 0 0 1px ${SPEED}4d`,
      }}
    >
      <ArrowUp className="size-6" strokeWidth={2.5} />
      <span
        className="text-3xl font-bold tabular-nums"
        style={{ textShadow: r >= 10e6 ? `0 0 20px ${SPEED}80` : "none" }}
      >
        {rate(r)}
      </span>
    </div>
  );
}

// [label, value, line under it]
function stats(
  t: Torrent,
  now: number,
  original: boolean,
): [string, string, string?][] {
  const seeding: [string, string, string?] =
    t.is_finished && t.completed_time > 0
      ? [
          "Seeding since",
          DateTime.fromSeconds(t.completed_time).toFormat("LLL d, yyyy"),
          // Under a day it's hours and minutes; then whole days.
          `for ${now - t.completed_time < 86400 ? duration(now - t.completed_time) : days(now - t.completed_time)}`,
        ]
      : ["Progress", `${(t.progress * 100).toFixed(1)}%`];

  // The tracker's counts of the whole swarm; -1 when it hasn't said.
  const swarm: [string, string, string?] =
    t.num_complete >= 0
      ? [
          "Swarm",
          `${t.num_complete} ${t.num_complete === 1 ? "seed" : "seeds"}`,
          t.num_incomplete >= 0
            ? `${t.num_incomplete} ${t.num_incomplete === 1 ? "peer" : "peers"}`
            : undefined,
        ]
      : ["Swarm", "-", "no tracker data"];

  // Uploading, the speed is up top and this says to how many; idle, it says
  // when it last uploaded (never "0 B/s").
  const activity: [string, string, string?] =
    t.upload_payload_rate > 0
      ? [
          "Sharing with",
          `${t.num_uploads} ${t.num_uploads === 1 ? "peer" : "peers"}`,
          "right now",
        ]
      : t.last_upload >= 0
        ? ["Last upload", duration(t.last_upload), "ago"]
        : ["Last upload", "Not yet"];

  return [
    ["Uploaded", bytes(t.all_time_upload)],
    [
      "Downloaded",
      bytes(t.all_time_download),
      original ? "original seed" : undefined,
    ],
    ["Size", t.has_metadata ? bytes(t.total) : "-"],
    seeding,
    swarm,
    activity,
  ];
}

const metals: Record<Tier, [string, string]> = {
  bronze: ["#f5c08f", "#a0522d"],
  silver: ["#f8fafc", "#94a3b8"],
  gold: ["#fde68a", "#d97706"],
  platinum: ["#e0e7ff", "#818cf8"],
};

function Medal({
  icon: Icon,
  tier,
  locked = false,
}: {
  icon: LucideIcon;
  tier: Tier;
  locked?: boolean;
}) {
  const [light, dark] = metals[tier];

  return (
    <div
      className={clsx(
        "grid size-10 shrink-0 place-items-center rounded-full p-0.5",
        locked && "opacity-35 grayscale",
      )}
      style={{ background: `linear-gradient(145deg, ${light}, ${dark})` }}
    >
      <div className="grid size-full place-items-center rounded-full bg-slate-950">
        <Icon className="size-5" style={{ color: light }} />
      </div>
    </div>
  );
}

function Badge({ badge }: { badge: Earned }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-white/5 px-2 py-3 text-center ring-1 ring-white/10">
      <Medal icon={badge.icon} tier={badge.tier} />
      <div className="w-full min-w-0">
        <div className="truncate text-sm font-semibold">{badge.title}</div>
        <div className="truncate text-[11px] text-slate-400">
          {badge.detail}
        </div>
      </div>
    </div>
  );
}

// Everything there is to earn, and how close the torrent is to the next step.
function AchievementList({ torrent, now }: { torrent: Torrent; now: number }) {
  const all = progress(torrent, now);
  const count = all.filter((p) => p.earned).length;

  return (
    <details className="collapse collapse-arrow mt-3 rounded-box border border-base-300">
      <summary className="collapse-title text-sm font-medium">
        Achievements · {count} of {all.length}
      </summary>
      <ul className="collapse-content space-y-3 text-sm">
        {all.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <Medal
              icon={p.icon}
              tier={p.earned?.tier ?? p.next!.tier}
              locked={!p.earned}
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {p.earned?.title ?? p.next!.title}
                {p.earned && p.next && (
                  <span className="font-normal opacity-60">
                    {" "}
                    · next: {p.next.title}
                  </span>
                )}
              </div>
              <div className="text-xs opacity-60">
                {p.next ? p.next.need : p.earned!.detail}
              </div>
              {p.next && p.next.progress > 0 && (
                <progress
                  className="progress progress-primary mt-1 h-1.5 w-full"
                  value={p.next.progress}
                  max={1}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

function StatsActions({
  card,
  onClose,
  children,
}: {
  card: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The opened tabs show their image until they're reloaded; the URLs go when
  // the dialog does.
  const urls = useRef<string[]>([]);
  useEffect(() => {
    const opened = urls.current;
    return () => opened.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  // The image opens in a tab of its own, to save, copy or share from there.
  // The tab opens on the click, before the render: browsers block a tab opened
  // after an await. A blob URL, since browsers won't open data: URLs in a tab.
  const open = async () => {
    const tab = window.open("", "_blank");

    if (!tab) {
      setError("The browser blocked the new tab; allow pop-ups for Porla");
      return;
    }

    tab.document.title = "Porla torrent stats";
    tab.document.body.textContent = "Rendering stats image";

    setBusy(true);
    setError(null);

    try {
      // Twice the size, so it stays sharp on high-DPI screens and when scaled.
      // The library loads on first use, not with the list.
      const { domToBlob } = await import("modern-screenshot");
      // At the card's own size: on narrow screens it's shown zoomed out,
      // which its on-screen box would carry into the image.
      const node = card.current!;
      const blob = await domToBlob(node, {
        width: CARD_WIDTH,
        height: node.offsetHeight,
        scale: 2,
        type: "image/png",
        font: false,
      });
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      tab.location.href = url;
    } catch (e) {
      tab.close();
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {error && <p className="text-error text-sm mt-3">{error}</p>}
      <div
        data-sticky-footer
        className="modal-action sticky bottom-0 -mx-6 flex-wrap items-center gap-y-3 border-t border-base-300 bg-base-100 px-6 pt-4 pb-6"
      >
        <div className="mr-auto">{children}</div>
        {/* together, so they wrap as one */}
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void open()}
          >
            <ExternalLink className="size-4" />
            Open image
          </button>
        </div>
      </div>
    </>
  );
}
