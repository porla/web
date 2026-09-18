import { useInvoker } from "@/api";
import type { ModalProps } from "@/components/modal";
import { useAppForm } from "@/hooks/form";
import { useQueryClient } from "@tanstack/react-query";

type SessionSettingSetModalProps = {
  session_id: number;
  setting_name: string;
  setting_value: string | number | boolean;
};

export default function SessionSettingSetModal({
  session_id,
  setting_name,
  setting_value,
  close,
}: SessionSettingSetModalProps & ModalProps<boolean>) {
  const queryClient = useQueryClient();

  const setSetting = useInvoker("sessions.settings.set", {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sessions.settings.get"] }),
  });

  const form = useAppForm({
    defaultValues: {
      setting_value,
    },
    onSubmit: async ({ value }) => {
      let s: Record<string, string | number | boolean> = {};
      s[setting_name] = value.setting_value;

      await setSetting.mutateAsync({
        id: session_id,
        settings: s,
      });

      close(true);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <h3 className="font-bold text-lg">Update session setting</h3>

      <form.AppField
        name="setting_value"
        children={(field) => (
          <>
            {typeof field.state.value === "boolean" && (
              <field.CheckboxField label={setting_name} />
            )}

            {typeof field.state.value === "number" && (
              <field.NumberField label={setting_name} />
            )}

            {typeof field.state.value === "string" && (
              <field.TextField label={setting_name} />
            )}
          </>
        )}
      />

      <div className="modal-action">
        <button type="button" className="btn" onClick={() => close(false)}>
          Cancel
        </button>

        <form.AppForm>
          <form.SubmitButton label="Update" />
        </form.AppForm>
      </div>
    </form>
  );
}
