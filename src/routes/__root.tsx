import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => (
  <>
    <Outlet />
    <TanStackRouterDevtools position="top-left" />
  </>
)

export const Route = createRootRoute({ component: RootLayout })