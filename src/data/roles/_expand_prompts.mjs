import { readFileSync, writeFileSync } from 'fs';
const dir = 'C:/Users/user/Documents/trust-agent-desktop/src/data/roles';

function expand(file, additionalContent) {
  const d = JSON.parse(readFileSync(dir + '/' + file, 'utf8'));
  d.systemPrompt = d.systemPrompt + '\n\n' + additionalContent;
  writeFileSync(dir + '/' + file, JSON.stringify(d, null, 2));
  console.log(`Expanded: ${file} -> ${d.systemPrompt.length} chars`);
}

// SQE Companion - needs major expansion
expand('sqe-companion.json', `DETAILED FLK1 CONTENT:

BUSINESS LAW AND PRACTICE:
Company formation: memorandum and articles of association, limited liability, separate legal personality (Salomon v Salomon [1897]). Directors duties under Companies Act 2006, s.171-177: duty to act within powers, promote success of the company, exercise independent judgement, exercise reasonable care skill and diligence, avoid conflicts of interest, not accept benefits from third parties, declare interest in transactions. Breach consequences: account of profits, equitable compensation, rescission. Partnership law: Partnership Act 1890, fiduciary duties between partners, joint and several liability. Limited Liability Partnerships Act 2000. Insolvency: compulsory and voluntary liquidation, administration, Company Voluntary Arrangement, wrongful trading (Insolvency Act 1986, s.214), fraudulent trading (s.213). Directors disqualification.

CONTRACT LAW:
Formation: offer (distinguished from invitation to treat - Partridge v Crittenden), acceptance (postal rule - Adams v Lindsell, instantaneous communication - Entores v Miles Far East), consideration (Currie v Misa definition, past consideration rule, promissory estoppel - Central London Property Trust v High Trees House), intention to create legal relations (commercial presumption). Terms: conditions, warranties, innominate terms (Hong Kong Fir Shipping v Kawasaki Kisen Kaisha). Implied terms: Sale of Goods Act 1979 (satisfactory quality, fitness for purpose), Supply of Goods and Services Act 1982. Exclusion clauses: incorporation, construction (contra proferentem), Unfair Contract Terms Act 1977 (reasonableness test), Consumer Rights Act 2015. Vitiating factors: misrepresentation (Hedley Byrne v Heller for negligent misrepresentation), mistake, duress, undue influence. Discharge: performance, breach (anticipatory - Hochster v De La Tour), frustration (Taylor v Caldwell), agreement. Remedies: damages (Hadley v Baxendale remoteness, mitigation duty), specific performance, injunctions, rescission.

TORT LAW:
Negligence: duty of care (Donoghue v Stevenson, Caparo v Dickman three-stage test - foreseeability, proximity, fair just and reasonable), breach of duty (Bolam standard for professionals, Bolitho qualification), causation (factual - but for test; legal - remoteness, The Wagon Mound), damages (compensatory - pecuniary and non-pecuniary). Defences: contributory negligence (Law Reform (Contributory Negligence) Act 1945), volenti non fit injuria, illegality. Occupiers liability: Occupiers Liability Act 1957 (lawful visitors - common duty of care), Occupiers Liability Act 1984 (trespassers - duty arises if danger known, visitors in vicinity, risk unreasonable). Employers liability: non-delegable duty of care (competent staff, safe system, safe plant, safe workplace). Vicarious liability: employer liable for employee torts committed in the course of employment (Various Claimants v Morrison Supermarkets [2020] refined close connection test). Nuisance: private (unreasonable interference with use and enjoyment of land), public (materially affects a class of people), Rylands v Fletcher (escape of dangerous thing from land). Defamation: libel (permanent), slander (transient), defences (truth, honest opinion, public interest, privilege).

CRIMINAL LAW:
Actus reus: voluntary act, state of affairs (Larsonneur), omissions (duty situations - statute, contract, voluntary assumption, dangerous situation). Mens rea: intention (Woollin direction - virtual certainty), recklessness (Cunningham subjective), negligence (gross negligence manslaughter - Adomako). Strict liability offences. Causation: factual (but for) and legal (operating and substantial cause, thin skull rule, novus actus interveniens). Homicide: murder (intention to kill or cause GBH, mandatory life), voluntary manslaughter (loss of control, diminished responsibility under Coroners and Justice Act 2009), involuntary manslaughter (constructive/unlawful act, gross negligence). Non-fatal offences: assault (apprehension of immediate unlawful force), battery (actual application), ABH (s.47 OAPA 1861), GBH (s.20 malicious wounding, s.18 wounding with intent). Theft Act 1968: theft (s.1 - dishonest appropriation of property belonging to another with intention to permanently deprive), robbery (s.8), burglary (s.9). Fraud Act 2006: fraud by false representation, failure to disclose, abuse of position. Defences: self-defence (s.76 Criminal Justice and Immigration Act 2008, reasonable force), duress, insanity (McNaghten Rules), automatism, intoxication (distinction between basic and specific intent offences - Majewski).

PROPERTY LAW AND CONVEYANCING:
Freehold conveyancing process: pre-contract (instructions, searches, title deduction), exchange of contracts (binding commitment, deposit typically 10%), completion (transfer of legal title, balance paid), post-completion (registration at Land Registry, SDLT, notice to landlord if leasehold). Title: registered land (Land Registration Act 2002 - register of title, overriding interests, priority of registered interests), unregistered land (root of title, title deeds, Land Charges Register). Leasehold: lease requirements (term certain, exclusive possession - Street v Mountford), landlord and tenant covenants, forfeiture, enfranchisement. Easements and covenants: creation, enforcement, modification. Co-ownership: joint tenancy (four unities, right of survivorship), tenancy in common (no survivorship, unequal shares possible). Mortgages: legal charges, rights of mortgagor and mortgagee, repossession (Pre-Action Protocol).

WILLS AND ADMINISTRATION OF ESTATES:
Valid will requirements (Wills Act 1837, s.9): in writing, signed by the testator (or direction), intended to give effect, witnessed by two witnesses present at same time (who also sign). Codicils. Revocation: by later will, by destruction, by marriage/civil partnership. Intestacy rules (Administration of Estates Act 1925 as amended): spouse/civil partner entitlement (first 322,000 plus personal chattels plus half residue if issue survive), then issue per stirpes. Grant of probate (executor) or letters of administration (administrator). IHT: nil rate band (325,000), residence nil rate band (175,000 if main residence passed to direct descendants), transferable nil rate band for surviving spouse, taper relief, business and agricultural property relief.

PROFESSIONAL CONDUCT AND ETHICS:
SRA Principles: act in a way that upholds public trust, act with integrity, act independently, act in the best interests of clients, provide a proper standard of service, act in a way that encourages equality diversity and inclusion, act in the best interests of the administration of justice. SRA Code of Conduct for Solicitors: client identification, conflicts of interest, confidentiality and disclosure, undertakings, client money (SRA Accounts Rules). Money laundering: Proceeds of Crime Act 2002, obligatory suspicious activity reports (SARs), client due diligence. Ethics scenarios frequently tested: conflicts between duties to client and court, confidentiality exceptions, money laundering reporting obligations.

SQE2 SKILLS IN DEPTH:

CLIENT INTERVIEWING AND ATTENDANCE NOTE:
Structure: introduction and rapport building, explaining the interview process, identifying the client's objectives, gathering relevant facts systematically, identifying the legal issues, providing initial advice within your competence, explaining next steps, confirming instructions, closing. Attendance note: date, time, attendees, summary of discussion, advice given, instructions received, agreed next steps. Active listening, open then closed questions, empathy without over-identification, managing client expectations.

ADVOCACY:
Magistrates court and County Court advocacy. Structure: introduction to the court, outline of case, presentation of legal argument supported by authority, addressing opposing arguments, summarising the position, requesting the relief sought. Court etiquette: addressing the bench correctly (Your Worship/Worships in magistrates, Your Honour in County Court), standing when the bench enters and leaves, not interrupting opposing counsel, citing authorities properly.

LEGAL RESEARCH:
Identifying the legal issue from facts, selecting appropriate sources (legislation, case law, commentary), using legal databases (Westlaw, LexisNexis concepts), applying the law to the facts, providing a reasoned conclusion. Ability to research novel areas where the answer is not immediately apparent.

LEGAL WRITING AND DRAFTING:
Letters of advice: clear structure (issue, relevant law, application to facts, advice, next steps). Client-facing language (plain English, avoiding unnecessary jargon). Drafting: witness statements (chronological, factual, first person), contract clauses (precision, avoiding ambiguity), particulars of claim basics.

EXAM TECHNIQUE FOR SQE2:
Each assessment is 50 minutes. Read instructions carefully. Plan before writing. Answer what is asked - no more, no less. Structure clearly with headings. Demonstrate legal knowledge AND practical skills. Time management is critical - you cannot afford to overrun.

STUDY STRATEGIES FOR SQE:
SQE1: flashcards for black letter law, practice MCQs extensively (minimum 2000-3000 before sitting), understand the structure of single best answer questions (4 options, 1 best - even if multiple are partly correct), time yourself. SQE2: practice skills under timed conditions, get feedback on written work, practice client interviews with study partners, observe court proceedings.`);

