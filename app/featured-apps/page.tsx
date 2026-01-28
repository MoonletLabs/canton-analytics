"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidatorLiveness, getLatestRound, delay } from "@/lib/api/scan-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Star, AlertCircle } from "lucide-react";

const REWARD_PER_LIVENESS = 2.85;

export default function FeaturedAppsPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [liveness, setLiveness] = useState<{ validator_id: string; liveness_rounds: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const round = await getLatestRound();
        if (cancelled) return;
        setRoundInfo(round);
        await delay(1500);

        const list = await getValidatorLiveness();
        if (!cancelled) setLiveness(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load data");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rewardData = liveness
    .map((v) => ({
      name: v.validator_id.length > 20 ? v.validator_id.slice(0, 20) + "…" : v.validator_id,
      rewards: (v.liveness_rounds ?? 0) * REWARD_PER_LIVENESS,
      liveness: v.liveness_rounds ?? 0,
    }))
    .sort((a, b) => b.rewards - a.rewards)
    .slice(0, 15);

  const totalRewards = rewardData.reduce((s, d) => s + d.rewards, 0);
  const pieData = rewardData.map((d, i) => ({
    name: d.name,
    value: d.rewards,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"][i % 5],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Star className="h-8 w-8 text-primary" />
            Featured Apps
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Reward share proxy from validator liveness — data from blockchain
          </p>
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
              <CardTitle>Rewards by validator (proxy)</CardTitle>
              <CardDescription>Liveness-based reward share (top 15)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[360px]">
                {rewardData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rewardData} layout="vertical" margin={{ left: 90 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [v.toFixed(2), "CC"]} />
                      <Bar dataKey="rewards" fill="#10b981" name="Rewards (CC)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reward share</CardTitle>
              <CardDescription>Distribution (total: {totalRewards.toFixed(0)} CC)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[360px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v.toFixed(2) + " CC", "Rewards"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data
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
