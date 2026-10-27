import { useModalDismissible, type ModalProps } from "@/components/modal";
import { useRef, useState } from "react";

type ShowApiKeyModalProps = {
  createdKey: string;
};

export default function ShowApiKeyModal(
  props: ShowApiKeyModalProps & ModalProps<boolean>,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // The key can't be shown again: only the explicit button closes this.
  useModalDismissible(false);

  const copy = async () => {
    try {
      // Only available in secure contexts (https, localhost).
      await navigator.clipboard.writeText(props.createdKey);
    } catch {
      // Plain http, e.g. on a LAN: copy the selected text instead.
      inputRef.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">API key</h3>

      <p>
        Your API key has been created. It cannot be retrieved after this dialog
        closes, so copy it now.
      </p>

      <div className="join w-full">
        <input
          ref={inputRef}
          type="text"
          value={props.createdKey}
          readOnly
          aria-label="API key"
          className="input input-lg join-item w-full font-mono text-sm"
          onClick={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          className="btn btn-lg join-item"
          autoFocus
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="modal-action">
        <button
          type="button"
          className="btn"
          onClick={() => props.close(false)}
        >
          I've copied the key
        </button>
      </div>
    </div>
  );
}
