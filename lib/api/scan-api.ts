/**
 * Canton Network data layer
 * Single upstream API via server-side proxy (/api/data).
 */

import { api } from "./api-client";
import type { ApiError } from "./api-client";

export type { ApiError };

/** Delay between API calls if needed (kept for compatibility). */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RoundInfo {
  round: number;
  timestamp: string;
}

export interface ValidatorInfo {
  validator_id: string;
  name?: string;
  status: string;
  liveness_rounds: number;
  missed_rounds: number;
  collection_timing?: { first: string; last: string };
}

export interface DSOState {
  voting_threshold: number;
  mining_rounds: number;
  amulet_rules: unknown;
  dso_rules: unknown;
  sv_node_states: Array<{ node_id: string; status: string }>;
}

/** Single open governance vote (from overview.openVotes). */
export interface GovernanceVote {
  contract_id?: string;
  trackingCid?: string;
  status?: string;
  acceptCount?: number;
  rejectCount?: number;
  noVoteCount?: number;
  payload?: {
    votes?: unknown;
    voteBefore?: string;
    requester?: string;
    reason?: string;
    action?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface PartyUpdate {
  update_id: string;
  timestamp: string;
  parties: string[];
  update_type: string;
  round: number;
  transaction_id?: string;
  events?: unknown[];
}

export interface Transfer {
  transfer_id: string;
  from_party: string;
  to_party: string;
  amount: number;
  currency: string;
  timestamp: string;
  round: number;
  transaction_id?: string;
}

export interface ValidatorRewards {
  validator_id: string;
  liveness_rewards: number;
  activity_rewards: number;
  total_rewards: number;
  period_start: string;
  period_end: string;
  rounds: number;
}

export interface TrafficData {
  validator_id: string;
  current_credits: number;
  daily_burn_rate: number;
  total_burned: number;
  total_purchased: number;
  average_burn_per_mb: number;
  last_updated: string;
}

function parseRound(s: string | number | undefined): number {
  if (s === undefined) return 0;
  const n = typeof s === "string" ? parseInt(s, 10) : s;
  return Number.isFinite(n) ? n : 0;
}

/** Latest round from consensus height (CC Explorer). */
export async function getLatestRound(): Promise<RoundInfo> {
  const [consensus, overview] = await Promise.all([
    api.getConsensus(),
    api.getOverview()
  ]);
  const height =
    consensus.latest_block?.signed_header?.header?.height ??
    overview.consensusHeight;
  const round = parseRound(height);
  const time =
    (
      consensus as {
        latest_block?: { signed_header?: { header?: { time?: string } } };
      }
    ).latest_block?.signed_header?.header?.time ?? new Date().toISOString();
  return {
    round,
    timestamp: time
  };
}

/** Safely get a string node_id from an SV entry (object or array). */
function svNodeId(s: unknown): string {
  if (typeof s === "string") return s;
  if (Array.isArray(s)) {
    const first = s[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "validatorId" in first)
      return String((first as { validatorId?: unknown }).validatorId ?? "");
    return "";
  }
  if (s && typeof s === "object" && "validatorId" in s)
    return String((s as { validatorId?: unknown }).validatorId ?? "");
  return "";
}

/** Safely get a string status from an SV entry. */
function svNodeStatus(s: unknown): string {
  if (s && typeof s === "object" && !Array.isArray(s) && "status" in s) {
    const v = (s as { status?: unknown }).status;
    return typeof v === "string" ? v : "active";
  }
  if (
    Array.isArray(s) &&
    s.length > 1 &&
    s[1] &&
    typeof s[1] === "object" &&
    "status" in s[1]
  ) {
    const v = (s[1] as { status?: unknown }).status;
    return typeof v === "string" ? v : "active";
  }
  return "active";
}

/** DSO-like state from overview + super-validators (CC Explorer). */
export async function getDSOState(): Promise<DSOState> {
  const [overview, superV] = await Promise.all([
    api.getOverview(),
    api.getSuperValidators()
  ]);
  const raw = superV.svs ?? [];
  const sv_node_states: Array<{ node_id: string; status: string }> = raw
    .map((s) => ({
      node_id: svNodeId(s),
      status: svNodeStatus(s)
    }))
    .filter((n) => n.node_id.length > 0);
  return {
    voting_threshold: 0,
    mining_rounds: 0,
    amulet_rules: {},
    dso_rules: {},
    sv_node_states
  };
}

function normalizeVote(v: unknown): GovernanceVote | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as GovernanceVote;
  }
  return null;
}