// Executive PA
expand('executive-personal-assistant.json', `ADVANCED PRODUCTIVITY SYSTEMS:

GETTING THINGS DONE (GTD) - DAVID ALLEN:
Five steps: Capture (collect everything that has your attention into trusted external systems), Clarify (process each item - is it actionable? If yes: what is the next action? If less than 2 minutes, do it now. If your action but more than 2 minutes, defer it or delegate it. If not actionable: trash, reference, or someday/maybe), Organise (put items where they belong - next actions lists by context, project lists, waiting for, calendar, reference), Reflect (weekly review: process inbox to zero, review all projects and next actions, update lists, plan ahead), Engage (choose what to work on based on context, time available, energy available, and priority).

The Weekly Review is the keystone habit: every week (ideally Friday afternoon or weekend), process all inboxes to zero, review every active project, review your calendar (past week for follow-ups, next two weeks for preparation), review someday/maybe list, review waiting-for list, do a mind sweep for anything new. This typically takes 1-2 hours but provides enormous clarity.

DEEP WORK AND FOCUS MANAGEMENT (CAL NEWPORT):
Deep Work: professional activities performed in a state of distraction-free concentration that push cognitive capabilities to their limit. These efforts create new value, improve skills, and are hard to replicate. Schedule deep work sessions: 90-minute blocks minimum, ideally 2-4 hours. Protect them fiercely. During deep work: phone in another room, email closed, notifications off, door closed, do not disturb sign. Shallow work (administrative, email, meetings) should be batched into specific windows rather than scattered throughout the day.

Attention residue: when you switch from Task A to Task B, your attention does not immediately follow - part of your attention remains stuck on Task A. This is why context-switching is so expensive. Solution: complete tasks before switching, or at least reach a natural stopping point and write a note about where you left off.

STRATEGIC EMAIL MANAGEMENT:
Processing vs checking: checking email (glancing, reading without acting) creates anxiety without progress. Processing (deciding and acting on each message) creates closure. Process email in 2-3 batches per day rather than continuously.

Email templates and canned responses for recurring situations: meeting scheduling, information requests, follow-up nudges, acknowledgement and timeline responses. Save 10-15 templates that cover 80% of your routine responses.

The 5-sentence email: most emails should be 5 sentences or fewer. Open with context, state the purpose, provide necessary information, make the ask, close with deadline or next step. Long emails are often a sign that a meeting or phone call would be more efficient.

MEETING MANAGEMENT:
Before accepting any meeting, ask: What is the purpose? What decision needs to be made? Am I necessary? Could this be an email? Amazon's two-pizza rule: if a meeting needs more than two pizzas to feed attendees, it has too many people.

Meeting agenda template: objective (what we will decide or accomplish), pre-read (sent 24 hours ahead), agenda items with time allocation, parking lot for off-topic items, action items (who, what, by when). Close every meeting by reviewing: what did we decide? what are the action items? who is responsible? what is the deadline?

Stand-up meetings: daily 15-minute check-ins. Each person answers: what did I do yesterday? what will I do today? what is blocking me? Effective for team coordination without consuming deep work time.

STAKEHOLDER MANAGEMENT:
Stakeholder mapping: power/interest grid. High power/high interest: manage closely (regular updates, seek input, involve in decisions). High power/low interest: keep satisfied (periodic updates, no unnecessary detail). Low power/high interest: keep informed (regular updates, opportunity for input). Low power/low interest: monitor (minimal effort). Tailor communication style: executives want headlines and decisions, technical teams want detail, clients want outcomes and timelines.

DELEGATION FRAMEWORK:
What to delegate: tasks that do not require your unique expertise, tasks that develop others, routine tasks that consume disproportionate time. How to delegate effectively: clearly define the task and expected outcome, provide necessary authority and resources, agree the timeline, set check-in points (do not micromanage), give feedback on completion. The 70% rule: if someone can do the task 70% as well as you, delegate it - the time you save can be used for higher-value activities, and they will improve through practice.

ENERGY MANAGEMENT (Tony Schwartz):
Energy is a more accurate lens than time. You have approximately 4-6 hours of peak cognitive energy per day. Use it for your most important work. Physical energy: sleep (7-9 hours), nutrition (regular meals, hydration), exercise (even 20 minutes daily). Emotional energy: positive relationships, managing conflict, gratitude practice. Mental energy: focused attention, task switching minimisation, creative thinking. Spiritual energy: alignment with values and purpose, meaningful work.

PROFESSIONAL COMMUNICATION EXCELLENCE:
Written communication: know your purpose before writing. Lead with the key message (bottom line up front - BLUF). Use bullet points for multiple items. End with a clear call to action. Proofread everything. Match tone to audience and context.

Upward communication: present problems with proposed solutions. Be concise - executives have limited attention. Use data to support points. Anticipate questions. Know when to communicate in writing vs in person.

CRISIS AND PRESSURE MANAGEMENT:
When everything is urgent: stop, breathe, list everything, identify the genuine deadline-driven items, communicate proactively about what can and cannot be done, ask for help, refuse new commitments until the crisis passes. Communicate early about potential delays - bad news does not improve with age.

PERSONAL PRODUCTIVITY RITUALS:
Morning routine: review calendar, identify top 3 priorities (MITs), check for overnight urgencies. Evening shutdown: review what was accomplished, note incomplete items, review tomorrow's calendar, write tomorrow's MIT list, close email and work tools. This shutdown ritual creates psychological closure and enables better rest.`);

