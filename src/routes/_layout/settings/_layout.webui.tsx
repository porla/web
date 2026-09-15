import { createFileRoute } from "@tanstack/react-router";

import { prefixPath } from "@/base";
import { useEffect, useState } from "react";
import { useInvoker, useRPC } from "@/api";
import { DateTime } from "luxon";

export const Route = createFileRoute("/_layout/settings/_layout/webui")({
  component: RouteComponent,
});

function RouteComponent() {
  const data = useRPC<any>("kv.get", {
    keys: ["porla.webui.repo"],
  });

  const install = useInvoker("webui.install");

  const [releases, setReleases] = useState<any[]>();
  const [version, setVersion] = useState<string>();

  useEffect(() => {
    fetch(prefixPath("/version.json"))
      .then((r) => r.json())
      .then((r) => {
        setVersion(`v${r.SemVer}`);
      })
      .catch((_) => {});
  }, []);

  if (data.isLoading || !data.data) {
    return <>loading</>;
  }

  const repo = data.data.values["porla.webui.repo"] ?? "porla/web";

  return (
    <div>
      <ul>
        <li>Current version: {version ?? "Unknown"}</li>
        {!releases && (
          <li>
            <button
              className="btn btn-primary"
              onClick={async () => {
                const releases = await fetch(
                  `https://api.github.com/repos/${repo}/releases`,
                ).then((r) => r.json());
                setReleases(releases);
              }}
            >
              Load versions from {repo}
            </button>
          </li>
        )}
      </ul>

      {releases && releases.length > 0 && (
        <table className="table table-zebra">
          <tbody>
            {releases.map((r) => (
              <tr key={`${r.id}`}>
                <td>{r.name}</td>
                <td>
                  {DateTime.fromISO(r.created_at).toFormat("yyyy-MM-dd HH:mm")}
                </td>
                <td>
                  {r.assets.find((a: any) => a.name === "webui.zip") && (
                    <a
                      className="btn btn-info btn-xs"
                      href={r.html_url}
                      target="_blank"
                    >
                      View
                    </a>
                  )}
                </td>
                <td className="text-right">
                  {r.assets.find((a: any) => a.name === "webui.zip") && (
                    <>
                      {version && r.name === version ? (
                        <span className="text-xs">Current version</span>
                      ) : (
                        <button
                          className="btn btn-warning btn-xs"
                          disabled={install.isPending}
                          onClick={async () => {
                            install.mutateAsync({
                              version: r.name,
                            });

                            // TODO: hacky since the key-update signal is posted to the io thread, so we
                            // need some space for the UI zip to reload
                            setTimeout(() => location.reload(), 1000);
                          }}
                        >
                          Install
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
