import type { LogEntry } from "@/api";

const ESCAPES: Record<string, string> = {
  "\\": "\\\\",
  '"': '\\"',
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
};

function value(v: string | number | boolean | null) {
  const s = v === null ? "" : String(v);

  if (s !== "" && !/[\s\p{Cc}="]/u.test(s)) {
    return s;
  }

  return `"${s.replace(/[\\"\n\r\t]/g, (c) => ESCAPES[c])}"`;
}

export function logfmt(entries: LogEntry[]) {
  return entries
    .map((e) =>
      [
        ["ts", new Date(e.ts).toISOString()],
        ["level", e.level],
        ...(e.component === null ? [] : [["component", e.component]]),
        ["msg", e.message],
        ...Object.entries(e.properties).sort(([a], [b]) => a.localeCompare(b)),
      ]
        .map(([k, v]) => `${k}=${value(v)}`)
        .join(" "),
    )
    .join("\n");
}
