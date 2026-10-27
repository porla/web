import { Check, Copy } from "lucide-react";
import { useState } from "react";

// Copies text to the clipboard. navigator.clipboard only exists in secure
// contexts (https, localhost); on plain http it falls back to execCommand.
export default function CopyButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs btn-square"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      onClick={copy}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
