"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDSOState, getLatestRound, delay } from "@/lib/api/scan-api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Crown, AlertCircle, Shield, Activity } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { TablePagination } from "@/components/ui/table-pagination";

export default function SuperValidatorsPage() {
  const [roundInfo, setRoundInfo] = useState<{ round: number } | null>(null);
  const [dsoState, setDsoState] = useState<{ voting_threshold: number; sv_node_states: { node_id: string; status: string }[] } | null>(null);
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

        const dso = await getDSOState();
        if (!cancelled) setDsoState(dso);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load DSO state");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const svNodes = dsoState?.sv_node_states ?? [];
  const nodeIdStr = (id: unknown) => (typeof id === "string" ? id : "");
  const statusStr = (s: unknown) => (typeof s === "string" ? s : "active");
  const svData = svNodes.map((n) => {
    const id = nodeIdStr(n.node_id);
    return {
      node_id: id,
      name: id.length > 24 ? id.slice(0, 24) + "…" : id,
      status: statusStr(n.status) === "active" ? 1 : 0,
    };
  });
  const activeCount = svNodes.filter((n) => statusStr(n.status) === "active").length;
  const paginatedNodes = svNodes.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2 text-foreground">
            <Crown className="h-8 w-8 text-primary" />
            Super Validators
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            DSO node states and participation — data from blockchain
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

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/15 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Voting threshold</p>
                  <p className="text-2xl font-bold">{loading ? "—" : (dsoState?.voting_threshold ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-500/15 p-3">
                  <Activity className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active SV nodes</p>
                  <p className="text-2xl font-bold">{loading ? "—" : activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <Crown className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total SV nodes</p>
                  <p className="text-2xl font-bold">{loading ? "—" : svNodes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">SV node status (chart)</CardTitle>
            <CardDescription>Active vs inactive distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {loading ? (
                <Loading className="h-full" />
              ) : svData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={svData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v ? "Active" : "Inactive")} stroke="currentColor" />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} stroke="currentColor" />
                    <Tooltip formatter={(v: number) => [v ? "Active" : "Inactive", "Status"]} />
                    <Bar dataKey="status" fill="#8b5cf6" name="Status" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No super validator data</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Super validator nodes</CardTitle>
            <CardDescription>Node ID and status — full list</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loading className="min-h-[200px]" />
            ) : svNodes.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">No SV nodes</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">#</th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">Node ID</th>
                        <th className="text-left py-3 px-3 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedNodes.map((n, i) => {
                        const nodeId = nodeIdStr(n.node_id);
                        const status = statusStr(n.status);
                        return (
                          <tr key={nodeId || i} className="border-b border-border last:border-0 hover:bg-muted/30">
                            <td className="py-3 px-3 text-muted-foreground">{(tablePage - 1) * tablePageSize + i + 1}</td>
                            <td className="py-3 px-3 font-mono text-xs break-all">{nodeId || "—"}</td>
                            <td className="py-3 px-3">
                              <span className={status === "active" ? "text-green-500" : "text-amber-500"}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  totalItems={svNodes.length}
                  pageSize={tablePageSize}
                  currentPage={tablePage}
                  onPageChange={setTablePage}
                  onPageSizeChange={(s) => { setTablePageSize(s); setTablePage(1); }}
                  label="nodes"
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
