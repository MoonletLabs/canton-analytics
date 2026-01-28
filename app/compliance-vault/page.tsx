"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Lock } from "lucide-react";

interface ExportRecord {
  id: string;
  exportedAt: string;
  exportedBy: string;
  resource: string;
  format: string;
  snapshotHash?: string;
}

interface EvidenceSnapshot {
  id: string;
  createdAt: string;
  scope: string;
  hash: string;
  immutable: boolean;
}

export default function ComplianceVaultPage() {
  const exports: ExportRecord[] = [];
  const snapshots: EvidenceSnapshot[] = [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Compliance Evidence Vault
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Controlled exports, immutable evidence snapshots, counterparty exposure
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Controlled exports
              </CardTitle>
              <CardDescription>
                Who exported what and when
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exports.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">
                  No exports yet. Request an export to record who exported what and when.
                </p>
              ) : (
                <div className="space-y-3">
                  {exports.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium text-sm">{r.resource}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.exportedBy} · {new Date(r.exportedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-mono">{r.format}</div>
                        {r.snapshotHash && (
                          <div className="text-muted-foreground">{r.snapshotHash}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="mt-4 w-full">
                Request export
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Immutable evidence snapshots
              </CardTitle>
              <CardDescription>
                Timestamped, hash-anchored evidence for audits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshots.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">
                  No evidence snapshots yet. Create a snapshot to store immutable, hash-anchored
                  evidence for audits.
                </p>
              ) : (
                snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium text-sm">{s.scope}</div>
                      <div className="text-xs text-muted-foreground font-mono">{s.hash}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(s.createdAt).toLocaleString()} ·{" "}
                        {s.immutable ? "Immutable" : "Mutable"}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="mt-4 w-full">
                Create snapshot
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Counterparty exposure summaries</CardTitle>
            <CardDescription>
              Privacy-aware audit view: exposure by counterparty. Data would come from your
              on-chain activity when integrated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground py-6 text-center">
              No counterparty exposure data loaded. Connect your party/validator data to see
              summaries here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