/** Open governance votes from CC Explorer overview. */
export async function getOpenVotes(): Promise<GovernanceVote[]> {
  const overview = await api.getOverview();
  const raw = overview.openVotes;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeVote).filter((v): v is GovernanceVote => v !== null);
}

/** Single governance vote by id (contract_id or trackingCid). */
export async function getGovernanceVoteDetail(
  id: string
): Promise<GovernanceVote | null> {
  const votes = await getOpenVotes();
  const normalized = (id || "").trim();
  if (!normalized) return null;
  const found = votes.find(
    (v) =>
      (v.contract_id ?? "").toLowerCase() === normalized.toLowerCase() ||
      (v.trackingCid ?? "").toLowerCase() === normalized.toLowerCase()
  );
  return found ?? null;
}

/** Normalize validator id for matching (full "x::y" or short "x"). */
function normalizeValidatorIdForMatch(id: string): {
  full: string;
  short: string;
} {
  const full = (id || "").trim();
  const short = full.includes("::") ? full.split("::")[0]!.trim() : full;
  return { full, short };
}

/** Single validator by id. Uses full liveness list so liveness_rounds (from consensus) is consistent. */
export async function getValidatorInfo(
  validatorId: string
): Promise<ValidatorInfo> {
  const all = await getValidatorLiveness();
  const { full: idFull, short: idShort } =
    normalizeValidatorIdForMatch(validatorId);
  const idFullL = idFull.toLowerCase();
  const idShortL = idShort.toLowerCase();

  const found = all.find((v) => {
    const pVal = v.validator_id.trim().toLowerCase();
    if (!pVal) return false;
    if (pVal === idFullL) return true;
    if (pVal === idShortL) return true;
    if (idFullL.startsWith(pVal + "::")) return true;
    if (pVal.startsWith(idShortL + "::")) return true;
    return false;
  });

  if (found) return found;
  return {
    validator_id: validatorId,
    name: undefined,
    status: "unknown",
    liveness_rounds: 0,
    missed_rounds: 0,
    collection_timing: undefined
  };
}

/** Build a map from validator address/id to consensus voting power (used as liveness proxy). */
function buildVotingPowerMap(
  validators?: Array<{ address?: string; voting_power?: string }>
): Map<string, number> {
  const map = new Map<string, number>();
  if (!validators) return map;
  for (const v of validators) {
    const addr = (v.address ?? "").trim().toLowerCase();
    if (!addr) continue;
    const power = parseInt(v.voting_power ?? "0", 10);
    if (!Number.isFinite(power)) continue;
    map.set(addr, power);
    // Also key by last segment (e.g. short id) for matching
    const lastPart = addr.includes("::")
      ? (addr.split("::").pop() ?? addr)
      : addr;
    if (lastPart && lastPart !== addr) map.set(lastPart, power);
  }
  return map;
}

/** All validators (liveness/faucet style). Liveness rounds from consensus voting power when available. */
export async function getValidatorLiveness(): Promise<ValidatorInfo[]> {
  const [res, consensus] = await Promise.all([
    api.getValidators(),
    api.getConsensus()
  ]);
  const licenses = res.validator_licenses ?? [];
  const votingPower = buildVotingPowerMap(consensus.validators);

  return licenses.map((l) => {
    const p = l.payload;
    const id = (p?.validator ?? "").trim();
    const idLower = id.toLowerCase();
    const missed = p?.faucetState?.numCouponsMissed ?? 0;
    const livenessRounds =
      votingPower.get(idLower) ??
      votingPower.get(
        idLower.includes("::") ? (idLower.split("::").pop() ?? "") : ""
      ) ??
      0;
    return {
      validator_id: id || "—",
      name: p?.sponsor,
      status: missed > 0 ? "at_risk" : "active",
      liveness_rounds: livenessRounds,
      missed_rounds: missed,
      collection_timing: p?.lastActiveAt
        ? { first: p.lastActiveAt, last: p.lastActiveAt }
        : undefined
    };
  });
}

