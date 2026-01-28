"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Hash, Clock, FileText } from "lucide-react";
import type { EvidenceBundle as EvidenceBundleType } from "@/lib/report-generator";

interface EvidenceBundleProps {
  evidence: EvidenceBundleType;
}

export function EvidenceBundle({ evidence }: EvidenceBundleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Evidence Bundle
        </CardTitle>
        <CardDescription>
          Cryptographic proof of data integrity and provenance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Snapshot Hash
          </div>
          <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
            {evidence.snapshotHash}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Data Hash
          </div>
          <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
            {evidence.dataHash}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Timestamp
          </div>
          <div className="p-3 bg-muted rounded-md text-sm">
            {new Date(evidence.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Derivation Notes
          </div>
          <div className="p-3 bg-muted rounded-md text-sm">
            {evidence.derivationNotes}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Signed By
          </div>
          <div className="p-3 bg-muted rounded-md text-sm">
            {evidence.signedBy}
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This evidence bundle provides cryptographic proof that the report data has not been
            tampered with and can be independently verified. The snapshot hash links all data
            together, while the data hash ensures individual data integrity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
