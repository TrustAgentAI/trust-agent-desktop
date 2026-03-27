# Trust Agent — CLAUDE.md
# DEEP RESEARCH · ROLE CREATION · SKILL ASSIGNMENT · AUDIT · MARKETPLACE PUBLISH
# Branch prefix: Unified/
# Drop this file at the root of the trust-agent-desktop repo and run: claude
#
# ════════════════════════════════════════════════════════════════════════════════
# CRITICAL INSTRUCTION — READ BEFORE DOING ANYTHING ELSE
# ════════════════════════════════════════════════════════════════════════════════
#
# You have web search access. USE IT FOR EVERY SINGLE ROLE.
#
# Before writing a single line of code or a single JSON file, you must research
# each role thoroughly using web search. The shelves cannot be empty.
# A GCSE Maths Tutor that cannot answer a question within GCSE Maths scope is
# a broken product. A French Language Tutor that cannot explain the subjunctive
# is a broken product. A Personal Trainer that doesn't know progressive overload
# is a broken product.
#
# YOUR RESEARCH STANDARD FOR EVERY ROLE:
# Search for the actual curriculum, the actual professional standards, the actual
# body of knowledge that a real human expert in that role would possess.
# Then encode ALL of it into the role's system prompt and skill set.
#
# Do not rush. Do not skip research. Do not write placeholder knowledge.
# A role is only complete when someone could genuinely rely on it as an expert.
#
# ════════════════════════════════════════════════════════════════════════════════

---

## PLATFORM CONTEXT

**Trust Agent** is an audited AI role agent marketplace operated by AgentCore LTD
(Company No. 17114811, 20 Wenlock Road, London, England, N1 7GU, trust-agent.ai).

Users hire AI role agents from the marketplace. Those agents run on the user's own
LLM infrastructure. Trust Agent provides the role configuration, the audit layer,
and the distribution platform. The role's system prompt IS the product.
If the system prompt doesn't contain the knowledge, the role is useless.

---

## RESEARCH PROTOCOL — MANDATORY FOR EVERY ROLE

For EACH role in this document, before writing its JSON file, you MUST:

### Step 1 — Research the professional standard
Search for:
- The official curriculum, qualification framework, or professional body standard
  for this role (e.g. AQA GCSE Maths spec, CEFR language framework, CIMSPA
  personal trainer standards, SRA solicitor standards, Michelin chef techniques)
- What a real expert in this role is expected to know and be able to do
- The most common questions, problems, and scenarios a user would bring to this role
- Any UK-specific, EU-specific, or global variants that affect the role's knowledge

### Step 2 — Research the knowledge body
Search for:
- Every topic, subtopic, and concept within the role's scope
- The depth of knowledge required at each level (beginner / intermediate / advanced)
- Common misconceptions, errors, and difficult areas users struggle with
- Current best practices, techniques, and methodologies in this field
- Relevant laws, regulations, standards, or guidelines that the role must know

### Step 3 — Research the gaps
Search for:
- What questions users most commonly ask in this domain
- What a human expert would know that an uninformed AI would typically get wrong
- Edge cases, regional variations, and nuanced scenarios
- Any recent changes to curriculum, legislation, or professional standards

### Step 4 — Write the system prompt
Only after completing Steps 1-3, write the system prompt. It must:
- Enumerate every topic area the role covers with the actual subtopics listed
- Include specific knowledge (e.g. actual GCSE Maths topics: surds, completing the
  square, trigonometric identities — not just "maths")
- Include the teaching/practice methodology appropriate to the role
- Include hard limits and escalation triggers based on real professional standards
- Be long enough that a real expert in this field would recognise it as accurate

**Minimum system prompt length: 1,500 characters. Target: 3,000-8,000 characters.**
A short system prompt means insufficient knowledge was encoded. Reject it and redo.

---

## TECH STACK REFERENCE

```
Database:    Neon PostgreSQL via Prisma ORM
API:         tRPC routers (src/server/routers/)
Queue:       BullMQ + Redis (Upstash)
Storage:     AWS S3 eu-west-2
             Buckets: trust-agent-assets | trust-agent-private | trust-agent-public
Auth:        NextAuth.js v5 + JWT
Frontend:    Next.js 14 App Router
Role data:   src/data/roles/{slug}.json
Skill data:  src/data/skills/{slug}.json
Audit:       src/server/audit/pipeline.ts
```

---

## ROLE DATA SCHEMA

```typescript
interface RoleDefinition {
  slug: string;
  name: string;
  category: RoleCategory;
  subcategory: string;
  tagline: string;
  description: string;          // 150+ words. What this role does and why it matters.
  targetUser: string;
  priceMonthly: number;         // GBP pence
  systemPrompt: string;         // THE KNOWLEDGE BASE. 1,500-8,000 chars minimum.
  capabilities: string[];       // Minimum 8. Specific, testable claims.
  limitations: string[];        // Minimum 4. Honest about what it cannot do.
  hardLimits: string[];         // Minimum 3. Non-negotiable refusals.
  escalationTriggers: string[]; // Minimum 3. When to refer to a human expert.
  skills: SkillAssignment[];
  knowledgeSources: string[];   // URLs/refs researched when building this role
  auditMetadata: AuditMetadata;
  tags: string[];
  searchKeywords: string[];
  languageCode?: string;
  languageName?: string;
}

type RoleCategory =
  | 'education'
  | 'health-wellness'
  | 'elderly-care'
  | 'food-lifestyle'
  | 'legal-financial'
  | 'creative-professional'
  | 'childrens'
  | 'enterprise';

interface SkillAssignment {
  skillSlug: string;
  skillName: string;
  injectionPoint: 'system' | 'context' | 'tools';
  priority: number;
}

interface AuditMetadata {
  submittedBy: 'trust-agent-internal';
  domainExpertRequired: string;
  childSafetyRequired: boolean;
  regulatoryFlags: string[];
  expectedBadge: 'PLATINUM' | 'GOLD' | 'SILVER';
  researchCompleted: boolean;   // Must be true — set after web research done
  knowledgeVerified: boolean;   // Must be true — set after self-review
}
```

---

## SKILL SCHEMA

```typescript
interface SkillDefinition {
  slug: string;
  name: string;
  description: string;
  systemFragment: string;  // Injected into role context. Must contain real knowledge.
  compatibleRoles: string[];
  incompatibleRoles: string[];
  stakeRequired: number;
}
```

---

## THE 47-CHECK AUDIT PIPELINE

Located at `src/server/audit/pipeline.ts`. Create if it doesn't exist.

### Stage 1 — Configuration Validation (15 checks)
```
system-prompt-present | system-prompt-min-length (1500 chars) | system-prompt-max-length
name-present | tagline-present (≤120 chars) | description-present (≥150 words)
capabilities-listed (≥8) | limitations-listed (≥4) | hard-limits-present (≥3)
escalation-triggers-present (≥3) | no-placeholder-text | no-competitor-mentions
price-valid | slug-format | category-valid | skill-compatibility-verified
children-safety-if-applicable | knowledge-sources-present (≥3 sources cited)
```

### Stage 2 — Behavioural Testing (22 checks, LLM evaluation)
```
consistency-response-variance | consistency-persona-stability
consistency-format-stability | consistency-boundary-stability | consistency-tone-stability
refusal-medical-diagnosis | refusal-legal-advice | refusal-financial-advice
refusal-harm-facilitation | refusal-identity-impersonation | refusal-scope-violation
domain-knowledge-depth | domain-knowledge-accuracy | domain-knowledge-currency
domain-knowledge-nuance | domain-knowledge-limits
escalation-safety-trigger | escalation-medical-trigger
escalation-legal-trigger | escalation-mental-health-trigger
persona-appropriate-for-audience | no-harmful-content-generation
```

### Stage 3 — Documentation Quality (10 checks)
```
capability-claims-verifiable | limitation-claims-honest | hard-limits-testable
escalation-triggers-specific | target-user-defined | price-justification-reasonable
skill-compatibility-verified | no-regulatory-violations
children-safety-if-applicable | audit-packet-complete
```

### Trust Score & Badge
```
Stage 1: 25% weight | Stage 2: 30% weight | Stage 3: 30% weight
Community signal: 10% (starts 75) | Version history: 5% (starts 0)

PLATINUM ≥ 90 | GOLD ≥ 75 | SILVER ≥ 60 | BASIC ≥ 40 | REJECTED < 40
```

---

## PHASE 1 — RESEARCH AND CREATE SKILL MODULES

Create `src/data/skills/`. For each skill below, research the actual knowledge
domain before writing the systemFragment.

### SKILL: adaptive-learning
Research: Learning science, spaced repetition, deliberate practice theory, Bloom's
taxonomy, formative assessment best practices.
The systemFragment must encode actual pedagogical techniques, not just say
"track progress." It must explain HOW to adapt — what signals to look for,
what adjustments to make, at what thresholds.

### SKILL: memory-persistence
Research: How expert tutors and coaches use session continuity. What information
matters to remember. How to reference history naturally without being robotic.

### SKILL: progress-tracking
Research: How professional tutors and coaches measure progress. What metrics matter
in education (confidence, accuracy, speed, depth). How to give honest, motivating
progress summaries.

### SKILL: exam-prep
Research: AQA, Edexcel, OCR, WJEC exam formats. Mark scheme logic. Command words
and what examiners expect. Common reasons students lose marks. Past paper technique.
THIS SKILL MUST CONTAIN ACTUAL EXAMINER GUIDANCE.

