"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLatestRound,
  getDSOState,
  getValidatorLiveness,
  delay,
} from "@/lib/api/scan-api";
import {
  BarChart3,
  FileText,
  Calculator,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Activity,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const PRODUCTS = [
  {
    href: "/",
    title: "Featured App / Committee Reporting",
    description:
      "One-click committee submission packs: PDF/CSV with provenance, evidence bundles, requirements checklist.",
    icon: FileText,
  },
  {
    href: "/validator-finops",
    title: "Validator FinOps",
    description:
      "Traffic burn vs rewards vs margin, runway forecast, what-changed attribution, idle/moderate/heavy scenarios.",
    icon: Calculator,
  },
  {
    href: "/operator-console",
    title: "Multi-tenant Operator Console",
    description:
      "Per-customer SLA, reward attribution, invoiceable statements, access control and audit trails.",
    icon: Users,
  },
  {
    href: "/incidents",
    title: "Operational risk & incidents",
    description:
      "Anomaly detection, incident timelines, runbook automation — PagerDuty-for-Canton.",
    icon: Zap,
  },
  {
    href: "/compliance-vault",
    title: "Compliance Evidence Vault",
    description:
      "Controlled exports, immutable evidence snapshots, counterparty exposure summaries.",
    icon: Shield,
  },
];

export default function AnalyticsPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number; timestamp: string } | null>(null);
  const [dsoState, setDsoState] = useState<{
    voting_threshold: number;
    sv_node_states: { node_id: string; status: string }[];
  } | null>(null);
  const [validatorCount, setValidatorCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const round = await getLatestRound();
        if (cancelled) return;
        setRoundInfo(round);
        await delay(1500);

        const dso = await getDSOState();
        if (cancelled) return;
        setDsoState(dso);
        await delay(1500);

        const liveness = await getValidatorLiveness();
        if (!cancelled) setValidatorCount(Array.isArray(liveness) ? liveness.length : 0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load blockchain data");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Canton Analytics
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Workflow products for enterprise and operators — data from blockchain
          </p>
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {!error && (roundInfo || dsoState || validatorCount !== null) && (
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {roundInfo && (
                <span className="text-sm text-muted-foreground">
                  Latest round: <strong>{roundInfo.round}</strong>
                </span>
              )}
              {dsoState && (
                <span className="text-sm text-muted-foreground">
                  SV nodes: <strong>{dsoState.sv_node_states?.length ?? 0}</strong>
                </span>
              )}
              {validatorCount !== null && (
                <span className="text-sm text-muted-foreground">
                  Validators (liveness): <strong>{validatorCount}</strong>
                </span>
              )}
              <span className="text-sm font-medium text-green-600">Data from blockchain</span>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Current round
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roundInfo?.round ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Validators (liveness)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validatorCount ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Data source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">Blockchain</div>
              <div className="text-xs text-muted-foreground">Public RPC / Scan API</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Product workflows</CardTitle>
            <CardDescription>
              High-signal gaps CC View doesn’t cover: governance, FinOps, NaaS, incidents,
              compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-1">
            {PRODUCTS.map((p) => {
              const Icon = p.icon;
              return (
                <Link key={p.href} href={p.href}>
                  <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {p.description}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
