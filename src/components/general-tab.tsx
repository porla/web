import { useRPC, type InfoHash, type Torrent } from "@/api";
import PieceProgress from "./pieces-progress";
import { binaryBytes, bytes, date, duration, rate } from "@/format";
import { Fragment, type ReactNode } from "react";
import CopyButton from "./copy-button";
import { torrentStatus, type Tone } from "@/torrent-status";
import Dash from "./dash";

type GeneralTabProps = {
  info_hash: InfoHash;
  session_id: number;
  torrent: Torrent | undefined;
};

// libtorrent reports "no limit" as -1, 0 or 2^24 - 1 depending on the field.
const limited = (n: number) => n > 0 && n < 16777215;

// The sidebar filters' colors, solid so they read in light and dark mode.
// Class names are spelled out for Tailwind.
const badges: Record<Tone, string> = {
  downloading: "bg-green-300 border-green-300 text-green-950",
  seeding: "bg-blue-300 border-blue-300 text-blue-950",
  finished: "bg-purple-300 border-purple-300 text-purple-950",
  paused: "bg-orange-300 border-orange-300 text-orange-950",
  error: "bg-red-300 border-red-300 text-red-950",
  other: "badge-ghost",
};

// Same rule as the backend's Utils::ETA: what's left of the selected files at
// the current payload rate.
function eta(t: Torrent) {
  const left = t.total_wanted - t.total_wanted_done;
  if (left <= 0) return null;
  return t.download_payload_rate > 0
    ? duration(left / t.download_payload_rate)
    : "∞";
}

// Utils::RealRatio caps at MAX_RATIO (9999) when nothing was downloaded.
const ratio = (r: number) => (r >= 9999 ? "∞" : r.toFixed(2));

function trackerHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// The bitfield only has the piece count; piece sizes are powers of two, so the
// smallest one that covers size / count is the piece size.
function pieceSize(total: number, count: number) {
  if (count === 0 || total === 0) return 0;
  return 2 ** Math.ceil(Math.log2(total / count));
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">
        {title}
      </h4>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-0.5 text-sm">
        {children}
      </dl>
    </section>
  );
}

