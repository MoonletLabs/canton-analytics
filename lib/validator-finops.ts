import { format, differenceInDays, addDays } from "date-fns";

export interface TrafficData {
  currentCredits: number;
  dailyBurnRate: number;
  averageBurnPerMB: number;
  totalMBUsed: number;
  totalCCBurned: number;
}

export interface RewardsData {
  livenessRewards: number;
  activityRewards: number;
  totalRewards: number;
  rewardsPerDay: number;
  rewardsPerRound: number;
}

export interface InfrastructureCosts {
  compute: number;
  storage: number;
  network: number;
  monitoring: number;
  total: number;
}

export interface ChangeAttribution {
  type: "volume_spike" | "new_party" | "integration_ramp" | "other";
  description: string;
  impact: number; // CC impact
  date: Date;
  parties?: string[];
}

export interface ValidatorFinOpsData {
  traffic: TrafficData;
  rewards: RewardsData;
  infrastructure: InfrastructureCosts;
  period: {
    start: Date;
    end: Date;
  };
  changes: ChangeAttribution[];
}

export interface RunwayForecast {
  daysRemaining: number;
  dateExhausted: Date;
  currentBurnRate: number;
  projectedBurnRate: number;
  warningLevel: "healthy" | "warning" | "critical";
}

export interface NetMargin {
  totalRevenue: number;
  totalCosts: number;
  netMargin: number;
  marginPercentage: number;
  breakEvenPoint: number;
}

export interface Scenario {
  name: "idle" | "moderate" | "heavy";
  description: string;
  dailyBurnRate: number;
  dailyRewards: number;
  monthlyNetMargin: number;
  runwayDays: number;
}

export class ValidatorFinOpsCalculator {
  private data: ValidatorFinOpsData;

  constructor(data: ValidatorFinOpsData) {
    this.data = data;
  }

  calculateRunway(): RunwayForecast {
    const { currentCredits, dailyBurnRate } = this.data.traffic;
    
    if (dailyBurnRate <= 0) {
      return {
        daysRemaining: Infinity,
        dateExhausted: addDays(new Date(), 365),
        currentBurnRate: 0,
        projectedBurnRate: 0,
        warningLevel: "healthy",
      };
    }

    const daysRemaining = Math.floor(currentCredits / dailyBurnRate);
    const dateExhausted = addDays(new Date(), daysRemaining);

    let warningLevel: "healthy" | "warning" | "critical" = "healthy";
    if (daysRemaining < 7) {
      warningLevel = "critical";
    } else if (daysRemaining < 30) {
      warningLevel = "warning";
    }

    // Project future burn rate based on recent changes
    const projectedBurnRate = this.calculateProjectedBurnRate();

    return {
      daysRemaining,
      dateExhausted,
      currentBurnRate: dailyBurnRate,
      projectedBurnRate,
      warningLevel,
    };
  }

  private calculateProjectedBurnRate(): number {
    const { dailyBurnRate } = this.data.traffic;
    const recentChanges = this.data.changes.filter(
      (change) => differenceInDays(new Date(), change.date) <= 7
    );

    if (recentChanges.length === 0) {
      return dailyBurnRate;
    }

    // Calculate impact of recent changes
    const totalImpact = recentChanges.reduce((sum, change) => {
      // Estimate burn rate impact from change
      const impactMultiplier = change.type === "volume_spike" ? 1.5 : 
                               change.type === "new_party" ? 1.2 : 
                               change.type === "integration_ramp" ? 1.3 : 1.1;
      return sum + (dailyBurnRate * (impactMultiplier - 1));
    }, 0);

    return dailyBurnRate + (totalImpact / recentChanges.length);
  }

  calculateNetMargin(): NetMargin {
    const totalRevenue = this.data.rewards.totalRewards;
    const totalCosts = 
      this.data.traffic.totalCCBurned + 
      this.data.infrastructure.total;

    const netMargin = totalRevenue - totalCosts;
    const marginPercentage = totalRevenue > 0 
      ? (netMargin / totalRevenue) * 100 
      : 0;

    // Calculate break-even point (daily rewards needed to cover costs)
    const daysInPeriod = differenceInDays(
      this.data.period.end,
      this.data.period.start
    ) || 1;
    
    const dailyCosts = totalCosts / daysInPeriod;
    const dailyRewards = this.data.rewards.rewardsPerDay;
    const breakEvenPoint = dailyCosts;

    return {
      totalRevenue,
      totalCosts,
      netMargin,
      marginPercentage,
      breakEvenPoint,
    };
  }

