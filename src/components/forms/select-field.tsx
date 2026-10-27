import { useFieldContext } from "@/hooks/form-context.tsx";
import { useId } from "react";
import FieldErrors from "./field-errors";

type SelectItem = {
  value: number;
  label: string;
};

export default function SelectField({
  autoFocus,
  label,
  items,
}: {
  autoFocus?: boolean;
  label: string;
  items: SelectItem[];
}) {
  const field = useFieldContext<number | null>();

  const id = useId();

  return (
    <div className="fieldset">
      <label className="label" htmlFor={id}>
        {label}
      </label>

      <select
        autoFocus={autoFocus}
        id={id}
        className="select"
        onBlur={field.handleBlur}
        onChange={(e) => {
          field.handleChange(
            e.target.value === "" ? null : parseInt(e.target.value),
          );
        }}
        value={field.state.value ?? ""}
      >
        <option value={""}>None</option>
        {items.map((item) => (
          <option key={`${field.name}_${item.value}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <FieldErrors />
    </div>
  );
}
