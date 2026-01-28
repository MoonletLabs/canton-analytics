"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getGovernanceVoteDetail } from "@/lib/api/scan-api";
import type { GovernanceVote } from "@/lib/api/scan-api";
import { Loading } from "@/components/ui/loading";
import { Vote, AlertCircle, ArrowLeft, CheckCircle, XCircle, MinusCircle, FileJson, ExternalLink, Calendar, User, MessageSquare, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";

function copyToClipboard(text: string) {
  if (typeof navigator?.clipboard?.writeText === "function") {
    navigator.clipboard.writeText(text);
  }
}

/** Turn payload field into a display string (for fallback). */
function payloadDisplayValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

/** Format ISO date string for display. */
function formatVoteBefore(iso: unknown): string {
  if (iso == null || typeof iso !== "string") return "";
  try {
    const d = parseISO(iso);
    return format(d, "PPP 'at' p 'UTC'");
  } catch {
    return String(iso);
  }
}

/** Extract reason for display: { url?, body? } or string. */
function ReasonBlock({ reason }: { reason: unknown }) {
  if (reason == null) return null;
  if (typeof reason === "string") {
    return <p className="text-sm text-foreground leading-relaxed">{reason}</p>;
  }
  if (typeof reason === "object" && reason !== null && !Array.isArray(reason)) {
    const r = reason as { url?: string; body?: string };
    return (
      <div className="space-y-3">
        {r.url && (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View source / announcement
          </a>
        )}
        {r.body && (
          <blockquote className="border-l-2 border-primary/50 pl-4 py-1 text-sm text-muted-foreground leading-relaxed italic">
            {r.body}
          </blockquote>
        )}
        {!r.url && !r.body && <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(reason, null, 2)}</pre>}
      </div>
    );
  }
  return <p className="text-sm text-foreground whitespace-pre-wrap">{payloadDisplayValue(reason)}</p>;
}

/** Extract action for display: { tag, value: { dsoAction?: { tag, value?: { provider? } } } }. */
function ActionBlock({ action }: { action: unknown }) {
  if (action == null) return null;
  if (typeof action === "string") {
    return <p className="text-sm font-mono text-foreground">{action}</p>;
  }
  if (typeof action === "object" && action !== null && !Array.isArray(action)) {
    const a = action as { tag?: string; value?: { dsoAction?: { tag?: string; value?: { provider?: string } } } };
    const mainTag = a.tag;
    const dso = a.value?.dsoAction;
    const innerTag = dso?.tag;
    const provider = dso?.value?.provider;

    return (
      <div className="space-y-3">
        {mainTag && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</span>
            <span className="inline-flex items-center rounded-md bg-primary/15 px-2.5 py-1 text-sm font-mono font-medium text-primary">
              {mainTag}
            </span>
          </div>
        )}
        {innerTag && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</span>
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-mono">
              {innerTag}
            </span>
          </div>
        )}
        {provider && (
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Provider</span>
            <Link
              href={`/validators/${encodeURIComponent(provider)}`}
              className="text-sm font-mono text-primary hover:underline break-all"
            >
              {provider}
            </Link>
          </div>
        )}
        {!mainTag && !innerTag && !provider && (
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(action, null, 2)}</pre>
        )}
      </div>
    );
  }
  return <p className="text-sm text-foreground whitespace-pre-wrap">{payloadDisplayValue(action)}</p>;
}

