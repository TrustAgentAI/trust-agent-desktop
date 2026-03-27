// ============================================================================
// Trust Agent - Audit Pipeline
// Stage 1: Configuration Validation (15 checks)
// ============================================================================

import {
  CheckResult,
  RoleDefinition,
  VALID_CATEGORIES,
  COMPETITOR_NAMES,
  PLACEHOLDER_PATTERNS,
  SLUG_REGEX,
} from '../types';

type CheckFn = (role: RoleDefinition) => CheckResult;

// ---------------------------------------------------------------------------
// Helper: count words in a string
// ---------------------------------------------------------------------------
function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Helper: search all text fields for a pattern
// ---------------------------------------------------------------------------
function searchAllFields(role: RoleDefinition, pattern: RegExp): string[] {
  const hits: string[] = [];
  const fields: (keyof RoleDefinition)[] = [
    'name',
    'tagline',
    'description',
    'systemPrompt',
    'targetUser',
  ];
  for (const field of fields) {
    const val = role[field];
    if (typeof val === 'string' && pattern.test(val)) {
      hits.push(`${field} matches ${pattern}`);
    }
  }
  for (let i = 0; i < role.capabilities.length; i++) {
    if (pattern.test(role.capabilities[i])) {
      hits.push(`capabilities[${i}] matches ${pattern}`);
    }
  }
  for (let i = 0; i < role.limitations.length; i++) {
    if (pattern.test(role.limitations[i])) {
      hits.push(`limitations[${i}] matches ${pattern}`);
    }
  }
  for (let i = 0; i < role.hardLimits.length; i++) {
    if (pattern.test(role.hardLimits[i])) {
      hits.push(`hardLimits[${i}] matches ${pattern}`);
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Check 1: system-prompt-present
// ---------------------------------------------------------------------------
const checkSystemPromptPresent: CheckFn = (role) => {
  const present =
    typeof role.systemPrompt === 'string' && role.systemPrompt.trim().length > 0;
  return {
    checkId: 'system-prompt-present',
    stage: 1,
    passed: present,
    score: present ? 100 : 0,
    message: present
      ? 'System prompt is present'
      : 'System prompt is missing or empty',
    evidence: present
      ? `System prompt length: ${role.systemPrompt.length} chars`
      : 'systemPrompt field is empty or undefined',
  };
};

// ---------------------------------------------------------------------------
// Check 2: system-prompt-min-length (1500 chars)
// ---------------------------------------------------------------------------
const checkSystemPromptMinLength: CheckFn = (role) => {
  const MIN = 1500;
  const len = (role.systemPrompt || '').length;
  const passed = len >= MIN;
  // Partial credit: proportional score up to the minimum
  const score = passed ? 100 : Math.round((len / MIN) * 100);
  return {
    checkId: 'system-prompt-min-length',
    stage: 1,
    passed,
    score,
    message: passed
      ? `System prompt meets minimum length (${len} >= ${MIN} chars)`
      : `System prompt too short (${len} < ${MIN} chars)`,
    evidence: `Length: ${len} chars, required: ${MIN}`,
  };
};

// ---------------------------------------------------------------------------
// Check 3: system-prompt-max-length
// ---------------------------------------------------------------------------
const checkSystemPromptMaxLength: CheckFn = (role) => {
  const MAX = 32000; // practical upper bound
  const len = (role.systemPrompt || '').length;
  const passed = len <= MAX;
  const score = passed ? 100 : Math.max(0, Math.round(((MAX * 2 - len) / MAX) * 100));
  return {
    checkId: 'system-prompt-max-length',
    stage: 1,
    passed,
    score,
    message: passed
      ? `System prompt within maximum length (${len} <= ${MAX} chars)`
      : `System prompt exceeds maximum length (${len} > ${MAX} chars)`,
    evidence: `Length: ${len} chars, maximum: ${MAX}`,
  };
};

// ---------------------------------------------------------------------------
// Check 4: name-present
// ---------------------------------------------------------------------------
const checkNamePresent: CheckFn = (role) => {
  const present = typeof role.name === 'string' && role.name.trim().length > 0;
  return {
    checkId: 'name-present',
    stage: 1,
    passed: present,
    score: present ? 100 : 0,
    message: present ? `Name present: "${role.name}"` : 'Name is missing or empty',
    evidence: present ? `name: "${role.name}"` : 'name field is empty or undefined',
  };
};

// ---------------------------------------------------------------------------
// Check 5: tagline-present (<=120 chars)
// ---------------------------------------------------------------------------
const checkTaglinePresent: CheckFn = (role) => {
  const exists = typeof role.tagline === 'string' && role.tagline.trim().length > 0;
  const withinLimit = exists && role.tagline.length <= 120;
  const passed = exists && withinLimit;
  let score = 0;
  if (exists && withinLimit) score = 100;
  else if (exists && !withinLimit) score = 50; // present but too long
  return {
    checkId: 'tagline-present',
    stage: 1,
    passed,
    score,
    message: !exists
      ? 'Tagline is missing or empty'
      : !withinLimit
        ? `Tagline exceeds 120 chars (${role.tagline.length})`
        : `Tagline present and within limit (${role.tagline.length} chars)`,
    evidence: exists
      ? `tagline: "${role.tagline}" (${role.tagline.length} chars)`
      : 'tagline field is empty or undefined',
  };
};

// ---------------------------------------------------------------------------
// Check 6: description-present (>=150 words)
// ---------------------------------------------------------------------------
const checkDescriptionPresent: CheckFn = (role) => {
  const exists =
    typeof role.description === 'string' && role.description.trim().length > 0;
  const MIN_WORDS = 150;
  const wc = exists ? wordCount(role.description) : 0;
  const passed = exists && wc >= MIN_WORDS;
  const score = !exists ? 0 : passed ? 100 : Math.round((wc / MIN_WORDS) * 100);
  return {
    checkId: 'description-present',
    stage: 1,
    passed,
    score,
    message: !exists
      ? 'Description is missing or empty'
      : !passed
        ? `Description too short (${wc} words < ${MIN_WORDS} required)`
        : `Description meets word count (${wc} words >= ${MIN_WORDS})`,
    evidence: `Word count: ${wc}, required: ${MIN_WORDS}`,
  };
};

// ---------------------------------------------------------------------------
// Check 7: capabilities-listed (>=8)
// ---------------------------------------------------------------------------
const checkCapabilitiesListed: CheckFn = (role) => {
  const MIN = 8;
  const count = Array.isArray(role.capabilities) ? role.capabilities.length : 0;
  const passed = count >= MIN;
  const score = passed ? 100 : Math.round((count / MIN) * 100);
  return {
    checkId: 'capabilities-listed',
    stage: 1,
    passed,
    score,
    message: passed
      ? `Capabilities listed: ${count} (>= ${MIN})`
      : `Insufficient capabilities: ${count} (need >= ${MIN})`,
    evidence: `Count: ${count}, required: ${MIN}`,
  };
};

// ---------------------------------------------------------------------------
// Check 8: limitations-listed (>=4)
// ---------------------------------------------------------------------------
const checkLimitationsListed: CheckFn = (role) => {
  const MIN = 4;
  const count = Array.isArray(role.limitations) ? role.limitations.length : 0;
  const passed = count >= MIN;
  const score = passed ? 100 : Math.round((count / MIN) * 100);
  return {
    checkId: 'limitations-listed',
    stage: 1,
    passed,
    score,
    message: passed
      ? `Limitations listed: ${count} (>= ${MIN})`
      : `Insufficient limitations: ${count} (need >= ${MIN})`,
    evidence: `Count: ${count}, required: ${MIN}`,
  };
};

// ---------------------------------------------------------------------------
// Check 9: hard-limits-present (>=3)
// ---------------------------------------------------------------------------
const checkHardLimitsPresent: CheckFn = (role) => {
  const MIN = 3;
  const count = Array.isArray(role.hardLimits) ? role.hardLimits.length : 0;
  const passed = count >= MIN;
  const score = passed ? 100 : Math.round((count / MIN) * 100);
  return {
    checkId: 'hard-limits-present',
    stage: 1,
    passed,
    score,
    message: passed
      ? `Hard limits present: ${count} (>= ${MIN})`
      : `Insufficient hard limits: ${count} (need >= ${MIN})`,
    evidence: `Count: ${count}, required: ${MIN}`,
  };
};

// ---------------------------------------------------------------------------
// Check 10: escalation-triggers-present (>=3)
// ---------------------------------------------------------------------------
const checkEscalationTriggersPresent: CheckFn = (role) => {
  const MIN = 3;
  const count = Array.isArray(role.escalationTriggers)
    ? role.escalationTriggers.length
    : 0;
  const passed = count >= MIN;
  const score = passed ? 100 : Math.round((count / MIN) * 100);
  return {
    checkId: 'escalation-triggers-present',
    stage: 1,
    passed,
    score,
    message: passed
      ? `Escalation triggers present: ${count} (>= ${MIN})`
      : `Insufficient escalation triggers: ${count} (need >= ${MIN})`,
    evidence: `Count: ${count}, required: ${MIN}`,
  };
};

// ---------------------------------------------------------------------------
// Check 11: no-placeholder-text
// ---------------------------------------------------------------------------
const checkNoPlaceholderText: CheckFn = (role) => {
  const allHits: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const hits = searchAllFields(role, pattern);
    allHits.push(...hits);
  }
  const passed = allHits.length === 0;
  const score = passed ? 100 : Math.max(0, 100 - allHits.length * 20);
  return {
    checkId: 'no-placeholder-text',
    stage: 1,
    passed,
    score,
    message: passed
      ? 'No placeholder text detected'
      : `Placeholder text detected in ${allHits.length} location(s)`,
    evidence: passed ? 'Clean' : allHits.slice(0, 5).join('; '),
  };
};

// ---------------------------------------------------------------------------
// Check 12: no-competitor-mentions
// ---------------------------------------------------------------------------
const checkNoCompetitorMentions: CheckFn = (role) => {
  const allHits: string[] = [];
  for (const name of COMPETITOR_NAMES) {
    const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const hits = searchAllFields(role, pattern);
    allHits.push(...hits);
  }
  const passed = allHits.length === 0;
  const score = passed ? 100 : Math.max(0, 100 - allHits.length * 25);
  return {
    checkId: 'no-competitor-mentions',
    stage: 1,
    passed,
    score,
    message: passed
      ? 'No competitor mentions detected'
      : `Competitor mentions found in ${allHits.length} location(s)`,
    evidence: passed ? 'Clean' : allHits.slice(0, 5).join('; '),
  };
};

// ---------------------------------------------------------------------------
// Check 13: price-valid
// ---------------------------------------------------------------------------
const checkPriceValid: CheckFn = (role) => {
  const price = role.priceMonthly;
  const isNumber = typeof price === 'number' && !isNaN(price);
  const isPositive = isNumber && price > 0;
  const isReasonable = isPositive && price <= 100000; // max 1000 GBP in pence
  const passed = isNumber && isPositive && isReasonable;
  let score = 0;
  if (passed) score = 100;
  else if (isNumber && isPositive) score = 50; // present but unreasonable
  return {
    checkId: 'price-valid',
    stage: 1,
    passed,
    score,
    message: !isNumber
      ? 'Price is not a valid number'
      : !isPositive
        ? 'Price must be positive (in GBP pence)'
        : !isReasonable
          ? `Price seems unreasonable (${price} pence = ${(price / 100).toFixed(2)} GBP)`
          : `Price valid: ${price} pence (${(price / 100).toFixed(2)} GBP/month)`,
    evidence: `priceMonthly: ${price}`,
  };
};

// ---------------------------------------------------------------------------
// Check 14: slug-format
// ---------------------------------------------------------------------------
const checkSlugFormat: CheckFn = (role) => {
  const slug = role.slug || '';
  const passed = SLUG_REGEX.test(slug) && slug.length >= 3 && slug.length <= 64;
  return {
    checkId: 'slug-format',
    stage: 1,
    passed,
    score: passed ? 100 : 0,
    message: passed
      ? `Slug format valid: "${slug}"`
      : `Invalid slug format: "${slug}" (must be lowercase kebab-case, 3-64 chars)`,
    evidence: `slug: "${slug}"`,
  };
};

// ---------------------------------------------------------------------------
// Check 15: category-valid
// ---------------------------------------------------------------------------
const checkCategoryValid: CheckFn = (role) => {
  const cat = role.category;
  const passed = VALID_CATEGORIES.includes(cat as any);
  return {
    checkId: 'category-valid',
    stage: 1,
    passed,
    score: passed ? 100 : 0,
    message: passed
      ? `Category valid: "${cat}"`
      : `Invalid category: "${cat}". Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    evidence: `category: "${cat}"`,
  };
};

// ---------------------------------------------------------------------------
// Check 16 (bonus mapped to spec): knowledge-sources-present (>=3)
// ---------------------------------------------------------------------------
const checkKnowledgeSourcesPresent: CheckFn = (role) => {
  const MIN = 3;
  const count = Array.isArray(role.knowledgeSources) ? role.knowledgeSources.length : 0;
  const passed = count >= MIN;
  const score = passed ? 100 : Math.round((count / MIN) * 100);
  return {
    checkId: 'knowledge-sources-present',
    stage: 1,
    passed,
    score,
    message: passed
      ? `Knowledge sources cited: ${count} (>= ${MIN})`
      : `Insufficient knowledge sources: ${count} (need >= ${MIN})`,
    evidence: passed
      ? `Sources: ${role.knowledgeSources.slice(0, 3).join(', ')}${count > 3 ? '...' : ''}`
      : `Count: ${count}`,
  };
};

// ---------------------------------------------------------------------------
// Check 17 (bonus mapped to spec): children-safety-if-applicable
// ---------------------------------------------------------------------------
const checkChildrenSafetyIfApplicable: CheckFn = (role) => {
  const isChildrenCategory = role.category === 'childrens';
  const hasChildSafetyFlag = role.auditMetadata?.childSafetyRequired === true;
  const needsSafety = isChildrenCategory || hasChildSafetyFlag;

  if (!needsSafety) {
    return {
      checkId: 'children-safety-if-applicable',
      stage: 1,
      passed: true,
      score: 100,
      message: 'Not a children-targeted role - check not applicable',
      evidence: `category: "${role.category}", childSafetyRequired: ${hasChildSafetyFlag}`,
    };
  }

  // For children-targeted roles, verify safeguarding measures exist
  const prompt = (role.systemPrompt || '').toLowerCase();
  const hasSafeguarding =
    prompt.includes('safeguard') ||
    prompt.includes('child safety') ||
    prompt.includes('child protection') ||
    prompt.includes('age-appropriate') ||
    prompt.includes('age appropriate');

  const hasEscalation = role.escalationTriggers.some(
    (t) =>
      t.toLowerCase().includes('safeguard') ||
      t.toLowerCase().includes('child') ||
      t.toLowerCase().includes('abuse') ||
      t.toLowerCase().includes('harm')
  );

  const hasSafeguardingSkill = role.skills.some(
    (s) => s.skillSlug === 'safeguarding' || s.skillSlug === 'crisis-escalation'
  );

  const checks = [hasSafeguarding, hasEscalation, hasSafeguardingSkill];
  const passedCount = checks.filter(Boolean).length;
  const passed = passedCount >= 2;
  const score = Math.round((passedCount / 3) * 100);

  return {
    checkId: 'children-safety-if-applicable',
    stage: 1,
    passed,
    score,
    message: passed
      ? 'Children safety measures verified'
      : `Insufficient children safety measures (${passedCount}/3 criteria met)`,
    evidence: `safeguarding in prompt: ${hasSafeguarding}, escalation trigger: ${hasEscalation}, safeguarding skill: ${hasSafeguardingSkill}`,
  };
};

// ---------------------------------------------------------------------------
// Check 18 (spec item): skill-compatibility-verified
// ---------------------------------------------------------------------------
const checkSkillCompatibilityVerified: CheckFn = (role) => {
  const skills = Array.isArray(role.skills) ? role.skills : [];
  if (skills.length === 0) {
    return {
      checkId: 'skill-compatibility-verified',
      stage: 1,
      passed: false,
      score: 0,
      message: 'No skills assigned to this role',
      evidence: 'skills array is empty',
    };
  }

  // Verify each skill has required fields
  const issues: string[] = [];
  for (const skill of skills) {
    if (!skill.skillSlug) issues.push('Missing skillSlug');
    if (!skill.skillName) issues.push(`Missing skillName for ${skill.skillSlug}`);
    if (!['system', 'context', 'tools'].includes(skill.injectionPoint)) {
      issues.push(
        `Invalid injectionPoint "${skill.injectionPoint}" for ${skill.skillSlug}`
      );
    }
    if (typeof skill.priority !== 'number' || skill.priority < 0) {
      issues.push(`Invalid priority for ${skill.skillSlug}`);
    }
  }

  // Check for duplicate slugs
  const slugs = skills.map((s) => s.skillSlug);
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length > 0) {
    issues.push(`Duplicate skill slugs: ${dupes.join(', ')}`);
  }

  const passed = issues.length === 0;
  const score = passed
    ? 100
    : Math.max(0, 100 - issues.length * 15);

  return {
    checkId: 'skill-compatibility-verified',
    stage: 1,
    passed,
    score,
    message: passed
      ? `All ${skills.length} skills validated`
      : `Skill compatibility issues: ${issues.length} problem(s)`,
    evidence: passed
      ? `Skills: ${slugs.join(', ')}`
      : issues.slice(0, 5).join('; '),
  };
};

// ---------------------------------------------------------------------------
// Exported: All Stage 1 checks
// ---------------------------------------------------------------------------
export const stage1Checks: CheckFn[] = [
  checkSystemPromptPresent,
  checkSystemPromptMinLength,
  checkSystemPromptMaxLength,
  checkNamePresent,
  checkTaglinePresent,
  checkDescriptionPresent,
  checkCapabilitiesListed,
  checkLimitationsListed,
  checkHardLimitsPresent,
  checkEscalationTriggersPresent,
  checkNoPlaceholderText,
  checkNoCompetitorMentions,
  checkPriceValid,
  checkSlugFormat,
  checkCategoryValid,
  checkKnowledgeSourcesPresent,
  checkChildrenSafetyIfApplicable,
  checkSkillCompatibilityVerified,
];

/** Run all Stage 1 checks against a role definition */
export function runStage1(role: RoleDefinition): CheckResult[] {
  return stage1Checks.map((check) => check(role));
}
