import clsx from "clsx";
import { FilePlus, Magnet, Upload } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

// A label around a visually hidden, still focusable file input.
function FilePicker(props: {
  className: string;
  children: ReactNode;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label
      className={clsx(
        props.className,
        "cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
      )}
    >
      <input
        type="file"
        className="sr-only"
        multiple
        accept=".torrent,application/x-bittorrent"
        onChange={(e) => {
          props.onFiles(Array.from(e.target.files ?? []));
          e.target.value = ""; // so a removed file can be chosen again
        }}
      />
      {props.children}
    </label>
  );
}

// Before anything is chosen: a drop zone and the magnet box. After: two
// buttons, so the list gets the room.
export default function Sources({
  compact,
  onFiles,
  onMagnets,
}: {
  compact: boolean;
  onFiles: (files: File[]) => void;
  onMagnets: (text: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [magnetsOpen, setMagnetsOpen] = useState(false);

  const addLinks = () => {
    onMagnets(text);
    setText("");
    setMagnetsOpen(false);
  };

  const magnets = (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        Magnet links, one per line
      </label>
      <textarea
        id={id}
        autoFocus={compact}
        className="textarea w-full font-mono text-xs"
        rows={3}
        placeholder="magnet:?xt=urn:btih:…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-sm w-fit"
        disabled={!text.trim()}
        onClick={addLinks}
      >
        Add links
      </button>
    </div>
  );

  if (!compact) {
    return (
      <div className="space-y-3">
        <FilePicker
          className="flex flex-col items-center gap-1 rounded-box border-2 border-dashed border-base-300 p-6 text-center"
          onFiles={onFiles}
        >
          <Upload className="size-5 opacity-60" />
          <span className="font-medium">
            Drop .torrent files or magnet links here, or click to choose files
          </span>
        </FilePicker>
        {magnets}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <FilePicker className="btn btn-sm" onFiles={onFiles}>
          <FilePlus className="size-4" />
          Add .torrent files
        </FilePicker>
        <button
          type="button"
          className={clsx("btn btn-sm", magnetsOpen && "btn-active")}
          aria-expanded={magnetsOpen}
          onClick={() => setMagnetsOpen(!magnetsOpen)}
        >
          <Magnet className="size-4" />
          Add magnet links
        </button>
      </div>
      {magnetsOpen && magnets}
    </div>
  );
}
