# TRUST AGENT — MANIFEST GENERATOR
# CLAUDE.md — Paste this as the prompt in Claude Code and run it.
# Branch prefix: Unified/
#
# ════════════════════════════════════════════════════════════════════════════
# PURPOSE
# ════════════════════════════════════════════════════════════════════════════
#
# This prompt does ONE thing: read the current state of the platform and
# produce a single file — TRUST_AGENT_MANIFEST.json — at the repo root.
#
# YOU DO NOT NEED TO DO ANYTHING EXCEPT RUN THIS PROMPT.
# Claude Code handles everything: creates the script, installs any
# missing dependencies, runs it, and confirms the file was written.
#
# When complete, download TRUST_AGENT_MANIFEST.json from the repo root
# and upload it to the Claude chat session. That is the only action required.
#
# THIS SCRIPT IS COMPLETELY READ-ONLY.
# It writes ONE file: TRUST_AGENT_MANIFEST.json
# It changes NOTHING else — no DB writes, no role changes, no migrations.
#
# ════════════════════════════════════════════════════════════════════════════
# OPERATOR: AgentCore LTD · Company No. 17114811 · trust-agent.ai
# ════════════════════════════════════════════════════════════════════════════

---

## INSTRUCTIONS FOR CLAUDE CODE

Do all of the following automatically. Do not ask for confirmation at any step.
Do not ask the user to run anything manually. Do everything yourself.

### Step 1 — Check the environment

```bash
# Confirm we are in the right repo
pwd
ls package.json prisma/schema.prisma src/data/roles 2>/dev/null || echo "WARNING: expected paths not found"

# Check tsx/ts-node is available, install if not
which tsx || npm install -g tsx
```

### Step 2 — Create the manifest generator script

