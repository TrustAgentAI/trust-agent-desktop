# FRONTEND GAP REPORT
Generated: 2026-03-30T15:35:00Z
Auditor: Claude Opus 4.6 (automated self-audit per FRONTEND-SELF-AUDIT-BUILD.md)

---

## ROUTES THAT EXIST

| Route | Component | Has API Calls | Has Loading State | Has Error State | Has Empty State |
|-------|-----------|:---:|:---:|:---:|:---:|
| `/` | DashboardPage | NO (reads from localStorage agentStore) | NO | Partial | YES (ghost cards) |
| `/marketplace` | MarketplacePanel | YES (roles via data/roles) | Partial | Partial | NO |
| `/permissions` | PermissionManager | NO | NO | NO | NO |
| `/audit` | AuditLog | NO (reads from auditStore) | NO | NO | NO |
| `/audit/:roleId` | AuditDetailPage | YES (api.get audit) | NO | NO | NO |
| `/settings` | SettingsPage | Partial (auth store) | NO | Partial | NO |
| `/study` | StudyGroupList | YES | YES | YES | YES |
| `/study/:groupId` | StudyGroupDetail | YES | YES | YES | YES |
| `/study/:groupId/session/:sessionId` | SharedSessionView | YES | YES | YES | NO |
| `/guardian` | GuardianDashboardPage | YES | YES | YES | YES |
| `/safeguarding` | SafeguardingDashboardPage | YES | YES | YES | YES |
| `/impact` | ImpactPage | YES | YES | YES | NO |
| `/admin/follow-ups` | HumanFollowUpQueue | YES | YES | YES | YES |
| `/brain/:hireId` | BrainJournalPage | YES (via BrainJournal) | YES | YES | YES |

**Total existing routes: 14**

---

## ROUTES MISSING (linked or required but no page)

### Pages that exist as files but have NO route in App.tsx:
| Missing Route | Page File Exists | Status |
|---------------|:---:|--------|
| `/billing` | YES (BillingPage.tsx) | File exists, not routed |
| `/checkout/:plan` | YES (CheckoutPage.tsx) | File exists, not routed |
| `/nhs` | YES (NHSPage.tsx) | File exists, not routed |

### Pages referenced in links/navigation but do not exist at all:
| Missing Route | Required By Spec | Priority |
|---------------|:---:|--------|
| `/companions` (public marketplace) | YES | HIGH |
| `/companions/[slug]` (role detail page) | YES | HIGH |
| `/onboarding` (standalone page - currently inline gate) | YES | MEDIUM |
| `/dashboard/brain` (brain journal as dashboard sub-page) | YES | MEDIUM |
| `/dashboard/reports` (progress reports) | YES | MEDIUM |
| `/dashboard/schedule` (weekly scheduling grid) | YES | MEDIUM |
| `/dashboard/review` (spaced repetition review) | YES | MEDIUM |
| `/dashboard/groups` (study groups from dashboard) | YES | MEDIUM |
| `/dashboard/notifications` (notification centre) | YES | MEDIUM |
| `/dashboard/guardian` (guardian from dashboard) | YES | MEDIUM |
| `/dashboard/referrals` (referral programme) | YES | MEDIUM |
| `/dashboard/shares` (progress sharing management) | YES | MEDIUM |
| `/checkout/success` (checkout success) | YES | HIGH |
| `/gift` (gift purchase) | YES | MEDIUM |
| `/gift/activate/:code` (gift activation) | YES | MEDIUM |
| `/pricing` (standalone pricing page) | YES | HIGH |
| `/schools` (schools/institutional page) | YES | MEDIUM |
| `/creator` (creator programme page) | YES | MEDIUM |
| `/hardware` (hardware overview) | YES | LOW |
| `/hardware/trustbox` (TrustBox Pro) | YES | LOW |
| `/hardware/truststick` (TrustStick) | YES | LOW |
| `/hardware/trustedge` (TrustEdge) | YES | LOW |
| `/progress/:shareToken` (public progress share) | YES | MEDIUM |
| `/settings/billing` (billing settings sub-page) | YES | HIGH |
| `/settings/voice` (voice/personality config) | YES | MEDIUM |
| `/settings/accessibility` (accessibility panel) | YES | MEDIUM |
| `/settings/notifications` (notification prefs) | YES | MEDIUM |
| `/settings/privacy` (privacy/data/deletion) | YES | MEDIUM |
| `/settings/profile` (profile editing) | YES | MEDIUM |
| `/auth/signin` (dedicated sign-in page) | YES | HIGH |
| `/auth/signup` (dedicated sign-up page) | YES | HIGH |
| `/admin` (admin overview) | YES | HIGH |
| `/admin/users` (user management) | YES | HIGH |
| `/admin/roles` (role management) | YES | HIGH |
| `/admin/pricing` (pricing tier management) | YES | HIGH |
| `/admin/system` (system health) | YES | MEDIUM |
| `/admin/safeguarding` (safeguarding events) | YES | MEDIUM |
| `/admin/impact` (onboarding funnel) | YES | MEDIUM |
| `/admin/flags` (feature flags) | YES | LOW |
| `/admin/nhs` (NHS partner management) | YES | MEDIUM |
| `/admin/creator` (creator applications) | YES | MEDIUM |
| `/admin/reaudit` (re-audit triggers) | YES | MEDIUM |
| `/b2b` (B2B role catalogue) | YES | MEDIUM |
| `/b2b/api-keys` (API key management) | YES | LOW |
| `/b2b/admin` (enterprise admin dashboard) | YES | LOW |

