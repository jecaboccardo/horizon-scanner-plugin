# Changelog — Horizon Scanner plugin

All notable changes to the Claude Code plugin. Bump `version` in
`.claude-plugin/plugin.json` to match the top entry on every release, then publish
(see README → "Publishing to a standalone repo"). Server-side changes (corpus,
retrieval, grounding, the writing contract at `/api/generation-spec`) reach users
immediately and are NOT listed here — only plugin-file changes are.

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
