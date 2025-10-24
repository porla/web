import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/settings/plugins/add')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/_layout/settings/plugins/add"!</div>
  )
}
