"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGlobalActivitySummary, getLatestRound, delay } from "@/lib/api/scan-api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { HandCoins, AlertCircle, Loader2 } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { subDays } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function OffersPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [summary, setSummary] = useState<{
    offers: number;
    transfers: number;
    preapprovals: number;
    updates: number;
    totalVolume: number;
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
            offers: data.offers,
            transfers: data.transfers,
            preapprovals: data.preapprovals,
            updates: data.updates,
            totalVolume: data.totalVolume,
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
    summary && (summary.offers + summary.transfers + summary.preapprovals + summary.updates) > 0
      ? [
          { name: "Offers", value: summary.offers, color: COLORS[0] },
          { name: "Transfers", value: summary.transfers, color: COLORS[1] },
          { name: "Preapprovals", value: summary.preapprovals, color: COLORS[2] },
          { name: "Updates", value: summary.updates, color: COLORS[3] },
        ].filter((d) => d.value > 0)
      : [];
  const barData = summary
    ? [
        { name: "Offers", count: summary.offers },
        { name: "Transfers", count: summary.transfers },
        { name: "Preapprovals", count: summary.preapprovals },
        { name: "Updates", count: summary.updates },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <HandCoins className="h-8 w-8 text-primary" />
            Offers
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Network-wide offers and activity mix — data from blockchain
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity mix</CardTitle>
              <CardDescription>Offers, transfers, preapprovals, updates (30d)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
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

          <Card>
            <CardHeader>
              <CardTitle>Offers vs others</CardTitle>
              <CardDescription>Count by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {barData.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" name="Count" />
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

        {roundInfo && (
          <p className="text-sm text-muted-foreground mt-6">
            Latest round: <strong>{roundInfo.round}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
