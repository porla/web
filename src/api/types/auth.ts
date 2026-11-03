export type ApiKey = {
  id: string;
  name: string;
  created_at: number;
  expires_at: number | null;
  last_used_at: number | null;
};

export type ApiKeysList = {
  keys: ApiKey[];
};
