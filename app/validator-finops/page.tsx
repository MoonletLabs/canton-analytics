"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RunwayForecastCard } from "@/components/validator/RunwayForecast";
import { NetMarginCard } from "@/components/validator/NetMarginCard";
import { ChangeAttributionCard } from "@/components/validator/ChangeAttribution";
import { ScenarioModeling } from "@/components/validator/ScenarioModeling";
import { FinancialHealth } from "@/components/validator/FinancialHealth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loading } from "@/components/ui/loading";
import {
  ValidatorFinOpsCalculator,
  type ValidatorFinOpsData,
  type ChangeAttribution
} from "@/lib/validator-finops";
import { fetchValidatorFinOpsData } from "@/lib/api/validator-finops-data";
import { Calculator, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { subDays, startOfMonth, endOfMonth } from "date-fns";

export default function ValidatorFinOpsPage() {
  const [validatorId, setValidatorId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finOpsData, setFinOpsData] = useState<ValidatorFinOpsData | null>(
    null
  );

  const emptyFinOps: ValidatorFinOpsData = {
    traffic: {
      currentCredits: 0,
      dailyBurnRate: 0,
      averageBurnPerMB: 10,
      totalMBUsed: 0,
      totalCCBurned: 0
    },
    rewards: {
      livenessRewards: 0,
      activityRewards: 0,
      totalRewards: 0,
      rewardsPerDay: 0,
      rewardsPerRound: 0
    },
    infrastructure: {
      compute: 0,
      storage: 0,
      network: 0,
      monitoring: 0,
      total: 0
    },
    period: {
      start: startOfMonth(subDays(new Date(), 30)),
      end: endOfMonth(subDays(new Date(), 1))
    },
    changes: []
  };

  const dataForCalc = finOpsData ?? emptyFinOps;
  const calculator = new ValidatorFinOpsCalculator(dataForCalc);
  const runway = calculator.calculateRunway();
  const netMargin = calculator.calculateNetMargin();
  const changeAnalysis = calculator.analyzeChanges();
  const scenarios = calculator.generateScenarios();
  const health = calculator.getFinancialHealth();

  const handleUpdateTrafficCredits = (value: string) => {
    if (!finOpsData) return;
    const credits = parseFloat(value) || 0;
    setFinOpsData({
      ...finOpsData,
      traffic: { ...finOpsData.traffic, currentCredits: credits }
    });
  };

  const handleUpdateBurnRate = (value: string) => {
    if (!finOpsData) return;
    const rate = parseFloat(value) || 0;
    setFinOpsData({
      ...finOpsData,
      traffic: { ...finOpsData.traffic, dailyBurnRate: rate }
    });
  };

  const handleFetchRealData = async () => {
    if (!validatorId?.trim()) {
      setError("Please enter a Validator ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const start = startOfMonth(subDays(new Date(), 30));
      const end = endOfMonth(subDays(new Date(), 1));

      const data = await fetchValidatorFinOpsData({
        validatorId: validatorId.trim(),
        startDate: start,
        endDate: end,
        infrastructureCosts: finOpsData
          ? {
              compute: finOpsData.infrastructure.compute,
              storage: finOpsData.infrastructure.storage,
              network: finOpsData.infrastructure.network,
              monitoring: finOpsData.infrastructure.monitoring
            }
          : undefined
      });

      setFinOpsData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch data from blockchain";
      setError(errorMessage);
      console.error("Error fetching validator FinOps data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Validator FinOps Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Traffic burn vs rewards vs margin analysis for Canton Network
            validators
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Source Configuration</CardTitle>
            <CardDescription>
              Fetch real-time data from Canton Network blockchain via Scan API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="validatorId">Validator ID</Label>
                <Input
                  id="validatorId"
                  value={validatorId}
                  onChange={(e) => setValidatorId(e.target.value)}
                  placeholder="Enter your validator ID"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleFetchRealData}
                  disabled={isLoading || !validatorId}
                >
                  {isLoading ? (
                    <>
                      <Loading size="sm" className="mr-2" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch Real Data"
                  )}
                </Button>
              </div>
            </div>
            {finOpsData && (
              <Alert variant="success">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Data from blockchain · Last updated:{" "}
                  {new Date().toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="runway">Runway Forecast</TabsTrigger>
            <TabsTrigger value="margin">Net Margin</TabsTrigger>
            <TabsTrigger value="changes">Change Attribution</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FinancialHealth
                status={health.status}
                message={health.message}
                recommendations={health.recommendations}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">
                        {dataForCalc.rewards.totalRewards.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Rewards (CC)
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {dataForCalc.traffic.totalCCBurned.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Burned (CC)
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {dataForCalc.traffic.currentCredits.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current Credits
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {dataForCalc.traffic.dailyBurnRate.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Daily Burn Rate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <RunwayForecastCard
              forecast={runway}
              currentCredits={dataForCalc.traffic.currentCredits}
            />

            <NetMarginCard margin={netMargin} />
          </TabsContent>

          <TabsContent value="runway" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Runway Configuration</CardTitle>
                <CardDescription>
                  Adjust traffic credits and burn rate to see impact on runway
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="credits">Current Traffic Credits</Label>
                    <Input
                      id="credits"
                      type="number"
                      value={dataForCalc.traffic.currentCredits}
                      onChange={(e) =>
                        handleUpdateTrafficCredits(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="burnRate">
                      Daily Burn Rate (credits/day)
                    </Label>
                    <Input
                      id="burnRate"
                      type="number"
                      value={dataForCalc.traffic.dailyBurnRate}
                      onChange={(e) => handleUpdateBurnRate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <RunwayForecastCard
              forecast={runway}
              currentCredits={dataForCalc.traffic.currentCredits}
            />
          </TabsContent>

          <TabsContent value="margin" className="space-y-6">
            <NetMarginCard margin={netMargin} />

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>
                  Detailed infrastructure and traffic costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Traffic Burn (CC)</span>
                    <span className="font-mono font-semibold">
                      {dataForCalc.traffic.totalCCBurned.toLocaleString()} CC
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Infrastructure - Compute</span>
                    <span className="font-mono">
                      {dataForCalc.infrastructure.compute.toLocaleString()} CC
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Infrastructure - Storage</span>
                    <span className="font-mono">
                      {dataForCalc.infrastructure.storage.toLocaleString()} CC
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Infrastructure - Network</span>
                    <span className="font-mono">
                      {dataForCalc.infrastructure.network.toLocaleString()} CC
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <span>Infrastructure - Monitoring</span>
                    <span className="font-mono">
                      {dataForCalc.infrastructure.monitoring.toLocaleString()}{" "}
                      CC
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary">
                    <span className="font-semibold">Total Costs</span>
                    <span className="font-mono font-bold">
                      {netMargin.totalCosts.toLocaleString()} CC
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="changes" className="space-y-6">
            <ChangeAttributionCard
              changes={changeAnalysis.topChanges}
              summary={changeAnalysis.summary}
              impactAnalysis={changeAnalysis.impactAnalysis}
            />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <ScenarioModeling scenarios={scenarios} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
