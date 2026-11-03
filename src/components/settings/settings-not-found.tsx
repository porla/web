import { Link } from "@tanstack/react-router";

export function SettingsNotFound() {
  return (
    <div className="space-y-3">
      <p>There is no such settings page.</p>
      <Link to="/settings" className="btn btn-sm">
        Back to settings
      </Link>
    </div>
  );
}
