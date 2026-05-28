# American Defense Readiness 2030 — Interactive Edition — Project Spec

A complete, build-ready specification of the project. Anyone (or any AI tool) can
recreate the entire app from this document alone. Nothing here is invented — it is
the actual structure and data that exist in the repo today.

---

## 1. What the project is

A **standalone interactive website** that presents a long-form policy/advocacy white
paper and makes it usable:

- Browse all **17 sections**.
- **Search** across all sections.
- An **interactive tool in every section** (17 distinct widgets).
- A personal **research dossier** (bookmarks, notes, highlights) saved in the visitor's
  own browser — nothing is sent to a server.
- A **printable** full-document view.

It is a static site: **$0 to host**, no backend, no database. The only thing that ever
costs money is an optional one-time AI step to draft the section prose.

---

## 2. Tech stack

| Concern | Choice |
| :-- | :-- |
| Framework | **Astro 6** (static output) |
| Interactive widgets | **React 19** islands (`@astrojs/react`) |
| Content | **MDX** (`@astrojs/mdx`) — one file per section |
| Styling | **Tailwind CSS 4** (`@tailwindcss/vite`) + typography plugin |
| Search | **Fuse.js** (client-side fuzzy search) |
| AI drafting (optional) | **@anthropic-ai/sdk** in a Node script |
| Hosting | Any static host (Vercel/Netlify/Cloudflare/GitHub Pages) |
| Node | **>= 22.12** |

Run: `npm install`, `npm run dev` (localhost:4321), `npm run build` (→ `./dist/`).

---

## 3. Site metadata (`src/data/site.ts`)

```
title:     "American Defense Readiness 2030"
subtitle:  "Protect & Defend the Unwelcomed"
tagline:   "A National Doctrine to Rescue, Restore, and Defend"
author:    "Project Defend & Protect Our Children (PDPC)"
partners:  "In partnership with America's Future and allied coalitions"
version:   "Version 1.0 — Long-Form Strategic Edition"
```

---

## 4. The 17 sections (master list = `src/data/toc.ts`)

Each section has: number, slug, title, one-line summary, and exactly one interactive
tool. Section prose lives in `content/sections/NN-slug.mdx`; its frontmatter
(`number`, `slug`, `title`, `summary`, `tool`) must match this list.

| # | Slug | Title | Tool |
|:--|:--|:--|:--|
| 1 | introduction | Introduction: The Strategic Crisis of the Republic | readiness-gauge |
| 2 | war-on-the-mind | The War on the Mind: Fifth Generation Warfare and Mass Grooming | concept-explorer |
| 3 | child-centered-deterrence | Child-Centered Deterrence: The Forgotten War at Home | risk-assessment-checklist |
| 4 | osint-humint-watchtower | OSINT + HUMINT as National Shield: The Watchtower Model | intel-source-builder |
| 5 | border-cartel-internal | Border, Cartel, and Internal Threat Posture | threat-map |
| 6 | strategic-stockpiles | Strategic Stockpiles and Domestic Arsenal Zones | stockpile-planner |
| 7 | school-shields-brigades | School Shields and Civic Defense Brigades | brigade-builder |
| 8 | national-rescue-operations | National Rescue Operations & Sanctuary Entry Protocol | protocol-stepper |
| 9 | faith-family-renewal | Faith, Family, and Cultural Renewal Doctrine | pledge-commitment-tracker |
| 10 | safe-usa-fund | SAFE-USA: Strategic Arsenal & Freedom Emergency Fund | fund-allocation-simulator |
| 11 | legislative-framework | PDPC Legislative Framework & PAC-Enabled Mandates | bill-template-generator |
| 12 | psychological-warfare-reversal | Psychological Warfare Reversal Programs (De-hypnosis, Deprogramming) | deprogramming-pathway |
| 13 | surveillance-detox | Strategic Intelligence Reclamation and Surveillance Detox | surveillance-detox-checklist |
| 14 | watchtower-deployment | PDPC Watchtower Deployment Schedule and Global Expansion | deployment-timeline |
| 15 | restoration-metrics | National Restoration Metrics and Deterrence Benchmarks | metrics-dashboard |
| 16 | conclusion-covenant | Conclusion: A New Covenant for a Protected Republic | covenant-builder |
| 17 | appendices | Appendices: Threat Maps, Rescue Protocols, Sample Legislation | appendix-explorer |

