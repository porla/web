import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";

export function CheckboxField({
  autoFocus,
  description,
  disabled,
  label,
}: {
  autoFocus?: boolean;
  description?: string;
  disabled?: boolean;
  label: string;
}) {
  const field = useFieldContext<boolean>();

  return (
    <Field label={label} description={description}>
      {(control) => (
        <input
          {...control}
          autoFocus={autoFocus}
          type="checkbox"
          className="checkbox"
          checked={field.state.value}
          disabled={disabled}
          onChange={(e) => field.handleChange(e.target.checked)}
        />
      )}
    </Field>
  );
}
