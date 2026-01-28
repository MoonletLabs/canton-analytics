"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

interface MetricsDashboardProps {
  metrics: {
    totalTransactions: number;
    totalVolume: number;
    activeUsers: number;
    rewardsEarned: number;
    transactionGrowth: number;
  };
  activityBreakdown: Array<{
    activityType: string;
    count: number;
    volume: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function MetricsDashboard({ metrics, activityBreakdown }: MetricsDashboardProps) {
  const activityChartData = activityBreakdown.map((activity) => ({
    name: activity.activityType,
    transactions: activity.count,
    volume: activity.volume,
  }));

  const pieData = activityBreakdown.map((activity) => ({
    name: activity.activityType,
    value: activity.count,
  }));

  const statCards = [
    {
      title: "Total Transactions",
      value: metrics.totalTransactions.toLocaleString(),
      icon: Activity,
      change: `+${metrics.transactionGrowth.toFixed(1)}%`,
      trend: "up" as const,
    },
    {
      title: "Total Volume",
      value: `${metrics.totalVolume.toLocaleString()} CC`,
      icon: DollarSign,
      change: `+${metrics.transactionGrowth.toFixed(1)}%`,
      trend: "up" as const,
    },
    {
      title: "Active Users",
      value: metrics.activeUsers.toLocaleString(),
      icon: Users,
      change: `+${metrics.transactionGrowth.toFixed(1)}%`,
      trend: "up" as const,
    },
    {
      title: "Rewards Earned",
      value: `${metrics.rewardsEarned.toLocaleString()} CC`,
      icon: TrendingUp,
      change: `+${metrics.transactionGrowth.toFixed(1)}%`,
      trend: "up" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from previous period
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
            <CardDescription>Transactions by activity type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume Distribution</CardTitle>
            <CardDescription>Volume by activity type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Type Distribution</CardTitle>
          <CardDescription>Percentage breakdown of transaction types</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
