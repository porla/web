import { useRPC } from "@/api";
import { keepPreviousData } from "@tanstack/react-query";

// null: a database is loaded but has nothing for this address (private or
// unknown); undefined: no database.
export type Country = { code?: string; name?: string } | null | undefined;

// Countries come from Porla's MMDB, when one is loaded. The lookups are
// queries keyed by the peers' addresses, so a slow, older reply can't
// overwrite a newer one. Without a database they fail, which is expected
// and not worth a toast; the country is simply left out.
export function usePeerCountries(ips: string[]) {
  const probe = useRPC(
    "mmdb.lookup",
    { values: ["127.0.0.1"] },
    { meta: { errorToast: false } },
  );

  const mmdbEnabled = !!probe.data && "127.0.0.1" in probe.data.results;

  // Sorted and deduplicated so the key only changes when the set of
  // addresses does, not when libtorrent lists them in another order.
  const values = [...new Set(ips)].sort();
  const lookups = useRPC(
    "mmdb.lookup",
    { values },
    {
      enabled: mmdbEnabled && values.length > 0,
      meta: { errorToast: false },
      placeholderData: keepPreviousData,
    },
  );

  // Lookups failing later means the database was unloaded.
  const dbLoaded = mmdbEnabled && !lookups.isError;

  return (ip: string): Country => {
    if (!dbLoaded) return undefined;
    const c = lookups.data?.results[ip]?.country;
    return c ? { code: c.iso_code, name: c.names?.en } : null;
  };
}
