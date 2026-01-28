"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getAllUpdates, getLatestRound, delay } from "@/lib/api/scan-api";
import type { PartyUpdate } from "@/lib/api/scan-api";
import { FileStack, AlertCircle, Loader2, FileJson } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { TablePagination } from "@/components/ui/table-pagination";
import { subDays, format } from "date-fns";

export default function UpdatesPage() {
  const router = useRouter();
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
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load updates"
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

        <Card className="bg-card/80 border-border shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileJson className="h-5 w-5 text-primary" />
              Recent updates
            </CardTitle>
            <CardDescription>
              Click Details for the full update page.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <Loading className="min-h-[280px]" text="Loading updates…" />
            ) : updates.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center">
                No updates in period
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-4 px-4 text-muted-foreground font-semibold tracking-tight">
                          Update ID
                        </th>
                        <th className="text-left py-4 px-4 text-muted-foreground font-semibold tracking-tight whitespace-nowrap">
                          Record time
                        </th>
                        <th className="text-left py-4 px-4 text-muted-foreground font-semibold tracking-tight">
                          Parties
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {updates
                        .slice(
                          (updatesPage - 1) * updatesPageSize,
                          updatesPage * updatesPageSize
                        )
                        .map((u) => {
                          const href = `/updates/${encodeURIComponent(u.update_id)}/${encodeURIComponent(u.timestamp)}`;
                          return (
                            <tr
                              key={`${u.update_id}-${u.timestamp}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => router.push(href)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  router.push(href);
                                }
                              }}
                              className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                            >
                              <td
                                className="py-4 px-4 font-mono text-xs break-all max-w-[240px] text-foreground/90"
                                title={u.update_id}
                              >
                                {u.update_id.length > 40
                                  ? u.update_id.slice(0, 40) + "…"
                                  : u.update_id}
                              </td>
                              <td className="py-4 px-4 text-muted-foreground whitespace-nowrap tabular-nums">
                                {format(
                                  new Date(u.timestamp),
                                  "MMM d, yyyy HH:mm:ss"
                                )}
                              </td>
                              <td
                                className="py-4 px-4 text-muted-foreground max-w-[220px] truncate"
                                title={u.parties?.join(", ")}
                              >
                                {u.parties?.length ? u.parties.join(", ") : "—"}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-border bg-muted/10">
                  <TablePagination
                    totalItems={updates.length}
                    pageSize={updatesPageSize}
                    currentPage={updatesPage}
                    onPageChange={setUpdatesPage}
                    onPageSizeChange={(s) => {
                      setUpdatesPageSize(s);
                      setUpdatesPage(1);
                    }}
                    label="updates"
                  />
                </div>
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