Create this file at `scripts/generate-manifest.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const db = new PrismaClient();

// ── QUALITY THRESHOLDS ──────────────────────────────────────────────────────
const QUALITY = {
  MIN_SYSTEM_PROMPT_CHARS: 1500,
  TARGET_SYSTEM_PROMPT_CHARS: 3000,
  MIN_CAPABILITIES: 8,
  MIN_HARD_LIMITS: 3,
  MIN_KNOWLEDGE_SOURCES: 3,
  MIN_ESCALATION_TRIGGERS: 3,
  FORTY_YEARS_MARKERS: [
    '40 year', '40-year', 'forty year', 'decades of',
    'expert', 'specialist', 'professional', 'experienced'
  ],
};

// ── VALID ENVIRONMENT THEMES ────────────────────────────────────────────────
const VALID_ENVIRONMENTS = [
  'study-room', 'language-studio', 'library', 'enchanted-classroom',
  'career-studio', 'boardroom', 'legal-office', 'creative-studio',
  'photography-studio', 'wellness-room', 'gym', 'living-room',
  'play-space', 'kitchen', 'sitting-room', 'pub-corner',
  'quiet-room', 'fresh-start-room',
];

function assessQuality(role: any): object {
  const sp = role.systemPrompt || '';
  const spLen = sp.length;
  const sources = role.knowledgeSources || [];
  const caps = role.capabilities || [];
  const limits = role.hardLimits || [];
  const escalations = role.escalationTriggers || [];
  const envConfig = role.environmentConfig as any;
  const envTheme = envConfig?.theme || null;

  const hasFortyYears = QUALITY.FORTY_YEARS_MARKERS.some(
    marker => sp.toLowerCase().includes(marker.toLowerCase())
  );

  const checks = {
    systemPromptMinLength:    { pass: spLen >= QUALITY.MIN_SYSTEM_PROMPT_CHARS,    value: spLen },
    systemPromptTargetLength: { pass: spLen >= QUALITY.TARGET_SYSTEM_PROMPT_CHARS, value: spLen },
    hasFortyYearsDepth:       { pass: hasFortyYears,                               value: hasFortyYears },
    knowledgeSourcesMin:      { pass: sources.length >= QUALITY.MIN_KNOWLEDGE_SOURCES, value: sources.length },
    capabilitiesMin:          { pass: caps.length >= QUALITY.MIN_CAPABILITIES,     value: caps.length },
    hardLimitsMin:            { pass: limits.length >= QUALITY.MIN_HARD_LIMITS,    value: limits.length },
    escalationTriggersMin:    { pass: escalations.length >= QUALITY.MIN_ESCALATION_TRIGGERS, value: escalations.length },
    hasEnvironmentTheme:      { pass: !!envTheme && VALID_ENVIRONMENTS.includes(envTheme), value: envTheme },
    hasGenderField:           { pass: !!role.gender,                               value: role.gender || null },
    hasCompanionName:         { pass: !!role.companionName,                        value: role.companionName || null },
    hasVoiceId:               { pass: !!role.voiceId,                              value: role.voiceId || null },
    hasBaseSlug:              { pass: !!role.baseSlug,                             value: role.baseSlug || null },
  };

  const passCount = Object.values(checks).filter((c: any) => c.pass).length;
  const totalChecks = Object.keys(checks).length;
  const qualityScore = Math.round((passCount / totalChecks) * 100);

  const status =
    qualityScore === 100 ? 'EXCELLENT' :
    qualityScore >= 80   ? 'GOOD' :
    qualityScore >= 60   ? 'NEEDS_UPGRADE' :
                           'POOR';

  return { qualityScore, status, passCount, totalChecks, checks };
}

async function generateManifest() {
  console.log('Trust Agent — Manifest Generator');
  console.log('Reading platform state...\n');

  // ── FETCH ALL ROLES FROM DB ────────────────────────────────────────────────
  const roles = await db.role.findMany({
    include: {
      audit: true,
      skills: true,
    },
    orderBy: [{ category: 'asc' }, { slug: 'asc' }],
  });

  // ── FETCH ALL SKILLS ───────────────────────────────────────────────────────
  const skills = await db.skill.findMany({
    orderBy: { slug: 'asc' },
  });

  // ── ALSO READ JSON FILES FROM DISK ────────────────────────────────────────
  const rolesDir = path.join(process.cwd(), 'src', 'data', 'roles');
  let diskRoleSlugs: string[] = [];
  if (fs.existsSync(rolesDir)) {
    diskRoleSlugs = fs.readdirSync(rolesDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  const dbSlugs = roles.map(r => r.slug);
  const inDiskNotDb = diskRoleSlugs.filter(s => !dbSlugs.includes(s));
  const inDbNotDisk = dbSlugs.filter(s => !diskRoleSlugs.includes(s));

  // ── SCAN REPO STRUCTURE (what has actually been built) ────────────────────
  function scanDir(dirPath: string, maxDepth = 3, depth = 0): string[] {
    if (!fs.existsSync(dirPath) || depth > maxDepth) return [];
    const items = fs.readdirSync(dirPath);
    const results: string[] = [];
    for (const item of items) {
      if (['node_modules', '.git', '.next', 'dist', '.turbo'].includes(item)) continue;
      const full = path.join(dirPath, item);
      const rel  = path.relative(process.cwd(), full);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results.push(`${rel}/`);
        results.push(...scanDir(full, maxDepth, depth + 1));
      } else {
        results.push(rel);
      }
    }
    return results;
  }

  const repoFiles = scanDir(process.cwd(), 4);

  // Key presence checks — what major pieces have been built
  const built = {
    prismaSchema:         fs.existsSync('prisma/schema.prisma'),
    nextjsApp:            fs.existsSync('src/app') || fs.existsSync('app'),
    tRPCRouter:           repoFiles.some(f => f.includes('trpc') || f.includes('router')),
    marketplacePage:      repoFiles.some(f => f.includes('marketplace')),
    dashboardPage:        repoFiles.some(f => f.includes('dashboard')),
    sessionPage:          repoFiles.some(f => f.includes('session')),
    environmentShell:     repoFiles.some(f => f.includes('EnvironmentShell') || f.includes('environment-shell')),
    auditPipeline:        repoFiles.some(f => f.includes('audit')),
    stripeIntegration:    repoFiles.some(f => f.includes('stripe')),
    liveKitIntegration:   repoFiles.some(f => f.includes('livekit') || f.includes('LiveKit')),
    designTokens:         repoFiles.some(f => f.includes('tokens.css') || f.includes('tokens')),
    rolesDataDir:         fs.existsSync('src/data/roles'),
    skillsDataDir:        fs.existsSync('src/data/skills'),
    tauriApp:             fs.existsSync('src-tauri'),
    expoApp:              fs.existsSync('apps/mobile') || fs.existsSync('mobile'),
    envFiles:             fs.existsSync('.env') || fs.existsSync('.env.local'),
  };

  // Page-level presence
  const appDir = fs.existsSync('src/app') ? 'src/app' : fs.existsSync('app') ? 'app' : null;
  const pages: Record<string, boolean> = {};
  if (appDir) {
    const pageTargets = [
      'page.tsx', 'marketplace', 'dashboard', 'session',
      'auth', 'enterprise', 'children', 'api'
    ];
    pageTargets.forEach(p => {
      pages[p] = repoFiles.some(f => f.includes(p));
    });
  }

  // Environment CSS files
  const envCssFiles = repoFiles.filter(f =>
    f.includes('environments') || f.includes('env-') ||
    VALID_ENVIRONMENTS.some(e => f.includes(e))
  );

  // ── ADD TO MANIFEST ────────────────────────────────────────────────────────
  // (add repoSnapshot to manifest object below)
  const roleEntries = roles.map(role => {
    const envConfig = role.environmentConfig as any;
    const quality = assessQuality(role);

    return {
      // Identity
      slug:           role.slug,
      baseSlug:       (role as any).baseSlug || null,
      gender:         (role as any).gender || null,
      name:           role.name,
      companionName:  (role as any).companionName || null,
      voiceId:        (role as any).voiceId || null,

      // Classification
      category:       role.category,
      subcategory:    (role as any).subcategory || null,
      languageCode:   role.languageCode || null,

      // Status
      isActive:       role.isActive,
      publishedAt:    role.publishedAt ? role.publishedAt.toISOString() : null,
      createdAt:      role.createdAt.toISOString(),

      // Environment
      environmentTheme: envConfig?.theme || null,
      companionPresence: envConfig?.companionPresence || null,
      primaryPanelType: envConfig?.primaryPanelType || null,

      // Audit
      trustScore:     role.audit?.trustScore || null,
      badge:          role.audit?.badge || null,
      auditedAt:      role.audit?.createdAt ? role.audit.createdAt.toISOString() : null,

      // Content metrics (no actual system prompt content — just metrics)
      systemPromptChars:    (role.systemPrompt || '').length,
      capabilitiesCount:    (role.capabilities || []).length,
      limitationsCount:     (role.limitations || []).length,
      hardLimitsCount:      (role.hardLimits || []).length,
      escalationCount:      (role.escalationTriggers || []).length,
      knowledgeSourcesCount:(role.knowledgeSources || []).length,
      knowledgeSources:      role.knowledgeSources || [],
      tagsCount:            (role.tags || []).length,

      // Skills assigned
      skills: role.skills.map(s => s.skillSlug),

      // Quality assessment
      quality,
    };
  });

  // ── CATEGORY BREAKDOWN ────────────────────────────────────────────────────
  const categories: Record<string, number> = {};
  roles.forEach(r => {
    categories[r.category] = (categories[r.category] || 0) + 1;
  });

  // ── ENVIRONMENT COVERAGE ──────────────────────────────────────────────────
  const environmentCoverage: Record<string, string[]> = {};
  roles.forEach(r => {
    const env = (r.environmentConfig as any)?.theme || 'MISSING';
    if (!environmentCoverage[env]) environmentCoverage[env] = [];
    environmentCoverage[env].push(r.slug);
  });

  // ── GENDER PAIR ANALYSIS ──────────────────────────────────────────────────
  const baseSlugsF = new Set(
    roles.filter(r => (r as any).gender === 'female' || r.slug.endsWith('-f'))
         .map(r => (r as any).baseSlug || r.slug.replace(/-f$/, ''))
  );
  const baseSlugsM = new Set(
    roles.filter(r => (r as any).gender === 'male' || r.slug.endsWith('-m'))
         .map(r => (r as any).baseSlug || r.slug.replace(/-m$/, ''))
  );
  const missingFemale = [...baseSlugsM].filter(s => !baseSlugsF.has(s));
  const missingMale   = [...baseSlugsF].filter(s => !baseSlugsM.has(s));

  // ── QUALITY SUMMARY ───────────────────────────────────────────────────────
  const qualityBreakdown = {
    excellent:     roleEntries.filter(r => (r.quality as any).status === 'EXCELLENT').length,
    good:          roleEntries.filter(r => (r.quality as any).status === 'GOOD').length,
    needsUpgrade:  roleEntries.filter(r => (r.quality as any).status === 'NEEDS_UPGRADE').length,
    poor:          roleEntries.filter(r => (r.quality as any).status === 'POOR').length,
  };

  const rolesMissingEnvironment = roleEntries
    .filter(r => !r.environmentTheme || r.environmentTheme === 'MISSING')
    .map(r => r.slug);

  const rolesMissingFortyYears = roleEntries
    .filter(r => !(r.quality as any).checks.hasFortyYearsDepth.pass)
    .map(r => r.slug);

  const rolesBelowTargetLength = roleEntries
    .filter(r => r.systemPromptChars < 3000)
    .map(r => ({ slug: r.slug, chars: r.systemPromptChars }));

  // ── ASSEMBLE MANIFEST ─────────────────────────────────────────────────────
  const manifest = {
    _meta: {
      generated:        new Date().toISOString(),
      generator:        'TRUST_AGENT_MANIFEST_V1',
      operator:         'AgentCore LTD · Company No. 17114811',
      platform:         'trust-agent.ai',
      description:      'Complete platform state snapshot for AI assistant context sync.',
      instructions_for_ai: [
        'This file represents the EXACT current state of the Trust Agent platform.',
        'Every role listed here ALREADY EXISTS. Do not recommend building these again.',
        'Roles with quality.status = NEEDS_UPGRADE or POOR require system prompt improvement.',
        'Roles in rolesMissingEnvironment need an environmentTheme assigned.',
        'Roles in rolesMissingFortyYears need their system prompt rebuilt to 40-years depth standard.',
        'Roles in missingMalePair or missingFemalePair need their gender companion built.',
        'inDiskNotDb means the JSON file exists but has not been seeded to the database.',
        'inDbNotDisk means the DB record exists but the JSON file is missing or was deleted.',
      ],
    },

    summary: {
      totalRoles:            roles.length,
      activeRoles:           roles.filter(r => r.isActive).length,
      inactiveRoles:         roles.filter(r => !r.isActive).length,
      totalDiskFiles:        diskRoleSlugs.length,
      inDiskNotDb:           inDiskNotDb,
      inDbNotDisk:           inDbNotDisk,
      categories:            categories,
      categoriesCount:       Object.keys(categories).length,
      environmentsInUse:     Object.keys(environmentCoverage).filter(e => e !== 'MISSING'),
      rolesMissingEnvironment,
      rolesMissingFortyYears,
      rolesBelowTargetLength,
      qualityBreakdown,
      genderAnalysis: {
        femaleVariants:      [...baseSlugsF].length,
        maleVariants:        [...baseSlugsM].length,
        missingFemalePair:   missingFemale,
        missingMalePair:     missingMale,
        fullyPaired:         [...baseSlugsF].filter(s => baseSlugsM.has(s)).length,
      },
    },

    environments: environmentCoverage,

    repoSnapshot: {
      built,
      pages,
      environmentCssFiles: envCssFiles,
      totalTrackedFiles: repoFiles.length,
      allFiles: repoFiles,
    },

    skills: skills.map(s => ({
      slug:        s.slug,
      name:        s.name,
      description: s.description,
      createdAt:   s.createdAt.toISOString(),
    })),

    roles: roleEntries,
  };

  // ── WRITE FILE ────────────────────────────────────────────────────────────
  const outputPath = path.join(process.cwd(), 'TRUST_AGENT_MANIFEST.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');

  // ── PRINT SUMMARY ─────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('TRUST AGENT — PLATFORM MANIFEST GENERATED');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total roles in DB:          ${manifest.summary.totalRoles}`);
  console.log(`Active roles:               ${manifest.summary.activeRoles}`);
  console.log(`JSON files on disk:         ${manifest.summary.totalDiskFiles}`);
  console.log(`In disk, not in DB:         ${inDiskNotDb.length}`);
  console.log(`In DB, not on disk:         ${inDbNotDisk.length}`);
  console.log('');
  console.log('QUALITY BREAKDOWN:');
  console.log(`  Excellent (100%):         ${qualityBreakdown.excellent}`);
  console.log(`  Good (80-99%):            ${qualityBreakdown.good}`);
  console.log(`  Needs Upgrade (60-79%):   ${qualityBreakdown.needsUpgrade}`);
  console.log(`  Poor (<60%):              ${qualityBreakdown.poor}`);
  console.log('');
  console.log('GAPS:');
  console.log(`  Missing environment:      ${rolesMissingEnvironment.length}`);
  console.log(`  Missing 40yr depth:       ${rolesMissingFortyYears.length}`);
  console.log(`  Below 3,000 char target:  ${rolesBelowTargetLength.length}`);
  console.log(`  Missing male pair:        ${missingMale.length}`);
  console.log(`  Missing female pair:      ${missingFemale.length}`);
  console.log('');
  console.log(`Manifest written to: TRUST_AGENT_MANIFEST.json`);
  console.log('═══════════════════════════════════════════════════');
  console.log('Download this file and share it with your AI');
  console.log('assistant to sync platform state.');
  console.log('═══════════════════════════════════════════════════');

  await db.$disconnect();
}

