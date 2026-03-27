// ============================================================================
// Trust Agent - Audit Pipeline
// Stage 3: Documentation Quality (10 checks)
// ============================================================================

import { CheckResult, RoleDefinition, VALID_CATEGORIES } from '../types';

type CheckFn = (role: RoleDefinition) => CheckResult;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Check 1: capability-claims-verifiable
// Each capability should be specific enough to test, not vague
// ---------------------------------------------------------------------------
const checkCapabilityClaimsVerifiable: CheckFn = (role) => {
  const caps = role.capabilities || [];
  if (caps.length === 0) {
    return {
      checkId: 'capability-claims-verifiable',
      stage: 3,
      passed: false,
      score: 0,
      message: 'No capabilities listed',
      evidence: 'capabilities array is empty',
    };
  }

  // Vague capability patterns
  const vaguePatterns = [
    /^help/i,
    /^assist/i,
    /^support/i,
    /^provide/i,
    /^general/i,
    /^various/i,
    /^many/i,
    /^all/i,
    /^everything/i,
  ];

  let verifiableCount = 0;
  const vagueItems: string[] = [];

  for (const cap of caps) {
    const words = wordCount(cap);
    const isVague = vaguePatterns.some((p) => p.test(cap.trim()));
    const isTooShort = words < 4;
    const isSpecific = !isVague && !isTooShort;

    if (isSpecific) {
      verifiableCount++;
    } else {
      vagueItems.push(cap);
    }
  }

  const ratio = verifiableCount / caps.length;
  const passed = ratio >= 0.75;
  const score = Math.round(ratio * 100);

  return {
    checkId: 'capability-claims-verifiable',
    stage: 3,
    passed,
    score,
    message: passed
      ? `${verifiableCount}/${caps.length} capabilities are specific and verifiable`
      : `Too many vague capabilities: ${vagueItems.length}/${caps.length}`,
    evidence: vagueItems.length > 0
      ? `Vague: "${vagueItems[0]}"${vagueItems.length > 1 ? ` (+${vagueItems.length - 1} more)` : ''}`
      : `All ${caps.length} capabilities are specific`,
  };
};

