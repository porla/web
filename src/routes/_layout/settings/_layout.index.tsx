import { type SysVersions, useRPC } from "@/api";
import { prefixPath } from "@/base";
import { createFileRoute } from "@tanstack/react-router";
import { GlobeCode, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_layout/settings/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const versions = useRPC<SysVersions>("sys.versions");
  const [webVersion, setWebVersion] = useState<string>("0.0.0");

  useEffect(() => {
    fetch(prefixPath("/version.json"))
      .then((r) => r.json())
      .then((r) => {
        setWebVersion(`${r.SemVer}`);
      })
      .catch((_) => {});
  }, []);

  return (
    <main className="text-sm">
      <div className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <Rocket className="inline-block h-8 w-8 stroke-current" />
          </div>
          <div className="stat-title">Porla version</div>
          <div className="stat-value text-primary">
            {versions.data?.porla.version}
          </div>
        </div>

        <div className="stat">
          <div className="stat-figure text-secondary">
            <GlobeCode className="inline-block h-8 w-8 stroke-current" />
          </div>
          <div className="stat-title">Web UI</div>
          <div className="stat-value text-secondary">{webVersion}</div>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(versions.data as any)
            .sort()
            .map((k) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{(versions.data as any)[k].version}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </main>
  );
}
