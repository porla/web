import { createFileRoute, Link, Navigate, Outlet } from '@tanstack/react-router'
import Isotyope from '../assets/isotype.svg?react'
import { AuthError, useRPC } from '../jsonrpc'
import { useEffect, useState } from 'react'
import { prefixPath } from '../base'

export const Route = createFileRoute('/_layout')({
  component: RouteComponent,
})

type SysVersions = {
  boost: {
    version: string;
  }
}

type SysStatus = {
  status: "setup" | string;
}

function RouteComponent() {
  const [ status, setStatus ] = useState<SysStatus | undefined>();

  useEffect(() => {
    fetch(prefixPath("/api/v1/system"))
      .then(r => r.json())
      .then(j => setStatus(j as SysStatus))
  }, []);

  if (!status) {
    return <div>Loading...</div>
  }

  if (status.status === "setup") {
    return <Navigate to="/setup" />;
  }

  return <App />
}

function App() {
  const versions = useRPC<SysVersions>("sys.versions");

  if (versions.error instanceof AuthError) {
    return <Navigate to="/login" />
  }

  return (
    <div className="text-white h-full grid grid-cols-[300px_1fr]">
      <div className="bg-gray-700 border-r border-r-gray-500 h-full flex flex-col shadow-md">
        <div className="m-2 space-x-2">
          <Isotyope className="w-8" />
          {versions.data?.boost.version}
          <div className="mt-3">
            <input type="text" placeholder="Search torrents..." className="w-full border border-gray-500 p-2 rounded bg-gray-600" />
          </div>
        </div>
        <div className="flex-1">
          menu
        </div>
        <div className="p-2">
          <Link to="/settings">Settings</Link>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
