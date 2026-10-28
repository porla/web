import { prefixPath } from "@/base";
import { useQuery } from "@tanstack/react-query";

// The web UI's own version, from the version.json a release build ships;
// "0.0.0" for a dev build without one.
export function useWebVersion() {
  return useQuery({
    queryKey: ["webui.version"],
    queryFn: async () => {
      try {
        const r = await fetch(prefixPath("/version.json"));
        return String((await r.json()).SemVer ?? "0.0.0");
      } catch {
        return "0.0.0";
      }
    },
    staleTime: Infinity,
  }).data;
}