**Total routes missing: 45**

---

## tRPC PROCEDURES WITH NO FRONTEND

These procedures exist in server routers but are never called from any frontend component:

| Router | Procedure | Frontend Calls |
|--------|-----------|:-:|
| payments | createCheckout | 0 |
| payments | getSubscription | 0 |
| payments | cancelSubscription | 0 |
| payments | topUpCredits | 0 |
| payments | listPayments | 0 |
| gifts | purchaseGift | 0 |
| gifts | activateGift | 0 |
| gifts | getMyGifts | 0 |
| referrals | getMyReferralCode | 0 |
| referrals | getMyReferrals | 0 |
| referrals | redeemCode | 0 |
| school | getLeaderboard | 0 |
| school | createLicence | 0 |
| school | enrolStudent | 0 |
| school | checkStudentAccess | 0 |
| school | getEnrolments | 0 |
| school | getLicenceStatus | 0 |
| stories | getFeatured | 0 |
| stories | submitStory | 0 |
| stories | getForAudience | 0 |
| stories | getUnverified | 0 |
| stories | verifyStory | 0 |
| admin | listUsers | 0 |
| admin | listRoles | 0 |
| admin | getPricingTiers | 0 |
| admin | updatePricingTier | 0 |
| admin | togglePricingTier | 0 |
| admin | systemHealth | 0 |
| admin | getOnboardingFunnel | 0 |
| admin | toggleRoleActive | 0 |
| admin | updateRole | 0 |
| admin | listAudits | 0 |
| creator | applyToBeCreator | 0 |
| creator | getCreatorStories | 0 |
| creator | approveCreatorStory | 0 |
| progressSharing | getMyShares | 0 |
| onboarding | trackOnboardingCheckpoint | 0 |
| onboarding | getQuizResult | 0 |
| notifications | registerPushSubscription | 0 |
| brain | generateSummary | 0 |
| impact | liveMetrics | 0 |
| impact | adminReport | 0 |
| scheduling | generateICS | 0 |
| scheduling | deleteSchedule | 0 |
| scheduling | toggleSchedule | 0 |
| reports | listReports | 0 |
| hires | listMyHires | 0 |
| hires | cancelHire | 0 |
| hires | updateNickname | 0 |
| roles | listPublished | 0 |
| roles | search | 0 |
| roles | getCategories | 0 |
| roles | getFeatured | 0 |
| roles | getBySlug | 0 |
| enterprise | createEnterprise | 0 |
| enterprise | getCompanyBrain | 0 |
| enterprise | updateCompanyBrain | 0 |
| enterprise | addSeat | 0 |
| enterprise | removeSeat | 0 |
| enterprise | addHITLRule | 0 |
| collaboration | startCollaboration | 0 |
| collaboration | endCollaboration | 0 |
| collaboration | getActiveCollaborations | 0 |
| collaboration | sendMessage | 0 |
| nhs | verifyPracticePartner | 0 |
| nhs | getNHSPartnerStats | 0 |
| nhs | addPartnerPractice | 0 |
| nhs | updatePartnerCompliance | 0 |
| pricing | getTiers | 0 |
| featureFlags | getAll | 0 |
| featureFlags | update | 0 |
| featureFlags | check | 0 |
| offlineBrain | getAllBrainSummaries | 0 |
| offlineBrain | syncOfflineActions | 0 |
| system | getErrorMessage | 0 |
| system | getHealth | 0 |
| auth | updateProfile | 0 |
| auth | deleteAccount | 0 |

**Total unwired tRPC procedures: 78**

