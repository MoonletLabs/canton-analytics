"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/lib/validator-finops";

interface ScenarioModelingProps {
  scenarios: Scenario[];
}

export function ScenarioModeling({ scenarios }: ScenarioModelingProps) {
  const chartData = scenarios.map((scenario) => ({
    name: scenario.name.charAt(0).toUpperCase() + scenario.name.slice(1),
    "Net Margin": scenario.monthlyNetMargin,
    "Daily Rewards": scenario.dailyRewards * 30, // Monthly
    "Daily Burn Cost": scenario.dailyBurnRate * 30, // Monthly (approximate)
  }));

  const getScenarioColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "idle":
        return "text-gray-600 dark:text-gray-400";
      case "moderate":
        return "text-blue-600 dark:text-blue-400";
      case "heavy":
        return "text-purple-600 dark:text-purple-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getMarginIcon = (margin: number) => {
    if (margin > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (margin < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Modeling</CardTitle>
        <CardDescription>
          Financial projections under different activity scenarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.name}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={cn("font-semibold text-lg", getScenarioColor(scenario.name))}>
                  {scenario.name.charAt(0).toUpperCase() + scenario.name.slice(1)}
                </h3>
                {getMarginIcon(scenario.monthlyNetMargin)}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {scenario.description}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Burn:</span>
                  <span className="font-mono">{scenario.dailyBurnRate.toFixed(0)} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Rewards:</span>
                  <span className="font-mono">{scenario.dailyRewards.toFixed(2)} CC</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Monthly Net:</span>
                  <span className={cn(
                    scenario.monthlyNetMargin >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {scenario.monthlyNetMargin >= 0 ? "+" : ""}
                    {scenario.monthlyNetMargin.toLocaleString()} CC
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>Runway:</span>
                  <span>
                    {scenario.runwayDays === Infinity 
                      ? "∞ days" 
                      : `${scenario.runwayDays} days`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">Monthly Financial Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} CC`}
              />
              <Legend />
              <Bar dataKey="Net Margin" fill="#10b981" />
              <Bar dataKey="Daily Rewards" fill="#3b82f6" />
              <Bar dataKey="Daily Burn Cost" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm font-medium mb-2">Key Insights</div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong>Idle:</strong> Lower rewards but minimal burn - longest runway
            </li>
            <li>
              <strong>Moderate:</strong> Balanced economics at current activity levels
            </li>
            <li>
              <strong>Heavy:</strong> Higher rewards but increased burn - monitor runway closely
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