  analyzeChanges(): {
    summary: string;
    topChanges: ChangeAttribution[];
    impactAnalysis: {
      totalImpact: number;
      byType: Record<string, number>;
    };
  } {
    const topChanges = [...this.data.changes]
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5);

    const byType = this.data.changes.reduce((acc, change) => {
      const type = change.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += Math.abs(change.impact);
      return acc;
    }, {} as Record<string, number>);

    const totalImpact = this.data.changes.reduce(
      (sum, change) => sum + Math.abs(change.impact),
      0
    );

    let summary = "No significant changes detected.";
    if (topChanges.length > 0) {
      const primaryChange = topChanges[0];
      summary = `Primary driver: ${primaryChange.description} (${primaryChange.type.replace("_", " ")})`;
    }

    return {
      summary,
      topChanges,
      impactAnalysis: {
        totalImpact,
        byType,
      },
    };
  }

  generateScenarios(): Scenario[] {
    const currentDailyBurn = this.data.traffic.dailyBurnRate;
    const currentDailyRewards = this.data.rewards.rewardsPerDay;
    const currentCredits = this.data.traffic.currentCredits;
    const infrastructureDaily = this.data.infrastructure.total / 30; // Approximate daily

    const scenarios: Scenario[] = [
      {
        name: "idle",
        description: "Low activity, minimal traffic burn",
        dailyBurnRate: currentDailyBurn * 0.3,
        dailyRewards: currentDailyRewards * 0.5,
        monthlyNetMargin: (currentDailyRewards * 0.5 - currentDailyBurn * 0.3 - infrastructureDaily) * 30,
        runwayDays: currentDailyBurn * 0.3 > 0 
          ? Math.floor(currentCredits / (currentDailyBurn * 0.3))
          : Infinity,
      },
      {
        name: "moderate",
        description: "Current activity levels continue",
        dailyBurnRate: currentDailyBurn,
        dailyRewards: currentDailyRewards,
        monthlyNetMargin: (currentDailyRewards - currentDailyBurn - infrastructureDaily) * 30,
        runwayDays: currentDailyBurn > 0 
          ? Math.floor(currentCredits / currentDailyBurn)
          : Infinity,
      },
      {
        name: "heavy",
        description: "High activity, increased traffic burn",
        dailyBurnRate: currentDailyBurn * 2.5,
        dailyRewards: currentDailyRewards * 1.8,
        monthlyNetMargin: (currentDailyRewards * 1.8 - currentDailyBurn * 2.5 - infrastructureDaily) * 30,
        runwayDays: currentDailyBurn * 2.5 > 0 
          ? Math.floor(currentCredits / (currentDailyBurn * 2.5))
          : Infinity,
      },
    ];

    return scenarios;
  }

  getFinancialHealth(): {
    status: "healthy" | "warning" | "critical";
    message: string;
    recommendations: string[];
  } {
    const margin = this.calculateNetMargin();
    const runway = this.calculateRunway();
    const recommendations: string[] = [];

    let status: "healthy" | "warning" | "critical" = "healthy";
    let message = "Validator economics are healthy.";

    if (margin.netMargin < 0) {
      status = "critical";
      message = "Validator is operating at a loss.";
      recommendations.push("Review infrastructure costs and optimize");
      recommendations.push("Consider increasing activity to boost rewards");
      recommendations.push("Evaluate traffic burn optimization strategies");
    } else if (margin.marginPercentage < 10) {
      status = "warning";
      message = "Low profit margin - monitor closely.";
      recommendations.push("Optimize traffic burn efficiency");
      recommendations.push("Review infrastructure spending");
    }

    if (runway.daysRemaining < 30) {
      status = runway.daysRemaining < 7 ? "critical" : "warning";
      message += ` Traffic credits running low (${runway.daysRemaining} days remaining).`;
      recommendations.push("Purchase additional traffic credits immediately");
      recommendations.push("Review traffic burn patterns for optimization");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue monitoring key metrics");
      recommendations.push("Plan for traffic credit purchases in advance");
    }

    return {
      status,
      message,
      recommendations,
    };
  }
}
