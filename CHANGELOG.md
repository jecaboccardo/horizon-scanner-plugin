# Changelog — Horizon Scanner plugin

All notable changes to the Claude Code plugin. Bump `version` in
`.claude-plugin/plugin.json` to match the top entry on every release, then publish
(see README → "Publishing to a standalone repo"). Server-side changes (corpus,
retrieval, grounding, the writing contract at `/api/generation-spec`) reach users
immediately and are NOT listed here — only plugin-file changes are.

## 0.5.4
- **First-run welcome in the terminal (no manual needed).** A `SessionStart` hook
  (`hooks/hooks.json` → `scripts/welcome.mjs`) prints a one-time, login-aware tip: if not
  logged in it shows the two setup steps; once logged in it shows *"✅ ready — just type
  `/horizon-scanner:horizon <your question>`"*. Shows once per machine (sentinel
  `~/.horizon-scanner/.welcomed`); fail-safe, never blocks the session; cross-platform (Node).
- **Shorter command: `/horizon-scanner:horizon`** (renamed from `…:horizon-paper`). Bare
  `/horizon` is not possible — Claude Code plugin commands are always namespaced — so this is
  the shortest reliable form.
- **No quotes needed.** `$ARGUMENTS` already captures the whole line; the misleading quotes were
  removed from the argument hint and all examples. Type the question in plain English.

## 0.5.3
- **Clarifier reliability (HARD RULES).** Step 1 was being collapsed — runs skipped the **Years/recency**
  question and the **Sources** confirmation, silently applying defaults. Now every one of the six
  dimensions MUST be shown with its default AND concrete options, and #4 (years: Recent 2020+ / From
  2000 / All years) and #5 (sources: the default set spelled out — ABS 3+ · IADB/WB/IMF/OECD ·
  NBER/IZA/CEPR/SSRN — plus "or choose specific tiers/repos/types") are called out as never-skip.
- **Base evidence table now shows Venue + Year** (columns: # · Authors · Year · Venue · Title · SMS).
- **Final evidence table before drafting (new, mandatory):** after the keep/drop gate, the plugin shows
  the COMPLETE set it will draw from — base retrieved + LLM-added together — as one numbered table with
  Authors (Year) · Venue · Title · SMS · Source (📚 retrieved / ➕ added), not just a paper count.

## 0.5.2
- **Review gate now re-shows the base evidence table alongside the proposed additions.**
  In a terminal the base table (from the search step) had scrolled out of view by the time
  the additions appeared, so the keep/drop decision was made without seeing what was already
  in the set. Step 5 now recaps the base papers, then lists additions — and flags each addition
  as on-topic vs merely adjacent (the grounding can surface same-keyword-but-different-literature
  papers, e.g. *returns-estimation* papers for an *information-intervention* question), plus
  calls out any relevant work cut as `over_cap`. Low-confidence adds are still shown — with a
  caveat — never silently dropped.
- **Lowered the creative-planner net-add cap 15 → 8** so the additions list stays focused and the
  adjacent-literature noise can't crowd out genuinely-missing seminal works.

## 0.5.1
- **Dropped the "Breadth" clarifying question** (Balanced vs Focused). The web app's
  direct/indirect/excluded classifier was removed (relevance-first redesign 2026-06-17) —
  evidence-table membership is now decided by a cosine relevance floor, so `evidenceMatch`
  no longer affects retrieval. Clarifying questions are now six (region, population, evidence
  type, recency, sources, length); the `evidenceMatch` mapping is gone from the request body.

## 0.5.0
- **Full quality self-review pass** added to the contract + flow — mirrors the app's
  *entire* QA suite: section recovery (completeness), claim audit (triage
  keep/soften/re-attribute/remove), Devil's Advocate, coherence, citation spread /
  cite-what-matters, corpus-gap weaving, citation-retention, DOI/Kris check, attribution,
  and final review — performed by the one capable local model. (The citation fence
  already prevented fabrication / bad DOIs, the Kris-class guarantee.)
- **DOIs in citations**: the Works Cited table now shows real `https://doi.org/…` DOIs
  (from the corpus `canonical_doi`, falling back to a `10.*` workId) instead of internal ids.
- **Paper-length option** in the clarifier (Brief ~10pg / Standard ~20pg / Custom).
- **Pre-generation notice** of the deliverables (Word `.docx` + Excel `.xlsx`).

## 0.4.0
- Paper footer is now **Works Cited only** (the papers actually cited) — the full
  all-papers pool table was dropped.
- **Export to Word** (`.docx`) for the paper and **Excel** (`.xlsx`) for the citations,
  with graceful fallback to `.md` / `.csv` when local converters aren't available.

## 0.3.0
- **Clarifying questions** before the search (region, population, evidence type,
  recency, breadth, sources) — parity with the web app; answers map to the search filters.
- **Step-by-step narration** (`▶` line before each step).
- In-terminal summary now shows **only the cited works** + how they were selected.

## 0.2.0
- **Single-source writing contract**: the plugin fetches `/api/generation-spec` so its
  output tracks the live pipeline (no plugin update needed when the contract changes).
- In-app "Set up Claude Code" setup made explicit (`/reload-plugins` step, namespaced
  `/horizon-scanner:…` commands, ordered setup snippet).

## 0.1.0
- Initial release: build evidence from the corpus + the user's own grounded creative
  planner → review gate → draft a JEL survey paper, entirely in the terminal on the
  user's Claude subscription. `/horizon-scanner:horizon-paper` + `/horizon-scanner:horizon-login`
  (durable, revocable, endpoint-scoped key).