### SKILL: safeguarding
Research: UK Children Act 1989, Working Together to Safeguard Children (2023),
KCSIE (Keeping Children Safe in Education) 2024 guidance, Childline resources,
NSPCC guidance. The systemFragment must reflect actual UK safeguarding law and
procedure — not generic "be careful with children."

### SKILL: crisis-escalation
Research: Samaritans guidance for conversations about suicide, Zero Suicide Alliance
training principles, ALGEE mental health first aid framework, NHS crisis pathways,
Crisis Text Line (SHOUT 85258). The systemFragment must contain the actual resources
and the actual response framework from evidence-based crisis support.

### SKILL: medical-disclaimer
Research: UK GMC guidance on medical information services, NHS choices framework,
ASA (Advertising Standards Authority) rules on health claims, CQC (Care Quality
Commission) standards for health information. Must reflect actual UK regulatory
requirements for health information services.

### SKILL: legal-disclaimer
Research: SRA (Solicitors Regulation Authority) guidance, Legal Services Act 2007
scope of regulated legal activity, Citizens Advice framework for legal information
vs advice, Law Society guidance on unbundled legal services. Must reflect actual
UK regulatory requirements.

### SKILL: financial-disclaimer
Research: FCA (Financial Conduct Authority) guidance on financial promotions,
COBS (Conduct of Business Sourcebook) rules, MoneyHelper (formerly MAS) framework,
distinction between financial information and regulated financial advice under
FSMA 2000. Must reflect actual FCA requirements.

### SKILL: voice-optimised
Research: Best practices for TTS (text-to-speech) script writing, natural language
processing for voice interfaces, SSML (Speech Synthesis Markup Language) principles,
conversational AI voice design patterns.

### SKILL: conversational-memory
Research: How therapists, coaches, and expert tutors maintain rapport and continuity.
Active listening techniques. How to reference prior context naturally. What details
to prioritise remembering.

### SKILL: step-by-step-guidance
Research: Scaffolded instruction theory, worked example effect in cognitive load
theory, ZPD (Zone of Proximal Development), instructional design for procedural
knowledge. Encode actual pedagogical techniques.

### SKILL: socratic-method
Research: Socratic questioning theory and practice, Bloom's taxonomy question types,
guided discovery learning, Vygotsky's scaffolding, how master teachers use questions
to promote understanding. Must include actual question types and when to use each.

### SKILL: emotional-support
Research: Motivational interviewing principles, growth mindset theory (Dweck),
self-determination theory, trauma-informed approaches in education, how expert
tutors and coaches manage frustration, anxiety, and disengagement.

### SKILL: multimodal-description
Research: How professional chefs, personal trainers, and craftspeople describe
physical technique to remote learners. Sensory description techniques. How to
convey visual and tactile information through voice only.

---

## PHASE 2 — RESEARCH AND CREATE ALL ROLE DEFINITIONS

**For every role below, execute the research protocol (Steps 1-4) using web search
before writing the JSON file. Record the URLs you researched in knowledgeSources[].**

The instructions below tell you what to research. They do not tell you what to write.
What you write must come from the research.

---

### EDUCATION ROLES — RESEARCH AND BUILD

#### ROLE: gcse-maths-tutor
**Research instructions:**
- Search: "AQA GCSE Maths specification 2024 full syllabus"
- Search: "Edexcel GCSE Mathematics specification topics list"
- Search: "OCR GCSE Maths J560 specification content"
- Search: "GCSE Maths common mistakes examiners report"
- Search: "GCSE Maths Foundation vs Higher tier content differences"
- Search: "Ofqual GCSE Mathematics subject level conditions"

**The system prompt must cover with full topic depth:**
NUMBER: integers, decimals, fractions, percentages, ratio and proportion,
  standard form, surds, indices, bounds, HCF and LCM, prime factorisation,
  product rule for counting
ALGEBRA: simplifying and manipulating expressions, expanding and factorising
  (including difference of two squares, completing the square), solving linear
  equations and inequalities, solving quadratics (factorising, formula,
  completing the square), simultaneous equations (elimination, substitution,
  graphically), sequences (arithmetic, geometric, nth term), functions and
  function notation, graph transformations (translations, reflections, stretches),
  algebraic proof, iteration
RATIO/PROPORTION: direct and inverse proportion, speed/distance/time,
  density/mass/volume, pressure/force/area, percentage change, reverse percentage,
  compound interest, depreciation, best buy problems
GEOMETRY AND MEASURE: angle rules (parallel lines, polygons, circles),
  triangle congruence and similarity, Pythagoras theorem (2D and 3D),
  trigonometry (SOHCAHTOA, sine rule, cosine rule, area formula),
  circle theorems (all 8), vectors (addition, scalar multiplication, proof),
  transformations (reflection, rotation, translation, enlargement including
  fractional and negative scale factors), loci and constructions,
  perimeter/area/volume of all standard shapes including spheres/cones/pyramids,
  surface area, arc length and sector area, bearings
PROBABILITY: theoretical and experimental probability, relative frequency,
  expected outcomes, tree diagrams, Venn diagrams, AND/OR rules, conditional
  probability, frequency trees, sample space diagrams
STATISTICS: types of data, sampling methods, averages (mean/median/mode/range
  for listed and grouped data), histograms with unequal class widths, cumulative
  frequency graphs, box plots, scatter graphs and correlation, time series,
  comparison of data sets

The system prompt must also encode:
- How to identify which exam board from the student's first message
- How to distinguish Foundation from Higher and adjust accordingly
- Mark scheme logic: method marks vs accuracy marks vs communication marks
- The most common algebraic errors (e.g. expanding (a+b)² incorrectly)
- How to use the grade boundaries to set realistic targets
- Specific techniques for each question type (show that, prove, hence)

**Skills:** adaptive-learning, memory-persistence, progress-tracking, exam-prep,
  voice-optimised, conversational-memory, socratic-method, emotional-support
**Expected badge:** PLATINUM
**Price:** £1200/month

---

#### ROLE: gcse-science-tutor
**Research:**
- Search: "AQA GCSE Combined Science Trilogy specification 2024"
- Search: "GCSE Biology Chemistry Physics required practicals list"
- Search: "GCSE Science Triple Award vs Combined Science differences"
- Search: "Edexcel GCSE Sciences specification content"
- Search: "AQA GCSE Science examiner report common errors"

**The system prompt must cover with full topic depth for all three sciences:**

BIOLOGY: Cell biology (cell structure, transport — diffusion/osmosis/active
  transport, microscopy, cell division — mitosis/meiosis), Organisation (levels
  of organisation, digestive system enzymes, blood and circulatory system,
  coronary heart disease, cancer, plant organisation, transpiration, translocation),
  Infection and Response (communicable diseases, immune system, vaccines,
  antibiotics, drug development), Bioenergetics (photosynthesis — light-dependent
  and light-independent reactions, respiration — aerobic and anaerobic, metabolism),
  Homeostasis and Response (nervous system, hormones, diabetes, menstrual cycle,
  contraception, plant hormones), Inheritance/Variation/Evolution (DNA structure,
  protein synthesis, genetic inheritance, Punnett squares, mutation, natural
  selection, speciation, classification), Ecology (food chains, decomposers,
  carbon cycle, nitrogen cycle, biodiversity, ecosystems, human impact)

CHEMISTRY: Atomic structure and the Periodic Table (atomic model history,
  electronic configuration, isotopes, groups and periods, metals and non-metals),
  Bonding/Structure/Properties (ionic, covalent, metallic bonding, giant
  structures vs simple molecules, nanoparticles), Quantitative Chemistry
  (moles, Mr, Ar, concentration, yield, atom economy, titration calculations),
  Chemical Changes (reactivity series, displacement, extraction of metals,
  acids and bases, salt preparation, electrolysis), Energy Changes (exo/endothermic,
  activation energy, bond energies, reaction profiles), Rates/Equilibrium
  (factors affecting rate, collision theory, reversible reactions, Le Chatelier),
  Organic Chemistry (alkanes, alkenes, addition polymers, condensation polymers,
  carboxylic acids, alcohols, esters, crude oil, cracking), Chemical Analysis
  (pure substances, formulations, chromatography, gas tests, flame tests, ion tests),
  Atmosphere/Earth (composition, climate change, pollution, carbon footprint),
  Using Resources (finite/renewable, water treatment, life cycle assessment)

PHYSICS: Forces (scalar/vector, resultant force, Newton's Laws, momentum,
  stopping distances, work done, elastic potential energy, Hooke's Law,
  pressure — fluid and atmospheric), Energy (kinetic/potential/thermal/elastic,
  conservation, efficiency, power, energy resources), Waves (transverse/longitudinal,
  properties — speed/frequency/wavelength/amplitude, EM spectrum, reflection/
  refraction/total internal reflection, sound, seismic waves), Electricity
  (circuit symbols, series/parallel circuits, Ohm's Law, I-V characteristics,
  resistance, power, mains supply, National Grid, static), Magnetism (poles,
  field lines, electromagnets, solenoid, motor effect, Fleming's left-hand rule,
  induced EMF, generator, transformers), Particle model (density, changes of
  state, specific heat capacity, specific latent heat, gas pressure/temperature),
  Atomic Structure (radioactive decay — alpha/beta/gamma, nuclear equations,
  half-life, fission, fusion, uses of radiation, safety)

Required practicals for all three sciences must be encoded with the actual method,
variables, and expected results.

**Skills:** adaptive-learning, memory-persistence, progress-tracking, exam-prep,
  voice-optimised, conversational-memory, socratic-method, emotional-support
**Expected badge:** PLATINUM

---

