export type ApiStatus = "checking" | "connected" | "error";

export interface HealthResponse {
  ok: boolean;
  workshop_custom_domain_configured: boolean;
  workshop_app_slug_configured: boolean;
}

export interface MeResponse {
  authenticated: boolean;
  uid?: string;
  email?: string | null;
}

export interface IdentityDiagnostics {
  header_present: boolean;
  jwks_path: string;
  public_domain: string | null;
  app_slug: string | null;
  ready_to_verify: boolean;
}
