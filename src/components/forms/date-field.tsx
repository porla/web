import { useFieldContext } from "@/hooks/form-context.tsx";
import { DateTime } from "luxon";
import { useId } from "react";
import FieldErrors from "./field-errors";

export default function DateField({ label }: { label: string }) {
  const field = useFieldContext<number | null>();

  const id = useId();

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        type="date"
        className="input"
        value={
          field.state.value === null
            ? ""
            : DateTime.fromSeconds(field.state.value).toFormat("yyyy-MM-dd")
        }
        min={DateTime.now().toFormat("yyyy-MM-dd")}
        onChange={(e) => {
          if (e.target.value === "") {
            return field.handleChange(null);
          }

          const picked = DateTime.fromISO(e.target.value);

          if (!picked.isValid) {
            return field.handleChange(null);
          }

          return field.handleChange(picked.endOf("day").toUnixInteger());
        }}
        onBlur={field.handleBlur}
      />

      <FieldErrors />
    </div>
  );
}
