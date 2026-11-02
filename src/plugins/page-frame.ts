// A frame showing one of the plugin's pages: a modal (a page opened with
// modal.open) or its settings page (ui.settings). The page sizes the frame with
// resize; a modal's page can close it with close.

import { useState } from "react";
import { SANDBOX, useFrameChannel } from "./protocol";
import type { Plugin } from "@/api";

// Props for the iframe, and whether the page has said how tall it is yet
// (until then, show a placeholder).
export function usePageFrame(
  role: "modal" | "settings",
  plugin: Plugin,
  src: string,
  title: string,
  { context, onClose }: { context?: unknown; onClose?: () => void } = {},
) {
  const [height, setHeight] = useState<number | null>(null);

  const onLoad = useFrameChannel(
    role,
    plugin,
    (msg) => {
      if (msg.type === "resize") {
        if (typeof msg.height === "number" && msg.height > 0) {
          setHeight(Math.min(Math.ceil(msg.height), 10_000));
        }
      } else if (msg.type === "close") {
        onClose?.();
      }
    },
    context,
  );

  return {
    frame: {
      src,
      title,
      sandbox: SANDBOX,
      onLoad,
      style: height === null ? undefined : { height },
    },
    sized: height !== null,
  };
}
