// ============================================================================
// Trust Agent - Audit Pipeline
// Main pipeline: loads role JSON, runs all 47 checks, calculates trust score,
// assigns badge.
//
// Usage (programmatic):
//   import { runAudit } from './pipeline';
//   const packet = runAudit(roleDefinition);
//
// Trust Score Calculation:
//   Stage 1: 25% weight | Stage 2: 30% weight | Stage 3: 30% weight
//   Community signal: 10% (starts 75) | Version history: 5% (starts 0)
//   PLATINUM >= 90 | GOLD >= 75 | SILVER >= 60 | BASIC >= 40 | REJECTED < 40
// ============================================================================

import {
  AuditPacket,
  CheckResult,
  RoleDefinition,
  StageSummary,
  TrustBadge,
} from './types';
import { runStage1 } from './checks/stage1';
import { runStage2 } from './checks/stage2';
import { runStage3 } from './checks/stage3';

const AUDIT_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------
const STAGE_1_WEIGHT = 0.25;
const STAGE_2_WEIGHT = 0.30;
const STAGE_3_WEIGHT = 0.30;
const COMMUNITY_WEIGHT = 0.10;
const VERSION_WEIGHT = 0.05;

// New roles start with these defaults
const DEFAULT_COMMUNITY_SIGNAL = 75;
const DEFAULT_VERSION_HISTORY = 0;

// Badge thresholds
const BADGE_THRESHOLDS: { badge: TrustBadge; min: number }[] = [
  { badge: 'PLATINUM', min: 90 },
  { badge: 'GOLD', min: 75 },
  { badge: 'SILVER', min: 60 },
  { badge: 'BASIC', min: 40 },
];

// ---------------------------------------------------------------------------
// Calculate average score for a list of check results
// ---------------------------------------------------------------------------
function averageScore(checks: CheckResult[]): number {
  if (checks.length === 0) return 0;
  const sum = checks.reduce((acc, c) => acc + c.score, 0);
  return sum / checks.length;
}

// ---------------------------------------------------------------------------
// Determine badge from final score
// ---------------------------------------------------------------------------
function determineBadge(score: number): TrustBadge {
  for (const { badge, min } of BADGE_THRESHOLDS) {
    if (score >= min) return badge;
  }
  return 'REJECTED';
}

