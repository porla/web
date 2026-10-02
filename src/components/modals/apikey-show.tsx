import type { ModalProps } from "@/components/modal";

type ShowApiKeyModalProps = {
  createdKey: string;
};

export default function ShowApiKeyModal(
  props: ShowApiKeyModalProps & ModalProps<boolean>,
) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">API key</h3>

      <p>
        Your API key has been created. It cannot be retrieved after this dialog
        closes, so copy it now.
      </p>

      <input
        type="text"
        value={props.createdKey}
        readOnly
        className="input input-lg w-full font-mono text-sm"
        onClick={(e) => e.currentTarget.select()}
      />

      <div className="modal-action">
        <button
          type="button"
          className="btn"
          onClick={() => props.close(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
