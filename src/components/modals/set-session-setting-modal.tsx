import { useInvoker, useRpcCache } from "@/api";
import type { ModalProps } from "@/components/modal/use-modal";
import { useAppForm } from "@/components/form/app-form";
import z from "zod";

type SetSessionSettingModalProps = {
  session_id: number;
  setting_name: string;
  setting_value: string | number | boolean;
};

// libtorrent settings are bools, ints or strings. The backend skips a value of
// the wrong type and still reports success, so it's checked here.
const settingSchemas: Record<
  "boolean" | "number" | "string",
  z.ZodType<
    { setting_value: string | number | boolean },
    { setting_value: string | number | boolean | null }
  >
> = {
  boolean: z.object({ setting_value: z.boolean() }),
  number: z.object({
    setting_value: z
      .number({ error: "Enter a whole number" })
      .int("Enter a whole number"),
  }),
  string: z.object({ setting_value: z.string() }),
};

export function SetSessionSettingModal({
  session_id,
  setting_name,
  setting_value,
  close,
}: SetSessionSettingModalProps & ModalProps<boolean>) {
  const cache = useRpcCache();

  const setSetting = useInvoker("sessions.settings.set", {
    meta: { errorToast: false },
    onSuccess: () => cache.invalidate("sessions.settings.get"),
  });

  // From the prop, not the live value: clearing a number gives null, which
  // must not change which input is shown.
  const kind = typeof setting_value as keyof typeof settingSchemas;
  const schema = settingSchemas[kind];

  const form = useAppForm({
    defaultValues: {
      setting_value: setting_value as string | number | boolean | null,
    },
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      await setSetting.mutateAsync({
        id: session_id,
        settings: { [setting_name]: schema.parse(value).setting_value },
      });

      close(true);
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm
        title="Update session setting"
        submitLabel="Update"
        error={setSetting.error}
      >
        <form.AppField
          name="setting_value"
          children={(field) => (
            <>
              {kind === "boolean" && (
                <field.CheckboxField label={setting_name} autoFocus />
              )}

              {kind === "number" && (
                <field.NumberField label={setting_name} autoFocus />
              )}

              {kind === "string" && (
                <field.TextField label={setting_name} autoFocus />
              )}
            </>
          )}
        />
      </form.ModalForm>
    </form.AppForm>
  );
}
