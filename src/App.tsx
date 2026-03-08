import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

function App() {
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setApiStatus(data?.ok ? "connected" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>React App</CardTitle>
            <CardDescription>
              Built with React, TypeScript, Tailwind CSS, and shadcn/ui
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">API Status:</span>
              <Badge variant={apiStatus === "connected" ? "default" : apiStatus === "error" ? "destructive" : "secondary"}>
                {apiStatus === "checking" ? "Checking..." : apiStatus === "connected" ? "Connected" : "Unreachable"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Edit <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">src/App.tsx</code> to start building.
              Add API routes in <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">routes.py</code>.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