// Family PA
expand('family-personal-assistant.json', `ADVANCED HOUSEHOLD MANAGEMENT:

SEASONAL HOUSEHOLD CHECKLIST:
Spring: garden preparation (lawn care, planting), deep clean (windows, carpets, curtains), declutter and donate winter clothes, check smoke alarm batteries, service air conditioning, clear gutters, exterior inspection for winter damage.
Summer: garden maintenance, holiday preparation, check travel documents, arrange pet/house care for holidays, school uniform preparation for September, review home insurance before holiday season.
Autumn: heating system service before winter, bleed radiators, chimney sweep if applicable, garden winterising, check draught excluders and insulation, stock emergency supplies (torches, batteries, candles), autumn deep clean, prepare winter clothing.
Winter: prevent frozen pipes (lag exposed pipes, know stopcock location), grit paths, check roof for damage before storms, festive planning and budgeting, annual document review (insurance renewals, subscriptions audit).

ANNUAL ADMIN CALENDAR:
January: review and set family budget, check insurance renewals (car, home, life), New Year goals and plans. February: Valentine's planning, half-term activities. March: Mother's Day, Easter planning, review energy tariffs. April: tax year end (ISAs, pension contributions), spring cleaning. May: bank holiday planning, garden focus. June: Father's Day, summer holiday finalisation, school report season. July: end of school year admin (uniform audit, book returns), summer activity bookings. August: school uniform shopping, back-to-school preparation, September schedule planning. September: new academic year, after-school activity sign-ups, heating check. October: half-term, Halloween, fireworks safety, clocks change preparation. November: Christmas planning (lists, budgeting, card writing), Black Friday deals assessment. December: Christmas, end-of-year review, New Year planning.

MEAL PLANNING ADVANCED STRATEGIES:
Meal prep Sunday: spend 2-3 hours preparing components for the week. Cook grains (rice, pasta, quinoa), prepare proteins (marinate, pre-cook), wash and chop vegetables, make sauces and dressings. Store in clear containers with labels and dates.

Freezer strategy: always have a frozen meal backup for days when plans change. Batch cook double portions of soups, stews, casseroles, pasta sauces, and freeze in family-sized portions. Label with contents and date. Use within 3 months for best quality.

Budget meal planning: plan meals around what is on sale. Use seasonal produce (cheaper and better quality). Reduce food waste by planning meals that use similar ingredients across the week. Use leftovers creatively (roast chicken Monday becomes chicken stir-fry Wednesday becomes chicken soup Friday). Store cupboard staples ensure you can always make a meal: pasta, rice, tinned tomatoes, beans, frozen vegetables, eggs.

FAMILY COMMUNICATION:
Family notice board or digital equivalent: weekly schedule, important dates, meal plan, chore rota, emergency contacts. Family WhatsApp or group chat for in-the-moment coordination. Monthly family meeting (age-appropriate): discuss what is coming up, celebrate achievements, address any issues, plan fun activities. Bedtime routine conversation: how was your day? what went well? anything you are worried about?

CHILDREN'S SCHEDULING:
Avoid overscheduling: children need unstructured play time. Maximum 2-3 structured activities per child per week (depending on age). Consider the impact on the whole family - one child's activity affects everyone's schedule. Transport logistics: carpool with other families where possible. Balance: academic, physical, creative, and social activities.

SCHOOL ADMINISTRATION:
Start-of-term admin: update contact details, medical information, dietary requirements, permission forms. Weekly: check book bags, school communication (app/email/letters), homework support, reading practice, PE kit. Ongoing: parent evening dates in calendar, school trip payments, non-uniform day costumes/donations, school events (sports day, nativity, fairs). Secondary school transition: open evenings, application deadlines (October for grammar/selective, January for standard applications).

HOME MAINTENANCE SCHEDULE:
Monthly: test smoke and CO alarms, clean oven, descale kettle, check tyre pressures, clean washing machine (maintenance wash). Quarterly: deep clean fridge, check fire extinguisher, clean extractor fans, flush taps not regularly used (legionella prevention). Annually: boiler service (ideally August/September before winter), chimney sweep, gutter clean, roof check, window seal inspection. As needed: re-grout bathroom, touch up paintwork, oil hinges and locks.

EMERGENCY PREPAREDNESS:
Household emergency contact list (visible on fridge or noticeboard): NHS 111, GP surgery, out-of-hours doctor, nearest A&E, pharmacy, school, emergency contacts (2-3 trusted adults), water company (leak), electricity (105 for power cuts), gas emergency (0800 111 999), police non-emergency (101), fire service non-emergency.
Basic home first aid kit: plasters, antiseptic wipes, bandages, scissors, tweezers, paracetamol (adult and child), ibuprofen, antihistamines, digital thermometer, ice pack, burns dressing.
Know the location of: stopcock (water), fuse box/consumer unit, gas isolation valve, meter locations. Teach older children these locations too.

FINANCIAL HOUSEHOLD MANAGEMENT:
Family budget: track income and all outgoing categories (mortgage/rent, utilities, food, transport, childcare, insurance, subscriptions, clothing, entertainment, savings). Review monthly. The 50/30/20 guideline: 50% needs, 30% wants, 20% savings and debt repayment. Regular subscription audit: cancel unused memberships, streaming services, apps. Compare utility prices annually (use comparison sites). Child savings: Junior ISA (tax-free, up to 9,000/year), premium bonds, regular saver accounts.

SELF-CARE FOR CARERS:
Running a household is relentless, largely invisible work. Parental burnout is real and increasingly recognised. Signs: emotional exhaustion, emotional distancing from children, loss of fulfilment in parenting role, contrast between previous and current parental self. Strategies: delegate genuinely (not just tasks but the mental load of remembering and planning), lower standards deliberately (good enough IS good enough), protect personal time (even 30 minutes daily), maintain at least one interest or identity beyond parenting, connect with other parents (shared experience reduces isolation), professional support through GP if struggling.`);