#### ROLE: gcse-english-tutor
**Research:**
- Search: "AQA GCSE English Language 8700 specification assessment objectives"
- Search: "AQA GCSE English Literature 8702 set texts list 2024-2025"
- Search: "Edexcel GCSE English Language specification assessment"
- Search: "GCSE English Language Paper 1 Paper 2 question types mark schemes"
- Search: "GCSE English examiner report most common mistakes"
- Search: "GCSE English Literature An Inspector Calls Macbeth Power and Conflict"

**The system prompt must encode:**
LANGUAGE Paper 1 (Fiction): Q1 (retrieve/list), Q2 (language analysis — AFOREST/
  structural techniques), Q3 (structural features), Q4 (evaluation with textual
  reference), Q5 (narrative/descriptive writing — structure, vocabulary,
  technique)
LANGUAGE Paper 2 (Non-fiction): Q1 (retrieve), Q2 (summary — synthesise and
  infer), Q3 (language analysis of non-fiction), Q4 (comparative analysis),
  Q5 (writing to argue/persuade/advise — rhetoric, structure, register)
Writing assessment: sentence variety, paragraphing, vocabulary choices, punctuation
  for effect, DAFOREST techniques, discourse markers, cyclical structure, narrative
  voice, descriptive writing techniques

LITERATURE — full analysis of common set texts:
An Inspector Calls: Priestley's socialist message, dramatic irony, the Inspector
  as device, each character's arc, structure (one location, one night), 1912 vs
  1945 context
Macbeth: ambition, power, gender, fate vs free will, supernatural, imagery
  (blood, darkness, clothing), soliloquies, key quotes by act and scene,
  historical context (James I, gunpowder plot)
Romeo and Juliet OR A Christmas Carol OR Jekyll and Hyde OR The Sign of Four
  (whichever is most commonly taught) — full thematic and character analysis
Power and Conflict poetry: all 15 poems, key themes, techniques, context for each
  poet, how to compare two poems effectively
Unseen poetry: how to approach an unfamiliar poem, annotation technique, analysis
  of tone/imagery/structure/form

The system prompt must also encode:
- PEA/PEEL/PETER paragraph structures and when each works best
- How to write a comparative essay introduction
- How to embed quotations naturally
- AO1 through AO4 — what each assessment objective requires
- How to write under timed conditions

**Skills:** adaptive-learning, memory-persistence, progress-tracking, exam-prep,
  voice-optimised, conversational-memory, socratic-method, emotional-support
**Expected badge:** PLATINUM

---

#### ROLE: gcse-history-tutor
**Research:**
- Search: "AQA GCSE History specification 8145 options 2024"
- Search: "Edexcel GCSE History specification topics"
- Search: "GCSE History source analysis skills mark scheme"
- Search: "GCSE History essay structure causation consequence significance"
- Search: "GCSE History most popular topics taught in UK schools"

**Research and encode all of:**
- Most commonly taught periods: Medicine Through Time, Norman England, Weimar/
  Nazi Germany, Cold War, Elizabethan England, American West
- Source/interpretation analysis skills: provenance, utility, reliability,
  how to argue with sources, how to compare interpretations
- Essay types: causation (reasons why), consequence, change and continuity,
  significance, how/why did X happen
- Chronological knowledge across all taught periods
- How to write 16-mark extended essays vs 8-mark questions vs 4-mark questions

---

#### ROLE: gcse-geography-tutor
**Research:**
- Search: "AQA GCSE Geography specification 8035"
- Search: "Edexcel GCSE Geography B specification"
- Search: "GCSE Geography Physical Human topics 2024"
- Search: "GCSE Geography fieldwork assessment requirements"

**Research and encode:**
Physical geography: tectonic hazards (plate boundaries, earthquakes, volcanoes,
  responses), tropical storms (formation, impacts, management), river landscapes
  (processes, landforms, flood management), coastal landscapes (erosion, deposition,
  management), hot deserts, cold environments, glaciation
Human geography: urban issues (UK and global city case studies), economic world
  (development gap, TNCs, aid, trade), resource management (food, water, energy)
Skills: map reading (OS maps, grid references, contours), graphs, data interpretation,
  geographical writing (PEEL), fieldwork design and analysis

---

#### ROLE: a-level-maths-tutor
**Research:**
- Search: "AQA A Level Mathematics 7357 specification full content"
- Search: "Edexcel A Level Mathematics 9MA0 specification"
- Search: "A Level Maths Pure Statistics Mechanics topics complete list"
- Search: "A Level Maths common student errors senior examiners report"
- Search: "A Level Further Maths vs A Level Maths differences"

**The system prompt must cover EVERY topic in full:**

PURE 1 & 2: Proof (contradiction, counter-example, direct, induction for FM),
  Algebra and Functions (domain/range, composite/inverse functions, modulus,
  partial fractions, algebraic division), Coordinate Geometry (circles, parametric),
  Sequences and Series (arithmetic, geometric, sigma notation, binomial expansion),
  Trigonometry (all identities, solving equations, double angle, addition formulae,
  R-alpha form, small angle approximations), Exponentials and Logarithms (laws,
  natural log, exponential growth/decay, solving exponential equations),
  Differentiation (first principles, chain/product/quotient rules, implicit,
  parametric, related rates, optimisation), Integration (by substitution, by parts,
  partial fractions, volumes of revolution, area between curves, differential
  equations — separable, integrating factor), Numerical Methods (change of sign,
  Newton-Raphson, iteration, trapezium rule), Vectors (3D, scalar product,
  equations of lines)

STATISTICS: Sampling methods, data representation, measures of location and spread,
  correlation and regression, discrete distributions (binomial, geometric),
  continuous distributions (normal), hypothesis testing (one-tail, two-tail,
  critical regions, Type I/II errors), conditional probability, Bayes' theorem

MECHANICS: Kinematics (constant acceleration SUVAT, variable acceleration calculus),
  Forces and Newton's Laws (all three, connected particles, pulleys, inclined planes,
  friction, normal reaction), Work/Energy/Power, Moments, Projectiles

---

#### ROLE: a-level-further-maths-tutor
**Research:**
- Search: "AQA A Level Further Mathematics 7367 specification"
- Search: "Edexcel A Level Further Mathematics 9FM0"
- Search: "A Level Further Maths core topics complex numbers matrices"

**Must cover:** Complex numbers (modulus-argument form, De Moivre, roots of unity,
  Argand diagrams, loci), Matrices (multiplication, inverse, transformations,
  eigenvalues/eigenvectors, Cayley-Hamilton), Further Algebra (roots of polynomials,
  recurrence relations, proof by induction), Further Calculus (Maclaurin series,
  improper integrals, arc length, surface area, mean value theorem), Polar
  coordinates, Hyperbolic functions, Further Vectors (planes, intersections),
  Further Statistics (Chi-squared, t-distribution, F-distribution, non-parametric
  tests), Further Mechanics (SHM, circular motion, elastic strings/springs,
  centres of mass), Decision Mathematics (algorithms, graph theory, linear
  programming)

---

#### ROLE: a-level-physics-tutor
**Research:**
- Search: "AQA A Level Physics 7408 specification full topic list"
- Search: "OCR A Level Physics A H557 specification"
- Search: "A Level Physics required practical activities list"
- Search: "A Level Physics mathematical skills requirements"
- Search: "A Level Physics past paper questions mark scheme analysis"

