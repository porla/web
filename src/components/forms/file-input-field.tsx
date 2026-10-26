import { useFieldContext } from "@/hooks/form-context.tsx";
import { useId } from "react";
import FieldErrors from "./field-errors";

export default function FileInputField({ label }: { label: string }) {
  const field = useFieldContext<FileList | null>();

  const id = useId();

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        type="file"
        className="file-input"
        onBlur={field.handleBlur}
        onChange={(e) =>
          e.target.files
            ? field.handleChange(e.target.files)
            : field.handleChange(null)
        }
        multiple
      />

      <FieldErrors />
    </div>
  );
}