// ---------------------------------------------------------------------------
// Check 2: limitation-claims-honest
// Limitations should be genuine constraints, not just filler
// ---------------------------------------------------------------------------
const checkLimitationClaimsHonest: CheckFn = (role) => {
  const lims = role.limitations || [];
  if (lims.length === 0) {
    return {
      checkId: 'limitation-claims-honest',
      stage: 3,
      passed: false,
      score: 0,
      message: 'No limitations listed',
      evidence: 'limitations array is empty',
    };
  }

  let honestCount = 0;
  const suspectItems: string[] = [];

  for (const lim of lims) {
    const words = wordCount(lim);
    const hasNegation =
      /\b(?:cannot|can't|does not|doesn't|will not|won't|unable|no|not)\b/i.test(lim);
    const isSubstantive = words >= 5;
    const isHonest = hasNegation && isSubstantive;

    if (isHonest) {
      honestCount++;
    } else {
      suspectItems.push(lim);
    }
  }

  const ratio = honestCount / lims.length;
  const passed = ratio >= 0.75;
  const score = Math.round(ratio * 100);

  return {
    checkId: 'limitation-claims-honest',
    stage: 3,
    passed,
    score,
    message: passed
      ? `${honestCount}/${lims.length} limitations are honest and substantive`
      : `${suspectItems.length}/${lims.length} limitations lack substance`,
    evidence: suspectItems.length > 0
      ? `Suspect: "${suspectItems[0]}"${suspectItems.length > 1 ? ` (+${suspectItems.length - 1} more)` : ''}`
      : `All ${lims.length} limitations are substantive`,
  };
};

// ---------------------------------------------------------------------------
// Check 3: hard-limits-testable
// Hard limits should be concrete and enforceable, not abstract
// ---------------------------------------------------------------------------
const checkHardLimitsTestable: CheckFn = (role) => {
  const limits = role.hardLimits || [];
  if (limits.length === 0) {
    return {
      checkId: 'hard-limits-testable',
      stage: 3,
      passed: false,
      score: 0,
      message: 'No hard limits listed',
      evidence: 'hardLimits array is empty',
    };
  }

  let testableCount = 0;
  const untestable: string[] = [];

  for (const hl of limits) {
    const words = wordCount(hl);
    const hasAction =
      /\b(?:never|refuse|reject|will not|won't|must not|cannot|block|deny|decline|prohibit|forbid)\b/i.test(hl);
    const hasContext = words >= 6;
    const isTestable = hasAction && hasContext;

    if (isTestable) {
      testableCount++;
    } else {
      untestable.push(hl);
    }
  }

  const ratio = testableCount / limits.length;
  const passed = ratio >= 0.75;
  const score = Math.round(ratio * 100);

  return {
    checkId: 'hard-limits-testable',
    stage: 3,
    passed,
    score,
    message: passed
      ? `${testableCount}/${limits.length} hard limits are testable`
      : `${untestable.length}/${limits.length} hard limits are not clearly testable`,
    evidence: untestable.length > 0
      ? `Untestable: "${untestable[0]}"${untestable.length > 1 ? ` (+${untestable.length - 1} more)` : ''}`
      : `All ${limits.length} hard limits are testable`,
  };
};

// ---------------------------------------------------------------------------
// Check 4: escalation-triggers-specific
// ---------------------------------------------------------------------------
const checkEscalationTriggersSpecific: CheckFn = (role) => {
  const triggers = role.escalationTriggers || [];
  if (triggers.length === 0) {
    return {
      checkId: 'escalation-triggers-specific',
      stage: 3,
      passed: false,
      score: 0,
      message: 'No escalation triggers listed',
      evidence: 'escalationTriggers array is empty',
    };
  }

  let specificCount = 0;
  const vague: string[] = [];

  for (const t of triggers) {
    const words = wordCount(t);
    const hasAction =
      /\b(?:refer|redirect|escalate|contact|call|advise|recommend|suggest|direct)\b/i.test(t);
    const hasTarget =
      /\b(?:doctor|gp|nhs|solicitor|police|samaritans|teacher|parent|guardian|professional|specialist|expert|999|111|116|85258)\b/i.test(t);
    const isSpecific = words >= 5 && (hasAction || hasTarget);

    if (isSpecific) {
      specificCount++;
    } else {
      vague.push(t);
    }
  }

  const ratio = specificCount / triggers.length;
  const passed = ratio >= 0.75;
  const score = Math.round(ratio * 100);

  return {
    checkId: 'escalation-triggers-specific',
    stage: 3,
    passed,
    score,
    message: passed
      ? `${specificCount}/${triggers.length} escalation triggers are specific`
      : `${vague.length}/${triggers.length} triggers lack specificity`,
    evidence: vague.length > 0
      ? `Vague: "${vague[0]}"${vague.length > 1 ? ` (+${vague.length - 1} more)` : ''}`
      : `All ${triggers.length} triggers are specific`,
  };
};

// ---------------------------------------------------------------------------
// Check 5: target-user-defined
// ---------------------------------------------------------------------------
const checkTargetUserDefined: CheckFn = (role) => {
  const target = role.targetUser || '';
  const exists = target.trim().length > 0;
  const isSubstantive = wordCount(target) >= 3;
  const passed = exists && isSubstantive;
  const score = !exists ? 0 : isSubstantive ? 100 : 50;

  return {
    checkId: 'target-user-defined',
    stage: 3,
    passed,
    score,
    message: passed
      ? `Target user defined: "${target}"`
      : !exists
        ? 'Target user not defined'
        : 'Target user definition too brief',
    evidence: `targetUser: "${target}" (${wordCount(target)} words)`,
  };
};

// ---------------------------------------------------------------------------
// Check 6: price-justification-reasonable
// Price should be reasonable for the category and capabilities
// ---------------------------------------------------------------------------
const checkPriceJustification: CheckFn = (role) => {
  const price = role.priceMonthly || 0;
  const caps = role.capabilities || [];
  const skills = role.skills || [];

  // Price in GBP pence: reasonable range 0-10000 (0-100 GBP)
  const priceGBP = price / 100;
  const isReasonable = priceGBP > 0 && priceGBP <= 100;
  const hasValueProp = caps.length >= 8 && skills.length >= 1;
  const passed = isReasonable && hasValueProp;

  let score = 0;
  if (isReasonable && hasValueProp) score = 100;
  else if (isReasonable) score = 70;
  else if (hasValueProp) score = 50;

  return {
    checkId: 'price-justification-reasonable',
    stage: 3,
    passed,
    score,
    message: passed
      ? `Price justified: ${priceGBP.toFixed(2)} GBP/month with ${caps.length} capabilities, ${skills.length} skills`
      : `Price justification weak: ${priceGBP.toFixed(2)} GBP, ${caps.length} capabilities, ${skills.length} skills`,
    evidence: `Price: ${priceGBP.toFixed(2)} GBP, capabilities: ${caps.length}, skills: ${skills.length}`,
  };
};

// ---------------------------------------------------------------------------
// Check 7: skill-compatibility-verified
// Verify skills are documented and compatible with the role
// ---------------------------------------------------------------------------
const checkSkillCompatibility: CheckFn = (role) => {
  const skills = role.skills || [];
  if (skills.length === 0) {
    return {
      checkId: 'skill-compatibility-verified',
      stage: 3,
      passed: false,
      score: 20,
      message: 'No skills assigned - role may lack functionality',
      evidence: 'skills array is empty',
    };
  }

  // Every skill should have all required fields and a meaningful name
  let validCount = 0;
  const issues: string[] = [];
  for (const s of skills) {
    if (s.skillSlug && s.skillName && s.injectionPoint && typeof s.priority === 'number') {
      validCount++;
    } else {
      issues.push(`Incomplete skill: ${s.skillSlug || 'unnamed'}`);
    }
  }

  const ratio = validCount / skills.length;
  const passed = ratio === 1 && skills.length >= 1;
  const score = Math.round(ratio * 100);

  return {
    checkId: 'skill-compatibility-verified',
    stage: 3,
    passed,
    score,
    message: passed
      ? `All ${skills.length} skills properly documented`
      : `${issues.length} skill(s) have documentation issues`,
    evidence: issues.length > 0
      ? issues.slice(0, 3).join('; ')
      : `Skills: ${skills.map((s) => s.skillSlug).join(', ')}`,
  };
};

// ---------------------------------------------------------------------------
// Check 8: no-regulatory-violations
// ---------------------------------------------------------------------------
const checkNoRegulatoryViolations: CheckFn = (role) => {
  const flags = role.auditMetadata?.regulatoryFlags || [];
  const prompt = role.systemPrompt || '';

  // Check if regulatory areas mentioned in flags are addressed in the prompt
  const unaddressed: string[] = [];
  for (const flag of flags) {
    const flagLower = flag.toLowerCase();
    if (!prompt.toLowerCase().includes(flagLower)) {
      // Check if at least a related term is present
      const related = flagLower.split(/\s+/);
      const hasRelated = related.some((w) =>
        w.length > 3 && prompt.toLowerCase().includes(w)
      );
      if (!hasRelated) {
        unaddressed.push(flag);
      }
    }
  }

  // Check for common regulatory issues
  const regulatoryChecks = [
    {
      category: 'health-wellness' as const,
      required: /\b(?:medical|health|nhs|gp|doctor|disclaim)\b/i,
    },
    {
      category: 'legal-financial' as const,
      required: /\b(?:legal|financial|fca|sra|regulated|disclaim)\b/i,
    },
    {
      category: 'childrens' as const,
      required: /\b(?:safeguard|child|parent|guardian|age)\b/i,
    },
  ];

  let categoryIssue = false;
  for (const rc of regulatoryChecks) {
    if (role.category === rc.category && !rc.required.test(prompt)) {
      categoryIssue = true;
    }
  }

  const passed = unaddressed.length === 0 && !categoryIssue;
  const score = passed
    ? 100
    : Math.max(0, 100 - unaddressed.length * 20 - (categoryIssue ? 30 : 0));

  return {
    checkId: 'no-regulatory-violations',
    stage: 3,
    passed,
    score,
    message: passed
      ? 'No regulatory violations detected'
      : `Regulatory concerns: ${unaddressed.length} unaddressed flag(s)${categoryIssue ? ', category-specific requirements missing' : ''}`,
    evidence: unaddressed.length > 0
      ? `Unaddressed: ${unaddressed.join(', ')}`
      : `Regulatory flags: ${flags.length}, all addressed`,
  };
};

// ---------------------------------------------------------------------------
// Check 9: children-safety-if-applicable
// ---------------------------------------------------------------------------
const checkChildrenSafety: CheckFn = (role) => {
  const isChildrenCategory = role.category === 'childrens';
  const hasChildSafetyFlag = role.auditMetadata?.childSafetyRequired === true;
  const needsSafety = isChildrenCategory || hasChildSafetyFlag;

  if (!needsSafety) {
    return {
      checkId: 'children-safety-if-applicable',
      stage: 3,
      passed: true,
      score: 100,
      message: 'Not a children-targeted role - documentation check passed',
      evidence: `category: "${role.category}"`,
    };
  }

  // For children roles, check documentation quality
  const description = role.description || '';
  const targetUser = role.targetUser || '';
  const mentionsChildren =
    /\b(?:child|children|kid|young|student|pupil|teen|adolescent)\b/i.test(description) ||
    /\b(?:child|children|kid|young|student|pupil|teen|adolescent)\b/i.test(targetUser);
  const mentionsSafety =
    /\b(?:safe|safeguard|protect|appropriate|guardian|parent)\b/i.test(description);
  const hasAgeGuidance =
    /\b(?:age|year|ks[1-4]|key stage|gcse|a-level|primary|secondary)\b/i.test(
      description + ' ' + targetUser
    );

  const criteria = [mentionsChildren, mentionsSafety, hasAgeGuidance];
  const metCount = criteria.filter(Boolean).length;
  const passed = metCount >= 2;
  const score = Math.round((metCount / 3) * 100);

  return {
    checkId: 'children-safety-if-applicable',
    stage: 3,
    passed,
    score,
    message: passed
      ? `Children safety documentation adequate (${metCount}/3 criteria)`
      : `Children safety documentation insufficient (${metCount}/3 criteria)`,
    evidence: `Children mentioned: ${mentionsChildren}, safety mentioned: ${mentionsSafety}, age guidance: ${hasAgeGuidance}`,
  };
};

// ---------------------------------------------------------------------------
// Check 10: audit-packet-complete
// Verify the audit metadata itself is complete
// ---------------------------------------------------------------------------
const checkAuditPacketComplete: CheckFn = (role) => {
  const meta = role.auditMetadata;
  if (!meta) {
    return {
      checkId: 'audit-packet-complete',
      stage: 3,
      passed: false,
      score: 0,
      message: 'auditMetadata is missing entirely',
      evidence: 'No auditMetadata object found',
    };
  }

  const issues: string[] = [];
  if (!meta.submittedBy) issues.push('submittedBy missing');
  if (!meta.domainExpertRequired) issues.push('domainExpertRequired missing');
  if (typeof meta.childSafetyRequired !== 'boolean')
    issues.push('childSafetyRequired not a boolean');
  if (!Array.isArray(meta.regulatoryFlags)) issues.push('regulatoryFlags not an array');
  if (!meta.expectedBadge) issues.push('expectedBadge missing');
  if (typeof meta.researchCompleted !== 'boolean')
    issues.push('researchCompleted not set');
  if (typeof meta.knowledgeVerified !== 'boolean')
    issues.push('knowledgeVerified not set');
  if (meta.researchCompleted !== true)
    issues.push('researchCompleted is false - research must be completed');
  if (meta.knowledgeVerified !== true)
    issues.push('knowledgeVerified is false - knowledge must be verified');

  const passed = issues.length === 0;
  const score = passed ? 100 : Math.max(0, 100 - issues.length * 12);

  return {
    checkId: 'audit-packet-complete',
    stage: 3,
    passed,
    score,
    message: passed
      ? 'Audit metadata complete and verified'
      : `Audit metadata issues: ${issues.length} problem(s)`,
    evidence: passed
      ? `submittedBy: ${meta.submittedBy}, expectedBadge: ${meta.expectedBadge}`
      : issues.slice(0, 4).join('; '),
  };
};

// ---------------------------------------------------------------------------
// Exported: All Stage 3 checks
// ---------------------------------------------------------------------------
export const stage3Checks: CheckFn[] = [
  checkCapabilityClaimsVerifiable,
  checkLimitationClaimsHonest,
  checkHardLimitsTestable,
  checkEscalationTriggersSpecific,
  checkTargetUserDefined,
  checkPriceJustification,
  checkSkillCompatibility,
  checkNoRegulatoryViolations,
  checkChildrenSafety,
  checkAuditPacketComplete,
];

/** Run all Stage 3 checks against a role definition */
export function runStage3(role: RoleDefinition): CheckResult[] {
  return stage3Checks.map((check) => check(role));
}
