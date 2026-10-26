import { createRootRoute, Outlet } from "@tanstack/react-router";
import Toaster from "@/components/toaster";

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
