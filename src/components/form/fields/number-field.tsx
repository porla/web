import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";

export function NumberField({
  autoFocus,
  label,
  placeholder,
}: {
  autoFocus?: boolean;
  label: string;
  placeholder?: string;
}) {
  const field = useFieldContext<number | null>();

  return (
    <Field label={label}>
      {(control) => (
        <input
          {...control}
          autoFocus={autoFocus}
          placeholder={placeholder}
          type="number"
          className="input"
          value={field.state.value ?? ""}
          onChange={(e) =>
            field.handleChange(
              Number.isNaN(e.target.valueAsNumber)
                ? null
                : e.target.valueAsNumber,
            )
          }
        />
      )}
    </Field>
  );
}
