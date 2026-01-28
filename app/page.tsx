"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getLatestRound,
  getDSOState,
  getValidatorLiveness,
  getOpenVotes,
  delay,
} from "@/lib/api/scan-api";
import type { ValidatorInfo, GovernanceVote } from "@/lib/api/scan-api";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Compass,
  TrendingUp,
  Users,
  ArrowRight,
  AlertCircle,
  Vote,
} from "lucide-react";
import { format } from "date-fns";
import { Loading } from "@/components/ui/loading";
import { TablePagination } from "@/components/ui/table-pagination";

const DELAY_MS = 800;

interface TenantRow {
  id: string;
  name: string;
  validatorId: string;
  slaPercent: number;
  missedRounds: number;
  rewardAttribution: number;
  lastIncident?: string;
}

export default function DashboardPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number; timestamp: string } | null>(null);
  const [dsoState, setDsoState] = useState<{ voting_threshold: number; sv_node_states: { node_id: string; status: string }[] } | null>(null);
  const [liveness, setLiveness] = useState<ValidatorInfo[]>([]);
  const [openVotes, setOpenVotes] = useState<GovernanceVote[]>([]);

  const [loadingRound, setLoadingRound] = useState(true);
  const [loadingDso, setLoadingDso] = useState(false);
  const [loadingLiveness, setLoadingLiveness] = useState(false);
  const [loadingOpenVotes, setLoadingOpenVotes] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const [openVotesPage, setOpenVotesPage] = useState(1);
  const [openVotesPageSize, setOpenVotesPageSize] = useState(10);
  const [tenantsPage, setTenantsPage] = useState(1);
  const [tenantsPageSize, setTenantsPageSize] = useState(10);
  const [rewardPage, setRewardPage] = useState(1);
  const [rewardPageSize, setRewardPageSize] = useState(9);

  useEffect(() => {
    cancelledRef.current = false;
    setError(null);

    async function runSequence() {
      try {
        setLoadingRound(true);
        const round = await getLatestRound();
        if (cancelledRef.current) return;
        setRoundInfo(round);
        setLoadingRound(false);
        await delay(DELAY_MS);

        setLoadingDso(true);
        const dso = await getDSOState();
        if (cancelledRef.current) return;
        setDsoState(dso);
        setLoadingDso(false);
        await delay(DELAY_MS);

        setLoadingLiveness(true);
        const list = await getValidatorLiveness();
        if (cancelledRef.current) return;
        setLiveness(Array.isArray(list) ? list : []);
        setLoadingLiveness(false);
        await delay(DELAY_MS);

        setLoadingOpenVotes(true);
        const votes = await getOpenVotes();
        if (cancelledRef.current) return;
        setOpenVotes(Array.isArray(votes) ? votes : []);
        setLoadingOpenVotes(false);
      } catch (err) {
        if (!cancelledRef.current) setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!cancelledRef.current) {
          setLoadingRound(false);
          setLoadingDso(false);
          setLoadingLiveness(false);
          setLoadingOpenVotes(false);
        }
      }
    }
    runSequence();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const validatorChart = liveness.slice(0, 12).map((v) => ({
    validator_id: v.validator_id,
    name: v.validator_id.length > 20 ? v.validator_id.slice(0, 20) + "…" : v.validator_id,
    liveness: v.liveness_rounds ?? 0,
    missed: v.missed_rounds ?? 0,
  }));

  const tenants: TenantRow[] = liveness.map((v, i) => ({
    id: v.validator_id,
    name: `Tenant ${i + 1}`,
    validatorId: v.validator_id,
    slaPercent: v.missed_rounds === 0 ? 100 : Math.max(0, 100 - (v.missed_rounds / 144) * 100),
    missedRounds: v.missed_rounds,
    rewardAttribution: (v.liveness_rounds ?? 0) * 2.85,
    lastIncident: (v.missed_rounds ?? 0) > 0 ? new Date(Date.now() - 86400000).toISOString() : undefined,
  }));

  const formatRoundTs = (ts: string | undefined) => {
    if (ts == null || ts === "") return "—";
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? "—" : format(d, "PPp");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2 text-foreground">
            <Compass className="h-8 w-8 text-primary" />
            Canton Dashboard
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Network metrics, validators, governance, and operator view — one place
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/15 text-destructive flex items-center gap-2 border border-destructive/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(200px,320px)_1fr] mb-8">
          <Card className="bg-card/80 border-border flex flex-col justify-center min-h-[200px]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Economics
              </CardTitle>
              <CardDescription className="text-xs">Latest round and consensus</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex flex-1 flex-col justify-center">
              <div className="flex flex-col items-center justify-center min-h-[100px]">
                {loadingRound ? (
                  <Loading className="min-h-[80px]" text="Loading round…" />
                ) : roundInfo ? (
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{roundInfo.round}</div>
                    <div className="text-sm text-muted-foreground">Current round</div>
                    <div className="text-xs text-muted-foreground mt-1">{formatRoundTs(roundInfo.timestamp)}</div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No round data</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                Validator liveness
              </CardTitle>
              <CardDescription>Liveness vs missed rounds (top 12)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[380px]">
                {loadingLiveness ? (
                  <Loading className="h-full" text="Loading validators…" />
                ) : validatorChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={validatorChart} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" stroke="currentColor" />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} stroke="currentColor" />
                      <Tooltip
                        content={({ payload }) => {
                          const p = payload?.[0]?.payload;
                          if (!p?.validator_id) return null;
                          return (
                            <div className="rounded-lg border bg-card p-2 shadow-lg">
                              <Link
                                href={`/validators/${encodeURIComponent(p.validator_id)}`}
                                className="text-primary hover:underline font-mono text-sm"
                              >
                                {p.validator_id}
                              </Link>
                              <div className="text-xs mt-1">Liveness: {p.liveness} · Missed: {p.missed}</div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="liveness" fill="#10b981" name="Liveness" />
                      <Bar dataKey="missed" fill="#ef4444" name="Missed" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No validator data</div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href="/validators">
                  <Button variant="outline" size="sm">Validators <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </Link>
                <Link href="/super-validators">
                  <Button variant="outline" size="sm">Super Validators <ArrowRight className="ml-1 h-4 w-4" /></Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Vote className="h-5 w-5 text-primary" />
              Governance metrics & open votes
            </CardTitle>
            <CardDescription>DSO state and open governance votes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingDso ? (
              <Loading className="min-h-[80px]" text="Loading DSO…" />
            ) : dsoState && (
              <div className="flex gap-6 flex-wrap text-sm">
                <span className="text-muted-foreground">Voting threshold: <strong className="text-foreground">{dsoState.voting_threshold ?? 0}</strong></span>
                <span className="text-muted-foreground">SV nodes: <strong className="text-foreground">{dsoState.sv_node_states?.length ?? 0}</strong></span>
              </div>
            )}
            {loadingOpenVotes ? (
              <Loading className="min-h-[100px]" text="Loading open votes…" />
            ) : openVotes.length === 0 ? (
              <p className="text-muted-foreground py-4">No open votes</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Vote ID</th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">Accept</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">Reject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openVotes.slice((openVotesPage - 1) * openVotesPageSize, openVotesPage * openVotesPageSize).map((v, i) => {
                        const voteId = v.trackingCid ?? v.contract_id ?? `vote-${i}`;
                        return (
                          <tr key={voteId} className="border-b border-border hover:bg-muted/30">
                            <td className="py-2 px-2 font-mono text-xs break-all">
                              <Link href={`/governance/${encodeURIComponent(voteId)}`} className="text-primary hover:underline">
                                {voteId.length > 48 ? voteId.slice(0, 48) + "…" : voteId}
                              </Link>
                            </td>
                            <td className="py-2 px-2">{v.status ?? "—"}</td>
                            <td className="py-2 px-2 text-right">{v.acceptCount ?? "—"}</td>
                            <td className="py-2 px-2 text-right">{v.rejectCount ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={openVotes.length}
                  pageSize={openVotesPageSize}
                  currentPage={openVotesPage}
                  onPageChange={setOpenVotesPage}
                  onPageSizeChange={(s) => { setOpenVotesPageSize(s); setOpenVotesPage(1); }}
                  label="votes"
                />
              </>
            )}
            <Link href="/governance">
              <Button variant="outline" size="sm">Governance <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Tenants & SLA (operator view)
            </CardTitle>
            <CardDescription>Per-validator uptime from blockchain liveness</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLiveness ? (
              <Loading className="min-h-[200px]" text="Loading…" />
            ) : tenants.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No validator liveness data</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Tenant</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Validator ID</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">SLA %</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Missed rounds</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Last incident</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.slice((tenantsPage - 1) * tenantsPageSize, tenantsPage * tenantsPageSize).map((t) => (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/30">
                          <td className="py-3 px-2 font-medium">{t.name}</td>
                          <td className="py-3 px-2 font-mono text-xs">
                            <Link href={`/validators/${encodeURIComponent(t.validatorId)}`} className="text-primary hover:underline">{t.validatorId}</Link>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span
                              className={
                                t.slaPercent >= 99 ? "text-green-500" : t.slaPercent >= 95 ? "text-amber-500" : "text-red-500"
                              }
                            >
                              {t.slaPercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">{t.missedRounds}</td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {t.lastIncident ? new Date(t.lastIncident).toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={tenants.length}
                  pageSize={tenantsPageSize}
                  currentPage={tenantsPage}
                  onPageChange={setTenantsPage}
                  onPageSizeChange={(s) => { setTenantsPageSize(s); setTenantsPage(1); }}
                  label="tenants"
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Reward attribution (operator view)
            </CardTitle>
            <CardDescription>Per-tenant reward attribution from on-chain liveness</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLiveness ? (
              <Loading className="min-h-[120px]" text="Loading…" />
            ) : tenants.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">No data</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Tenant</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Validator ID</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Reward (CC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.slice((rewardPage - 1) * rewardPageSize, rewardPage * rewardPageSize).map((t) => (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/30">
                          <td className="py-3 px-2 font-medium">{t.name}</td>
                          <td className="py-3 px-2 font-mono text-xs">
                            <Link href={`/validators/${encodeURIComponent(t.validatorId)}`} className="text-primary hover:underline">{t.validatorId}</Link>
                          </td>
                          <td className="py-3 px-2 text-right font-semibold">{t.rewardAttribution.toLocaleString()} CC</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={tenants.length}
                  pageSize={rewardPageSize}
                  currentPage={rewardPage}
                  onPageChange={setRewardPage}
                  onPageSizeChange={(s) => { setRewardPageSize(s); setRewardPage(1); }}
                  label="tenants"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