// ---------------------------------------------------------------------------
// Build stage summary
// ---------------------------------------------------------------------------
function buildStageSummary(
  stage: 1 | 2 | 3,
  stageName: string,
  checks: CheckResult[],
  weight: number
): StageSummary {
  const avg = averageScore(checks);
  return {
    stage,
    stageName,
    checks,
    averageScore: Math.round(avg * 100) / 100,
    passedCount: checks.filter((c) => c.passed).length,
    totalCount: checks.length,
    weight,
    weightedScore: Math.round(avg * weight * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Main audit function
// ---------------------------------------------------------------------------
export interface AuditOptions {
  communitySignal?: number;  // override default 75
  versionHistory?: number;   // override default 0
}

export function runAudit(
  role: RoleDefinition,
  options: AuditOptions = {}
): AuditPacket {
  const communitySignal = options.communitySignal ?? DEFAULT_COMMUNITY_SIGNAL;
  const versionHistory = options.versionHistory ?? DEFAULT_VERSION_HISTORY;

  // Run all three stages
  const stage1Results = runStage1(role);
  const stage2Results = runStage2(role);
  const stage3Results = runStage3(role);

  // Build summaries
  const stage1Summary = buildStageSummary(1, 'Configuration Validation', stage1Results, STAGE_1_WEIGHT);
  const stage2Summary = buildStageSummary(2, 'Behavioural Testing', stage2Results, STAGE_2_WEIGHT);
  const stage3Summary = buildStageSummary(3, 'Documentation Quality', stage3Results, STAGE_3_WEIGHT);

  // Calculate weighted scores
  const stage1Score = stage1Summary.averageScore;
  const stage2Score = stage2Summary.averageScore;
  const stage3Score = stage3Summary.averageScore;

  const stage1Weighted = stage1Score * STAGE_1_WEIGHT;
  const stage2Weighted = stage2Score * STAGE_2_WEIGHT;
  const stage3Weighted = stage3Score * STAGE_3_WEIGHT;
  const communityWeighted = communitySignal * COMMUNITY_WEIGHT;
  const versionWeighted = versionHistory * VERSION_WEIGHT;

  const finalScore =
    stage1Weighted +
    stage2Weighted +
    stage3Weighted +
    communityWeighted +
    versionWeighted;

  const roundedFinal = Math.round(finalScore * 100) / 100;
  const badge = determineBadge(roundedFinal);

  const allChecks = [...stage1Results, ...stage2Results, ...stage3Results];
  const totalPassed = allChecks.filter((c) => c.passed).length;

  return {
    roleSlug: role.slug,
    roleName: role.name,
    auditVersion: AUDIT_VERSION,
    auditTimestamp: new Date().toISOString(),
    stages: [stage1Summary, stage2Summary, stage3Summary],
    allChecks,
    scoring: {
      stage1Score: Math.round(stage1Score * 100) / 100,
      stage2Score: Math.round(stage2Score * 100) / 100,
      stage3Score: Math.round(stage3Score * 100) / 100,
      communitySignal,
      versionHistory,
      stage1Weighted: Math.round(stage1Weighted * 100) / 100,
      stage2Weighted: Math.round(stage2Weighted * 100) / 100,
      stage3Weighted: Math.round(stage3Weighted * 100) / 100,
      communityWeighted: Math.round(communityWeighted * 100) / 100,
      versionWeighted: Math.round(versionWeighted * 100) / 100,
      finalScore: roundedFinal,
    },
    badge,
    totalChecks: allChecks.length,
    totalPassed,
    summary: `Role "${role.name}" scored ${roundedFinal}/100 - Badge: ${badge} (${totalPassed}/${allChecks.length} checks passed)`,
  };
}

// ---------------------------------------------------------------------------
// Load and audit a role from a JSON file path (for Node.js usage)
// ---------------------------------------------------------------------------
export async function auditRoleFile(filePath: string, options?: AuditOptions): Promise<AuditPacket> {
  // Dynamic import for Node.js fs - this function is only called from the CLI runner
  const fs = await import('fs');
  const path = await import('path');

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Role file not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf-8');
  let role: RoleDefinition;
  try {
    role = JSON.parse(raw) as RoleDefinition;
  } catch {
    throw new Error(`Invalid JSON in role file: ${resolved}`);
  }

  return runAudit(role, options);
}

// ---------------------------------------------------------------------------
// Pretty-print an audit packet to console
// ---------------------------------------------------------------------------
export function printAuditReport(packet: AuditPacket): void {
  const divider = '='.repeat(72);
  const thinDivider = '-'.repeat(72);

  console.log('');
  console.log(divider);
  console.log(`  TRUST AGENT AUDIT REPORT`);
  console.log(`  Role: ${packet.roleName} (${packet.roleSlug})`);
  console.log(`  Audit version: ${packet.auditVersion}`);
  console.log(`  Timestamp: ${packet.auditTimestamp}`);
  console.log(divider);
  console.log('');

  for (const stage of packet.stages) {
    console.log(`  STAGE ${stage.stage}: ${stage.stageName.toUpperCase()}`);
    console.log(`  ${stage.passedCount}/${stage.totalCount} passed | Average: ${stage.averageScore.toFixed(1)} | Weighted: ${stage.weightedScore.toFixed(2)}`);
    console.log(thinDivider);

    for (const check of stage.checks) {
      const icon = check.passed ? '[PASS]' : '[FAIL]';
      const scoreStr = String(check.score).padStart(3, ' ');
      console.log(`    ${icon} ${scoreStr}/100  ${check.checkId}`);
      if (!check.passed) {
        console.log(`           -> ${check.message}`);
        if (check.evidence) {
          console.log(`              ${check.evidence}`);
        }
      }
    }
    console.log('');
  }

  console.log(divider);
  console.log(`  TRUST SCORE BREAKDOWN`);
  console.log(thinDivider);
  console.log(`  Stage 1 (Config):       ${packet.scoring.stage1Score.toFixed(1)} x ${(STAGE_1_WEIGHT * 100).toFixed(0)}% = ${packet.scoring.stage1Weighted.toFixed(2)}`);
  console.log(`  Stage 2 (Behavioural):  ${packet.scoring.stage2Score.toFixed(1)} x ${(STAGE_2_WEIGHT * 100).toFixed(0)}% = ${packet.scoring.stage2Weighted.toFixed(2)}`);
  console.log(`  Stage 3 (Documentation):${packet.scoring.stage3Score.toFixed(1)} x ${(STAGE_3_WEIGHT * 100).toFixed(0)}% = ${packet.scoring.stage3Weighted.toFixed(2)}`);
  console.log(`  Community signal:       ${packet.scoring.communitySignal.toFixed(1)} x ${(COMMUNITY_WEIGHT * 100).toFixed(0)}% = ${packet.scoring.communityWeighted.toFixed(2)}`);
  console.log(`  Version history:        ${packet.scoring.versionHistory.toFixed(1)} x ${(VERSION_WEIGHT * 100).toFixed(0)}%  = ${packet.scoring.versionWeighted.toFixed(2)}`);
  console.log(thinDivider);
  console.log(`  FINAL SCORE: ${packet.scoring.finalScore.toFixed(2)} / 100`);
  console.log(`  BADGE: ${packet.badge}`);
  console.log(`  CHECKS: ${packet.totalPassed}/${packet.totalChecks} passed`);
  console.log(divider);
  console.log('');
}
