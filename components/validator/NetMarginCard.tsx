"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NetMargin } from "@/lib/validator-finops";

interface NetMarginCardProps {
  margin: NetMargin;
}

export function NetMarginCard({ margin }: NetMarginCardProps) {
  const isPositive = margin.netMargin >= 0;
  const marginColor = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Net Margin Analysis
        </CardTitle>
        <CardDescription>
          Revenue minus costs (traffic burn + infrastructure)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</div>
            <div className="text-2xl font-bold">
              {margin.totalRevenue.toLocaleString()} CC
            </div>
            <div className="text-xs text-muted-foreground mt-1">Rewards earned</div>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Costs</div>
            <div className="text-2xl font-bold">
              {margin.totalCosts.toLocaleString()} CC
            </div>
            <div className="text-xs text-muted-foreground mt-1">Burn + Infrastructure</div>
          </div>
        </div>

        <div className="p-6 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Net Margin</span>
            <div className={cn("flex items-center gap-2", marginColor)}>
              {isPositive ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span className="text-3xl font-bold">
                {isPositive ? "+" : ""}{margin.netMargin.toLocaleString()} CC
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Margin Percentage</span>
            <span className={cn("text-xl font-semibold", marginColor)}>
              {isPositive ? "+" : ""}{margin.marginPercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
            <span className="text-sm font-medium">Break-Even Point</span>
            <span className="text-sm font-mono">
              {margin.breakEvenPoint.toFixed(2)} CC/day
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Daily rewards needed to cover all costs
          </div>
        </div>

        {!isPositive && (
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-semibold text-red-800 dark:text-red-200 mb-1">
                  Operating at a Loss
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Current rewards do not cover costs. Review infrastructure spending and traffic burn optimization.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