**Must cover:** Measurements and errors, Particles and radiation (quarks, leptons,
  antiparticles, photons, energy levels), Waves (progressive, stationary,
  diffraction, interference, Young's double slit, diffraction gratings),
  Mechanics and materials (moments, projectiles, Newton's Laws, terminal velocity,
  work/energy/power, stress/strain/Young modulus, bulk modulus), Electricity
  (I/V characteristics, Kirchhoff's Laws, internal resistance, power),
  Further Mechanics (circular motion, SHM, resonance), Thermal Physics (ideal gas
  laws, kinetic theory, thermal energy), Fields (gravitational, electric, magnetic,
  electromagnetic induction, transformer equations, Hall probe, mass spectrometer),
  Nuclear Physics (binding energy, fission, fusion, radioactive decay, half-life),
  Options (Astrophysics/Medical/Turning Points/Electronics — research which is most
  commonly taken). All required practicals with method and analysis.

---

#### ROLE: a-level-chemistry-tutor
**Research:**
- Search: "AQA A Level Chemistry 7405 specification complete"
- Search: "A Level Chemistry organic mechanisms complete list"
- Search: "A Level Chemistry required practical activities"
- Search: "A Level Chemistry most difficult topics students struggle with"

**Must cover:** Physical (atomic structure, bonding, energetics — Hess's law/
  Born-Haber cycles, kinetics — Arrhenius equation, equilibria — Kc/Kp/Le Chatelier,
  acids and bases — Ka/Kw/pH calculations/buffer solutions, electrochemistry —
  electrode potentials/cell EMF), Inorganic (Period 3 trends, Group 2/7 reactions,
  transition metals — d-orbital splitting/complex ions/catalysis, redox reactions),
  Organic (nomenclature/isomerism, alkanes/alkenes/halogenoalkanes/alcohols/
  carboxylic acids/esters/amines/amides/amino acids/polymerisation, all reaction
  mechanisms: SN1/SN2 nucleophilic substitution, electrophilic addition/aromatic
  substitution, nucleophilic acyl substitution, condensation), Analytical (NMR
  spectroscopy — integration/splitting patterns/chemical shift, MS, IR, UV-vis,
  chromatography, qualitative tests)

---

#### ROLE: a-level-biology-tutor
**Research:**
- Search: "AQA A Level Biology 7402 specification topics"
- Search: "A Level Biology required practical activities"
- Search: "A Level Biology mathematical skills requirements"

**Must cover ALL topics with full detail:** Biological molecules (carbohydrates,
  lipids, proteins, nucleic acids, water), Cells (prokaryotic/eukaryotic, cell
  fractionation, microscopy, mitosis/meiosis), Organisms exchange substances
  (surface area:volume, gas exchange systems, mass transport in plants and animals,
  cardiac cycle, haemoglobin), Genetic information (DNA replication, transcription,
  translation, gene expression, epigenetics, operons), Energy transfers (ATP,
  photosynthesis — light-dependent/Calvin cycle, respiration — glycolysis/Krebs/
  oxidative phosphorylation), Organisms respond to changes (nervous system,
  hormones, muscle structure and contraction, homeostasis, immune response,
  plant responses), Genetics/populations/evolution/ecosystems (inheritance — mono/
  dihybrid/sex-linkage/codominance, Hardy-Weinberg, selection, speciation,
  biodiversity indices, ecosystem dynamics, succession), Control of gene expression
  (mutation, gene regulation, oncogenes, recombinant DNA technology, PCR, gel
  electrophoresis, genetic fingerprinting)

---

#### ROLE: a-level-economics-tutor
**Research:**
- Search: "AQA A Level Economics 7136 specification"
- Search: "Edexcel A Level Economics 9EC0 specification"
- Search: "A Level Economics key theories models 2024"
- Search: "A Level Economics 25 mark essay structure"

**Must cover:** Microeconomics (supply and demand — shifts/elasticities/consumer
  and producer surplus, market structures — perfect competition/monopoly/
  oligopoly/monopolistic competition, labour markets, market failure — externalities/
  public goods/information failure, government intervention), Macroeconomics
  (national income — circular flow/AD-AS model/multiplier/accelerator, economic
  objectives — growth/inflation/unemployment/balance of payments, fiscal policy,
  monetary policy, supply-side policy, exchange rates, international trade,
  globalisation, development economics), Evaluation skills (short-run vs long-run,
  significance of magnitude, context application, counter-arguments), Diagram
  drawing and analysis for every major model

---

#### ROLE: a-level-psychology-tutor
**Research:**
- Search: "AQA A Level Psychology 7182 specification"
- Search: "A Level Psychology approaches studies key studies"
- Search: "A Level Psychology research methods complete"

**Must cover:** Social influence (conformity — Asch/types/explanations,
  obedience — Milgram/Hofling/explanations, minority influence, social change),
  Memory (MSM — Atkinson & Shiffrin, working memory — Baddeley, EWT — Loftus,
  anxiety and memory, cognitive interview), Attachment (Lorenz, Harlow, Ainsworth
  Strange Situation, attachment types, Bowlby's theory, privation, day care),
  Psychopathology (definitions of abnormality, phobias/depression/OCD — characteristics/
  explanations/treatments), Approaches (behaviourist, social learning, cognitive,
  biological, psychodynamic, humanist), Biopsychology (nervous system, neurons,
  neurotransmitters, localisation, split brain, HM case study, methods of
  investigation), Research Methods (all experimental designs, sampling, ethical
  issues, all statistical tests and when to use, levels of measurement, BPS guidelines),
  Issues and Debates (free will/determinism, reductionism, nature/nurture,
  gender bias, cultural bias, ethics), Options (relationships, cognition and
  development, schizophrenia, eating behaviour, stress, aggression, forensic/
  addiction/anomalistic — research most commonly taught)

---

#### ROLE: a-level-history-tutor
**Research:**
- Search: "AQA A Level History specification breadth and depth studies"
- Search: "A Level History essay writing source analysis guidance"
- Search: "Edexcel A Level History 9HI0 specification"

**Must cover:** Historical argument and essay construction (introduction with
  sustained argument, paragraph structure, counter-argument, conclusion),
  Source analysis (provenance — origin/purpose/content, reliability, utility,
  corroboration), Interpretations (comparing historiographical views, how to
  argue with an interpretation), Most commonly taught topics: Nazi Germany,
  Tsarist/Communist Russia, American history, British political history,
  Tudor England — full knowledge of each

---

#### ROLE: a-level-english-literature-tutor
**Research:**
- Search: "AQA A Level English Literature 7712 specification set texts"
- Search: "A Level English Literature essay structure analysis"
- Search: "A Level English Literature context and critical interpretations"

**Must cover:** Close reading and textual analysis, context (historical, social,
  cultural, biographical), literary criticism and critical theory (feminist,
  Marxist, psychoanalytic, post-colonial, ecocritical readings), comparison
  across texts, poetry analysis (form, metre, prosody), prose analysis,
  drama analysis, independent study coursework. Most commonly taught texts:
  The Great Gatsby, Hamlet, Keats poetry, Donne poetry, Atwood, Plath,
  Toni Morrison, Shelley

---

#### ROLE: eleven-plus-coach
**Research:**
- Search: "11 plus CEM test format 2024 verbal reasoning non-verbal reasoning"
- Search: "GL Assessment 11+ exam format English maths"
- Search: "11 plus topics complete list UK grammar school entrance"
- Search: "11 plus most common mistakes children make"
- Search: "11 plus anxiety support parents guidance"

**Must encode full knowledge of:**
CEM format: integrated verbal reasoning, numerical reasoning, English comprehension
  — question types, timing, how to navigate the adaptive difficulty
GL format: separate VR, NVR, English, Maths papers — all question types with
  examples
ALL VR question types: codes and ciphers, analogies, odd one out, hidden words,
  word connections, letter series, number series, logic
ALL NVR question types: nets, matrices, analogies, odd one out, rotation, reflection,
  cubes, sequences
Maths: every topic up to Year 6 National Curriculum plus some Year 7
The emotional and psychological dimension: managing exam anxiety in 8-10 year olds,
  how to keep sessions positive, parental anxiety management

---

#### ROLE: university-personal-statement-coach
**Research:**
- Search: "UCAS personal statement guidance 2024 word limit"
- Search: "UCAS personal statement common mistakes rejected"
- Search: "Oxford Cambridge personal statement requirements by subject"
- Search: "Personal statement structure opening paragraph advice"
- Search: "UCAS personal statement AI detection policy 2024"

**Must encode:** UCAS process and timeline, new UCAS format (2024 changes),
  structure for different subjects (sciences vs humanities vs arts vs vocational),
  how Oxbridge personal statements differ from Russell Group, what admissions tutors
  say they look for, how to write about work experience, how to demonstrate
  intellectual curiosity, common clichés to avoid, how to open compellingly,
  how to close memorably. UCAS AI detection policy and how to ensure authenticity.

---

#### ROLE: primary-homework-helper
**Research:**
- Search: "UK National Curriculum Key Stage 2 English Maths Science objectives"
- Search: "Year 3 4 5 6 curriculum objectives complete list"
- Search: "How to help children without doing their homework for them"
- Search: "Scaffolded learning primary school techniques"

**Must encode:** Full KS2 curriculum (Years 3-6) for Maths (times tables, fractions,
  decimals, percentages, geometry, statistics), English (grammar — SPAG, reading
  comprehension, creative writing techniques, spelling), Science (animals/plants/
  living things, materials, physics — forces/light/sound/electricity, Earth and
  space). Socratic questioning adapted for primary age. How to detect when a child
  is genuinely stuck vs giving up too early.

---

#### ROLE: primary-reading-coach
**Research:**
- Search: "Phonics screening check Year 1 UK 2024 GPCs"
- Search: "Systematic synthetic phonics phases 1-6 Letters and Sounds"
- Search: "KS1 KS2 reading comprehension skills progression"
- Search: "Reading fluency strategies primary school"

**Must encode:** All 44 phonemes and their common graphemes, all phonics phases
  (1-6), blending and segmenting techniques, reading comprehension skills at
  each year group, fluency development, how to support reluctant readers,
  recommended book lists by reading level, how to make reading sessions enjoyable.

---

### LANGUAGE TUTOR ROLES — RESEARCH AND BUILD ALL 40

For EACH language tutor, before writing the JSON:

**Research protocol for every language:**
- Search: "{Language} CEFR framework A1 B2 C2 learning objectives complete"
- Search: "{Language} grammar complete reference for English learners"
- Search: "Most difficult aspects of {Language} for English speakers"
- Search: "{Language} official qualification exam format {DELF/DELE/Goethe etc}"
- Search: "{Language} common mistakes English speakers make"
- Search: "{Language} pronunciation guide for English speakers"
- For languages with non-Latin scripts: search how to teach the script
  progressively and include that methodology

**Every language tutor system prompt must contain:**

1. CEFR LEVEL PROGRESSION — what the role covers at A1 through C2:
   - A1: core vocabulary (200-500 words), basic present tense, introductions,
     numbers, days, times, simple questions
   - A2: past tenses, common phrases, everyday conversations, 1000+ vocabulary
   - B1: all major tenses, opinions, future plans, reading simple texts, 2000+ vocab
   - B2: complex grammar, nuanced expression, cultural topics, 4000+ vocab
   - C1/C2: idiomatic expression, formal registers, literature, native-level discourse

2. GRAMMAR — every significant grammatical structure in the language:
   - Verb conjugation system (tenses, moods, aspects relevant to the language)
   - Noun system (gender, case, declension if applicable)
   - Adjective agreement and position rules
   - Pronoun system (subject, object, reflexive, relative)
   - Sentence structure rules (SVO/SOV/VSO etc)
   - All structures English learners consistently struggle with

3. PRONUNCIATION GUIDE — specific to the language:
   - All sounds that don't exist in English
   - Common pronunciation errors by English speakers
   - Tone system if applicable (Mandarin, Cantonese, Vietnamese, Thai, etc)
   - Script/orthography explanation if non-Latin

4. CULTURAL CONTEXT:
   - Regional variants (Spain vs Latin America, Brazil vs Portugal, etc)
   - Formal vs informal register differences
   - Cultural taboos and etiquette relevant to language use
   - Common idioms and expressions

5. EXAM PREPARATION:
   - The specific official qualification (DELF, DELE, Goethe-Zertifikat, HSK,
     JLPT, TOPIK, etc)
   - Format of each exam component
   - How to prepare for speaking, writing, reading, listening assessments

**Create all 40 tutors:**

European (research each independently):
1. french-language-tutor — DELF/DALF, subjunctive, gender rules, liaison,
   formal vous vs informal tu, French vs Belgian vs Canadian French
2. spanish-language-tutor — DELE, ser vs estar, subjunctive mood, preterite vs
   imperfect, Spain vs Latin American variants, vosotros
3. german-language-tutor — Goethe-Zertifikat, four cases (nominative/accusative/
   dative/genitive), der/die/das gender rules, word order (V2, subordinate clauses),
   separable verbs, modal verbs
4. italian-language-tutor — CILS/CELI, passato prossimo vs imperfetto, subjunctive,
   formal vs informal register, Italian pronunciation
5. portuguese-language-tutor — CAPLE (European) vs CELPE-Bras (Brazilian),
   nasal vowels, European vs Brazilian differences
6. dutch-language-tutor — NT2 exam, de/het article rules, separable verbs,
   Dutch word order, Dutch vowel sounds
7. swedish-language-tutor — TISUS exam, tonal accent, definite article suffixes,
   Swedish vowel sounds, pitch accent
8. norwegian-language-tutor — Bergenstesten, Bokmål vs Nynorsk, Norwegian pitch
   accent, similarities to Danish and Swedish
9. danish-language-tutor — Study in Denmark test, Danish pronunciation (soft d,
   stød), Danish vs Norwegian/Swedish
10. polish-language-tutor — TELC Polish, seven cases with full declension tables,
    aspect pairs (perfective/imperfective verbs), Polish consonant clusters,
    Polish spelling system
11. russian-language-tutor — TORFL, Cyrillic alphabet teaching method,
    six cases (with full declension patterns), aspect system, verb conjugation,
    Russian pronunciation — vowel reduction, hard/soft consonants
12. czech-language-tutor — Seven cases, Czech pronunciation (ř, háček),
    verbal aspect, Czech vs Slovak
13. hungarian-language-tutor — ECL Hungarian, vowel harmony, 18 cases (simplified),
    definite vs indefinite conjugation, agglutinative structure
14. romanian-language-tutor — DELF equivalent, Latin origin, Romanian cases,
    definite article as suffix, Romanian pronunciation
15. greek-language-tutor — Ellinomathia, modern Greek alphabet teaching method,
    modern vs ancient Greek distinction, Greek grammar essentials
16. turkish-language-tutor — TYS exam, vowel harmony, agglutinative system,
    suffix-heavy grammar, SOV word order, Turkish alphabet
17. ukrainian-language-tutor — Cyrillic (Ukrainian variant), Ukrainian vs Russian
    differences, Ukrainian grammar, current Ukrainian language situation
18. catalan-language-tutor — JLCC exam, Catalan vs Spanish/French similarities,
    Catalan phonology, where Catalan is spoken
19. welsh-language-tutor — GCSE/A-Level Welsh context, Welsh mutations (initial
    consonant mutations), Welsh lenition, North vs South Welsh variants,
    Welsh language situation in Wales
20. irish-language-tutor — TEG exam, three Irish dialects (Connacht/Munster/Ulster),
    Irish mutations (lenition and eclipsis), Irish verbal noun system, Irish script
    vs Roman alphabet

Asian/Other (research each independently):
21. mandarin-language-tutor — HSK 1-6 framework (new HSK 3.0), four tones plus
    neutral tone, simplified characters with pinyin, stroke order, radical system,
    measure words, topic-comment sentence structure, no tense morphology
22. cantonese-language-tutor — Six tones, traditional characters, Jyutping system,
    Cantonese vs Mandarin grammar differences, where Cantonese is spoken
23. japanese-language-tutor — JLPT N5-N1 framework, three scripts (hiragana,
    katakana, kanji — grade by grade), three levels of politeness, particles
    (wa, ga, wo, ni, de, e, to, ka, ne, yo), SOV structure, keigo (formal speech)
24. korean-language-tutor — TOPIK I and II, Hangul teaching method (vowels,
    consonants, syllable blocks, double consonants), honorific system,
    agglutinative grammar, Korean particles, SOV structure
25. arabic-language-tutor — Modern Standard Arabic vs dialects, Arabic script
    (right-to-left, connected letters, diacritics), root system, dual number,
    broken plurals, six cases (simplified), MSA vs Egyptian/Levantine/Gulf
26. hindi-language-tutor — Devanagari script teaching method, post-position system,
    SOV word order, gender system, Hindi verb conjugation, difference from Urdu
27. urdu-language-tutor — Nastaliq script (or Roman for beginners), similarity
    to Hindi vocabulary, Persian/Arabic loanwords in Urdu, register differences
28. bengali-language-tutor — Bengali script, verb conjugation, formal vs informal
    Bengali, standard Bangladeshi vs West Bengali differences
29. punjabi-language-tutor — Gurmukhi script (and Shahmukhi for Pakistani Punjabi),
    Punjabi tones (three tones), Punjabi in UK context
30. gujarati-language-tutor — Gujarati script, Gujarati in UK diaspora context,
    formal vs colloquial Gujarati
31. tamil-language-tutor — Tamil script, classical vs colloquial Tamil (diglossia),
    Tamil grammar (agglutinative), Tamil in UK/Sri Lanka/India context
32. thai-language-tutor — Thai script (44 consonants, 32 vowels, 5 tones),
    Thai tonal system, Thai script reading progression, Thai honorifics,
    classifier system
33. vietnamese-language-tutor — Vietnamese alphabet (quốc ngữ), six tones in
    Northern Vietnamese (different in Southern), tonal marking system,
    Southern vs Northern Vietnamese differences
34. indonesian-language-tutor — Bahasa Indonesia official standard, relatively
    regular grammar compared to other Asian languages, prefix/suffix system,
    Indonesian vs Malay relationship
35. malay-language-tutor — Bahasa Melayu, Malaysian vs Singaporean vs Bruneian
    Malay, affixation system, formal vs informal
36. swahili-language-tutor — East African lingua franca, Bantu noun class system,
    (15 classes), subject/object concord, Swahili script (Roman), Tanzania/Kenya
    Swahili
37. farsi-language-tutor — Persian (Nastaliq) script right-to-left, SOV word order,
    verb conjugation (present, past, future tenses), ezafe construction,
    formal vs colloquial Persian
38. hebrew-language-tutor — Hebrew alphabet (22 letters), niqqud for beginners,
    right-to-left reading, root system (3-letter roots), Biblical vs Modern Hebrew
    differences, verb binyanim (patterns)
39. amharic-language-tutor — Ge'ez (Ethiopic) script — fidel syllabary (267 base
    characters), Amharic phonology, SOV structure, Amharic as Ethiopian lingua
    franca, verb root system
40. latin-language-tutor — Five declensions with full case tables, four conjugations,
    GCSE and A-Level Latin contexts, prose composition, verse (hexameter for Virgil),
    Cambridge Latin Course and OCR specifications, connecting to English vocabulary

---

### HEALTH & WELLNESS ROLES — RESEARCH AND BUILD

#### ROLE: between-visit-health-companion
**Research:**
- Search: "NHS long-term conditions self-management guidance 2024"
- Search: "Type 2 diabetes self-management NICE guidelines"
- Search: "Hypertension blood pressure self-monitoring guidance"
- Search: "IBD Crohn's colitis self-management patient information"
- Search: "Asthma action plan GINA guidelines patient education"
- Search: "How to prepare for a GP appointment maximum value"
- Search: "Understanding NHS blood test results patient guide"
- Search: "Red flag symptoms when to call 999 vs 111 vs GP"

**System prompt must encode:** Full knowledge of the most common long-term
conditions and how patients manage them day-to-day, how to read blood test
results (ranges, what's significant), how to prepare effective GP questions,
how to advocate for yourself in the NHS system, when symptoms require 999 vs
111 vs GP vs wait-and-see, medication adherence strategies, lifestyle factors
for each condition.

---

#### ROLE: mental-wellness-companion
**Research:**
- Search: "CBT cognitive behavioural therapy techniques self-help"
- Search: "Thought record ABC model CBT worksheet"
- Search: "Behavioural activation depression evidence base"
- Search: "Cognitive restructuring techniques anxiety depression"
- Search: "NICE guidelines for depression anxiety treatment"
- Search: "ACT acceptance commitment therapy self-help techniques"
- Search: "Mindfulness based cognitive therapy MBCT"
- Search: "Samaritans active listening guidelines"
- Search: "Mental health first aid MHFA training key principles"

**System prompt must encode:** Full CBT model (situations, thoughts, feelings,
behaviours, physical sensations), thought records and how to complete them,
cognitive distortions (all-or-nothing thinking, catastrophising, mind reading,
etc), behavioural activation scheduling, activity monitoring, relaxation
techniques (PMR, 4-7-8 breathing, 5-4-3-2-1 grounding), sleep hygiene
principles, the difference between low mood and clinical depression (and why
the role cannot diagnose), when to refer.

---

#### ROLE: personal-trainer
**Research:**
- Search: "CIMSPA personal trainer competency framework UK 2024"
- Search: "REPs Level 3 personal trainer qualification syllabus"
- Search: "Progressive overload principle resistance training science"
- Search: "FITT principle exercise programming"
- Search: "HIIT vs LISS cardio evidence comparison"
- Search: "Compound vs isolation exercises programming"
- Search: "Periodisation training blocks strength hypertrophy"
- Search: "PAR-Q health questionnaire pre-exercise screening"
- Search: "Common exercise technique mistakes injury prevention"
- Search: "Female physiology training differences hormonal cycle"

**System prompt must encode:** Full FITT principle application, PAR-Q screening
methodology, progressive overload with specific percentage increments, all major
movement patterns (push/pull/hinge/squat/carry/rotate), form cues for all
major exercises (squat, deadlift, bench, overhead press, row), RPE and 1RM
calculations, periodisation models (linear, undulating, block), energy systems
and cardio programming, recovery principles, common injuries and prevention,
female-specific training adaptations, body composition science.

---

#### ROLE: registered-dietitian
**Research:**
- Search: "BDA British Dietetic Association evidence-based practice guidelines"
- Search: "SACN dietary reference values UK 2024"
- Search: "NHS Eatwell Guide macronutrients micronutrients guidance"
- Search: "NICE obesity management guidelines"
- Search: "FODMAP diet IBS evidence base Monash University"
- Search: "Coeliac UK gluten-free diet guidance"
- Search: "Type 2 diabetes dietary management NICE NG28"
- Search: "Eating disorder recovery nutritional rehabilitation guidance"
- Search: "Sports nutrition timing protein carbohydrate"

**System prompt must encode:** All macronutrient and micronutrient science
(RNIs, functions, sources, deficiency signs), the Eatwell Guide applied to
different dietary patterns (vegetarian, vegan, halal, kosher), therapeutic
diets for common conditions with the evidence base, how to calculate caloric
needs (TDEE, BMR — Mifflin-St Jeor equation), nutrition myths and the evidence
against them, how to read food labels, eating disorder recognition and the
boundaries of this role's competence.

---

#### ROLE: womens-health-specialist
**Research:**
- Search: "NICE PCOS polycystic ovary syndrome diagnosis management"
- Search: "Endometriosis UK patient information symptoms diagnosis"
- Search: "Menopause NICE guideline NG23 HRT updated 2024"
- Search: "RCOG menstrual disorders heavy periods guidance"
- Search: "NHS perimenopause symptoms checklist"
- Search: "PCOS diet lifestyle management evidence"
- Search: "How to advocate for yourself at the gynaecologist"
- Search: "Fertility awareness method symptothermal method"

**System prompt must encode:** Menstrual cycle physiology (follicular, ovulation,
luteal phases), PCOS (symptoms, diagnostic criteria — Rotterdam, management
options), endometriosis (symptoms, diagnostic delay, management), perimenopause
and menopause (symptoms, HRT types — oestrogen-only vs combined, NICE
recommendations, non-hormonal options), fibroids, adenomyosis, PMDD, how to
navigate gynaecological appointments effectively.

---

#### ROLE: sleep-coach
**Research:**
- Search: "CBT-I cognitive behavioural therapy insomnia NICE guidelines"
- Search: "Sleep restriction therapy protocol CBT-I"
- Search: "Stimulus control therapy insomnia evidence"
- Search: "Sleep hygiene evidence base meta-analysis"
- Search: "Circadian rhythm chronotype sleep timing"
- Search: "Sleep stages architecture REM NREM"
- Search: "Insomnia vs hypersomnia vs parasomnia types"
- Search: "Shift work disorder sleep management"

**System prompt must encode:** Full CBT-I protocol (sleep restriction rules and
how to apply them, stimulus control rules, cognitive restructuring for sleep-related
anxious thoughts), sleep diary methodology, sleep efficiency calculation, all sleep
hygiene factors with evidence ratings, chronotype science and how to apply it,
sleep architecture and why each stage matters, when to refer to a GP (sleep apnoea
red flags, narcolepsy signs).

---

#### ROLE: physio-recovery-guide
**Research:**
- Search: "NHS physiotherapy post total knee replacement exercise protocol"
- Search: "ACL reconstruction rehabilitation protocol phase 1 2 3"
- Search: "Rotator cuff repair rehabilitation exercises"
- Search: "Hip replacement post-op physiotherapy"
- Search: "Lower back pain exercise based physiotherapy NICE"
- Search: "Physiotherapy outcome measures pain VAS scale"
- Search: "Red flags back pain physiotherapy contraindications"

**System prompt must encode:** Major rehabilitation protocols for common surgeries
and injuries with phase-by-phase exercise progressions, how to assess current
function using validated tools (VAS pain scale, functional assessments), all
contraindications and red flags that require immediate referral, correct exercise
technique described with precision for voice delivery, when and how to progress
exercise intensity, the difference between therapeutic discomfort and harmful pain.

---

### ELDERLY CARE ROLES — RESEARCH AND BUILD

#### ROLE: daily-companion
**Research:**
- Search: "Meaningful activities for older adults living alone evidence"
- Search: "Dementia friendly communication techniques"
- Search: "Loneliness in elderly interventions evidence UK"
- Search: "Age UK befriending service model"
- Search: "Reminiscence therapy older adults evidence"
- Search: "Cognitive stimulation activities for seniors"

**System prompt must encode:** Communication adjustments for older adults
(slower pace, plain language, repetition without condescension), reminiscence
prompts by decade (1940s-1990s — music, events, cultural touchstones), cognitive
stimulation activities appropriate for different ability levels, recognition of
cognitive decline signs and how to respond supportively, medication reminders
methodology, how to facilitate family connection, when to escalate concerns.

---

#### ROLE: memory-support-companion
**Research:**
- Search: "Alzheimer's Society communication with dementia patients"
- Search: "NICE dementia support guidelines"
- Search: "Validation therapy dementia Naomi Feil"
- Search: "Reality orientation vs validation therapy debate"
- Search: "Cognitive stimulation therapy CST dementia evidence"
- Search: "Sundowning dementia management strategies"

**System prompt must encode:** Dementia-specific communication principles,
validation therapy techniques (accepting the person's reality), orientation
techniques that are gentle not distressing, cognitive engagement activities
graded by ability level, how to handle repetitive questions compassionately,
sundowning recognition and response strategies, recognising signs of increased
confusion that need escalation.

---

### FOOD & LIFESTYLE ROLES — RESEARCH AND BUILD

#### ROLE: michelin-chef
**Research:**
- Search: "Escoffier classical French cuisine techniques"
- Search: "Larousse Gastronomique fundamental cooking techniques"
- Search: "Maillard reaction cooking science"
- Search: "Knife skills professional chef techniques"
- Search: "Mise en place professional kitchen organisation"
- Search: "Sauce making classical French mother sauces"
- Search: "Michelin star chef techniques professional kitchen"
- Search: "Italian cooking fundamentals regional cuisines"
- Search: "Japanese knife techniques sushi sashimi preparation"
- Search: "Indian spice blending regional cuisine techniques"
- Search: "Thai cooking balance of flavours techniques"
- Search: "Baking bread sourdough fermentation science"

**System prompt must encode:** All five French mother sauces and their derivatives,
classical knife skills and cuts (julienne, brunoise, chiffonade, etc), moist and
dry heat cooking methods with the science behind each (conduction, convection,
Maillard, caramelisation), flavour pairing principles, seasoning theory (salt,
acid, fat, heat — Samin Nosrat), basting and resting meat principles, pasta
shapes and appropriate sauces, pastry types (shortcrust, puff, choux, filo),
emulsification science, how to rescue common cooking disasters, regional Italian
cooking traditions, Japanese umami and dashi fundamentals, Indian spice knowledge
(whole spices, tempering, spice blending), Thai balance of sweet/sour/salty/spicy,
bread science (gluten development, fermentation, scoring).

---

#### ROLE: sommelier
**Research:**
- Search: "WSET Wine Spirit Education Trust Level 3 syllabus"
- Search: "Wine regions of the world comprehensive guide"
- Search: "Wine and food pairing principles sommelier guide"
- Search: "Bordeaux Burgundy Champagne production methods"
- Search: "New World wine regions California Oregon New Zealand"
- Search: "Natural wine biodynamic organic differences"
- Search: "Sommelier service standards Michelin restaurant"
- Search: "Whisky Scotch single malt regions flavour profiles"

**System prompt must encode:** All major wine regions (France — all AOCs,
Italy — all DOC/DOCG, Spain, Germany, Portugal, new world), major grape varieties
and their characteristics, wine service temperature and glassware, how to describe
wine (appearance, nose, palate, finish), food and wine pairing principles, common
faults (cork taint, oxidation, reduction), how to read a wine label, Champagne
production (méthode champenoise), vintage significance, spirits knowledge
(whisky regions and production, gin botanicals, cognac regions).

---

### LEGAL & FINANCIAL ROLES — RESEARCH AND BUILD

#### ROLE: rights-legal-guide
**Research:**
- Search: "UK employment rights 2024 unfair dismissal redundancy"
- Search: "Renters Reform Bill 2024 UK tenant rights"
- Search: "Consumer Rights Act 2015 UK guide"
- Search: "Employment Tribunal process UK guide"
- Search: "Citizens Advice Bureau most common legal queries"
- Search: "Section 21 eviction notice rules England 2024"
- Search: "Equality Act 2010 protected characteristics"
- Search: "Small claims court England Wales process"
- Search: "Universal Credit benefits appeals process"
- Search: "UK immigration rights overview EU citizens"

**System prompt must encode:** Employment law (unfair dismissal criteria,
redundancy rights and pay calculations, discrimination under Equality Act 2010,
constructive dismissal, TUPE), housing law (Section 21 and Section 8 notices,
deposit protection schemes, landlord repair obligations, council housing rights),
consumer rights (30-day right to reject, 6-month rule, chargeback process),
benefits system (Universal Credit, PIP, how to appeal decisions), small claims
process (how to file, what to expect), what is and is not covered by legal aid.

---

#### ROLE: small-business-legal-companion
**Research:**
- Search: "UK employment law for small businesses 2024"
- Search: "IR35 off-payroll working rules UK 2024"
- Search: "UK GDPR ICO guidance small business compliance"
- Search: "Intellectual property UK trademarks copyright patents"
- Search: "Commercial contracts UK essential clauses"
- Search: "Companies House requirements directors duties"
- Search: "Business rates VAT registration thresholds UK 2024"

**System prompt must encode:** Employment contracts (what must be included,
staff handbook, disciplinary process, grievance procedures), IR35 determination
guide, GDPR compliance for small businesses (what data you can collect, consent,
subject access requests, breach notification), trademark registration process,
copyright law basics, what a solid commercial contract needs, director's duties
under Companies Act 2006, VAT registration and when it applies.

---

#### ROLE: financial-wellbeing-coach
**Research:**
- Search: "MoneyHelper budgeting advice UK debt management"
- Search: "StepChange debt charity free advice guide"
- Search: "ISA types UK 2024 annual allowances"
- Search: "Auto-enrolment pension UK employer requirements"
- Search: "State pension age and entitlement UK 2024"
- Search: "Help to Buy First Homes scheme UK 2024"
- Search: "Universal Credit means test savings rules"
- Search: "Credit score improvement UK Experian Equifax"

**System prompt must encode:** Budgeting methods with real examples, debt
prioritisation (priority debts — rent, council tax, utilities vs non-priority),
types of debt help available (DRO, IVA, DMP, bankruptcy — explained plainly),
ISAs (Cash, Stocks and Shares, Lifetime, Junior — limits and rules), pension
basics (auto-enrolment thresholds, contribution rates, final salary vs defined
contribution), credit score factors and how to improve them, first-time buyer
schemes, benefits entitlements (who qualifies and how to check).

---

#### ROLE: tax-self-assessment-guide
**Research:**
- Search: "HMRC self-assessment tax return guide 2023-24"
- Search: "Allowable expenses self-employed UK HMRC list"
- Search: "Class 2 Class 4 National Insurance self-employed 2024"
- Search: "Making Tax Digital ITSA update 2024"
- Search: "HMRC simplified expenses home office flat rate"
- Search: "Payment on account self-assessment explanation"
- Search: "Self-assessment penalty regime HMRC deadlines"

**System prompt must encode:** Every section of the SA100 and supplementary
pages (SA103 for self-employment), full list of allowable expenses by category
(travel, equipment, home office, professional subscriptions, training), Class 2
and Class 4 NIC thresholds and rates, trading allowance threshold, how payment
on account works with a concrete example, all deadlines and penalties, Making
Tax Digital timeline, how to register for self-assessment.

---

### CREATIVE & PROFESSIONAL ROLES — RESEARCH AND BUILD

#### ROLE: career-coach
**Research:**
- Search: "STAR method interview technique competency based"
- Search: "CV best practices UK 2024 ATS applicant tracking"
- Search: "Salary negotiation research preparation techniques"
- Search: "LinkedIn profile optimisation 2024 guide"
- Search: "Career change mid-life transferable skills framework"
- Search: "Redundancy rights UK process career next steps"
- Search: "Assessment centre exercises group task competencies"

**System prompt must encode:** CV structure (UK format, 2 pages, ATS keywords,
achievement-focused bullets using CAR — Context/Action/Result), cover letter
structure and how to customise it, LinkedIn 10-point optimisation checklist,
STAR method with practice framework, the 5 most common interview questions and
how to answer each, salary negotiation research methodology (Glassdoor, LinkedIn
Salary, industry reports), how to handle "what are your weaknesses," assessment
centre exercises (in-tray, group discussion, presentation, role play), career
change framework (skills audit, transferable skills mapping, retraining paths).

---

#### ROLE: creative-writing-coach
**Research:**
- Search: "Stephen King On Writing craft lessons"
- Search: "Story structure three-act five-act hero's journey"
- Search: "Show don't tell creative writing techniques examples"
- Search: "Dialogue writing craft techniques"
- Search: "Characterisation techniques fiction writing"
- Search: "Screenwriting craft Syd Field Robert McKee"
- Search: "Poetry forms metre iambic pentameter"
- Search: "Literary agents query letter UK submissions"

**System prompt must encode:** Narrative structure (three-act, Freytag's pyramid,
Hero's Journey, Save the Cat), POV types and when each serves the story,
dialogue mechanics (beats, subtext, said vs dialogue tags), characterisation
(wants vs needs, backstory, character voice), description and sensory detail,
pacing (scene vs summary), show vs tell with examples of each, common first-draft
errors, revision methodology, UK literary agent submission process (synopsis,
query letter, first pages), screenwriting format and structure.

---

#### ROLE: public-speaking-coach
**Research:**
- Search: "Toastmasters speech evaluation criteria"
- Search: "TED Talk structure principles"
- Search: "Glossophobia speech anxiety techniques"
- Search: "Aristotle rhetoric ethos pathos logos"
- Search: "Vocal delivery techniques pace pause power"
- Search: "Presentation design principles Nancy Duarte"
- Search: "Pitch deck presentation structure investors"

**System prompt must encode:** The three pillars of rhetoric (ethos, pathos, logos)
and how to build each, speech structure (opening hook types, body organisation,
memorable close), vocal delivery (pace — words per minute targets, pause power,
volume variation, pitch variation), managing nerves (physiological techniques,
cognitive reframing), non-verbal communication described for voice context,
handling Q&A and hostile questions, virtual presentation differences, pitch deck
storytelling structure, how to open with a hook (statistic, story, question,
provocative statement).

---

#### ROLE: music-tutor
**Research:**
- Search: "ABRSM music theory grades 1-8 syllabus"
- Search: "Trinity College London music theory syllabus"
- Search: "Guitar grades ABRSM pieces technical exercises"
- Search: "Piano technique Czerny exercises scales arpeggios"
- Search: "Music theory fundamentals intervals chords scales"
- Search: "Song writing chord progressions pop rock"
- Search: "Ear training intervals recognition exercises"
- Search: "Jazz harmony chord substitutions"

**System prompt must encode:** Music theory (all major and minor scales — natural,
harmonic, melodic — all modes, intervals, chords — triads and 7ths in all
inversions, Roman numeral analysis, time signatures and rhythm, sight-reading
notation), ABRSM Grade 1-8 requirements for theory and practical, piano technique
(scales/arpeggios/broken chords across all keys, hand independence, pedalling),
guitar (chord shapes — open and barre, CAGED system, scales, fingerpicking
patterns, reading TAB), ear training methodology, songwriting chord progressions
(I-IV-V, ii-V-I, circle of fifths), composition techniques.

---

### CHILDREN'S ROLES — RESEARCH AND BUILD

#### ROLE: bedtime-story-companion
**Research:**
- Search: "NSPCC safe online children interaction guidelines"
- Search: "Children's literature age-appropriate themes 3-8"
- Search: "Story grammar narrative structure children"
- Search: "Bibliotherapy emotional regulation children's stories"
- Search: "UK Children's Code age appropriate design requirements"

**System prompt must encode:** Story structure for young children (character,
setting, problem, resolution), age-appropriate vocabulary and sentence length by
age (3-4, 5-6, 7-8), themes and values that resonate at each age, how to make
stories interactive without losing the bedtime wind-down effect, how to incorporate
a child's interests without requiring much input from them, how to handle dark
themes (loss, fear, conflict) in age-appropriate ways, NSPCC safeguarding
guidelines fully embedded.

---

#### ROLE: curiosity-companion
**Research:**
- Search: "National Curriculum Key Stage 2 science topics"
- Search: "Primary school history geography topics UK curriculum"
- Search: "How to explain complex science to children BBC"
- Search: "Age-appropriate explanations death space universe children"
- Search: "Growth mindset questions to ask curious children"

**System prompt must encode:** Core science topics from KS1-2 (animals and
their habitats, plants, materials, forces, light, sound, electricity, Earth and
space, human body, food chains), history topics (ancient civilisations, UK
history, world history at primary level), geography (continents, countries,
physical features, weather, climate), how to answer "why is the sky blue" and
100 other canonical children's questions accurately, Socratic follow-up questions
to deepen curiosity, how to acknowledge "I don't know" and model intellectual
curiosity.

---

#### ROLE: creative-play-partner
**Research:**
- Search: "Imaginative play development stages 5-12"
- Search: "Storytelling games children primary age"
- Search: "STEM activities home without equipment children"
- Search: "Word games for children vocabulary development"

**System prompt must encode:** Age-appropriate roleplay scenarios by age group,
classic word games (20 questions, I spy adaptations, story chains, word associations,
riddles categorised by age), collaborative worldbuilding prompts, how to be an
enthusiastic but not overpowering play partner, how to extend creative play without
taking over, how to introduce new ideas when play stalls.

---

#### ROLE: primary-homework-helper
**Research:**
- Search: "KS2 maths curriculum year 3 4 5 6 objectives"
- Search: "SPAG spelling punctuation grammar KS2 curriculum"
- Search: "How to help child with homework without doing it"
- Search: "Zone of proximal development primary teaching"
- Search: "Growth mindset praise Carol Dweck"

**System prompt must encode:** All KS2 maths objectives year by year (Y3: 3-digit
addition/subtraction, Y4: times tables to 12, fractions, Y5: decimals, percentages,
Y6: algebra intro, ratio), all SPAG content (word classes, punctuation, clauses,
subjunctive, passive voice, punctuation for effect), reading comprehension question
types and how to approach each (inference, retrieval, vocabulary, prediction,
evaluation), science and foundation subjects at primary level, Socratic questioning
adapted for primary age, growth mindset language for when a child is struggling.

---

## PHASE 3 — BUILD THE AUDIT PIPELINE

Create `src/server/audit/pipeline.ts` with complete implementation of all 47 checks.

The Stage 2 behavioural tests must send the role's actual system prompt to an
evaluation LLM and assess the responses. The test scenarios must be specific to
the role's domain — a generic test for a GCSE Maths Tutor would ask it to solve
a quadratic equation, not just ask "do you know maths?"

For every role, the audit pipeline must generate:
- A numerical Trust Score (0-100)
- A badge (PLATINUM/GOLD/SILVER/BASIC/REJECTED)
- A SHA-256 hash of the role configuration
- A full audit report stored to S3
- A record in the database

No role may be published to the marketplace without passing all critical checks.

**Pipeline implementation:** [Same as specified in previous CLAUDE.md — implement
the full TypeScript pipeline with all 47 checks, LLM evaluation in Stage 2,
score calculation, S3 storage, and Prisma database writes]

---

## PHASE 4 — PRISMA SCHEMA

Add to `prisma/schema.prisma`:

```prisma
model Role {
  id              String      @id @default(cuid())
  slug            String      @unique
  name            String
  category        String
  subcategory     String
  tagline         String
  description     String      @db.Text
  systemPrompt    String      @db.Text
  priceMonthly    Int
  targetUser      String
  capabilities    String[]
  limitations     String[]
  hardLimits      String[]
  escalationTriggers String[]
  knowledgeSources String[]
  tags            String[]
  languageCode    String?
  languageName    String?
  isActive        Boolean     @default(false)
  publishedAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  audit           RoleAudit?
  hires           Hire[]
  skills          RoleSkill[]
}

model RoleSkill {
  id             String   @id @default(cuid())
  roleId         String
  role           Role     @relation(fields: [roleId], references: [id])
  skillSlug      String
  skillName      String
  injectionPoint String   @default("system")
  priority       Int      @default(1)
}

model Skill {
  id             String   @id @default(cuid())
  slug           String   @unique
  name           String
  description    String   @db.Text
  systemFragment String   @db.Text
  stakeRequired  Int
  createdAt      DateTime @default(now())
}

model RoleAudit {
  id              String   @id @default(cuid())
  roleSlug        String   @unique
  role            Role     @relation(fields: [roleSlug], references: [slug])
  trustScore      Int
  badge           String
  artefactHash    String
  auditReportKey  String
  stage1Passed    Int
  stage1Failed    Int
  stage2Passed    Int
  stage2Failed    Int
  stage3Passed    Int
  stage3Failed    Int
  completedAt     DateTime
  createdAt       DateTime @default(now())
}
```

Run: `npx prisma migrate dev --name "add-role-universe"`

---

## PHASE 5 — SEED SCRIPT

Create `src/scripts/seed-roles.ts`:

```typescript
// Reads all role and skill JSON files
// Upserts each to database
// Runs full 47-check audit on every role
// Publishes all passing roles to marketplace
// Prints summary report with Trust Scores and badges
```

Add to package.json: `"seed:roles": "ts-node src/scripts/seed-roles.ts"`

The seed script must:
1. Seed all 15 skill definitions
2. Seed all 60+ role definitions with skill assignments
3. Run `runFullAudit(slug)` for every role
4. Set `isActive: true` and `publishedAt: new Date()` for every role that passes
5. Print a formatted report: role name, Trust Score, badge, pass/fail per stage

---

## PHASE 6 — MARKETPLACE ROUTER

Update `src/server/routers/marketplace.ts`:

```typescript
// browse: filter by category, subcategory, badge, minScore, language, search
// getRole: full role detail with audit report
// getLanguageTutors: all language tutors grouped and sorted
// getStats: total roles, by category, by badge
// getRoleAuditReport: public audit report for a specific role
```

---

## PHASE 7 — EXECUTE

```bash
npx prisma migrate dev --name "add-role-universe"
npx prisma generate
npm run seed:roles
```

---

## PHASE 8 — VERIFICATION

```bash
# TypeScript: zero errors
npx tsc --noEmit

# Role count: 60+ roles
node -e "const fs=require('fs'); const n=fs.readdirSync('src/data/roles').filter(f=>f.endsWith('.json')).length; console.log('Roles:',n); if(n<60){process.exit(1);}"

# Language tutors: exactly 40
node -e "const fs=require('fs'); const n=fs.readdirSync('src/data/roles').filter(f=>f.includes('language-tutor')).length; console.log('Language tutors:',n); if(n<40){process.exit(1);}"

# System prompt minimum length: every role ≥ 1500 chars
node -e "
const fs=require('fs'),path=require('path');
let fail=false;
fs.readdirSync('src/data/roles').filter(f=>f.endsWith('.json')).forEach(f=>{
  const r=JSON.parse(fs.readFileSync(path.join('src/data/roles',f),'utf-8'));
  if(r.systemPrompt.length<1500){console.error('SHORT PROMPT:',f,'('+r.systemPrompt.length+' chars)');fail=true;}
});
if(fail)process.exit(1);
console.log('All system prompts meet minimum length: PASS');
"

# Knowledge sources: every role has at least 3
node -e "
const fs=require('fs'),path=require('path');
let fail=false;
fs.readdirSync('src/data/roles').filter(f=>f.endsWith('.json')).forEach(f=>{
  const r=JSON.parse(fs.readFileSync(path.join('src/data/roles',f),'utf-8'));
  if(!r.knowledgeSources||r.knowledgeSources.length<3){console.error('INSUFFICIENT SOURCES:',f);fail=true;}
});
if(fail)process.exit(1);
console.log('All roles have knowledge sources: PASS');
"

# No placeholder text
node -e "
const fs=require('fs'),path=require('path');
const pat=/TODO|PLACEHOLDER|LOREM|FIXME|\[INSERT/i;
let fail=false;
fs.readdirSync('src/data/roles').filter(f=>f.endsWith('.json')).forEach(f=>{
  if(pat.test(fs.readFileSync(path.join('src/data/roles',f),'utf-8'))){console.error('PLACEHOLDER:',f);fail=true;}
});
if(fail)process.exit(1);
console.log('No placeholder text: PASS');
"

# Hard limits: every role has 3+
node -e "
const fs=require('fs'),path=require('path');
let fail=false;
fs.readdirSync('src/data/roles').filter(f=>f.endsWith('.json')).forEach(f=>{
  const r=JSON.parse(fs.readFileSync(path.join('src/data/roles',f),'utf-8'));
  if(!r.hardLimits||r.hardLimits.length<3){console.error('FEW HARD LIMITS:',f);fail=true;}
  if(!r.escalationTriggers||r.escalationTriggers.length<3){console.error('FEW ESCALATION TRIGGERS:',f);fail=true;}
  if(!r.capabilities||r.capabilities.length<8){console.error('FEW CAPABILITIES:',f);fail=true;}
});
if(fail)process.exit(1);
console.log('Role structure check: PASS');
"

# Children safeguarding
node -e "
const fs=require('fs'),path=require('path');
let fail=false;
fs.readdirSync('src/data/roles').filter(f=>f.endsWith('.json')).forEach(f=>{
  const r=JSON.parse(fs.readFileSync(path.join('src/data/roles',f),'utf-8'));
  if(r.category==='childrens'&&!r.skills.some(s=>s.skillSlug==='safeguarding')){
    console.error('MISSING SAFEGUARDING:',f);fail=true;
  }
});
if(fail)process.exit(1);
console.log('Safeguarding check: PASS');
"

# DB active roles
node -e "
const{PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
db.role.count({where:{isActive:true}}).then(n=>{
  console.log('Active roles in DB:',n);
  if(n<50){console.error('Too few active roles');process.exit(1);}
  console.log('DB check: PASS');
  db.\$disconnect();
});
"
```

---

## COMPLETION CHECKLIST

Do not stop until every item is checked:

- [ ] Web research completed for every role (knowledgeSources[] populated)
- [ ] All 15 skill files created with real knowledge in systemFragment
- [ ] All 60+ role files created — zero placeholder text
- [ ] Every system prompt ≥ 1,500 characters (most should be 3,000-8,000)
- [ ] All 40 language tutor files created
- [ ] Every education role encodes the actual curriculum topics in detail
- [ ] Every health/legal/financial role encodes the actual regulatory framework
- [ ] Every children's role has safeguarding skill assigned
- [ ] Every role has ≥ 8 capabilities, ≥ 4 limitations, ≥ 3 hard limits, ≥ 3 escalation triggers
- [ ] Audit pipeline created and functional (all 47 checks)
- [ ] Prisma migration ran successfully
- [ ] Seed script runs without error
- [ ] All roles pass audit (none REJECTED) — fix any failures
- [ ] All roles published to marketplace (isActive: true in DB)
- [ ] Marketplace tRPC router updated
- [ ] `npx tsc --noEmit` exits 0
- [ ] All 8 verification checks pass
- [ ] Git commit with full message
- [ ] Pushed

**If any item is unchecked: continue. The shelves must never be empty.**

---

*Trust Agent — AgentCore LTD — Company No. 17114811 — trust-agent.ai*
