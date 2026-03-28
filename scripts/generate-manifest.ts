import * as fs from 'fs';
import * as path from 'path';

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

function generateManifest() {
  console.log('Trust Agent - Manifest Generator');
  console.log('Reading platform state from JSON files...\n');

  const rolesDir = path.join(process.cwd(), 'src', 'data', 'roles');
  const skillsDir = path.join(process.cwd(), 'src', 'data', 'skills');

  // Load all role JSON files
  const roles: any[] = [];
  if (fs.existsSync(rolesDir)) {
    const files = fs.readdirSync(rolesDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(rolesDir, file), 'utf-8');
        const role = JSON.parse(content);
        role._filename = file;
        roles.push(role);
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    }
  }

  // Load all skill JSON files
  const skills: any[] = [];
  if (fs.existsSync(skillsDir)) {
    const files = fs.readdirSync(skillsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(skillsDir, file), 'utf-8');
        const skill = JSON.parse(content);
        skills.push(skill);
      } catch (e) {
        console.error(`Failed to parse ${file}:`, e);
      }
    }
  }

  // Scan repo structure
  function scanDir(dirPath: string, maxDepth = 3, depth = 0): string[] {
    if (!fs.existsSync(dirPath) || depth > maxDepth) return [];
    const items = fs.readdirSync(dirPath);
    const results: string[] = [];
    for (const item of items) {
      if (['node_modules', '.git', '.next', 'dist', '.turbo', 'target', '__pycache__'].includes(item)) continue;
      const full = path.join(dirPath, item);
      const rel = path.relative(process.cwd(), full);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results.push(`${rel}/`);
          results.push(...scanDir(full, maxDepth, depth + 1));
        } else {
          results.push(rel);
        }
      } catch {}
    }
    return results;
  }

  const repoFiles = scanDir(process.cwd(), 4);

  const built = {
    prismaSchema:       fs.existsSync('prisma/schema.prisma'),
    nextjsApp:          fs.existsSync('src/app') || fs.existsSync('app'),
    tRPCRouter:         repoFiles.some(f => f.includes('trpc') || f.includes('router')),
    marketplacePage:    repoFiles.some(f => f.includes('marketplace')),
    dashboardPage:      repoFiles.some(f => f.includes('dashboard') || f.includes('Dashboard')),
    sessionPage:        repoFiles.some(f => f.includes('session')),
    auditPipeline:      repoFiles.some(f => f.includes('audit')),
    liveKitIntegration: repoFiles.some(f => f.includes('livekit') || f.includes('LiveKit')),
    rolesDataDir:       fs.existsSync('src/data/roles'),
    skillsDataDir:      fs.existsSync('src/data/skills'),
    tauriApp:           fs.existsSync('src-tauri'),
    agentRuntime:       fs.existsSync('agent-runtime'),
  };

  // Build role entries
  const roleEntries = roles.map(role => {
    const quality = assessQuality(role);
    return {
      slug:                 role.slug,
      name:                 role.name,
      category:             role.category,
      subcategory:          role.subcategory || null,
      tagline:              role.tagline || null,
      targetUser:           role.targetUser || null,
      languageCode:         role.languageCode || null,
      priceMonthly:         role.priceMonthly || null,
      systemPromptChars:    (role.systemPrompt || '').length,
      capabilitiesCount:    (role.capabilities || []).length,
      limitationsCount:     (role.limitations || []).length,
      hardLimitsCount:      (role.hardLimits || []).length,
      escalationCount:      (role.escalationTriggers || []).length,
      knowledgeSourcesCount:(role.knowledgeSources || []).length,
      knowledgeSources:     role.knowledgeSources || [],
      tagsCount:            (role.tags || []).length,
      skills:               (role.skills || []).map((s: any) => s.skillSlug || s),
      auditMetadata:        role.auditMetadata || null,
      quality,
    };
  });

  // Category breakdown
  const categories: Record<string, number> = {};
  roles.forEach(r => {
    categories[r.category] = (categories[r.category] || 0) + 1;
  });

  // Quality summary
  const qualityBreakdown = {
    excellent:    roleEntries.filter(r => (r.quality as any).status === 'EXCELLENT').length,
    good:         roleEntries.filter(r => (r.quality as any).status === 'GOOD').length,
    needsUpgrade: roleEntries.filter(r => (r.quality as any).status === 'NEEDS_UPGRADE').length,
    poor:         roleEntries.filter(r => (r.quality as any).status === 'POOR').length,
  };

  const rolesBelowTargetLength = roleEntries
    .filter(r => r.systemPromptChars < 3000)
    .map(r => ({ slug: r.slug, chars: r.systemPromptChars }));

  const rolesMissingFortyYears = roleEntries
    .filter(r => !(r.quality as any).checks.hasFortyYearsDepth.pass)
    .map(r => r.slug);

  // Assemble manifest
  const manifest = {
    _meta: {
      generated:       new Date().toISOString(),
      generator:       'TRUST_AGENT_MANIFEST_V1',
      operator:        'AgentCore LTD - Company No. 17114811',
      platform:        'trust-agent.ai',
      source:          'JSON files (src/data/roles/ and src/data/skills/)',
      description:     'Complete platform state snapshot for AI assistant context sync.',
    },

    summary: {
      totalRoles:           roles.length,
      totalSkills:          skills.length,
      categories:           categories,
      categoriesCount:      Object.keys(categories).length,
      qualityBreakdown,
      rolesBelowTargetLength,
      rolesMissingFortyYears,
    },

    repoSnapshot: {
      built,
      totalTrackedFiles: repoFiles.length,
    },

    skills: skills.map(s => ({
      slug:        s.slug,
      name:        s.name,
      description: s.description,
    })),

    roles: roleEntries,
  };

  // Write file
  const outputPath = path.join(process.cwd(), 'TRUST_AGENT_MANIFEST.json');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');

  // Print summary
  console.log('===================================================');
  console.log('TRUST AGENT - PLATFORM MANIFEST GENERATED');
  console.log('===================================================');
  console.log(`Total roles:                ${manifest.summary.totalRoles}`);
  console.log(`Total skills:               ${manifest.summary.totalSkills}`);
  console.log(`Categories:                 ${manifest.summary.categoriesCount}`);
  console.log('');
  console.log('CATEGORIES:');
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  console.log('');
  console.log('QUALITY BREAKDOWN:');
  console.log(`  Excellent (100%):         ${qualityBreakdown.excellent}`);
  console.log(`  Good (80-99%):            ${qualityBreakdown.good}`);
  console.log(`  Needs Upgrade (60-79%):   ${qualityBreakdown.needsUpgrade}`);
  console.log(`  Poor (<60%):              ${qualityBreakdown.poor}`);
  console.log('');
  console.log(`  Below 3,000 char target:  ${rolesBelowTargetLength.length}`);
  console.log(`  Missing 40yr depth:       ${rolesMissingFortyYears.length}`);
  console.log('');
  console.log(`Manifest written to: TRUST_AGENT_MANIFEST.json`);
  console.log('===================================================');
}

generateManifest();
