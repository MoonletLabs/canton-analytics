"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScanApiClient } from "@/lib/api/scan-api-client";
import type { ScanNode } from "@/lib/api/scan-api-client";
import { useState, useEffect } from "react";

interface NodeStatusItem {
  node: ScanNode;
  isActive: boolean;
}

export function NodeStatus() {
  const [nodeStatus, setNodeStatus] = useState<NodeStatusItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = () => {
    setIsRefreshing(true);
    const client = getScanApiClient();
    setNodeStatus(client.getNodeStatus());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const getStatusIcon = (node: NodeStatusItem) => {
    if (node.isActive) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (node.node.consecutiveErrors >= 5) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    if (node.node.consecutiveErrors > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <CheckCircle2 className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = (node: NodeStatusItem) => {
    if (node.isActive) {
      return "Active";
    }
    if (node.node.consecutiveErrors >= 5) {
      return "Unavailable";
    }
    if (node.node.consecutiveErrors > 0) {
      return "Degraded";
    }
    return "Standby";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            Scan API Node Status
          </span>
          <button
            onClick={refreshStatus}
            disabled={isRefreshing}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Refresh
          </button>
        </CardTitle>
        <CardDescription>
          Current node and failover status with rate limit handling
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nodeStatus.map((status, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                status.isActive
                  ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  : "bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(status)}
                <div>
                  <div className="font-medium">{status.node.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {status.node.url}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-sm font-medium",
                  status.isActive ? "text-green-600" : "text-muted-foreground"
                )}>
                  {getStatusText(status)}
                </div>
                {status.node.rateLimitInfo && (
                  <div className="text-xs text-muted-foreground">
                    {status.node.rateLimitInfo.remaining}/{status.node.rateLimitInfo.limit} remaining
                  </div>
                )}
                {status.node.consecutiveErrors > 0 && (
                  <div className="text-xs text-red-600">
                    {status.node.consecutiveErrors} errors
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
          <div className="font-medium mb-1">How it works:</div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Automatically switches to next node on rate limit (429)</li>
            <li>Tracks rate limit headers and waits when needed</li>
            <li>Fails over to backup nodes on errors</li>
            <li>Resets error counts after cooldown period</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
