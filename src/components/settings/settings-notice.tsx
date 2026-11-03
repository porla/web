import { Spinner } from "@/components/ui/spinner";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export function SettingsNotice({
  query,
  notFound,
  back,
}: {
  query: { isLoading: boolean; error: Error | null };
  notFound: string;
  back: { to: ComponentProps<typeof Link>["to"]; label: string };
}) {
  if (query.isLoading) {
    return <Spinner size="xl" />;
  }

  return (
    <div className="space-y-3">
      <p>{query.error?.message ?? notFound}</p>
      <Link to={back.to} className="btn btn-sm">
        {back.label}
      </Link>
    </div>
  );
}
