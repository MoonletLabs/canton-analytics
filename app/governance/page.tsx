"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  getDSOState,
  getLatestRound,
  getOpenVotes,
  delay
} from "@/lib/api/scan-api";
import type { GovernanceVote } from "@/lib/api/scan-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Vote, AlertCircle, Scale, Users, FileCheck } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import Link from "next/link";
import { TablePagination } from "@/components/ui/table-pagination";

export default function GovernancePage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [dsoState, setDsoState] = useState<{
    voting_threshold: number;
    sv_node_states: { node_id: string; status: string }[];
  } | null>(null);
  const [openVotes, setOpenVotes] = useState<GovernanceVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votesPage, setVotesPage] = useState(1);
  const [votesPageSize, setVotesPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const round = await getLatestRound();
        if (cancelled) return;
        setRoundInfo(round);
        await delay(800);

        const dso = await getDSOState();
        if (cancelled) return;
        setDsoState(dso);
        await delay(800);

        const votes = await getOpenVotes();
        if (!cancelled) setOpenVotes(Array.isArray(votes) ? votes : []);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load governance data"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount =
    dsoState?.sv_node_states?.filter((n) => n.status === "active").length ?? 0;
  const totalCount = dsoState?.sv_node_states?.length ?? 0;
  const chartData = dsoState
    ? [
        { name: "Voting threshold", value: dsoState.voting_threshold ?? 0 },
        { name: "Active SV nodes", value: activeCount },
        { name: "Total SV nodes", value: totalCount }
      ]
    : [];

  const paginatedVotes = openVotes.slice(
    (votesPage - 1) * votesPageSize,
    votesPage * votesPageSize
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-primary/15 p-3">
              <Vote className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Governance</h1>
              <p className="text-muted-foreground text-lg mt-0.5">
                DSO voting, node participation, and open votes — data from
                blockchain
              </p>
            </div>
          </div>
          {roundInfo && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              Latest round:{" "}
              <strong className="text-foreground">{roundInfo.round}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/15 text-destructive flex items-center gap-2 border border-destructive/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-card/80 border-border shadow-lg shadow-black/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/15 p-3">
                  <Scale className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Voting threshold
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? "—" : (dsoState?.voting_threshold ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border shadow-lg shadow-black/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-500/15 p-3">
                  <Users className="h-7 w-7 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Active SV nodes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? "—" : activeCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border shadow-lg shadow-black/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-muted p-3">
                  <FileCheck className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total SV nodes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? "—" : totalCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-card/80 border-border shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              Governance metrics
            </CardTitle>
            <CardDescription>
              Voting threshold and SV node counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {loading ? (
                <Loading className="h-full" text="Loading metrics…" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="name" stroke="currentColor" />
                    <YAxis stroke="currentColor" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.5rem",
                        border: "1px solid hsl(var(--border))"
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      name="Value"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No governance data
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border shadow-lg shadow-black/5 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-foreground">
              Open votes
            </CardTitle>
            <CardDescription>
              Governance votes — click a vote ID to view full details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12">
                <Loading className="min-h-[120px]" text="Loading open votes…" />
              </div>
            ) : openVotes.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No open votes
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left py-4 px-4 text-muted-foreground font-medium">
                          Vote ID
                        </th>
                        <th className="text-left py-4 px-4 text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="text-right py-4 px-4 text-muted-foreground font-medium">
                          Accept
                        </th>
                        <th className="text-right py-4 px-4 text-muted-foreground font-medium">
                          Reject
                        </th>
                        <th className="text-right py-4 px-4 text-muted-foreground font-medium">
                          No vote
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVotes.map((v, i) => {
                        const voteId =
                          v.trackingCid ?? v.contract_id ?? `vote-${i}`;
                        return (
                          <tr
                            key={voteId}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-xs break-all">
                              <Link
                                href={`/governance/${encodeURIComponent(voteId)}`}
                                className="text-primary hover:underline"
                              >
                                {voteId.length > 56
                                  ? voteId.slice(0, 56) + "…"
                                  : voteId}
                              </Link>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                                {v.status ?? "—"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {v.acceptCount ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-right font-medium">
                              {v.rejectCount ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground">
                              {v.noVoteCount ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={openVotes.length}
                  pageSize={votesPageSize}
                  currentPage={votesPage}
                  onPageChange={setVotesPage}
                  onPageSizeChange={(s) => {
                    setVotesPageSize(s);
                    setVotesPage(1);
                  }}
                  label="votes"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
