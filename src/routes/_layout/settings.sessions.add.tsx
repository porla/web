import Button from '@/components/button';
import { useInvoker } from '@/jsonrpc'
import { useForm } from '@tanstack/react-form';
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/settings/sessions/add')({
  component: RouteComponent,
})

type SessionsAdd = {
  id: number;
}

function RouteComponent() {
  const navigate = useNavigate();
  const add = useInvoker<SessionsAdd>("sessions.add");

  const form = useForm({
    defaultValues: {
      name: "",
      settings_base: "default"
    },
    onSubmit: async ({ value }) => {
      const { id } = await add(value);
      await navigate({ to: "/settings/sessions/$id", params: { id } })
    }
  })

  return <div className="m-10">
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-5"
    >
      <form.Field
        name="name"
        children={(field) => (
          <input
            type="text"
            placeholder="Session name"
            className="input w-full"
            required
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      />

      <Button type="submit" text="Add session" />
    </form>
  </div>
}