---

## COMPONENTS WITH FAKE/HARDCODED DATA

### Components using mock agent responses instead of real API:
| Component | Issue |
|-----------|-------|
| `src/components/agent/ChatWindow.tsx` | Uses `getMockResponse()` instead of real agent API |
| `src/components/session/SessionView.tsx` | Uses `getMockResponse()` (3 occurrences) instead of real session API |
| `src/hooks/useAgent.ts` | Uses `getMockResponse()` instead of real agent API |

### Stores persisting to localStorage instead of syncing with API:
| Store | Issue |
|-------|-------|
| `src/store/agentStore.ts` | Hired roles stored in localStorage, not fetched from `hires.listMyHires` |
| `src/store/guardianStore.ts` | Guardian data in localStorage, not from `guardian.getLinkedChildren` |
| `src/store/scheduleStore.ts` | Schedules in localStorage, not from `scheduling.getMySchedules` |
| `src/store/spacedRepetitionStore.ts` | SR items in localStorage, not from `spaced-repetition.getDueItems` |
| `src/store/streaksStore.ts` | Streaks in localStorage, not from `milestones.getMilestones` |
| `src/store/settingsStore.ts` | Settings in localStorage, not from API |
| `src/store/permissionStore.ts` | Permissions in localStorage, not from API |

### DashboardPage data source:
| Component | Issue |
|-----------|-------|
| `src/pages/DashboardPage.tsx` | Reads roles from `agentStore` (localStorage), not `hires.listMyHires` tRPC |
| `src/pages/DashboardPage.tsx` | Reads audit events from `auditStore` (localStorage), not API |
| `src/pages/DashboardPage.tsx` | No API calls at all - zero real data |

**Total fake data components: 13**

---

## DESIGN SYSTEM GAPS

### Conflicting design tokens:
- `src/styles/globals.css` defines a DARK NAVY colour system (`--color-dark-navy: #0A1628`, `--color-electric-blue: #1E6FFF`, etc.)
- `src/styles/tokens.css` defines the WARM STONE colour system (`--bg-page: #FAFAF8`, `--primary-600: #1A5276`, etc.)
- **These two systems conflict.** The globals.css dark theme is what the app actually uses. The tokens.css warm stone system is defined but components do not use it.

### Font conflicts:
- `index.html` loads: Manrope, DM Sans, Instrument Serif, JetBrains Mono
- `globals.css` declares: `--font-sans: 'Manrope'` (not DM Sans as spec requires)
- `tokens.css` declares: `--font-sans: 'DM Sans'`, `--font-serif: 'Instrument Serif'`
- **Components use `var(--font-sans)` which resolves to Manrope (globals.css wins), not DM Sans**

### Hardcoded colours:
- **298 hardcoded colour instances** found across all frontend components
- Most common: `color: '#E8EDF5'` (used ~150+ times as text colour)
- Also frequent: `#F59E0B`, `#FF6B6B`, `#1E6FFF`, `#C8D0DC`, `#22c55e`, `#ef4444`
- None of these use CSS variables from either tokens.css or globals.css

### No Tailwind:
- No `tailwind.config.js` or `tailwind.config.ts` exists
- Spec mentions Tailwind but app uses inline styles throughout
- Some components use Tailwind-style classes (e.g., `className="w-full bg-white/[0.05]"`) but these only work because some utility CSS exists

### Missing CSS variable usage:
- Category colours defined in tokens.css (`--cat-education`, `--cat-health`, etc.) are NOT used by any component
- Warm Stone shadow variables NOT used by any component
- Warm Stone radius variables partially used

### Component library:
- Lucide React icons used throughout (good)
- No shadcn/ui, Radix, or Headless UI detected
- Custom UI primitives exist: Button, Card, Badge, Input, Toast, Skeleton, EmptyState, CodeBlock

---

## i18n GAPS

### Current locale files (7 of 33 target):
- en.json (English)
- ar.json (Arabic)
- de.json (German)
- es.json (Spanish)
- fr.json (French)
- ja.json (Japanese)
- zh.json (Chinese)

### Missing locale files (26 of 33):
bg, bn, cs, cy, da, el, fa, fi, gu, he, hi, hu, id, it, ko, nl, no, pa, pl, pt, ro, ru, sv, th, tr, ur

### RTL support:
- Arabic (ar) file exists but RTL rendering untested
- Hebrew (he), Farsi (fa), Urdu (ur) files missing entirely

---

## WHITEPAPER SPEC GAPS (1J)

