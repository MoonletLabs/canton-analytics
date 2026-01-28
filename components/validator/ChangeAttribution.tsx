"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Zap, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ChangeAttribution } from "@/lib/validator-finops";

interface ChangeAttributionProps {
  changes: ChangeAttribution[];
  summary: string;
  impactAnalysis: {
    totalImpact: number;
    byType: Record<string, number>;
  };
}

const getChangeIcon = (type: ChangeAttribution["type"]) => {
  switch (type) {
    case "volume_spike":
      return TrendingUp;
    case "new_party":
      return Users;
    case "integration_ramp":
      return Zap;
    default:
      return AlertCircle;
  }
};

const getChangeLabel = (type: ChangeAttribution["type"]) => {
  switch (type) {
    case "volume_spike":
      return "Volume Spike";
    case "new_party":
      return "New Party";
    case "integration_ramp":
      return "Integration Ramp";
    default:
      return "Other";
  }
};

const getChangeColor = (type: ChangeAttribution["type"]) => {
  switch (type) {
    case "volume_spike":
      return "text-blue-600 dark:text-blue-400";
    case "new_party":
      return "text-green-600 dark:text-green-400";
    case "integration_ramp":
      return "text-purple-600 dark:text-purple-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

export function ChangeAttributionCard({ changes, summary, impactAnalysis }: ChangeAttributionProps) {
  const topChanges = changes.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Change Attribution
        </CardTitle>
        <CardDescription>
          What changed? Analysis of traffic burn and reward drivers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-1">Summary</div>
          <div className="text-base">{summary}</div>
        </div>

        {topChanges.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold">Recent Changes</div>
            {topChanges.map((change, index) => {
              const Icon = getChangeIcon(change.type);
              const color = getChangeColor(change.type);
              
              return (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", color)} />
                      <span className="font-medium">{getChangeLabel(change.type)}</span>
                    </div>
                    <span className={cn("text-sm font-semibold", color)}>
                      {change.impact > 0 ? "+" : ""}{change.impact.toLocaleString()} CC
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {change.description}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(change.date, "MMM dd, yyyy")}
                    </span>
                    {change.parties && change.parties.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {change.parties.length} party{change.parties.length > 1 ? "ies" : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-sm font-semibold">Impact by Type</div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(impactAnalysis.byType).map(([type, impact]) => (
              <div key={type} className="p-3 bg-background rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">
                  {getChangeLabel(type as ChangeAttribution["type"])}
                </div>
                <div className="text-lg font-bold">
                  {impact.toLocaleString()} CC
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
            Total Impact
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {impactAnalysis.totalImpact.toLocaleString()} CC
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            Combined impact of all changes on validator economics
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
