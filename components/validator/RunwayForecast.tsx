"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { RunwayForecast } from "@/lib/validator-finops";

interface RunwayForecastProps {
  forecast: RunwayForecast;
  currentCredits: number;
}

export function RunwayForecastCard({ forecast, currentCredits }: RunwayForecastProps) {
  const getStatusColor = () => {
    switch (forecast.warningLevel) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  const getStatusBg = () => {
    switch (forecast.warningLevel) {
      case "critical":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
    }
  };

  const burnRateChange = forecast.projectedBurnRate - forecast.currentBurnRate;
  const burnRateChangePercent = forecast.currentBurnRate > 0
    ? ((burnRateChange / forecast.currentBurnRate) * 100)
    : 0;

  return (
    <Card className={cn(getStatusBg())}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Traffic Credits Runway
          </span>
          {forecast.warningLevel !== "healthy" && (
            <AlertCircle className={cn("h-5 w-5", getStatusColor())} />
          )}
        </CardTitle>
        <CardDescription>
          Days of traffic credits remaining at current burn rate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold mb-1">
              {forecast.daysRemaining === Infinity ? "∞" : forecast.daysRemaining}
            </div>
            <div className="text-sm text-muted-foreground">Days Remaining</div>
          </div>
          <div>
            <div className="text-lg font-semibold mb-1">
              {forecast.daysRemaining === Infinity 
                ? "N/A" 
                : format(forecast.dateExhausted, "MMM dd, yyyy")}
            </div>
            <div className="text-sm text-muted-foreground">Exhaustion Date</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-background rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Burn Rate</span>
              <span className="text-sm font-mono">
                {forecast.currentBurnRate.toLocaleString()} credits/day
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Projected Burn Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {forecast.projectedBurnRate.toLocaleString()} credits/day
                </span>
                {burnRateChange !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    burnRateChange > 0 ? "text-red-600" : "text-green-600"
                  )}>
                    {burnRateChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(burnRateChangePercent).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-background rounded-lg">
            <div className="text-sm font-medium mb-2">Current Credits</div>
            <div className="text-2xl font-bold font-mono">
              {currentCredits.toLocaleString()} credits
            </div>
          </div>
        </div>

        {forecast.warningLevel !== "healthy" && (
          <div className={cn(
            "p-4 rounded-lg border",
            forecast.warningLevel === "critical" 
              ? "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700"
              : "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700"
          )}>
            <div className="flex items-start gap-2">
              <AlertCircle className={cn("h-5 w-5 mt-0.5", getStatusColor())} />
              <div>
                <div className={cn("font-semibold mb-1", getStatusColor())}>
                  {forecast.warningLevel === "critical" ? "Critical" : "Warning"}
                </div>
                <div className="text-sm">
                  {forecast.warningLevel === "critical"
                    ? "Traffic credits will be exhausted soon. Purchase additional credits immediately."
                    : "Traffic credits are running low. Plan for additional purchases."}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