// Interactive Quiz
expand('interactive-quiz-companion.json', `ADVANCED QUIZ MASTERY:

QUESTION CRAFTING PRINCIPLES:
Good quiz questions are unambiguous, have one clearly correct answer, are pitched at the right difficulty, and ideally teach something interesting even when answered incorrectly. Avoid: questions with multiple defensible answers, trick questions that rely on gotchas rather than knowledge, questions so obscure that nobody could reasonably know the answer.

DIFFICULTY CALIBRATION:
Easy: facts that most adults encounter through school, media, or general culture. 'What is the capital of France?' 'How many sides does a hexagon have?'
Medium: requires specific knowledge or recall beyond general culture. 'In what year did the Berlin Wall fall?' 'What is the chemical symbol for gold?'
Hard: requires specialist knowledge, detailed recall, or connecting obscure facts. 'Which element has the highest melting point?' 'Who composed the opera The Magic Flute?'
Expert: deep knowledge that even enthusiasts might struggle with. Use sparingly and celebrate when answered.

CATEGORY DEEP DIVES:

HISTORY:
Ancient civilisations (Egypt, Greece, Rome, Mesopotamia, Indus Valley, China), Medieval period, Renaissance, Age of Exploration, Industrial Revolution, World Wars, Cold War, decolonisation, modern history. British history: monarchs, key dates (1066, 1215 Magna Carta, 1666 Great Fire, 1707 Acts of Union, 1815 Waterloo, 1914/1939 World Wars, 1969 Moon landing). Focus on stories and human interest, not just dates.

SCIENCE AND NATURE:
Biology (human body, animals, plants, ecosystems, evolution, genetics), Chemistry (elements, reactions, everyday chemistry), Physics (forces, energy, light, sound, space, quantum concepts simplified), Earth Science (geology, weather, climate, oceans, volcanoes). Nature: animal records (fastest, tallest, oldest, smallest), endangered species, bizarre adaptations, natural phenomena.

GEOGRAPHY:
Physical: mountains, rivers, deserts, oceans, volcanoes, earthquakes, climate zones. Political: countries, capitals, flags, currencies, languages. Human: populations, cultures, landmarks, food. Map skills: continent identification, famous borders, island nations.

SPORT:
Football (World Cup history, Premier League records, international), Cricket, Rugby, Tennis (Grand Slams), Olympics (summer and winter), Athletics, Boxing, Formula 1, Golf, Swimming. Records, famous moments, sporting legends.

ENTERTAINMENT:
Film (Academy Awards, directors, actors, franchises, iconic quotes), Television (classic and contemporary, British and international), Music (genres, number ones, albums, instruments, music theory basics), Theatre (West End, musicals, Shakespeare), Gaming, Comedy.

LITERATURE:
Classic and contemporary fiction, poetry, children's literature, authors and their works, literary prizes (Booker, Nobel, Pulitzer), Shakespeare, literary movements, opening lines, famous characters.

FOOD AND DRINK:
Cuisine by country, cooking techniques, ingredients, wine regions, beer varieties, cocktails, food history, molecular gastronomy, famous chefs, food science.

PUB QUIZ FORMAT:
Traditional pub quiz structure: 6-8 rounds of 10 questions, mixture of themed and general knowledge rounds, picture round (adapted to descriptive for voice), music round, joker round (team doubles their score on one chosen round), bonus questions. Common themed rounds: connections (all answers share a hidden link), sequences (identify the pattern and provide the next item), missing link, initials (answers are given as initials to decode).

QUIZ LEAGUE PREPARATION:
Quiz league format varies but typically: individual buzzer rounds, team rounds, specialised subject rounds, picture/music identification. Preparation: read widely (newspapers, magazines, non-fiction), watch quiz shows (University Challenge, Only Connect, Pointless), use spaced repetition for facts you want to retain, join online quiz communities, practice with past quiz league papers.

BRAIN TRAINING GAMES:
Number sequences: identify the pattern and predict the next number. Start simple (2, 4, 6, 8, ?) and progress to complex (1, 1, 2, 3, 5, 8, 13, ?).
Logic puzzles: Einstein's riddle style (grid puzzles with clues), Sudoku-style reasoning, deductive reasoning chains.
Lateral thinking: 'A man walks into a bar and asks for a glass of water. The bartender pulls out a gun and points it at him. The man says thank you and leaves. Why?' (Answer: he had hiccups).
Memory challenges: Kim's Game (list items, recall after removal), story recall (listen to a short story, answer questions about details), number recall (increasingly long number sequences).
Pattern recognition: visual patterns described verbally, mathematical patterns, word patterns.

COMPETITIVE FORMATS:
Head to Head: alternating questions, first to 10 correct wins.
Fastest Finger: timed responses, bonus points for speed.
Millionaire Style: increasing difficulty with lifelines (50/50, phone a friend analogy, ask the audience analogy).
Weakest Link Style: banking correct answers in chains.
Jeopardy Style: given the answer, provide the question.
Countdown Style: word and number games.`);

// Now expand the remaining education roles with much more depth
// I'll add substantial content to each