generateManifest().catch(async (e) => {
  console.error('Manifest generation failed:', e);
  await db.$disconnect();
  process.exit(1);
});
```

---

### Step 3 — Run the script automatically

```bash
# Run the manifest generator
npx tsx scripts/generate-manifest.ts

# Confirm the file was written
echo "---"
echo "Manifest file size:"
ls -lh TRUST_AGENT_MANIFEST.json

echo "---"
echo "First 50 lines of manifest:"
head -50 TRUST_AGENT_MANIFEST.json
```

### Step 4 — Report completion

After running, print this exact message so the user knows what to do next:

```
════════════════════════════════════════════════════════
TRUST AGENT MANIFEST GENERATED SUCCESSFULLY
════════════════════════════════════════════════════════
File: TRUST_AGENT_MANIFEST.json (repo root)

NEXT STEP FOR YOU:
1. Download TRUST_AGENT_MANIFEST.json from the repo root
2. Upload it to your Claude chat session
3. Claude will read it and understand exactly what
   exists on the platform before making any changes.

The file contains NO secrets, NO system prompts,
NO user data. It is safe to share.
════════════════════════════════════════════════════════
```

---

## WHAT THIS FILE DOES NOT CONTAIN

For security, the manifest deliberately omits:
- Actual systemPrompt text (only character count is recorded)
- User data of any kind
- API keys, secrets, or credentials
- Audit report content (only scores and badges)
- Session or message data

---

*Trust Agent — AgentCore LTD — Company No. 17114811 — trust-agent.ai*
*GENERATE-MANIFEST.md — Paste as Claude Code prompt. Run at any time.*
