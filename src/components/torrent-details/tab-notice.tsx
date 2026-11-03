import { ListState } from "@/components/ui/list-state";
import { Spinner } from "@/components/ui/spinner";
import { TriangleAlert } from "lucide-react";

export function TabNotice({
  query,
  what,
}: {
  query: { error: Error | null };
  what: string;
}) {
  if (query.error) {
    return (
      <ListState icon={TriangleAlert} title={`Couldn't load the ${what}`}>
        {query.error.message}
      </ListState>
    );
  }

  return <Spinner className="m-3" />;
}
