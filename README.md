# Horizon Scanner — Claude Code plugin

Generate IADB-grade JEL survey papers **from your own Claude Code terminal, on your
own Claude subscription** — instead of (or alongside) the Horizon Scanner web app.

This is a **power-user option**. The web app still works standalone for everyone:
it generates papers server-side (Gemini/Qwen) with no setup. This plugin is for
analysts who have Claude Code + a Pro/Max subscription and want the paper written
by their own Claude (better long-form synthesis, and the LLM cost lands on their
subscription, not the app's API budget).

## How it splits the work

Everything can happen in the terminal — no web round-trip required.

| Step | Where it runs | Who pays |
|------|---------------|----------|
| Retrieve the base evidence table from the 488k-paper corpus | Horizon Scanner server (read-only, no LLM) | — |
| Propose missing seminal works / sub-literatures | **Your Claude Code** | Your subscription |
| Corroborate those proposals vs the corpus | Horizon Scanner server (read-only) | — |
| Review which additions to keep | You (a checklist in the terminal) | — |
| Write the paper | **Your Claude Code** | Your subscription |

"You propose, the corpus disposes": your Claude can suggest missing seminal works,
but only papers that resolve to a real corpus row can be added or cited — no fabrication.

## Install

```
/plugin install horizon-scanner@<marketplace>
```
…or, during development, point Claude Code at this directory as a local plugin.

## One-time setup

Export your Horizon Scanner credentials (get them from the web app → account):

```bash
export HORIZON_API_BASE="https://horizon-api.nextminder.com"   # or http://localhost:3002
export HORIZON_API_TOKEN="<your access token>"
export HORIZON_TENANT_ID="iadb-demo"
```

## Use

**Terminal-first (default — no web app needed):**
```
/horizon-paper "returns to schooling information interventions in Latin America"
```
Claude retrieves the base table from the corpus, proposes grounded additions, shows
you a **review checklist** to keep/drop them, then writes the paper.

**From a web-curated table (optional handoff):** if you already built a table in
Paper Studio, pass its plan id instead:
```
/horizon-paper --plan <planId>
```

Options: `--no-expand` (skip the creative-planner additions), `--out <path>` (output file).

The finished paper is written to `./horizon-paper-<id>.md`. You can upload it back
into the Horizon Scanner Library, or keep it locally.

## What it talks to (both read-only, golden-rule-safe — never write the corpus)

- `GET  /api/paper-plans/:id/bundle` — the curated evidence + plan north-star.
- `POST /api/paper-plans/:id/ground` — corroborate your proposed additions against
  the corpus (no server-side LLM; the proposing happens in your Claude Code).
- `GET  /api/generation-spec` — the live JEL writing contract (same single source the
  server's own drafter uses), so the plugin's output tracks the pipeline automatically.

## Notes / limits

- **Anthropic terms**: you run your own Claude Code on your own data — confirm this
  use fits the current Consumer Terms before relying on it at scale.
- **Re-import** of the finished paper into the web Library is Phase 2 (for now, save
  locally / upload manually).
- Prompts here are a faithful port of the server pipeline's methodology, tuned for a
  capable local model; they may diverge from the web app's Gemini/Qwen prompts over time.
