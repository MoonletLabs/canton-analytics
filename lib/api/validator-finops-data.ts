/**
 * Validator FinOps Data Fetcher
 * Fetches data from Canton Network blockchain via Scan API only.
 */

import {
  getValidatorInfo,
  getValidatorRewards,
  getValidatorTraffic,
} from './scan-api';
import type { ValidatorFinOpsData, ChangeAttribution } from '../validator-finops';

export interface FetchValidatorFinOpsOptions {
  validatorId: string;
  startDate: Date;
  endDate: Date;
  infrastructureCosts?: {
    compute: number;
    storage: number;
    network: number;
    monitoring: number;
  };
}

/**
 * Fetch FinOps data from blockchain. Throws on API failure.
 */
export async function fetchValidatorFinOpsData(
  options: FetchValidatorFinOpsOptions
): Promise<ValidatorFinOpsData> {
  const { validatorId, startDate, endDate, infrastructureCosts } = options;

  const [validatorData, rewardsData, trafficData] = await Promise.all([
    getValidatorInfo(validatorId),
    getValidatorRewards(validatorId, startDate, endDate),
    getValidatorTraffic(validatorId),
  ]);

  const daysInPeriod = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const changes = await detectChanges(validatorId, startDate, endDate);

  const finOpsData: ValidatorFinOpsData = {
    traffic: {
      currentCredits: trafficData.current_credits ?? 0,
      dailyBurnRate: trafficData.daily_burn_rate ?? 0,
      averageBurnPerMB: trafficData.average_burn_per_mb ?? 10,
      totalMBUsed: 0,
      totalCCBurned: trafficData.total_burned ?? 0,
    },
    rewards: {
      livenessRewards: rewardsData.liveness_rewards ?? 0,
      activityRewards: rewardsData.activity_rewards ?? 0,
      totalRewards: rewardsData.total_rewards ?? 0,
      rewardsPerDay:
        daysInPeriod > 0 ? (rewardsData.total_rewards ?? 0) / daysInPeriod : 0,
      rewardsPerRound:
        daysInPeriod > 0
          ? (rewardsData.total_rewards ?? 0) / (daysInPeriod * 144)
          : 0,
    },
    infrastructure: {
      compute: infrastructureCosts?.compute ?? 0,
      storage: infrastructureCosts?.storage ?? 0,
      network: infrastructureCosts?.network ?? 0,
      monitoring: infrastructureCosts?.monitoring ?? 0,
      total:
        (infrastructureCosts?.compute ?? 0) +
        (infrastructureCosts?.storage ?? 0) +
        (infrastructureCosts?.network ?? 0) +
        (infrastructureCosts?.monitoring ?? 0),
    },
    period: { start: startDate, end: endDate },
    changes,
  };

  return finOpsData;
}

async function detectChanges(
  validatorId: string,
  startDate: Date,
  endDate: Date
): Promise<ChangeAttribution[]> {
  try {
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - periodLength);

    const [currentRewards, prevRewards] = await Promise.all([
      getValidatorRewards(validatorId, startDate, endDate),
      getValidatorRewards(validatorId, prevStart, startDate),
    ]);

    const cur = currentRewards.total_rewards ?? 0;
    const prev = prevRewards.total_rewards ?? 0;
    const rewardChangePercent = prev > 0 ? ((cur - prev) / prev) * 100 : 0;

    if (Math.abs(rewardChangePercent) > 20) {
      return [
        {
          type: rewardChangePercent > 0 ? 'volume_spike' : 'other',
          description: `Reward ${rewardChangePercent > 0 ? 'increase' : 'decrease'} of ${Math.abs(rewardChangePercent).toFixed(1)}%`,
          impact: cur - prev,
          date: startDate,
        },
      ];
    }
  } catch {
    // No change attribution if comparison fails
  }
  return [];
}
