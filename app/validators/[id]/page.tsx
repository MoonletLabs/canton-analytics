"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidatorInfo } from "@/lib/api/scan-api";
import type { ValidatorInfo } from "@/lib/api/scan-api";
import { Loading } from "@/components/ui/loading";
import { Shield, AlertCircle, ArrowLeft, Activity, Clock, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { format, parseISO } from "date-fns";

function copyToClipboard(text: string) {
  if (typeof navigator?.clipboard?.writeText === "function") {
    navigator.clipboard.writeText(text);
  }
}

function formatLastActive(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = parseISO(iso);
    return format(d, "PPP 'at' p");
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export default function ValidatorDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [validator, setValidator] = useState<ValidatorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing validator ID");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    getValidatorInfo(id)
      .then((info) => {
        if (!cancelled) setValidator(info);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load validator");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const lastActive = validator?.collection_timing?.last;
  const shortId = id.length > 40 ? id.slice(0, 20) + "…" + id.slice(-20) : id;

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-muted-foreground">Missing validator ID.</p>
          <Link href="/validators" className="text-primary hover:underline mt-2 inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Validators
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/validators"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Validators
        </Link>

        {loading ? (
          <Loading className="min-h-[320px]" text="Loading validator…" />
        ) : error ? (
          <Card className="bg-card/80 border-border border-destructive/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <span>{error}</span>
              </div>
              <Link href="/validators" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4">
                <ArrowLeft className="h-4 w-4" /> Back to Validators
              </Link>
            </CardContent>
          </Card>
        ) : validator ? (
          <div className="space-y-8">
            {/* Hero */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="rounded-2xl bg-primary/15 p-4 shrink-0">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-mono break-all leading-tight">
                  {validator.validator_id}
                </h1>
                <p className="text-muted-foreground font-mono text-sm mt-1 break-all">
                  {shortId}
                </p>
                {validator.name && (
                  <p className="text-foreground/90 mt-2 font-medium">{validator.name}</p>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium mt-3 ${
                    validator.status === "active"
                      ? "bg-green-500/15 text-green-500"
                      : "bg-amber-500/15 text-amber-500"
                  }`}
                >
                  {validator.status === "active" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span className="capitalize">{validator.status.replace("_", " ")}</span>
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="bg-card/80 border-border overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-xl p-2.5 ${
                        validator.status === "active" ? "bg-green-500/15" : "bg-amber-500/15"
                      }`}
                    >
                      {validator.status === "active" ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</p>
                      <p className="text-lg font-bold text-foreground capitalize">
                        {validator.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/15 p-2.5">
                      <Target className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Missed rounds</p>
                      <p className="text-lg font-bold text-foreground">{validator.missed_rounds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border overflow-hidden col-span-2 sm:col-span-1">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/15 p-2.5">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Liveness rounds</p>
                      <p className="text-lg font-bold text-foreground">{validator.liveness_rounds}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <Card className="bg-card/80 border-border shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="text-foreground">Validator details</CardTitle>
                <CardDescription>Identifier and activity from blockchain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Validator ID
                  </p>
                  <p
                    className="font-mono text-sm break-all cursor-pointer hover:text-primary transition-colors"
                    onClick={() => copyToClipboard(validator.validator_id)}
                    title="Click to copy"
                  >
                    {validator.validator_id}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last active</p>
                    <p className="text-foreground font-medium">{formatLastActive(lastActive)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6 text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
              <p className="text-muted-foreground font-medium">Validator not found</p>
              <p className="text-sm text-muted-foreground mt-1">
                The ID may be incorrect or the validator may no longer be in the set.
              </p>
              <Link href="/validators" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-6">
                <ArrowLeft className="h-4 w-4" /> Back to Validators
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
