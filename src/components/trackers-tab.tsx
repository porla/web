import {
  type TorrentsTrackersList,
  useRPC,
  type InfoHash,
  type AnnounceEntry,
  type AnnounceInfohash,
  type AnnounceEndpoint,
} from "@/api";

type TrackersTabProps = {
  info_hash: InfoHash;
  session_id: number;
};

const UNSET = -2147483648; // INT_MIN -> next/min_announce "not set"

// --- status model ---
type Status = "working" | "updating" | "queued" | "error" | "inactive";

const RANK: Record<Status, number> = {
  working: 4,
  updating: 3,
  queued: 2,
  error: 1,
  inactive: 0,
};

const isLoopback = ([ip]: [string, number]): boolean =>
  ip === "127.0.0.1" || ip === "::1";

const best = (statuses: Status[]): Status =>
  statuses.reduce<Status>((a, b) => (RANK[b] > RANK[a] ? b : a), "inactive");

// --- leaf: one announce_infohash (v1 or v2) ---
function leafStatus(ih: AnnounceInfohash): Status {
  if (ih.updating) return "updating"; // awaiting tracker response
  if (ih.fails > 0 && ih.last_error) return "error"; // failing now
  if (ih.start_sent) return "working"; // got a valid started response
  if (ih.next_announce === UNSET) return "inactive"; // never scheduled (e.g. unused v2)
  return "queued"; // scheduled, not yet contacted
}

// --- endpoint: fold its info_hashes, ignoring inactive ones ---
function endpointStatus(ep: AnnounceEndpoint): Status {
  if (!ep.enabled) return "inactive";
  const active = ep.info_hashes
    .map(leafStatus)
    .filter((s): s is Status => s !== "inactive");
  return active.length ? best(active) : "inactive";
}

// --- tracker: fold endpoints, ignoring loopback for the verdict ---
function trackerStatus(tr: AnnounceEntry): Status {
  const real = tr.endpoints.filter((ep) => !isLoopback(ep.local_endpoint));
  const pool = (real.length ? real : tr.endpoints).filter((ep) => ep.enabled);

  return best(
    pool.map(endpointStatus).filter((s): s is Status => s !== "inactive"),
  );
}

function TrackerStatusItem(tr: AnnounceEntry) {
  const status = trackerStatus(tr);

  if (status === "working") {
    return (
      <div className="flex space-x-2 items-center">
        <div className="status status-success"></div>
        <span>OK</span>
      </div>
    );
  }

  return <>Unknown</>
}

export default function TrackersTab({
  info_hash,
  session_id,
}: TrackersTabProps) {
  const trackers = useRPC<TorrentsTrackersList>(
    "torrents.trackers.list",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  return (
    <table className="table table-sm table-zebra">
      <thead>
        <tr>
          <th>Status</th>
          <th className="w-3">#</th>
          <th>Url</th>
          <th>Status</th>
          <th>Source</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {trackers.data?.trackers.map((t) => (
          <tr key={t.url}>
            <td>{TrackerStatusItem(t)}</td>
            <td>{t.tier}</td>
            <td>{t.url}</td>
            <td>{t.verified ? "1" : "0"}</td>
            <td>{t.source.join(",")}</td>
            <td>
              <ul>
                {t.endpoints.map((e) => (
                  <li key={e.local_endpoint[0]}>
                    {e.enabled ? "enabled" : "0"}:{" "}
                    {e.local_endpoint[0] + ":" + e.local_endpoint[1]}
                    {JSON.stringify(e.info_hashes)}
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