const expansions = {
'open-university-study-mentor.json': `ADVANCED OU STUDY STRATEGIES:

MODULE WEBSITE NAVIGATION:
The module website is your learning hub. Key areas: Study Calendar (your week-by-week guide - follow it religiously), Assessment tab (TMA and EMA details, marking criteria, submission dates), Resources (additional reading, podcasts, videos, interactive activities), Forums (module-wide and tutorial group discussions), Library links (databases and e-resources relevant to your module).

Tips for using the module website effectively: bookmark frequently used pages, download PDFs for offline study, set calendar reminders for assessment dates at the start of the module, check the News and Announcements section weekly, participate in forums even if you feel uncertain - other students share your doubts.

EFFECTIVE NOTE-TAKING FOR DISTANCE LEARNING:
The challenge of distance learning is that you do not have a lecturer highlighting what is important. You must identify key points yourself. Strategies:

Cornell Method: divide your page into three sections - a narrow left column for cues/questions, a wide right column for notes, and a bottom section for summary. During study: write detailed notes in the right column. After study: write questions and key terms in the left column. At the end: write a brief summary at the bottom. This structure supports both understanding and revision.

Active annotation: do not just highlight text. Write marginal notes: 'connects to Block 1 theory,' 'could use this in TMA 02,' 'disagree - see Jones (2019),' 'key definition,' 'exam topic.' Annotations that connect ideas across the module are more valuable than highlighting facts.

Mind mapping: for visual learners, create mind maps connecting key concepts within each block. Show relationships between theories, evidence, and arguments. Particularly useful for revision and essay planning.

FORUM PARTICIPATION:
OU forums are a learning tool, not just social media. Benefits: testing your understanding by explaining concepts to others, encountering perspectives you had not considered, reducing isolation, getting peer support near TMA deadlines. Good forum practice: read before posting (your question may already be answered), contribute substantively (not just 'I agree'), respect diverse viewpoints, avoid sharing TMA answers (academic misconduct), use forums to discuss concepts and approaches rather than specific answers.

TUTORIAL ATTENDANCE:
Whether online (Adobe Connect, Teams, or Zoom) or face-to-face, tutorials are your opportunity for live interaction with your AL and fellow students. Preparation: read the relevant material before the tutorial, note any questions or points of confusion, complete any pre-tutorial activities. During: participate actively, ask your questions, take notes on AL explanations and peer discussions. After: review your notes, follow up on any points you did not fully understand. Some students skip tutorials because they feel behind on studying. This is counterproductive - tutorials often clarify material more efficiently than re-reading.

RESIDENTIAL SCHOOLS AND DAY SCHOOLS:
Some modules include optional or compulsory residential schools. These are intensive learning experiences over several days at a UK location. They provide: hands-on practical work (essential for science modules), face-to-face interaction with staff and students, immersive focus on the module. Preparation: read the pre-residential preparation materials, pack comfortable clothes, be prepared for long days of intensive study, bring note-taking materials, and approach the experience with openness.

MANAGING STUDY WITH WORK AND FAMILY:
This is the defining challenge of OU study. Practical strategies:

Communication: tell your employer, partner, family, and friends about your study commitments. Be specific: 'I need Tuesday and Thursday evenings, and Saturday mornings, for study.' People support what they understand.

Negotiation: with your employer (can you study during lunch breaks? Is there a quiet room? Would they support flexible working for exam periods?), with your partner (explicit agreement about who manages childcare/household tasks during your study time), with friends (they need to understand that social commitments may be reduced temporarily).

Protected study time: treat it as non-negotiable. If your study time is 7-9pm Tuesday, that is your appointment with your future. Close the door, put your phone away, and study. The family will survive without you for two hours.

Efficient study: not all study is equal. Active study (making notes, answering questions, applying concepts) is worth three times more than passive study (re-reading, highlighting). In limited time, always choose active methods.

Good enough: perfectionism is the enemy of progress in distance learning. An 80% effort TMA submitted on time is infinitely better than a 100% effort TMA submitted late or not at all. Lower your standards slightly and meet your deadlines.

STUDY SKILLS DEVELOPMENT ACROSS LEVELS:
Level 1: focus on developing habits - regular study routine, note-taking, basic academic writing, Harvard referencing, engaging with module materials systematically.
Level 2: develop analytical skills - move beyond description to analysis, engage critically with sources, strengthen argument construction, improve essay planning, develop time management for increased workload.
Level 3: develop independence - formulate research questions, conduct independent literature searching, synthesise complex arguments, write at near-professional academic standard, manage longer independent projects.
Postgraduate: expect to work at the forefront of the discipline, engage with primary research, demonstrate original thinking, produce work of publishable standard.

DEALING WITH SETBACKS:
Failed a TMA: it happens. Read the feedback carefully. Identify what went wrong. Contact your AL for guidance. The module grade is often an aggregate - one poor TMA can be recovered. Failed a module: you can resit or retake. Contact Student Support to understand options and financial implications. It is not the end of your degree journey. Life crisis during study: the OU has procedures for exactly this. Interruption of study, extensions, deferrals, and reduced study loads are all available. Contact Student Support as early as possible. Do not simply disappear - the OU wants to help you continue.

DEGREE CLASSIFICATION:
OU degrees are classified based on credit-weighted grades from Level 2 and Level 3 modules only (Level 1 counts toward credit total but not classification). First Class Honours: average grade equivalent above approximately 85. Upper Second (2:1): approximately 70-84. Lower Second (2:2): approximately 55-69. Third: approximately 40-54. Each module's grade is weighted by its credit value. Level 3 modules carry double the weight of Level 2 in the classification algorithm.`,

'open-university-assignment-coach.json': `ADVANCED ASSIGNMENT COACHING:

DEVELOPING A FIRST-CLASS ARGUMENT:

The Architecture of Academic Argument:
A first-class essay does not just answer the question - it makes a compelling, well-evidenced, nuanced argument about the question. The difference between a 65 and an 85 often lies in the sophistication of the argument structure.

Thesis-Antithesis-Synthesis: the dialectical approach works well for evaluative questions. Present the strongest argument for a position (thesis), present the strongest counterargument (antithesis), then reach a nuanced conclusion that accounts for both (synthesis). This demonstrates the higher-order thinking markers are looking for.

Signposting: guide the reader through your argument. Introduction: 'This essay will argue that... This argument will be developed through three main areas...' Body transitions: 'Having established that X, it is now necessary to consider Y...' 'While the evidence for X is compelling, a more nuanced picture emerges when considering...' Conclusion: 'In light of the evidence examined, this essay has argued that...'

Counter-argument engagement: the strongest essays do not just present one side. They identify the best counter-arguments and address them. 'Critics of this position argue that... (Smith, 2020). However, this criticism is weakened by...' This shows intellectual maturity and genuine critical engagement.

WORKING WITH MODULE MATERIALS AS EVIDENCE:

The OU expects you to engage primarily with module materials for TMAs. This demonstrates that you have studied and understood the module content. External sources supplement but do not replace module engagement.

How to use module materials effectively:
- Reference specific module units, not just 'the module materials'
- Quote or paraphrase specific arguments, data, and theories from the module
- Show that you have read the set readings (articles, book chapters, case studies assigned in each unit)
- Connect ideas across different units and blocks - the module is designed as a coherent whole
- Use the module's theoretical framework as the lens through which you analyse your topic

When to use external sources:
- To supplement module coverage with more recent research
- To provide additional evidence for arguments
- To demonstrate wider reading beyond the minimum
- To access empirical data or case studies not covered in the module
- At Level 3: external sources become increasingly important as independent research is expected

COMMON TMA TYPES AND HOW TO APPROACH THEM:

The Essay: Plan your argument before writing. Introduction (10%): context, scope, thesis statement, structure outline. Body (80%): PEEL paragraphs building a cumulative argument. Each paragraph should earn its place - if it does not contribute to your argument, cut it. Conclusion (10%): synthesise, do not summarise. What is your answer to the question?

The Report: often used in business, science, and technology modules. Structure: Title, Executive Summary (brief overview of findings and recommendations), Introduction (context and purpose), Methodology (if applicable), Findings (organised by theme, with evidence), Discussion (analysis of findings, linking to theory), Conclusions, Recommendations (specific, actionable, justified). Use headings and numbered sections. Write clearly and concisely. Include tables or bullet points where appropriate.

The Case Study Analysis: apply module theory to a specific scenario. Structure: brief summary of the case, identification of key issues, theoretical analysis (apply module frameworks to the case), evaluation (how well do the theories explain the case? What are the limitations?), recommendations (what should the organisation/individual do and why?). The key skill: connecting theory to practice. Do not just describe the case, and do not just describe the theory - analyse the case THROUGH the theory.

The Reflective Essay: requires first-person writing (unusual in academic work). Use a reflective model: Gibbs (Description, Feelings, Evaluation, Analysis, Conclusion, Action Plan) or Driscoll (What? So what? Now what?). Go beyond description to analytical reflection: do not just describe what happened - analyse WHY it happened, what you learned, how it changed your thinking, and what you would do differently. Connect personal experience to module theory.

The Portfolio: a curated collection of evidence. Quality over quantity. Each piece should demonstrate specific learning outcomes or competencies. Include a reflective commentary explaining what each piece demonstrates and how it connects to module themes.

REVISION AND EXAM PREPARATION (FOR MODULES WITH EXAMS):

Past papers: the single most valuable revision tool. Work through under timed conditions. Mark against model answers and examiner reports. Identify recurring topics and question styles.

Revision techniques: active recall (test yourself without looking at notes), spaced repetition (review material at increasing intervals), elaborative interrogation (ask yourself 'why?' and 'how?' for every fact), the Feynman technique (explain the concept as if teaching a child - if you cannot explain it simply, you do not understand it well enough).

Exam day: read ALL questions before choosing (do not dive into the first one that looks familiar). Plan your time based on marks available. Spend 5 minutes planning each answer before writing. Answer the question asked, not the question you wish had been asked. If you run out of time, write in bullet points - some marks are better than none.

REFERENCING PRECISION:

Harvard style - common OU issues:
- Secondary referencing: 'As Smith (2015, cited in Jones, 2020) argues...' Only Jones appears in the reference list (because that is the source you actually read). Use sparingly.
- Multiple works by same author in same year: Smith (2020a), Smith (2020b)
- No date: Smith (n.d.)
- No author: use the title in the in-text citation
- Module materials: '(The Open University, 2024, Unit 3, p. 27)' or as specified in your module guide
- Direct quotes: must include page number and use quotation marks for short quotes or indented block for quotes over 40 words
- Paraphrasing: still needs a citation even though you are using your own words

DEVELOPING YOUR ACADEMIC VOICE:

Many students struggle with finding their academic voice - the balance between using sources and expressing their own analysis. Your voice is heard through:
- How you select and combine evidence (the choice of what to include is analytical)
- How you interpret evidence ('This suggests that...' 'This finding can be explained by...')
- How you evaluate evidence ('However, the strength of this claim is limited by...')
- How you connect ideas ('When considered alongside [other evidence], this paints a picture of...')
- Your thesis statement and conclusion (these should be YOUR position, supported by evidence)

Your voice is NOT heard through: unsupported opinions, personal anecdotes (unless reflective writing), emotional language, rhetorical questions, or first-person statements in standard academic essays.`,

'academic-writing-coach.json': `ADVANCED ACADEMIC WRITING:

DISCIPLINE-SPECIFIC WRITING CONVENTIONS:

Humanities (History, Literature, Philosophy, Languages):
- Often uses first person cautiously ('In this essay, I will argue...')
- Extensive use of direct quotation from primary sources (historical documents, literary texts, philosophical works)
- MHRA or Chicago footnote referencing common
- Arguments built through close textual analysis and interpretation
- Historiographical awareness: not just what happened but how different historians have interpreted events
- Literary analysis: close reading, theoretical frameworks (feminism, post-colonialism, structuralism, psychoanalytic), engaging with secondary criticism

Social Sciences (Psychology, Sociology, Politics, Education):
- Generally third person, impersonal register
- Heavy reliance on empirical research evidence
- APA or Harvard referencing
- Methodology awareness: understanding how evidence was generated
- Statistical literacy: ability to interpret and critique quantitative findings
- Theory-evidence integration: applying theoretical frameworks to empirical data
- Policy implications: connecting academic findings to real-world applications

Sciences (Biology, Chemistry, Physics, Engineering):
- Passive voice traditionally used ('The experiment was conducted...' though some journals now accept active voice)
- Vancouver or IEEE referencing
- IMRAD structure: Introduction, Methods, Results, and Discussion
- Precision in reporting: exact measurements, statistical significance, confidence intervals
- Reproducibility: sufficient methodological detail for replication
- Tables and figures: data presentation through visual means
- Conciseness valued: shorter is better if clarity is maintained

Business and Management:
- Harvard referencing
- Report format common (executive summary, headings, recommendations)
- Case study analysis: applying theory to practice
- Professional register with accessibility: academic rigour without unnecessary jargon
- Data-driven arguments: statistics, financial data, market research
- Strategic recommendations: actionable, specific, justified

ADVANCED PARAGRAPH CONSTRUCTION:

The Concession Paragraph: acknowledge the strongest counter-argument and address it. Structure: 'It could be argued that... [present counter-argument fairly and at its strongest]. Indeed, [concede what is valid about the counter-argument]. However, [explain why your position remains stronger, with evidence]. Therefore, while the counter-argument has some merit, the weight of evidence supports...'

The Synthesis Paragraph: bring together insights from multiple sources to create new understanding. Not just 'Smith says X, Jones says Y' but 'The convergence of Smith's (2020) quantitative findings and Jones's (2021) qualitative insights suggests a more nuanced picture in which...' This is the highest level of academic writing and is what distinguishes first-class work.

The Pivot Paragraph: transitions between major sections of your argument. 'Having established that [summary of previous section's argument], it is now necessary to consider [introduction to next section's focus], since [explanation of why this transition is logical and necessary].'

LITERATURE REVIEW TECHNIQUE:

Finding sources:
Start with your module reading list and recommended texts. Use Google Scholar for recent papers (filter by date). Search key databases: JSTOR (humanities and social sciences), Web of Science (sciences), PubMed (biomedical), Scopus (multidisciplinary). Use Boolean operators: AND (narrows: 'climate change AND agriculture'), OR (broadens: 'teenagers OR adolescents'), NOT (excludes: 'depression NOT economic'). Use truncation: teach* finds teaching, teacher, teachers. Citation chaining: when you find a key paper, check its references (backward chaining) and who has cited it (forward chaining via Google Scholar).

Evaluating sources:
Currency: how recent is it? Is this a field where recency matters?
Relevance: does it directly address your research question?
Authority: who wrote it? What are their credentials? Where is it published? (Peer-reviewed journals carry more weight than popular press.)
Methodology: is the research design appropriate? Is the sample size adequate? Are the conclusions supported by the evidence?
Bias: does the author have a potential conflict of interest? Is the research funded by an interested party?

Synthesising (not summarising):
A literature review that goes: 'Smith (2020) found X. Jones (2021) found Y. Brown (2022) found Z.' is a summary, not a synthesis. A synthesis organises by theme, identifies patterns, highlights contradictions, and evaluates the collective body of evidence:

'Research on [topic] has evolved significantly over the past decade. Early studies focused primarily on [aspect], with Smith (2015) and Jones (2016) both demonstrating [finding]. However, more recent work has challenged this consensus, with Brown (2020) identifying [contradiction] and Lee (2021) proposing [alternative explanation]. The methodological limitations of the earlier studies - particularly their reliance on [method] and [limitation] - may partially account for this discrepancy. A more comprehensive picture emerges from mixed-methods research such as Garcia (2022), which suggests that [synthesis of insights].'

PROOFREADING STRATEGY:

Read your essay aloud. This catches: awkward phrasing, run-on sentences, missing words, unclear pronoun references, and rhythm problems.

Proofread in multiple passes, each looking for different things:
Pass 1: Argument flow. Does each paragraph contribute? Is the logical progression clear?
Pass 2: Evidence. Is every claim supported? Are all citations present?
Pass 3: Referencing. Do in-text citations match the reference list? Is formatting consistent?
Pass 4: Grammar and spelling. Subject-verb agreement, tense consistency, punctuation.
Pass 5: Formatting. Word count, margins, font, heading styles, page numbers.

Leave at least 24 hours between writing and final proofreading. Fresh eyes catch errors that tired eyes miss.`
};

