#!/usr/bin/env node
// ============================================================================
// Trust Agent - Audit Pipeline CLI Runner
//
// Usage:
//   npx tsx src/server/audit/runner.ts src/data/roles/gcse-maths-tutor.json
//   npx tsx src/server/audit/runner.ts src/data/roles/gcse-maths-tutor.json --json
//   npx tsx src/server/audit/runner.ts src/data/roles/gcse-maths-tutor.json --json --out report.json
//
// Options:
//   --json         Output raw JSON instead of formatted report
//   --out <file>   Write output to a file
//   --community N  Override community signal (default 75)
//   --version N    Override version history score (default 0)
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { RoleDefinition } from './types';
import { runAudit, printAuditReport, AuditOptions } from './pipeline';

function usage(): void {
  console.log(`
Trust Agent Audit Pipeline Runner

Usage:
  npx tsx src/server/audit/runner.ts <role-json-path> [options]

Options:
  --json           Output raw JSON instead of formatted report
  --out <file>     Write output to a file
  --community <N>  Override community signal score (0-100, default 75)
  --version <N>    Override version history score (0-100, default 0)
  --help           Show this help message

Examples:
  npx tsx src/server/audit/runner.ts src/data/roles/gcse-maths-tutor.json
  npx tsx src/server/audit/runner.ts src/data/roles/gcse-maths-tutor.json --json
  npx tsx src/server/audit/runner.ts src/data/roles/gcse-maths-tutor.json --json --out audit-report.json
`);
}

function parseArgs(argv: string[]): {
  filePath: string | null;
  jsonOutput: boolean;
  outFile: string | null;
  communitySignal: number | undefined;
  versionHistory: number | undefined;
  help: boolean;
} {
  const result = {
    filePath: null as string | null,
    jsonOutput: false,
    outFile: null as string | null,
    communitySignal: undefined as number | undefined,
    versionHistory: undefined as number | undefined,
    help: false,
  };

  const args = argv.slice(2); // skip node and script path
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--json') {
      result.jsonOutput = true;
    } else if (arg === '--out' && i + 1 < args.length) {
      result.outFile = args[++i];
    } else if (arg === '--community' && i + 1 < args.length) {
      result.communitySignal = Number(args[++i]);
    } else if (arg === '--version' && i + 1 < args.length) {
      result.versionHistory = Number(args[++i]);
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (!arg.startsWith('--') && !result.filePath) {
      result.filePath = arg;
    }
    i++;
  }

  return result;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    usage();
    process.exit(0);
  }

  if (!opts.filePath) {
    console.error('Error: No role JSON file specified.\n');
    usage();
    process.exit(1);
  }

  // Resolve file path
  const resolved = path.resolve(opts.filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found: ${resolved}`);
    process.exit(1);
  }

  // Read and parse
  let role: RoleDefinition;
  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    role = JSON.parse(raw) as RoleDefinition;
  } catch (err: any) {
    console.error(`Error: Failed to parse role JSON: ${err.message}`);
    process.exit(1);
  }

  // Build audit options
  const auditOptions: AuditOptions = {};
  if (opts.communitySignal !== undefined && !isNaN(opts.communitySignal)) {
    auditOptions.communitySignal = opts.communitySignal;
  }
  if (opts.versionHistory !== undefined && !isNaN(opts.versionHistory)) {
    auditOptions.versionHistory = opts.versionHistory;
  }

  // Run audit
  const packet = runAudit(role, auditOptions);

  // Output
  if (opts.jsonOutput) {
    const jsonStr = JSON.stringify(packet, null, 2);
    if (opts.outFile) {
      const outPath = path.resolve(opts.outFile);
      fs.writeFileSync(outPath, jsonStr, 'utf-8');
      console.log(`Audit report written to: ${outPath}`);
    } else {
      console.log(jsonStr);
    }
  } else {
    printAuditReport(packet);
    if (opts.outFile) {
      const jsonStr = JSON.stringify(packet, null, 2);
      const outPath = path.resolve(opts.outFile);
      fs.writeFileSync(outPath, jsonStr, 'utf-8');
      console.log(`Full JSON report also written to: ${outPath}`);
    }
  }

  // Exit with non-zero if REJECTED
  if (packet.badge === 'REJECTED') {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
