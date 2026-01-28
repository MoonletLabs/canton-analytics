"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGlobalActivitySummary, getLatestRound, delay } from "@/lib/api/scan-api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { FileCheck, AlertCircle, Loader2 } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { subDays } from "date-fns";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

export default function PreapprovalsPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [summary, setSummary] = useState<{
    preapprovals: number;
    offers: number;
    transfers: number;
    updates: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const start = subDays(end, 30);
        const data = await getGlobalActivitySummary(start, end, 2000);
        if (!cancelled)
          setSummary({
            preapprovals: data.preapprovals,
            offers: data.offers,
            transfers: data.transfers,
            updates: data.updates,
          });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load activity");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activityData =
    summary && (summary.preapprovals + summary.offers + summary.transfers + summary.updates) > 0
      ? [
          { name: "Preapprovals", value: summary.preapprovals, color: COLORS[0] },
          { name: "Offers", value: summary.offers, color: COLORS[1] },
          { name: "Transfers", value: summary.transfers, color: COLORS[2] },
          { name: "Updates", value: summary.updates, color: COLORS[3] },
        ].filter((d) => d.value > 0)
      : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-primary" />
            Preapprovals
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Network-wide preapprovals and activity — data from blockchain
          </p>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activity…
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Activity breakdown (30d)</CardTitle>
            <CardDescription>Preapprovals, offers, transfers, updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {activityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  {loading ? <Loading className="h-full" /> : <span className="text-muted-foreground">No activity</span>}
                </div>
              )}
            </div>
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
