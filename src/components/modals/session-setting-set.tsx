import { useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";
import z from "zod";

type SessionSettingSetModalProps = {
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

export default function SessionSettingSetModal({
  session_id,
  setting_name,
  setting_value,
  close,
}: SessionSettingSetModalProps & ModalProps<boolean>) {
  const queryClient = useQueryClient();

  const setSetting = useInvoker("sessions.settings.set", {
    meta: { silent: true },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sessions.settings.get"] }),
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
      <form.Form>
        <h3 className="font-bold text-lg">Update session setting</h3>

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

        <form.SaveError error={setSetting.error} />
        <form.ModalActions submitLabel="Update" onCancel={() => close(false)} />
      </form.Form>
    </form.AppForm>
  );
}
