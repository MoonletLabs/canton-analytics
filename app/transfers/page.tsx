"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllTransfers, getLatestRound, delay } from "@/lib/api/scan-api";
import type { Transfer } from "@/lib/api/scan-api";
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
import { ArrowLeftRight, AlertCircle, Loader2 } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { subDays, format, startOfDay } from "date-fns";

export default function TransfersPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
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
        const start = subDays(end, 14);
        const data = await getAllTransfers(start, end, 2000);
        if (!cancelled) setTransfers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load transfers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const byDay = transfers.reduce<Record<string, { count: number; volume: number }>>((acc, t) => {
    const day = format(startOfDay(new Date(t.timestamp)), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = { count: 0, volume: 0 };
    acc[day].count += 1;
    acc[day].volume += t.amount || 0;
    return acc;
  }, {});
  const chartData = Object.entries(byDay)
    .map(([day, v]) => ({ day, count: v.count, volume: Math.round(v.volume) }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
            Transfers
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Network-wide transfer volume and count — data from blockchain
          </p>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading all transfers…
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
              <CardTitle>Volume over time</CardTitle>
              <CardDescription>Transfer volume per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(v: number) => [v, "Volume"]} />
                      <Area type="monotone" dataKey="volume" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    {loading ? <Loading className="h-full" /> : <span className="text-muted-foreground">No transfers</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Count over time</CardTitle>
              <CardDescription>Number of transfers per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Transfers" />
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
