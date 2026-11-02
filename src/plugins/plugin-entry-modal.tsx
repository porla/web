import { X } from "lucide-react";
import type { ModalProps } from "@/components/modal/use-modal";
import { usePageFrame } from "./page-frame";
import type { Plugin } from "@/api";
import clsx from "clsx";
import { ModalTitle } from "@/components/modal/modal-title";

type PluginEntryModalProps = {
  plugin: Plugin;
  title: string;
  src: string;
  context: unknown;
};

export function PluginEntryModal({
  plugin,
  title,
  src,
  context,
  close,
}: PluginEntryModalProps & ModalProps) {
  const { frame, sized } = usePageFrame("modal", plugin, src, title, {
    context,
    onClose: () => close(),
  });

  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <ModalTitle>{title}</ModalTitle>
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost"
          aria-label="Close"
          onClick={() => close()}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-col">
        <iframe
          {...frame}
          data-plugin-frame
          className={clsx("block min-h-0 w-full", !sized && "aspect-square")}
        />
        {!sized && <div className="skeleton absolute inset-0" />}
      </div>
    </>
  );
}
