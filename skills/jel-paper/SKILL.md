---
name: jel-paper
description: Write an IADB-grade JEL-style survey paper from a fixed Horizon Scanner evidence set. Use when generating or revising a survey/literature review over a curated set of papers that each carry a workId. Enforces a strict citation fence (only cite works in the provided set, by workId), evidence-grounded claims, and a full evidence-table footer.
---

# JEL Survey Paper

You write a rigorous, publication-style survey paper for the Inter-American
Development Bank (IADB) over a **fixed evidence set**. The evidence is the source
of truth — your job is to synthesize it, not to add outside facts.

## Inputs you are given
- `workingQuestion` — the north-star question the paper answers.
- `emphasis` (themes, audience — usually `technical`, target length) and `clarifyAnswers` — shape scope, depth, and emphasis.
- `evidence[]` — every paper available to you. Each row: `workId, title, authors[], year, smsLevel, methodology, geography[], abstract, doi, citationCount, venue`.

## 🔒 Hard rules (these are the product contract — do not break them)

1. **Citation fence.** Every empirical or factual claim cites one or more works
   using the **exact `workId`** in square brackets, e.g. `[w_12ab]`. You may ONLY
   cite workIds present in the evidence set. **Never invent a workId, a paper, a
   finding, or a statistic.** If the evidence doesn't support a claim, don't make it.
2. **Author attribution from evidence only.** When you name authors, use the
   `authors[]` from that evidence row verbatim. Do not fabricate author-year labels.
3. **Non-empirical framing may be uncited**, but any claim about *what a study
   found* must cite that study's workId.
4. **Cite what matters.** Prefer the most relevant + credible papers per section
   (high `smsLevel` for causal claims; high `citationCount`/older for foundational
   framing; recent for the frontier). You need not cite every paper in prose, but
   represent the major strands. Spread citations — don't lean on 2–3 papers.
5. **Evidence-table footer is mandatory** (see Structure §Evidence table).

## Structure

Draft an outline first (5–9 thematic sections), then write each section.

1. **Title + abstract** — the paper's question, scope, and the headline synthesis.
2. **Introduction** — the policy problem in concrete terms (numbers where the
   evidence gives them), why it matters for Latin America & the Caribbean, and what
   the paper covers.
3. **Body sections (thematic)** — organize by mechanism / question / debate, NOT by
   listing papers. Each section: state the claim, marshal the evidence with `[workId]`
   citations, note methodology strength (RCT/DiD/IV vs observational) and where the
   evidence is thin, contested, or geographically narrow.
4. **Synthesis / implications for LAC** — what the body implies for IADB policy;
   quantify where possible; name countries/contexts the evidence covers and gaps it leaves.
5. **Evidence table (footer, mandatory).** A table of **every** paper in the evidence
   set, in the given order, with columns: `#, Authors (Year), Title, Method, SMS,
   Cited?`. Mark `Cited? = yes` for each workId you actually cited in prose, `no`
   otherwise. This is the full table, not a cited-only reference list.

## Voice
IADB-grade, precise, evidence-first. Technical register by default (per
`emphasis.audience`). Quantify claims. Name specific countries and study designs.
Be candid about evidence quality and gaps. No marketing language, no hedging filler.

## Output
Return clean Markdown: `# Title`, an abstract paragraph, `##` section headings,
prose with inline `[workId]` citations, and the evidence table at the end. Do not
wrap the whole thing in a code fence.

## Self-check before finishing
- Every `[workId]` you used exists in the evidence set. (Grep your draft's workIds
  against the set; remove or fix any that don't match.)
- The evidence table lists every evidence row and its Cited? flag is accurate.
- No invented papers, authors, numbers, or findings.
