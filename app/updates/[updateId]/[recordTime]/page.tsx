"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUpdateDetail } from "@/lib/api/scan-api";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, FileText, CheckCircle, Users, Coins, Calendar, Hash, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";

function formatTs(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = parseISO(iso);
    return format(d, "PPpp");
  } catch {
    return String(iso);
  }
}

interface UpdateDetailData {
  recordTime?: string;
  updateId?: string;
  effectiveAt?: string;
  eventCount?: number;
  migrationId?: number;
  workflowId?: string;
  synchronizerId?: string;
  submittingPartyId?: string;
  partiesSummarized?: boolean;
  amuletTransferred?: string;
  totalMinted?: string;
  totalBurned?: string;
  createdAt?: string;
  updatedAt?: string;
  balanceChanges?: {
    byParty?: Record<string, {
      partyId?: string;
      recordTime?: string;
      updateId?: string;
      round?: number;
      amuletPrice?: string;
      unlockedBalanceChange?: string;
      lockedBalanceChange?: string;
      amuletTransferred?: string;
      [key: string]: unknown;
    }>;
  };
  raw?: {
    verdict?: {
      verdict_result?: string;
      finalization_time?: string;
      record_time?: string;
      domain_id?: string;
      submitting_parties?: string[];
      submitting_participant_uid?: string;
      mediator_group?: number;
      [key: string]: unknown;
    };
    update?: {
      update_id?: string;
      record_time?: string;
      effective_at?: string;
      root_event_ids?: string[];
      events_by_id?: Record<string, { event_type?: string; template_id?: string; choice?: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export default function UpdateDetailPage() {
  const params = useParams();
  const updateId = typeof params.updateId === "string" ? params.updateId : "";
  const recordTimeRaw = typeof params.recordTime === "string" ? params.recordTime : "";
  const recordTime = recordTimeRaw.includes("%") ? decodeURIComponent(recordTimeRaw) : recordTimeRaw;

  const [data, setData] = useState<UpdateDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!updateId || !recordTime) {
      setLoading(false);
      setError("Missing update ID or record time");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUpdateDetail(updateId, recordTime)
      .then((res) => {
        if (!cancelled) setData(res as UpdateDetailData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load update");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [updateId, recordTime]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <Loading className="min-h-[40vh]" text="Loading update…" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <Card className="bg-card/80 border-border max-w-xl">
            <CardContent className="pt-6">
              <p className="text-destructive">{error ?? "Update not found."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const verdict = data.raw?.verdict;
  const byParty = data.balanceChanges?.byParty ?? {};
  const partyEntries = Object.entries(byParty);
  const eventsById = data.raw?.update?.events_by_id ?? {};
  const eventList = Object.entries(eventsById);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-7 w-7 text-primary" />
            Update detail
          </h1>
          <p className="font-mono text-sm text-muted-foreground mt-1 break-all" title={data.updateId}>
            {data.updateId ?? "—"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Record time</span>
                <span className="font-mono text-right">{formatTs(data.recordTime)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Effective at</span>
                <span className="font-mono text-right">{formatTs(data.effectiveAt)}</span>
              </div>
              {verdict?.finalization_time && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Finalization time</span>
                  <span className="font-mono text-right">{formatTs(verdict.finalization_time as string)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Event count</span>
                <span className="font-mono">{data.eventCount ?? "—"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Migration ID</span>
                <span className="font-mono">{data.migrationId ?? "—"}</span>
              </div>
              {data.amuletTransferred != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Amulet transferred</span>
                  <span className="font-mono font-semibold">{data.amuletTransferred}</span>
                </div>
              )}
              {verdict?.verdict_result != null && (
                <div className="flex justify-between gap-4 items-center">
                  <span className="text-muted-foreground">Verdict</span>
                  <span className="inline-flex items-center gap-1 font-mono text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    {String(verdict.verdict_result).replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Parties
            </CardTitle>
            <CardDescription>Submitting party and participant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data.submittingPartyId && (
              <div>
                <span className="text-muted-foreground block mb-1">Submitting party</span>
                <p className="font-mono text-xs break-all bg-muted/50 rounded px-2 py-2">{data.submittingPartyId}</p>
              </div>
            )}
            {verdict?.submitting_participant_uid != null && (
              <div>
                <span className="text-muted-foreground block mb-1">Submitting participant</span>
                <p className="font-mono text-xs break-all bg-muted/50 rounded px-2 py-2">
                  {String(verdict.submitting_participant_uid)}
                </p>
              </div>
            )}
            {verdict?.submitting_parties && Array.isArray(verdict.submitting_parties) && verdict.submitting_parties.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">Parties</span>
                <ul className="list-disc list-inside space-y-1 font-mono text-xs break-all">
                  {verdict.submitting_parties.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {partyEntries.length > 0 && (
          <Card className="mb-8 bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Balance changes
              </CardTitle>
              <CardDescription>Per-party balance deltas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Party</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Unlocked Δ</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Locked Δ</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Amulet transferred</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyEntries.map(([_, row]) => (
                      <tr key={row.partyId ?? _} className="border-b border-border hover:bg-muted/20">
                        <td className="py-2 px-2 font-mono text-xs break-all max-w-[220px]">{row.partyId ?? "—"}</td>
                        <td className="py-2 px-2 text-right font-mono">{row.unlockedBalanceChange ?? "—"}</td>
                        <td className="py-2 px-2 text-right font-mono">{row.lockedBalanceChange ?? "—"}</td>
                        <td className="py-2 px-2 text-right font-mono font-semibold">{row.amuletTransferred ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {eventList.length > 0 && (
          <Card className="mb-8 bg-card/80 border-border">
            <CardHeader>
              <CardTitle className="text-base">Events</CardTitle>
              <CardDescription>Event count: {eventList.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {eventList.slice(0, 20).map(([eventId, ev]) => (
                  <li key={eventId} className="flex flex-wrap gap-2 items-center border-b border-border/50 pb-2">
                    <span className="font-mono text-xs text-muted-foreground">{eventId}</span>
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs">
                      {ev.event_type ?? "—"}
                    </span>
                    {ev.template_id != null && (
                      <span className="font-mono text-xs truncate max-w-[200px]" title={String(ev.template_id)}>
                        {String(ev.template_id).slice(-24)}
                      </span>
                    )}
                    {ev.choice != null && (
                      <span className="text-muted-foreground text-xs">{String(ev.choice)}</span>
                    )}
                  </li>
                ))}
                {eventList.length > 20 && (
                  <li className="text-muted-foreground text-xs pt-2">+{eventList.length - 20} more events</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card/80 border-border">
          <CardHeader>
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="flex items-center gap-2 text-left w-full text-muted-foreground hover:text-foreground"
            >
              {showRaw ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <CardTitle className="text-base">Raw JSON</CardTitle>
            </button>
          </CardHeader>
          {showRaw && (
            <CardContent>
              <pre className="text-xs overflow-auto max-h-[60vh] rounded-lg bg-muted/50 p-4 whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
