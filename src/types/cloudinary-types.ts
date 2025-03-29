interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  tags: string[];
}

interface CloudinaryResponse {
  resources: CloudinaryResource[];
  next_cursor?: string;
  rate_limit_allowed?: number;
  rate_limit_remaining?: number;
  rate_limit_reset_at?: string;
}
