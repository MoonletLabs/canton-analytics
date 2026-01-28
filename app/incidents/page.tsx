"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidatorLiveness, getLatestRound, delay } from "@/lib/api/scan-api";
import type { ValidatorInfo } from "@/lib/api/scan-api";
import {
  AlertTriangle,
  Clock,
  Zap,
  FileText,
  CheckCircle2,
  ChevronRight,
  Activity,
  AlertCircle,
} from "lucide-react";

interface Anomaly {
  id: string;
  type: "missed_rounds" | "traffic_spike" | "governance";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
  validatorId?: string;
  resolvedAt?: string;
}

const RUNBOOK_STEPS = [
  "Check validator process and logs",
  "Verify Global Synchronizer connectivity",
  "Confirm traffic credits and burn rate",
  "Review governance events for the round",
  "Check Super Validator status",
  "Escalate to on-call if unresolved",
];

export default function IncidentsPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number; timestamp: string } | null>(null);
  const [liveness, setLiveness] = useState<ValidatorInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const round = await getLatestRound();
        if (cancelled) return;
        setRoundInfo(round);
        await delay(1500);

        const list = await getValidatorLiveness();
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setLiveness(arr);

        const listAnomalies: Anomaly[] = [];
        arr.forEach((v) => {
          const missed = v.missed_rounds ?? 0;
          if (missed > 0) {
            listAnomalies.push({
              id: `missed-${v.validator_id}`,
              type: "missed_rounds",
              severity: missed > 5 ? "high" : "medium",
              title: `${missed} missed round(s)`,
              description: `Validator ${v.validator_id} missed liveness in recent rounds.`,
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              validatorId: v.validator_id,
            });
          }
        });
        if (!cancelled) setAnomalies(listAnomalies);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load blockchain data");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCount = anomalies.filter((a) => !a.resolvedAt).length;
  const resolvedCount = anomalies.filter((a) => a.resolvedAt).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Operational risk & incident intelligence
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Anomaly detection, incident timelines, runbook automation (data from blockchain)
          </p>
          {roundInfo && (
            <p className="text-sm text-muted-foreground mt-2">
              Latest round: <strong>{roundInfo.round}</strong>
            </p>
          )}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Open incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Resolved (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Current round
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roundInfo?.round ?? "—"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Anomalies & incidents
              </CardTitle>
              <CardDescription>
                From validator liveness: missed rounds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {anomalies.length === 0 && !error ? (
                <div className="py-8 text-center text-muted-foreground">
                  No anomalies detected from current liveness data.
                </div>
              ) : (
                anomalies.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-lg border p-4 ${
                      a.severity === "high"
                        ? "border-red-300 bg-red-50 dark:bg-red-950"
                        : a.severity === "medium"
                          ? "border-amber-300 bg-amber-50 dark:bg-amber-950"
                          : "border-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{a.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {a.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(a.timestamp).toLocaleString()}
                          {a.resolvedAt &&
                            ` · Resolved ${new Date(a.resolvedAt).toLocaleString()}`}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          a.severity === "high"
                            ? "bg-red-200 dark:bg-red-900"
                            : a.severity === "medium"
                              ? "bg-amber-200 dark:bg-amber-900"
                              : "bg-muted"
                        }`}
                      >
                        {a.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Runbook automation
              </CardTitle>
              <CardDescription>What to check and in what order</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {RUNBOOK_STEPS.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </li>
                ))}
              </ol>
              <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
                Postmortem template: timeline, root cause, action items, prevention.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