function mapUpdateToPartyUpdate(u: {
  updateId?: string;
  recordTime?: string;
  effectiveAt?: string;
  createdAt?: string;
  submittingPartyId?: string;
  partiesSummarized?: unknown;
}): PartyUpdate {
  const ts =
    u.recordTime ?? u.effectiveAt ?? u.createdAt ?? new Date().toISOString();
  const parties = u.submittingPartyId ? [u.submittingPartyId] : [];
  return {
    update_id: u.updateId ?? "",
    timestamp: ts,
    parties,
    update_type: "update",
    round: 0
  };
}

const UPDATES_PAGE_SIZE = 500;
const UPDATES_MAX_PAGES = 25;
const UPDATES_PAGE_DELAY_MS = 400;

/** All updates from CC Explorer v2/updates, with pagination to span the date range.
 * API returns newest first; we paginate until we have enough in range or pass startDate. */
export async function getAllUpdates(
  startDate: Date,
  endDate: Date,
  limit: number = 2000
): Promise<PartyUpdate[]> {
  const all: PartyUpdate[] = [];
  let nextToken: string | undefined;
  const endMs = endDate.getTime();
  const startMs = startDate.getTime();

  for (let page = 0; page < UPDATES_MAX_PAGES; page++) {
    const res = await api.getUpdates({
      limit: UPDATES_PAGE_SIZE,
      nextToken
    });
    const batch = (res.updates ?? []).map(mapUpdateToPartyUpdate);
    let oldestInBatchMs: number | null = null;
    for (const u of batch) {
      const ts = new Date(u.timestamp).getTime();
      if (oldestInBatchMs == null || ts < oldestInBatchMs) oldestInBatchMs = ts;
      if (ts >= startMs && ts <= endMs) all.push(u);
      if (all.length >= limit) break;
    }
    if (all.length >= limit) break;
    nextToken = res.nextToken;
    if (!nextToken || batch.length === 0) break;
    if (oldestInBatchMs != null && oldestInBatchMs < startMs) break;
    await delay(UPDATES_PAGE_DELAY_MS);
  }

  return all.slice(0, limit);
}

/** Single update detail from CC Explorer GET /api/v2/updates/:updateId/:recordTime. */
export async function getUpdateDetail(
  updateId: string,
  recordTime: string
): Promise<Record<string, unknown>> {
  return api.getUpdateDetail(updateId, recordTime);
}

/** Transfers: not provided by CC Explorer; return empty. */
export async function getAllTransfers(
  _startDate: Date,
  _endDate: Date,
  _limit: number = 2000
): Promise<Transfer[]> {
  return [];
}

/** Validator rewards: not provided by CC Explorer; return stub. */
export async function getValidatorRewards(
  validatorId: string,
  startDate: Date,
  endDate: Date
): Promise<ValidatorRewards> {
  return {
    validator_id: validatorId,
    liveness_rewards: 0,
    activity_rewards: 0,
    total_rewards: 0,
    period_start: startDate.toISOString(),
    period_end: endDate.toISOString(),
    rounds: 0
  };
}

/** Validator traffic: not provided by CC Explorer; return stub. */
export async function getValidatorTraffic(
  validatorId: string
): Promise<TrafficData> {
  return {
    validator_id: validatorId,
    current_credits: 0,
    daily_burn_rate: 0,
    total_burned: 0,
    total_purchased: 0,
    average_burn_per_mb: 0,
    last_updated: new Date().toISOString()
  };
}

/** Global activity: updates only (transfers = 0). */
export async function getGlobalActivitySummary(
  startDate: Date,
  endDate: Date,
  limit: number = 2000
): Promise<{
  totalTransactions: number;
  totalVolume: number;
  transfers: number;
  offers: number;
  preapprovals: number;
  updates: number;
}> {
  const transfers = await getAllTransfers(startDate, endDate, limit);
  const updates = await getAllUpdates(startDate, endDate, limit);
  const totalVolume = transfers.reduce((sum, t) => sum + (t.amount || 0), 0);
  return {
    totalTransactions: transfers.length + updates.length,
    totalVolume,
    transfers: transfers.length,
    offers: updates.filter((u) =>
      u.update_type?.toLowerCase().includes("offer")
    ).length,
    preapprovals: updates.filter((u) =>
      u.update_type?.toLowerCase().includes("preapproval")
    ).length,
    updates: updates.filter(
      (u) =>
        !u.update_type?.toLowerCase().includes("offer") &&
        !u.update_type?.toLowerCase().includes("preapproval")
    ).length
  };
}