**Section summaries** (drive homepage cards + search):

1. Frames the document: converging strategic, institutional, and cultural pressures requiring a coordinated response.
2. Defines fifth-generation warfare and information-age influence operations targeting attention, belief, and identity.
3. A child-protection-centered view of deterrence and a self-assessment of community preparedness.
4. Combining open-source and human intelligence into a layered "watchtower" model; compose source coverage.
5. Surveys threat posture across border, cartel, and internal categories on an interactive map.
6. Strategic stockpiles and domestic arsenal planning, with a per-capita stockpile estimator.
7. School protection and civic defense brigade concepts, with a brigade composition planner.
8. A step-by-step rescue-operations and sanctuary-entry protocol you can track.
9. The cultural renewal doctrine; assemble a personal or community pledge.
10. The proposed SAFE-USA fund and a notional budget allocation simulator.
11. The legislative framework; generates a formatted sample-bill template from selections.
12. Reversal/recovery program concepts as a branching, self-guided pathway.
13. A categorized digital-hardening and "surveillance detox" checklist with progress tracking.
14. The phased deployment schedule and expansion roadmap on an interactive timeline.
15. Restoration metrics and deterrence benchmarks on a baseline / current / target dashboard.
16. Concludes the document; assemble a printable covenant from its principles.
17. Reference appendix: downloadable assets and a searchable glossary.

---

## 5. The 17 interactive tools (behavior + data)

Each tool reads a data object from `src/data/tools/*.ts`. The `tool.dataKey` in the
section's `.mdx` frontmatter selects the data; `ToolRenderer` selects the widget.
Tools are designed so non-coders edit **data only**, never component code.

Shared tool props: `{ data, config?, slug, title?, sectionNumber }`.

### 5.1 readiness-gauge (Section 1) — `readiness`
Bars showing current `value` vs `target` (0–100) per dimension.
```
Strategic Deterrence   42 → 90   (Foreign-facing posture.)
Institutional Trust    35 → 85
Cultural Cohesion      38 → 80
Child Protection       30 → 95   (Central concern of the document.)
Industrial Capacity    55 → 90
```

### 5.2 concept-explorer (Section 2) — `concepts`
Expandable cards: term, definition, list of indicators.
- **Fifth-Generation Warfare (5GW)** — Conflict waged primarily through information,
  perception, and social influence rather than conventional force.
  Indicators: Narrative manipulation · Manufactured consensus · Erosion of shared reality.
- **Attention Capture** — Designing systems to maximize engagement, redirecting focus
  away from deliberate, self-directed thought.
  Indicators: Compulsive use patterns · Infinite feeds · Reward-loop reinforcement.
- **Mass Grooming (as described in the document)** — The document's term for large-scale
  efforts it argues are aimed at shaping the beliefs and identities of young people.
  Indicators: Targeted messaging to minors · Normalization campaigns · Peer-pressure amplification.
- **Identity Disruption** — Pressures the document describes as destabilizing a young
  person's sense of self, faith, and country.
  Indicators: Confusion messaging · Isolation from family · Authority substitution.