export default function GovernanceDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [vote, setVote] = useState<GovernanceVote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing vote ID");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    getGovernanceVoteDetail(id)
      .then((v) => {
        if (!cancelled) setVote(v ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load vote");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayId = vote?.trackingCid ?? vote?.contract_id ?? id;
  const shortId = displayId.length > 32 ? displayId.slice(0, 16) + "…" + displayId.slice(-16) : displayId;

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Missing vote ID.</p>
          <Link href="/governance" className="text-primary hover:underline mt-2 inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Governance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/governance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Governance
        </Link>

        {loading ? (
          <Loading className="min-h-[320px]" text="Loading vote…" />
        ) : error ? (
          <Card className="bg-card/80 border-border border-destructive/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <span>{error}</span>
              </div>
              <Link href="/governance" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4">
                <ArrowLeft className="h-4 w-4" /> Back to Governance
              </Link>
            </CardContent>
          </Card>
        ) : vote ? (
          <div className="space-y-8">
            {/* Hero */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="rounded-2xl bg-primary/15 p-4 shrink-0">
                <Vote className="h-12 w-12 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-mono break-all leading-tight">
                  {displayId}
                </h1>
                <p className="text-muted-foreground font-mono text-sm mt-1 break-all">
                  {shortId}
                </p>
                {vote.status != null && (
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium mt-3 capitalize">
                    {String(vote.status)}
                  </span>
                )}
              </div>
            </div>

            {/* Vote counts */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-card/80 border-border overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-green-500/15 p-2.5">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Accept</p>
                      <p className="text-2xl font-bold text-foreground">
                        {typeof vote.acceptCount === "number" ? vote.acceptCount : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-500/15 p-2.5">
                      <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Reject</p>
                      <p className="text-2xl font-bold text-foreground">
                        {typeof vote.rejectCount === "number" ? vote.rejectCount : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-muted p-2.5">
                      <MinusCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">No vote</p>
                      <p className="text-2xl font-bold text-foreground">
                        {typeof vote.noVoteCount === "number" ? vote.noVoteCount : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Identifiers & details */}
            <Card className="bg-card/80 border-border shadow-lg shadow-black/5">
              <CardHeader>
                <CardTitle className="text-foreground">Vote details</CardTitle>
                <CardDescription>Identifiers and metadata from open votes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                  {vote.trackingCid && (
                    <div className="rounded-lg bg-muted/30 p-4">
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Tracking ID
                      </dt>
                      <dd
                        className="font-mono text-sm break-all cursor-pointer hover:text-primary transition-colors"
                        onClick={() => copyToClipboard(vote.trackingCid!)}
                        title="Click to copy"
                      >
                        {vote.trackingCid}
                      </dd>
                    </div>
                  )}
                  {vote.contract_id && (
                    <div className="rounded-lg bg-muted/30 p-4">
                      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Contract ID
                      </dt>
                      <dd
                        className="font-mono text-sm break-all cursor-pointer hover:text-primary transition-colors"
                        onClick={() => copyToClipboard(vote.contract_id!)}
                        title="Click to copy"
                      >
                        {vote.contract_id}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Payload — user-friendly */}
            {vote.payload && typeof vote.payload === "object" && (
              <Card className="bg-card/80 border-border shadow-lg shadow-black/5 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileJson className="h-5 w-5 text-primary" />
                    Proposal details
                  </CardTitle>
                  <CardDescription>Requester, reason, action and vote deadline</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {vote.payload.requester != null && payloadDisplayValue(vote.payload.requester) && (
                    <div className="space-y-2">
                      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <User className="h-3.5 w-3.5" />
                        Requester
                      </dt>
                      <dd className="font-medium text-foreground pl-5">
                        {payloadDisplayValue(vote.payload.requester)}
                      </dd>
                    </div>
                  )}

                  {vote.payload.reason != null && (
                    <div className="space-y-2">
                      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Reason
                      </dt>
                      <dd className="pl-5">
                        <ReasonBlock reason={vote.payload.reason} />
                      </dd>
                    </div>
                  )}

                  {vote.payload.action != null && (
                    <div className="space-y-2">
                      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Zap className="h-3.5 w-3.5" />
                        Action
                      </dt>
                      <dd className="pl-5">
                        <ActionBlock action={vote.payload.action} />
                      </dd>
                    </div>
                  )}

                  {vote.payload.voteBefore != null && payloadDisplayValue(vote.payload.voteBefore) && (
                    <div className="space-y-2">
                      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Calendar className="h-3.5 w-3.5" />
                        Vote before
                      </dt>
                      <dd className="text-sm text-foreground pl-5 font-medium">
                        {formatVoteBefore(vote.payload.voteBefore)}
                      </dd>
                    </div>
                  )}

                  <details className="rounded-lg border border-border bg-muted/10 overflow-hidden">
                    <summary className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-muted/20 select-none">
                      Technical details (raw JSON)
                    </summary>
                    <pre className="p-4 text-xs overflow-auto max-h-64 font-mono text-muted-foreground border-t border-border">
                      {JSON.stringify(vote.payload, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="bg-card/80 border-border">
            <CardContent className="pt-6 text-center py-12">
              <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
              <p className="text-muted-foreground font-medium">Vote not found</p>
              <p className="text-sm text-muted-foreground mt-1">
                It may have been resolved or the ID may be incorrect.
              </p>
              <Link
                href="/governance"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Governance
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