function Row({ name, children }: { name: string; children: ReactNode }) {
  return (
    <>
      <dt className="opacity-60">{name}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

// "↓ a ↑ b", wrapping between the two halves only.
function Pair({ down, up }: { down: string; up: string }) {
  return (
    <>
      <span className="whitespace-nowrap">↓ {down}</span>{" "}
      <span className="whitespace-nowrap">↑ {up}</span>
    </>
  );
}

// A long value with its copy button kept next to it. Paths wrap after a "/",
// hashes (mono) anywhere.
function Copyable({
  text,
  label,
  mono,
}: {
  text: string;
  label: string;
  mono?: boolean;
}) {
  return (
    <span className="flex items-start gap-1">
      {mono ? (
        <span className="font-mono text-xs break-all pt-0.5">{text}</span>
      ) : (
        <span className="wrap-anywhere">
          {text.split("/").map((part, i) => (
            <Fragment key={i}>
              {i > 0 && (
                <>
                  /<wbr />
                </>
              )}
              {part}
            </Fragment>
          ))}
        </span>
      )}
      <CopyButton text={text} label={label} />
    </span>
  );
}

export default function GeneralTab({
  info_hash,
  session_id,
  torrent: t,
}: GeneralTabProps) {
  const pieces = useRPC(
    "torrents.pieces.get",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  // Rate limits aren't in the status; they change only through the properties
  // dialog, so this isn't polled.
  const properties = useRPC("torrents.properties.get", {
    info_hash,
    session_id,
  });

  if (!t || pieces.isLoading || !pieces.data) {
    return <span className="loading loading-spinner m-3" />;
  }

  const st = torrentStatus(t);
  const s = { label: st.label, badge: badges[st.tone] };

  const left = eta(t);
  const pieceCount = pieces.data.pieces[0];
  const lastActivity = [t.last_download, t.last_upload].filter((n) => n >= 0);
  const [v1, v2] =
    typeof t.info_hash === "string" ? [t.info_hash, null] : t.info_hash;
  const dlLimit = properties.data?.download_limit ?? -1;
  const ulLimit = properties.data?.upload_limit ?? -1;
  const options = [
    t.flags.includes("sequential_download") && "Sequential",
    t.flags.includes("super_seeding") && "Super seeding",
    t.flags.includes("upload_mode") && "Upload only",
    t.flags.includes("share_mode") && "Share mode",
    !t.flags.includes("auto_managed") && "Not auto-managed",
  ].filter(Boolean);

  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {t.errc ? (
          // A solid "Error" joined to the message in the soft style; badges are
          // one line high by default, so the message can grow.
          <span role="alert" className="join items-stretch">
            <span className={`badge join-item h-auto ${s.badge}`}>
              {s.label}
            </span>
            <span className="badge join-item h-auto min-h-5 py-0.5 text-left bg-red-300/15 border-red-300/30 text-red-800 dark:text-red-300">
              {t.errc.message}
            </span>
          </span>
        ) : (
          <span className={`badge ${s.badge}`}>{s.label}</span>
        )}
        <span className="font-semibold">{(t.progress * 100).toFixed(1)}%</span>
        {left && s.label === "Downloading" && <span>{left} left</span>}
        <span className="opacity-70">↓ {rate(t.download_payload_rate)}</span>
        <span className="opacity-70">↑ {rate(t.upload_payload_rate)}</span>
      </div>

      {t.has_metadata && (
        <PieceProgress
          pieces={pieces.data.pieces}
          verified={pieces.data.verified_pieces}
        />
      )}

      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(max-content,1fr)_minmax(0,1.4fr)]">
        <Section title="Transfer">
          {/* The all-time counters are updated on a tick and can briefly lag
              this session's. */}
          <Row name="Downloaded">
            {bytes(Math.max(t.all_time_download, t.total_payload_download))}
          </Row>
          <Row name="Uploaded">
            {bytes(Math.max(t.all_time_upload, t.total_payload_upload))}
          </Row>
          <Row name="This session">
            <Pair
              down={bytes(t.total_payload_download)}
              up={bytes(t.total_payload_upload)}
            />
          </Row>
          <Row name="Ratio">
            {t.ratio.toFixed(2)}
            {t.ratio_real.toFixed(2) !== t.ratio.toFixed(2) && (
              <span
                className="opacity-60"
                title="Counting only what this client downloaded"
              >
                {" "}
                (own {ratio(t.ratio_real)})
              </span>
            )}
          </Row>
          <Row name="Wasted">
            {bytes(t.total_failed_bytes + t.total_redundant_bytes)}
          </Row>
          <Row name="Limits">
            <Pair
              down={limited(dlLimit) ? rate(dlLimit) : "unlimited"}
              up={limited(ulLimit) ? rate(ulLimit) : "unlimited"}
            />
          </Row>
        </Section>

        <Section title="Swarm">
          {/* "of N" is the tracker's count (-1 if unknown); it can lag behind
              who is actually connected. */}
          <Row name="Seeds">
            <span title="Connected, of the seeds the tracker reports">
              {t.num_seeds}
              {t.num_complete >= t.num_seeds && <> of {t.num_complete}</>}
            </span>
          </Row>
          <Row name="Peers">
            <span title="Connected, of the peers the tracker reports">
              {t.num_peers - t.num_seeds}
              {t.num_incomplete >= t.num_peers - t.num_seeds && (
                <> of {t.num_incomplete}</>
              )}
            </span>
          </Row>
          <Row name="Connections">
            {t.num_connections}
            {limited(t.connections_limit) && <> of {t.connections_limit} max</>}
          </Row>
          <Row name="Availability">
            {t.has_metadata && t.distributed_copies >= 0 ? (
              t.distributed_copies.toFixed(2)
            ) : (
              <Dash />
            )}
          </Row>
          <Row name="Tracker">
            {/* The host; the Trackers tab has the rest. */}
            <span title={t.current_tracker} className="wrap-anywhere">
              {trackerHost(t.current_tracker) || <Dash />}
            </span>
          </Row>
          <Row name="Next announce">
            {t.next_announce > 0 ? `in ${duration(t.next_announce)}` : <Dash />}
          </Row>
        </Section>

        <Section title="Time">
          <Row name="Added">
            <span className="whitespace-nowrap">{date(t.added_time)}</span>
          </Row>
          {t.completed_time > 0 && (
            <Row name="Completed">
              <span className="whitespace-nowrap">
                {date(t.completed_time)}
              </span>
            </Row>
          )}
          <Row name="Active">{duration(t.active_duration)}</Row>
          {t.seeding_duration > 0 && (
            <Row name="Seeding">{duration(t.seeding_duration)}</Row>
          )}
          <Row name="Last activity">
            {lastActivity.length
              ? `${duration(Math.min(...lastActivity))} ago`
              : "never"}
          </Row>
          <Row name="Last seen complete">
            <span className="whitespace-nowrap">
              {date(t.last_seen_complete)}
            </span>
          </Row>
        </Section>

        <Section title="Information">
          <Row name="Size">
            {t.has_metadata ? bytes(t.total_wanted) : <Dash />}
            {t.total_wanted !== t.total && (
              <span className="opacity-60"> selected of {bytes(t.total)}</span>
            )}
          </Row>
          {t.has_metadata && pieceCount > 0 && (
            <Row name="Pieces">
              {pieceCount.toLocaleString()} ×{" "}
              {binaryBytes(pieceSize(t.total, pieceCount))}
            </Row>
          )}
          <Row name="Save path">
            <Copyable text={t.save_path} label="save path" />
          </Row>
          {v1 && (
            <Row name="Info hash v1">
              <Copyable text={v1} label="info hash v1" mono />
            </Row>
          )}
          {v2 && (
            <Row name="Info hash v2">
              <Copyable text={v2} label="info hash v2" mono />
            </Row>
          )}
          {t.$userdata?.category && (
            <Row name="Category">{t.$userdata.category}</Row>
          )}
          {t.$userdata?.tags.length > 0 && (
            <Row name="Tags">{t.$userdata.tags.join(", ")}</Row>
          )}
          {t.queue_position >= 0 && (
            <Row name="Queue position">{t.queue_position + 1}</Row>
          )}
          {options.length > 0 && <Row name="Options">{options.join(", ")}</Row>}
        </Section>
      </div>
    </div>
  );
}
