"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialHealthProps {
  status: "healthy" | "warning" | "critical";
  message: string;
  recommendations: string[];
}

export function FinancialHealth({ status, message, recommendations }: FinancialHealthProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "critical":
        return <XCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
      case "critical":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
    }
  };

  const getTextColor = () => {
    switch (status) {
      case "healthy":
        return "text-green-800 dark:text-green-200";
      case "warning":
        return "text-yellow-800 dark:text-yellow-200";
      case "critical":
        return "text-red-800 dark:text-red-200";
    }
  };

  return (
    <Card className={cn(getStatusColor())}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Financial Health Status
        </CardTitle>
        <CardDescription>
          Overall validator economics assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn("p-4 rounded-lg bg-background/50", getTextColor())}>
          <div className="font-semibold mb-1">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
          <div className="text-sm">{message}</div>
        </div>

        {recommendations.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2">Recommendations</div>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