for (const [file, content] of Object.entries(expansions)) {
  expand(file, content);
}

// Expand remaining shorter roles
const moreExpansions = {
'mba-corporate-finance-mentor.json': `ADVANCED CORPORATE FINANCE TOPICS:

REAL OPTIONS ANALYSIS:
Traditional NPV analysis assumes a now-or-never decision. Real options recognise that managers have flexibility to adapt decisions as uncertainty resolves. Types of real options:
Option to delay: wait for better information before investing. Valuable when uncertainty is high and the investment is partially or fully irreversible.
Option to expand: invest in a small project now with the option to scale up if conditions are favourable. The initial investment buys information.
Option to abandon: walk away from a project if it performs poorly. Salvage value is the floor.
Option to switch: flexibility to change inputs, outputs, or processes. Manufacturing plants that can use multiple fuels, product lines that can be retooled.
Growth options: R&D spending and platform investments that open up future opportunities.
Valuation: use decision tree analysis for simple cases, or binomial option pricing/Black-Scholes adaptation for more rigorous valuation. Real options are most valuable when: uncertainty is high, there is room for managerial flexibility, and NPV is near zero (options tip the balance).

ADVANCED VALUATION TECHNIQUES:
Comparable Companies Analysis (Trading Comps): select peer group (same industry, size, geography, growth profile), calculate multiples (EV/EBITDA, EV/Revenue, P/E), apply median or mean multiple to target metrics, adjust for company-specific factors (growth premium/discount, margin differences, risk).
Precedent Transaction Analysis (Deal Comps): identify relevant M&A transactions, calculate implied multiples, apply to target. Typically yields higher values than trading comps due to control premium. Adjust for market conditions at time of transaction.
Sum-of-the-Parts (SOTP): value each business unit separately using most appropriate methodology, sum to get total enterprise value. Useful for diversified conglomerates. May reveal conglomerate discount (sum of parts > whole due to complexity discount).
Leveraged Recapitalisation: value based on what a financial buyer would pay. Useful for assessing private equity interest. Back into equity value from affordable debt levels and required returns.
Football Field Chart: present all valuation methodologies on a single chart showing ranges. The overlap zone suggests a reasonable valuation range.

CAPITAL ALLOCATION AND SHAREHOLDER VALUE:
Capital allocation is arguably the most important CEO function. Options: reinvest in existing operations (organic growth), acquire other businesses (inorganic growth), pay dividends, repurchase shares, pay down debt, hold cash. Optimal allocation depends on: available investment opportunities above WACC, company lifecycle stage, tax efficiency, signalling effects, shareholder preferences.
Economic Value Added (EVA) = NOPAT - (WACC x Capital Employed). Positive EVA means the company is creating value above its cost of capital. EVA decomposition reveals which business units create and destroy value.

FINANCIAL DISTRESS AND RESTRUCTURING:
Altman Z-Score: multivariate model predicting bankruptcy probability. Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E (where A-E are financial ratios). Z > 2.99: safe. Z < 1.81: distress zone. Between: grey zone.
Restructuring options: operational (cost cutting, asset sales, management changes), financial (debt renegotiation, debt-equity swaps, rights issues, exchange offers), strategic (mergers, spin-offs, divestitures). Chapter 11 (US) / Administration (UK): reorganisation under court protection. Pre-pack administration: arranged sale before formal administration begins.

INTERNATIONAL CORPORATE FINANCE:
Cross-border valuation: currency risk (transaction, translation, economic exposure), country risk premium, political risk, repatriation restrictions. Interest rate parity, purchasing power parity, and the international Fisher effect. Transfer pricing considerations. Tax treaties and withholding taxes.

BEHAVIOURAL CORPORATE FINANCE:
Managerial overconfidence: CEOs systematically overestimate their ability to create value, leading to overpayment in M&A and excessive investment. Winner's curse in auctions. Empire building: managers prefer larger firms for status and compensation, even when growth destroys value. Short-termism: pressure from quarterly earnings targets leads to underinvestment in long-term value creation. Agency costs: misalignment between manager and shareholder interests. Governance mechanisms: board independence, executive compensation design (long-term incentives, clawbacks), activist investors.

CASE STUDY METHOD FOR FINANCE:
Approach: read the case once quickly for overview, read the assigned questions, read the case again slowly making notes relevant to each question, gather data (financial statements, market data from exhibits), perform analysis (calculate ratios, build models, apply frameworks), develop recommendations with supporting evidence. Common pitfalls: restating the case without analysis, performing calculations without interpreting results, making recommendations without financial justification, ignoring qualitative factors (management quality, competitive position, industry dynamics).`,

'mba-strategy-mentor.json': `ADVANCED STRATEGIC MANAGEMENT:

RESOURCE-BASED VIEW IN DEPTH:
Tangible resources: financial (cash reserves, borrowing capacity), physical (plant, equipment, location, raw materials), technological (patents, copyrights, trade secrets). Intangible resources: human (expertise, trust, skills, collaborative ability), innovation (R&D capability, innovation culture, scientific capability), reputational (brand, reputation with customers, suppliers, employees). Organisational capabilities: the firm's capacity to deploy resources to a desired end. Threshold capabilities (necessary but not sufficient for competitive advantage) vs distinctive capabilities (unique strengths).

Path dependence: a firm's resources and capabilities are shaped by its history. This creates both advantage (difficult for competitors to replicate a unique history) and inertia (difficult to change direction). Core rigidities (Leonard-Barton): when core competencies become so embedded that they prevent adaptation.

GAME THEORY AND COMPETITIVE DYNAMICS:
Nash Equilibrium: a set of strategies where no player can improve their outcome by unilaterally changing their strategy. In business: price wars often reach Nash equilibria where both firms earn lower profits than they would through cooperation, but neither can unilaterally raise prices.
Prisoner's Dilemma: in one-shot games, rational players defect even though cooperation would yield better joint outcomes. In repeated games (ongoing competitive interaction), cooperation can emerge through tit-for-tat and reputation effects.
First-mover advantage: network effects, switching costs, pre-emption of scarce resources, learning curve advantages. But: first-mover disadvantages include free-riding by followers, resolution of market uncertainty by followers, potential for incumbent inertia.
Commitment and signalling: credible commitments (capacity investment, long-term contracts, brand investment) signal intentions and deter entry. Signals are only effective if they are costly and therefore credible.

DYNAMIC CAPABILITIES AND STRATEGIC AGILITY:
Teece's framework: sensing (scanning the environment for opportunities and threats), seizing (mobilising resources to capture opportunities), transforming (reconfiguring resources and organisation to maintain competitiveness). Ambidexterity (O'Reilly and Tushman): simultaneously exploiting existing businesses (efficiency, execution) while exploring new opportunities (innovation, experimentation). Structural separation or contextual ambidexterity.

PLATFORM STRATEGY AND NETWORK EFFECTS:
Platform businesses (Uber, Airbnb, Amazon Marketplace) create value by facilitating interactions between two or more user groups. Network effects: direct (value increases with same-side users - social networks) and indirect (value increases with cross-side users - more riders attract more drivers). Winner-take-all dynamics vs multi-homing. Platform envelopment: using a position in one market to enter adjacent markets. Chicken-and-egg problem: how to attract both sides when neither side wants to join without the other. Strategies: subsidise one side, single-player mode, seeding.

SCENARIO PLANNING:
Structured approach to thinking about the future under deep uncertainty. Not forecasting (predicting) but exploring (preparing for multiple futures). Steps: identify focal question, identify driving forces (key uncertainties and predetermined elements), construct 2x2 matrix using two critical uncertainties, develop 3-4 scenario narratives, identify strategic implications and robust strategies. Shell pioneered scenario planning in the 1970s - prepared for oil price collapse when competitors did not.

STRATEGY EXECUTION:
Balanced Scorecard (Kaplan and Norton): translate strategy into measurable objectives across four perspectives - Financial (how do we look to shareholders?), Customer (how do customers see us?), Internal Business Process (what must we excel at?), Learning and Growth (can we continue to improve?). Strategy maps connect objectives across perspectives in cause-and-effect chains.

McKinsey 7S Framework: Strategy, Structure, Systems (hard elements) and Shared Values, Skills, Style, Staff (soft elements). All seven must be aligned for effective execution. Hard elements are easier to change; soft elements are more resistant but often more important.

CORPORATE GOVERNANCE AND STAKEHOLDER THEORY:
Shareholder primacy (Friedman): the social responsibility of business is to increase profits. Stakeholder theory (Freeman): firms should create value for all stakeholders - customers, employees, suppliers, communities, shareholders. Enlightened shareholder value: long-term shareholder value is best served by considering all stakeholders. ESG (Environmental, Social, Governance): increasingly integrated into corporate strategy and investment decisions. Corporate purpose beyond profit: B Corps, benefit corporations, purpose-driven strategy.

STRATEGIC LEADERSHIP:
Transformational vs transactional leadership. Visionary leadership: articulating a compelling future state and mobilising people toward it. Strategic decision-making under uncertainty: pattern recognition, cognitive biases (confirmation bias, anchoring, groupthink), devil's advocate processes. Board composition and governance: independent directors, board diversity, CEO duality (chair and CEO same person - governance concern).`,

'mba-marketing-mentor.json': `ADVANCED MARKETING STRATEGY:

CUSTOMER JOURNEY MAPPING:
The modern customer journey is non-linear. Traditional funnel (Awareness > Interest > Desire > Action) replaced by more complex models. Google's Messy Middle: between trigger and purchase, consumers explore (expanding options) and evaluate (narrowing options) in a loop. Touchpoint analysis: identify every interaction between customer and brand. Moments of truth: Zero (online research), First (in-store/purchase experience), Second (usage experience), Ultimate (sharing experience). Journey mapping exercise: persona selection, stage identification, touchpoint mapping, emotional arc, pain points, opportunities for improvement.

BRAND POSITIONING ADVANCED:
Brand archetypes (Jung/Mark and Pearson): 12 archetypes (Innocent, Explorer, Sage, Hero, Outlaw, Magician, Regular Guy, Lover, Jester, Caregiver, Creator, Ruler). Choosing an archetype provides consistent brand personality across all touchpoints. Examples: Nike (Hero), Apple (Magician), Dove (Caregiver), Harley-Davidson (Outlaw).

Category entry points (Ehrenberg-Bass Institute): the situations, needs, or occasions that trigger category thoughts. Brands grow by being linked to more category entry points in more people's minds. Mental availability (brand salience) is often more important than brand positioning.

Distinctive brand assets: the non-brand-name elements that trigger brand recognition. Colour (Tiffany blue, Cadbury purple), shapes (Nike swoosh, Apple), sounds (Intel chime, McDonald's ba-da-ba-ba-ba), characters (Compare the Meerkat, Tony the Tiger), taglines. Build and protect distinctive assets as they drive effortless recognition.

PRICING STRATEGY ADVANCED:
Price-quality signalling: price acts as a quality cue, especially when other quality indicators are absent. Luxury brands deliberately maintain high prices to signal exclusivity.
Reference price: the price consumers expect to pay based on experience, competition, and context. Anchor pricing: present a high reference price first to make the target price seem reasonable.
Bundle pricing: pure bundling (only available as package), mixed bundling (available separately or as package - usually more profitable as it captures diverse willingness to pay), unbundling (stripping components to reduce headline price).
Subscription and recurring revenue: customer lifetime value calculation, churn reduction strategies, pricing tiers (good-better-best), free trial to paid conversion optimisation.
Freemium model: free basic tier attracts users, premium tier monetises. Conversion rates typically 2-5%. The free tier must deliver enough value to attract but leave enough desire to upgrade.

DIGITAL MARKETING STRATEGY ADVANCED:
Marketing automation: lead scoring, drip campaigns, behavioural triggers, progressive profiling. Tools: HubSpot, Marketo, Pardot, Mailchimp (for smaller operations).
Growth hacking: rapid experimentation across marketing channels to find the most efficient growth levers. AARRR funnel (Dave McClure): Acquisition, Activation, Retention, Referral, Revenue. Focus on the metric that matters most at each stage.
Influencer marketing: nano (1K-10K followers, highest engagement), micro (10K-100K), macro (100K-1M), mega (1M+). Selection criteria: audience relevance, engagement rate (not just follower count), authenticity, brand fit. ROI measurement: track through unique codes, UTM parameters, branded landing pages.
Performance marketing: cost per acquisition (CPA), return on ad spend (ROAS), customer acquisition cost (CAC). A/B testing: test one variable at a time, statistical significance required, document and institutionalise learnings.

MARKETING ANALYTICS:
Key metrics by channel: Website (sessions, bounce rate, conversion rate, time on site, pages per session), Email (open rate, click rate, unsubscribe rate, list growth), Social (engagement rate, reach, sentiment, share of voice), Paid (CTR, CPC, CPA, ROAS, quality score), SEO (organic traffic, keyword rankings, domain authority, backlink profile).
Cohort analysis: group users by acquisition date and track behaviour over time. Reveals whether retention is improving across cohorts.
RFM analysis (Recency, Frequency, Monetary): segment customers by how recently they purchased, how often, and how much they spend. Target high-value segments with retention strategies and low-value segments with win-back campaigns.
Net Promoter Score (NPS): 'How likely are you to recommend us?' Scale 0-10. Promoters (9-10), Passives (7-8), Detractors (0-6). NPS = %Promoters - %Detractors. Simple but powerful indicator of customer loyalty and growth potential.

INTERNATIONAL MARKETING:
Standardisation vs adaptation debate: standardise for efficiency and brand consistency (Levitt's globalisation thesis), adapt for cultural relevance and local consumer needs (Bartlett and Ghoshal's transnational model). Most firms adopt a glocal approach: global strategy with local execution.
Cultural dimensions (Hofstede): power distance, individualism vs collectivism, masculinity vs femininity, uncertainty avoidance, long-term vs short-term orientation, indulgence vs restraint. Impact on: advertising appeals, product design, pricing strategy, distribution channels.
Market entry strategies: direct export, agent/distributor, licensing, franchising, joint venture, wholly-owned subsidiary, acquisition. Selection based on: control required, risk tolerance, investment capacity, local knowledge needs, speed to market.

PRODUCT INNOVATION AND NPD:
Stage-Gate process (Cooper): idea generation, screening, business case, development, testing, launch. Each gate is a go/no-go decision. Lean Startup (Ries): Build-Measure-Learn. Minimum Viable Product (MVP) to test assumptions quickly and cheaply. Pivot or persevere based on data. Design Thinking (IDEO/Stanford d.school): Empathise, Define, Ideate, Prototype, Test. Human-centred approach to innovation.`
};

for (const [file, content] of Object.entries(moreExpansions)) {
  expand(file, content);
}

console.log('All expansions complete!');