### 5.3 risk-assessment-checklist (Section 3) — `deterrenceChecklist`
Each checked item adds `weight`; total score maps to a band.
Items (weight): family safety/communication plan (10); know school protection/reporting
contacts (10); household online-use rules + parental controls (15); connected to
neighborhood/community watch (15); know how to report exploitation/trafficking (20);
children can name several trusted adults (15); aware of local counseling/recovery (15).
Bands (min score → label / note): 0 → Getting started ("Pick two items this week.");
40 → Developing ("Foundation in place; close gaps."); 70 → Prepared ("Strong — keep
current."); 95 → Highly prepared ("Comprehensive. Consider mentoring other families.").

### 5.4 intel-source-builder (Section 4) — `intelSources`
Toggle sources on/off; compute how many of the categories are covered.
Categories: Public web, Social, Community, Field reports, Records.
Sources (kind · category): News & public records (OSINT · Public web); Social media
monitoring (OSINT · Social); Open forums & boards (OSINT · Social); Community tip line
(HUMINT · Community); Faith & civic liaisons (HUMINT · Community); Field observers
(HUMINT · Field reports); Public registries (OSINT · Records).

### 5.5 threat-map (Section 5) — `threats`
Markers on a simplified US map box. `x`/`y` are percentages; `severity` 1–3; filter by
category. Categories: Border, Cartel, Internal.
Markers (category, x, y, sev): Southwest border corridor (Border, 30, 78, 3); Gulf
trafficking routes (Cartel, 47, 82, 3); Southwest distribution hub (Cartel, 33, 60, 2);
Northeast urban node (Internal, 82, 32, 2); Midwest interstate hub (Internal, 60, 40, 1);
West coast port (Cartel, 9, 45, 2). Each has a `detail` string.

### 5.6 stockpile-planner (Section 6) — `stockpile`
`quantity = population × perThousand / 1000`. Default population 50,000.
Items (unit, per 1,000): Emergency water reserve (gal, 3000); Shelf-stable meals
(meals, 9000); Trauma/medical kits (kits, 40); Backup generators (units, 2); Field
radios (units, 15); Reserve fuel (gal, 500).

### 5.7 brigade-builder (Section 7) — `brigade`
Recommended count per role = `recommendedPer × (students / studentsPer)`, capped at `max`.
studentsPer 500; default students 1000.
Roles (recommendedPer, max): Safety coordinator (1, 10); Trained monitors (4, 40);
First-aid responders (2, 20); Family liaison (1, 10); Communications lead (1, 10).

### 5.8 protocol-stepper (Section 8) — `rescueProtocol`
Ordered, checkable steps with a progress bar. Steps: Intake & verification → Coordinate
with authorities → Assess safety & risk → Secure sanctuary placement → Transport under
protocol → Stabilize & provide care → Follow-up & casework. (Each has a detail line; the
content is procedural/lawful — coordinate with law enforcement before any action.)

### 5.9 pledge-commitment-tracker (Section 9) — `pledge`
Select commitments → printable pledge. Intro: "I commit to the following in support of
family and community renewal:" Commitments: device-free family time; nurture faith &
shared values; mentor/support a young person; give time to local service/charity; seek
reliable information & model discernment; know and support neighbors.

### 5.10 fund-allocation-simulator (Section 10) — `fundBuckets`
Allocate a notional 100% across buckets (sliders + stacked bar; flag when total ≠ 100).
Buckets (default %, color): Child rescue & recovery (30, #2563eb); School shields
(20, #16a34a); Strategic stockpiles (15, #d97706); Watchtower/intelligence (15, #9333ea);
Recovery programs (10, #dc2626); Emergency reserve (10, #0891b2). Total label: "SAFE-USA
Emergency Fund".

### 5.11 bill-template-generator (Section 11) — `billTemplate`
Select provisions → assembled sample bill text (copyable). Title prefix "A BILL".
Provisions: Definitions (§1); Child protection mandate (§2); Reporting requirements (§3);
Funding authorization (§4); Oversight & audit (§5); Enforcement (§6). Each provision has
formal placeholder statutory text.

### 5.12 deprogramming-pathway (Section 12) — `deprogramming`
A self-guided, **informational** branching decision tree (not medical/psychological
advice — disclaimer shown). Start node "root": "Who is this pathway for?" → Myself /
A family member. Self → "What feels most pressing?" → focus / beliefs (each ends in a
constructive suggestion). Family → "Is the person open to talking?" → open / closed
(each ends in a suggestion about listening, connection, and seeking a counselor).

### 5.13 surveillance-detox-checklist (Section 13) — `detoxChecklist`
Categorized checklist; progress = % checked. Categories & items:
- **Accounts:** password manager + unique passwords; 2FA on key accounts; review/revoke unused app permissions.
- **Devices:** keep devices/software updated; audit location-sharing; review mic/camera permissions.
- **Data footprint:** opt out of major data brokers; privacy-respecting search engine; audit public info on social profiles.

### 5.14 deployment-timeline (Section 14) — `timeline`
Phased milestones, filterable by region (National/Regional/Global).
Phase 1 / 2026 / National — Pilot watchtower nodes.
Phase 2 / 2027 / Regional — Regional expansion.
Phase 3 / 2028 / National — Civic brigade integration.
Phase 4 / 2029 / Global — Allied coordination.
Phase 5 / 2030 / Global — Full deployment.

### 5.15 metrics-dashboard (Section 15) — `metrics`
Progress = `(current − baseline) / (target − baseline)`. Metrics (baseline/current/target unit):
Schools with civic defense brigades (0 / 1,200 / 50,000 schools); Active watchtower
nodes (0 / 35 / 500 nodes); Documented rescues/recoveries (0 / 480 / 10,000 cases);
Families completing preparedness program (0 / 9,500 / 250,000 families); Strategic
stockpile coverage (5 / 22 / 90 %).

### 5.16 covenant-builder (Section 16) — `covenant`
Select principles → printable covenant. Preamble: "We affirm a renewed covenant for a
protected republic, and commit to:" Principles: safety of children at the center of
public life; strengthen families; defend truth/discernment/open inquiry; serve neighbors
directly; remain vigilant sentinels; pursue cultural and spiritual renewal.

### 5.17 appendix-explorer (Section 17) — `glossary`
Reference assets (links to Sections 5, 8, 11) + a searchable glossary.
Glossary terms: 5GW; OSINT; HUMINT; Watchtower Model; SAFE-USA; Civic Defense Brigade;
Sanctuary Entry Protocol (each with a one-line definition).

---

## 6. File / folder layout

```
defense-readiness-app/
├─ astro.config.mjs            # Astro + MDX + React + Tailwind
├─ package.json                # scripts: dev, build, preview, draft
├─ tsconfig.json
├─ content/
│  └─ sections/01..17-*.mdx    # section prose (frontmatter + body)
├─ src/
│  ├─ content.config.ts        # MDX collection schema
│  ├─ data/
│  │  ├─ site.ts               # site metadata (§3)
│  │  ├─ toc.ts                # 17-section master list (§4)
│  │  └─ tools/*.ts            # one data file per tool + index.ts + glossary
│  ├─ components/
│  │  ├─ layout/   BaseLayout.astro, SectionNav.astro, SearchBox.tsx
│  │  ├─ research/ Dossier.tsx, ResearchToolkit.tsx
│  │  └─ tools/    <17 widgets>.tsx, ToolRenderer.tsx, primitives.tsx, types.ts
│  ├─ lib/         search-index.ts, store.ts, urlState.ts, cite.ts, clipboard.ts, print.ts
│  ├─ pages/       index.astro, sections/[slug].astro, dossier.astro, print.astro,
│  │               search-index.json.ts
│  └─ styles/      global.css
└─ scripts/
   ├─ draft-content.mjs        # optional one-time AI drafting
   └─ prompts/section-prompt.md
```

## 7. MDX section file shape

```mdx
---
number: 1
slug: "introduction"
title: "Introduction: The Strategic Crisis of the Republic"
summary: "One-line summary (matches toc.ts)."
tool:
  type: "readiness-gauge"
  dataKey: "readiness"
  title: "National Readiness Snapshot"
---

## Overview

<the section's prose goes here — GitHub-flavored Markdown>
```

> **Current content status:** all 17 `.mdx` bodies are placeholders ("_Draft pending_").
> The structure, tools, and tool data are complete; the long-form prose still needs to be
> dropped in (either paste your real text, or run `npm run draft`).

## 8. Optional AI drafting (`scripts/draft-content.mjs` + `prompts/section-prompt.md`)

`npm run draft` calls the Anthropic API once to write each section's body from its title
and the document framing (needs an API key in `.env`; never needed again afterward).
Editorial rules enforced by the prompt: present the document's stated positions in a
neutral editorial voice; attribute contested/sensitive claims to "the document/authors"
rather than asserting them as fact; keep content lawful and constructive (no operational
instructions for harming, surveilling individuals, or evading law enforcement); output
GFM with `##`/`###` headings, ~400–700 words, no H1, no References section.

## 9. Privacy & hosting

- All visitor inputs (bookmarks, notes, highlights, tool selections) persist only in the
  visitor's browser (localStorage). Nothing is sent to a server.
- `npm run build` → static `./dist/`. Deploy on Vercel/Netlify/Cloudflare/GitHub Pages.
- For Vercel: set **Root Directory = `defense-readiness-app`**; Astro auto-detected.

## 10. Bonus: single-file edition

`American-Defense-Readiness-2030.html` in this folder is a **self-contained** version of
the whole app (all 17 sections + all 17 interactive tools, with the real data above) in
one HTML file — open it directly in any browser, no Node or build required. Edit the
`SITE`, `SECTIONS`, and `DATA` objects in its `<script>` block to change content.
