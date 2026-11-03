import { useFieldContext } from "@/components/form/form-context";
import { Field } from "@/components/form/field";
import { Eye, EyeOff } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

export function PasswordField({
  autoComplete,
  autoFocus,
  description,
  label,
}: {
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  description?: string;
  label: string;
}) {
  const field = useFieldContext<string>();
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checkCapsLock = (e: KeyboardEvent) =>
    setCapsLock(e.getModifierState("CapsLock"));

  return (
    <Field label={label} description={description}>
      {(control) => (
        <div className="input">
          <input
            {...control}
            name={field.name}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            type={shown ? "text" : "password"}
            autoCapitalize="none"
            spellCheck={false}
            className="grow"
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onKeyDown={checkCapsLock}
            onKeyUp={checkCapsLock}
            onBlur={() => {
              setCapsLock(false);
              control.onBlur();
            }}
            data-secret
          />

          {/* Always rendered, so screen readers announce what appears in it. */}
          <span role="status">
            {capsLock && (
              <span className="badge badge-sm badge-warning">Caps Lock</span>
            )}
          </span>

          <button
            type="button"
            tabIndex={-1}
            className="btn btn-square btn-ghost btn-sm -me-2"
            aria-label="Show password"
            aria-pressed={shown}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShown(!shown)}
          >
            {shown ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
      )}
    </Field>
  );
}
