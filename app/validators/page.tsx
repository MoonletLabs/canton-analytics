"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidatorLiveness, getLatestRound, delay } from "@/lib/api/scan-api";
import type { ValidatorInfo } from "@/lib/api/scan-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Shield, AlertCircle, Server, Activity } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { TablePagination } from "@/components/ui/table-pagination";
import { format } from "date-fns";

export default function ValidatorsPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [liveness, setLiveness] = useState<ValidatorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const round = await getLatestRound();
        if (cancelled) return;
        setRoundInfo(round);
        await delay(1500);

        const list = await getValidatorLiveness();
        if (!cancelled) setLiveness(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load validators");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const topMissed = [...liveness]
    .sort((a, b) => (b.missed_rounds ?? 0) - (a.missed_rounds ?? 0))
    .slice(0, 20);

  const chartData = topMissed.map((v, i) => ({
    validator_id: v.validator_id,
    rank: i + 1,
    label: v.validator_id.length > 22 ? v.validator_id.slice(0, 22) + "…" : v.validator_id,
    missed: v.missed_rounds ?? 0,
  }));

  const paginatedLiveness = liveness.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2 text-foreground">
            <Shield className="h-8 w-8 text-primary" />
            Validators
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Validator liveness, status, and last activity — data from blockchain
          </p>
          {roundInfo && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              Latest round: <strong className="text-foreground">{roundInfo.round}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/15 text-destructive flex items-center gap-2 border border-destructive/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Card className="mb-8 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Missed rounds (coupons) per validator
            </CardTitle>
            <CardDescription>Top 20 by missed count — from API faucet data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <Loading className="min-h-[320px]" />
            ) : chartData.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No validator data</p>
            ) : (
                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" stroke="currentColor" tick={{ fontSize: 11 }} allowDataOverflow={false} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={140}
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        interval={0}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ payload }) => {
                          const p = payload?.[0]?.payload;
                          if (!p?.validator_id) return null;
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-lg max-w-sm">
                              <Link
                                href={`/validators/${encodeURIComponent(p.validator_id)}`}
                                className="text-primary hover:underline font-mono text-xs break-all"
                              >
                                {p.validator_id}
                              </Link>
                              <div className="text-sm mt-1.5 font-medium">Missed: {p.missed?.toLocaleString() ?? 0}</div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="missed" fill="#ef4444" name="Missed" radius={[0, 2, 2, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">All validators</CardTitle>
            <CardDescription>Validator ID, sponsor, status, liveness, missed rounds, last active — click row for details</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading className="min-h-[200px]" />
            ) : liveness.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No validator data</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">Validator ID</th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">Sponsor / Name</th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-right py-3 px-3 text-muted-foreground font-medium">Liveness</th>
                        <th className="text-right py-3 px-3 text-muted-foreground font-medium">Missed</th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">Last active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLiveness.map((v) => (
                        <tr key={v.validator_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-3 font-mono text-xs">
                            <Link href={`/validators/${encodeURIComponent(v.validator_id)}`} className="text-primary hover:underline break-all">
                              {v.validator_id}
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">{v.name ?? "—"}</td>
                          <td className="py-3 px-3">
                            <span className={v.status === "active" ? "text-green-500" : "text-amber-500"}>
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">{v.liveness_rounds ?? 0}</td>
                          <td className="py-3 px-3 text-right">{v.missed_rounds ?? 0}</td>
                          <td className="py-3 px-3 text-muted-foreground text-xs">
                            {v.collection_timing?.last ? format(new Date(v.collection_timing.last), "PP") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={liveness.length}
                  pageSize={tablePageSize}
                  currentPage={tablePage}
                  onPageChange={setTablePage}
                  onPageSizeChange={(s) => { setTablePageSize(s); setTablePage(1); }}
                  label="validators"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
