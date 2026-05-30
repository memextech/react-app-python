import type { ApiStatus, HealthResponse, IdentityDiagnostics, MeResponse } from "./types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  Globe2,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Server,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyDiagnostics: IdentityDiagnostics = {
  header_present: false,
  jwks_path: "/.well-known/workshop-identity/jwks.json",
  public_domain: null,
  app_slug: null,
  ready_to_verify: false,
};

function Field({
  label,
  value,
  empty = "Not available",
}: {
  label: string;
  value?: string | null;
  empty?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase text-neutral-500">{label}</dt>
      <dd className="mt-1 break-all font-mono text-sm text-neutral-950">{value || empty}</dd>
    </div>
  );
}

function BooleanRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          value ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {value ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-neutral-950">{label}</div>
        <div className="text-sm text-neutral-600">{detail}</div>
      </div>
    </div>
  );
}

function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<IdentityDiagnostics>(emptyDiagnostics);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const healthRequest = fetch("/api/health")
      .then((response) => response.json())
      .then((data: HealthResponse) => {
        setHealth(data);
        setApiStatus(data?.ok ? "connected" : "error");
      })
      .catch(() => {
        setHealth(null);
        setApiStatus("error");
      });

    const identityRequest = fetch("/api/me")
      .then(async (response) => {
        if (response.ok) {
          return (await response.json()) as MeResponse;
        }
        return { authenticated: false } satisfies MeResponse;
      })
      .then(setMe)
      .catch(() => setMe({ authenticated: false }));

    const diagnosticsRequest = fetch("/api/identity-diagnostics")
      .then((response) => response.json())
      .then((data: IdentityDiagnostics) => setDiagnostics(data))
      .catch(() => setDiagnostics(emptyDiagnostics));

    await Promise.all([healthRequest, identityRequest, diagnosticsRequest]);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const signedIn = me?.authenticated === true;
  const status = useMemo(() => {
    if (apiStatus === "checking") {
      return {
        label: "Checking API",
        className: "border-neutral-200 bg-neutral-50 text-neutral-700",
      };
    }
    if (apiStatus === "connected") {
      return {
        label: "API connected",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }
    return {
      label: "API unreachable",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }, [apiStatus]);

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-neutral-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
              <ShieldCheck className="h-4 w-4 text-blue-700" />
              Workshop published app
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-neutral-950">
              Viewer identity demo
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            <Button onClick={refresh} disabled={loading} size="sm">
              <RefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-lg border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                      signedIn ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-950">
                      {signedIn ? "Signed-in viewer" : "Anonymous viewer"}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600">
                      {signedIn
                        ? "The FastAPI route verified the signed Workshop token."
                        : "The server did not receive a verified Workshop identity."}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    signedIn
                      ? "w-fit border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "w-fit border-neutral-200 bg-neutral-50 text-neutral-700"
                  }
                >
                  {signedIn ? "Verified" : "No identity"}
                </Badge>
              </div>

              <Separator className="my-6" />

              <dl className="grid gap-5 sm:grid-cols-2">
                <Field label="UID" value={me?.uid} />
                <Field label="Email" value={me?.email} />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">Server checks</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Live state from `/api/identity-diagnostics`.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <BooleanRow
                  label="Identity header"
                  value={diagnostics.header_present}
                  detail={
                    diagnostics.header_present
                      ? "X-Workshop-User arrived at the backend."
                      : "X-Workshop-User is absent on this request."
                  }
                />
                <BooleanRow
                  label="Verification metadata"
                  value={diagnostics.ready_to_verify}
                  detail={
                    diagnostics.ready_to_verify
                      ? "Domain and app slug are configured."
                      : "Deploy with identity passthrough to configure metadata."
                  }
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-lg border-neutral-200 shadow-sm lg:col-span-2">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">Verification inputs</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Values the backend uses to verify the JWT signature and audience.
                  </p>
                </div>
              </div>

              <dl className="grid gap-5 sm:grid-cols-2">
                <Field label="Public domain" value={diagnostics.public_domain} />
                <Field label="Token audience" value={diagnostics.app_slug} />
                <Field label="JWKS path" value={diagnostics.jwks_path} />
                <Field
                  label="Environment ready"
                  value={
                    health
                      ? health.workshop_custom_domain_configured &&
                        health.workshop_app_slug_configured
                        ? "true"
                        : "false"
                      : null
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-950">Route contract</h2>
                  <p className="mt-1 text-sm text-neutral-600">The browser calls the backend.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2">
                  <Globe2 className="h-4 w-4 shrink-0 text-neutral-500" />
                  <code className="break-all font-mono text-neutral-950">GET /api/me</code>
                </div>
                <p className="text-neutral-600">
                  The route returns viewer JSON only after verifying the signed header with
                  Workshop's public JWKS.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

export default App;
