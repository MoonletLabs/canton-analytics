"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllUpdates, getLatestRound, delay } from "@/lib/api/scan-api";
import type { PartyUpdate } from "@/lib/api/scan-api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { FileStack, AlertCircle, Loader2, FileJson } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { TablePagination } from "@/components/ui/table-pagination";
import { subDays, format, startOfDay } from "date-fns";

export default function UpdatesPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [updates, setUpdates] = useState<PartyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatesPage, setUpdatesPage] = useState(1);
  const [updatesPageSize, setUpdatesPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const r = await getLatestRound();
        if (cancelled) return;
        setRoundInfo(r);
        await delay(1500);

        const end = new Date();
        const start = subDays(end, 14);
        const data = await getAllUpdates(start, end, 2000);
        if (!cancelled) setUpdates(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load updates");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const byDay = updates.reduce<Record<string, number>>((acc, u) => {
    const day = format(startOfDay(new Date(u.timestamp)), "yyyy-MM-dd");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(byDay)
    .map(([day, count]) => ({ day, count, date: day }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const byType = updates.reduce<Record<string, number>>((acc, u) => {
    const t = u.update_type || "other";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <FileStack className="h-8 w-8 text-primary" />
            Updates
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Network-wide update activity — data from blockchain
          </p>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading all updates…
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Updates over time</CardTitle>
              <CardDescription>Count per day (network)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    {loading ? <Loading className="h-full" /> : <span className="text-muted-foreground">No updates</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By update type</CardTitle>
              <CardDescription>Distribution by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    {loading ? <Loading className="h-full" /> : <span className="text-muted-foreground">No data</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              Recent updates
            </CardTitle>
            <CardDescription>Click &quot;Details&quot; for full update page.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading className="min-h-[200px]" text="Loading updates…" />
            ) : updates.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No updates in period</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Update ID</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Record time</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Parties</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updates.slice((updatesPage - 1) * updatesPageSize, updatesPage * updatesPageSize).map((u) => (
                        <tr key={`${u.update_id}-${u.timestamp}`} className="border-b border-border hover:bg-muted/30">
                          <td className="py-3 px-2 font-mono text-xs break-all max-w-[200px]" title={u.update_id}>
                            {u.update_id.length > 32 ? u.update_id.slice(0, 32) + "…" : u.update_id}
                          </td>
                          <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                            {format(new Date(u.timestamp), "yyyy-MM-dd HH:mm:ss")}
                          </td>
                          <td className="py-3 px-2 text-muted-foreground max-w-[180px] truncate" title={u.parties?.join(", ")}>
                            {u.parties?.length ? u.parties.join(", ") : "—"}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/updates/${encodeURIComponent(u.update_id)}/${encodeURIComponent(u.timestamp)}`}
                              >
                                <FileJson className="h-4 w-4 mr-1" />
                                Details
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={updates.length}
                  pageSize={updatesPageSize}
                  currentPage={updatesPage}
                  onPageChange={setUpdatesPage}
                  onPageSizeChange={(s) => { setUpdatesPageSize(s); setUpdatesPage(1); }}
                  label="updates"
                />
              </>
            )}
          </CardContent>
        </Card>

        {roundInfo && (
          <p className="text-sm text-muted-foreground mt-6">
            Latest round: <strong>{roundInfo.round}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