### Consumer features - status:
| Feature | Status |
|---------|--------|
| Homepage with quote-first hero | MISSING - current homepage is a dashboard, no public homepage |
| Marketplace: 179+ roles, search, filter | PARTIAL - MarketplacePanel exists but uses local data, not `roles.listPublished` |
| Role detail: trust score, 47 checks, reviews | PARTIAL - AuditDetailView exists, RoleDetail exists, but routing incomplete |
| Onboarding quiz: 8 questions | EXISTS - OnboardingQuiz.tsx wired, but uses `submitQuiz` not `trackOnboardingCheckpoint` |
| Session screen: memory-first | PARTIAL - SessionView exists but uses mock responses, not real agent API |
| Dashboard: companion cards, Brain preview | PARTIAL - exists but data from localStorage, not API |
| Brain journal: dated entries | EXISTS - BrainJournal.tsx with real API calls |
| Guardian dashboard | EXISTS - GuardianDashboardPage with real API calls |
| Spaced repetition review | PARTIAL - SpacedRepetitionReview component exists, no dedicated route |
| Scheduling: weekly grid, .ics | PARTIAL - SessionScheduler exists, `generateICS` not wired |
| Progress reports: PDF | PARTIAL - ProgressReport exists, `listReports` not wired |
| Study groups | EXISTS - full CRUD with routes |
| Notifications: centre, push | PARTIAL - NotificationCenter exists, `registerPushSubscription` not wired |
| Stripe billing | MISSING - BillingPage.tsx exists but not routed |
| Gift subscriptions | MISSING - no frontend at all |
| Referral programme | MISSING - no frontend at all |
| Progress sharing: public link | PARTIAL - SharedProgressView exists, no public route |
| NHS pathway page | MISSING - NHSPage.tsx exists but not routed, `verifyPracticePartner` not wired |
| Schools page | MISSING - no page exists |
| Creator programme | MISSING - no page exists |
| Hardware pages | MISSING - no pages exist |
| Impact/mission metrics | PARTIAL - ImpactPage exists but `liveMetrics` not wired |
| Settings pages | PARTIAL - single SettingsPage, no sub-pages for voice/accessibility/notifications/privacy |
| Admin panel | MISSING - only HumanFollowUpQueue exists, no admin overview/users/roles/pricing/system |
| Error states: human messages | MISSING - `system.getErrorMessage` never called |
| Empty states: ghost cards | PARTIAL - EmptyState/GhostCard components exist but not used on most pages |
| Google OAuth | PARTIAL - `loginWithGoogle()` function exists in auth.ts, button exists in LoginPage, but no server-side NextAuth/Google provider |
| i18n: 26 of 33 missing | 26 MISSING |

### B2B features - status:
| Feature | Status |
|---------|--------|
| B2B role catalogue with Company Brain | MISSING - no page, enterprise router exists but unwired |
| API key management page | MISSING - no page |
| Enterprise admin dashboard | MISSING - no page |

---

## SUMMARY

```
METRIC                          COUNT
------------------------------------
Routes that exist:                 14
Routes missing:                    45
tRPC procedures unwired:           78
Fake data components:              13
Hardcoded colour instances:       298
Design system conflicts:            2  (globals.css vs tokens.css, Manrope vs DM Sans)
Pages with NO loading state:        5  (of 8 page files)
Pages with NO error state:          3  (of 8 page files)
Pages with NO empty state:          5  (of 8 page files)
Stores using localStorage:          7  (should sync with API)
Mock agent responses:               3  (components using getMockResponse)
i18n files existing:                7
i18n files missing:                26
Prisma models with no router:      54
Prisma models backend-only:        11
Unrouted page files:                3  (BillingPage, CheckoutPage, NHSPage exist but no route)
------------------------------------
TOTAL WORK ITEMS:                 459
```

---

## CRITICAL PATH (highest impact gaps)

1. **DashboardPage has zero API calls** - the main page users see uses only localStorage
2. **78 tRPC procedures have no frontend** - massive backend with no UI
3. **298 hardcoded colours** - design system tokens exist but are ignored
4. **Session/Chat uses mock responses** - core product feature is faked
5. **45 missing routes** - most of the required pages do not exist
6. **No admin panel** - only follow-up queue exists
7. **No billing/checkout flow** - pages exist as files but are unreachable
8. **Font system broken** - globals.css overrides tokens.css, wrong font family used
9. **26 missing i18n files** - only 7 of 33 target locales
10. **3 page files not routed** - BillingPage, CheckoutPage, NHSPage are dead code

---

*Report ends. Do not proceed to building until all items above are accounted for in the build plan.*
