export type PluginManifest = {
  name: string | null;
  slug: string | null;
  version: string | null;
  ui: {
    entry: string | null;
    settings?: string | null; // porla with ui.settings
    rpc: string[] | null;
  } | null;
};

export type Plugin = {
  id: number;
  path: string;
  config: string | null;
  metadata: Record<string, unknown>;
  name?: string | null; // <=0.52.0
  version?: string | null; // <=0.52.0
  is_loaded?: boolean; // <=0.52.0
  slug?: string;
  manifest?: PluginManifest | null;
  status?: "running" | "error";
  error?: string | null;
};

export type PluginsGet = {
  plugin: Plugin;
};

export type PluginsList = {
  plugins: Plugin[];
};
