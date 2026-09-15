import {
  type TorrentsPeersList,
  useRPC,
  type InfoHash,
  useInvoker,
} from "@/api";
import { useEffect, useState } from "react";

type PeersTabProps = {
  info_hash: InfoHash;
  session_id: number;
};

export default function PeersTab({ info_hash, session_id }: PeersTabProps) {
  const mmdb = useInvoker<any>("mmdb.lookup");
  const [mmdbEnabled, setMmdbEnabled] = useState(false);
  const [mmdbEndpoints, setMmdbEndpoints] = useState<any>();

  const peers = useRPC<TorrentsPeersList>(
    "torrents.peers.list",
    {
      info_hash,
      session_id,
    },
    {
      refetchInterval: 2000,
    },
  );

  useEffect(() => {
    mmdb
      .mutateAsync({ values: ["127.0.0.1"] })
      .then((r) => setMmdbEnabled("results" in r && "127.0.0.1" in r.results))
      .catch((_) => setMmdbEnabled(false));
  }, []);

  useEffect(() => {
    if (!peers.data?.peers || !mmdbEnabled) {
      return;
    }

    const endpoints = peers.data.peers.map((p) => p.remote_endpoint[0]);

    mmdb
      .mutateAsync({ values: endpoints })
      .then((r) => setMmdbEndpoints(r.results));
  }, [peers.data?.peers, mmdbEnabled]);

  return (
    <table className="table table-sm">
      <tbody>
        {peers.data?.peers.map((p) => (
          <tr
            key={`peer_${p.remote_endpoint[0].replace(":", "_")}_${p.remote_endpoint[1]}`}
          >
            <td>{p.remote_endpoint[0]}</td>
            {mmdbEnabled && mmdbEndpoints && (
              <td>
                {p.remote_endpoint[0] in mmdbEndpoints && (
                  <span>
                    {mmdbEndpoints[p.remote_endpoint[0]].country?.iso_code}
                  </span>
                )}
              </td>
            )}
            <td>{p.connection_type}</td>
            <td>{p.flags.join(",")}</td>
            <td>{p.source.join(",")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
