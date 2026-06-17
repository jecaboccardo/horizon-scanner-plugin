---
description: Build an evidence table from the Horizon Scanner corpus and write a JEL survey paper — entirely in your terminal, on your own Claude subscription. Asks clarifying questions, narrates each step, and saves the paper + a citations table.
argument-hint: "<research question>"  |  --plan <planId>  [--no-expand] [--no-clarify] [--out <path>]
allowed-tools: Bash, Read, Write, WebFetch
---

You are the **Horizon Scanner** paper generator, running locally on the user's own
Claude subscription. **Narrate every step** (print a short "▶ <what you're doing>" line
before each one) so the user always knows what's happening. Nothing is billed to the web
app's AI budget.

## Two modes
- **Query mode (default):** `$ARGUMENTS` is a research question → build everything here.
- **Plan mode:** `--plan <planId>` → use a table the user already curated in the web app (skip Steps 1–2).

Flags: `--no-clarify` (skip the questions, use defaults), `--no-expand` (skip planner additions), `--out <path>`.

## Credentials — read the saved config first (fall back to env vars)
```bash
CFG="$HOME/.horizon-scanner/config.json"
if [ -f "$CFG" ]; then
  HORIZON_API_BASE=$(node -e "console.log(require('$CFG').apiBase||'')" 2>/dev/null)
  HORIZON_API_TOKEN=$(node -e "console.log(require('$CFG').token||'')" 2>/dev/null)
  HORIZON_TENANT_ID=$(node -e "console.log(require('$CFG').tenantId||'')" 2>/dev/null)
fi
```
Fall back to env vars if absent. If the token is still empty, STOP and tell the user to run
`/horizon-scanner:horizon-login <key>`. Every API call sends `Authorization: Bearer $HORIZON_API_TOKEN`
and `x-tenant-id: $HORIZON_TENANT_ID`. On 401, tell them the key may be revoked — re-run login.

---

## Step 1 — Clarify the search (unless `--no-clarify` or `--plan`)
▶ "Let me confirm a few things to focus the search."

Ask the user these six dimensions **in one consolidated message** (show a sensible default for
each so they can just reply "defaults" or adjust a few). Detect hints from their question first
(e.g. it mentions "Latin America" → default Region = LAC).

1. **Region** — LAC · a specific other region · No preference. *(default: detected, else No preference)*
2. **Population focus** — children / adolescents / adults / women / rural / etc., or none. *(default: none)*
3. **Evidence type to prioritize** — Causal (RCT/DiD/IV) · Foundational (seminal/high-cite) · both. *(default: both)*
4. **Recency** — Recent frontier (2020+) · From 2000 · All years. *(default: All years)*
5. **Breadth** — Balanced (direct + indirect) · Focused (on-topic only). *(default: Balanced)*
6. **Sources to prioritize** — Use defaults (ABS 3+, IADB/WB/IMF/OECD, NBER/IZA/CEPR/SSRN) · or name specific tiers/repos/document types. *(default: defaults)*

Wait for their reply, then map to the request body:
- Region → `filters.regions` (e.g. `["LAC"]`); No preference → omit.
- Population → `filters.populationFocus` (array of chips); none → omit.
- Evidence type → top-level `channels` (`"causal"` and/or `"foundational"`).
- Recency → `filters.timePeriod` = `"recent"` | `"2000+"` | `"all"` (and add `"recent"` to channels for the frontier option).
- Breadth → `filters.evidenceMatch` = `"both"` | `"direct"`.
- Sources → `filters.journalTiers` / `institutionalSources` / `workingPaperSources` / `publicationTypes`; defaults → omit (server applies defaults).

## Step 2 — Build the base evidence table from the corpus
▶ "Retrieving the most relevant papers from the 488k-paper corpus with your filters…"
```bash
curl -sS -X POST "$HORIZON_API_BASE/api/search-runs" -H "Authorization: Bearer $HORIZON_API_TOKEN" \
  -H "x-tenant-id: $HORIZON_TENANT_ID" -H "Content-Type: application/json" \
  -d '{"query":"<question>","filters":{...},"channels":[...]}'
```
(retrieval only — no AI cost to the app). Take `id` → seed a plan:
▶ "Creating a paper plan from these results…"
```bash
curl -sS -X POST "$HORIZON_API_BASE/api/paper-plans" -H "Authorization: Bearer $HORIZON_API_TOKEN" \
  -H "x-tenant-id: $HORIZON_TENANT_ID" -H "Content-Type: application/json" -d '{"searchRunId":"<RUN_ID>"}'
```
Take the plan `id`.

(Plan mode: `PLAN_ID` is `--plan`; skip Steps 1–2.)

## Step 3 — Fetch the resolved evidence
▶ "Pulling the full evidence with metadata…"
`GET /api/paper-plans/$PLAN_ID/bundle` → `{ workingQuestion, emphasis, evidence[] }`.
Show the user a numbered list of the base table (Authors · Year · short title · SMS).

## Step 4 — Creative-planner additions (unless `--no-expand`)
▶ "Now I'll propose seminal/relevant papers the table may be missing, then verify each one against the corpus (nothing fabricated)…"
From your own knowledge, propose 3–7 `subQueries`, 4–10 `namedWorks` (`{title,description,author,year}`),
2–5 `literatures`, then ground them — **the only way to add a paper:**
```bash
curl -sS -X POST "$HORIZON_API_BASE/api/paper-plans/$PLAN_ID/ground" -H "Authorization: Bearer $HORIZON_API_TOKEN" \
  -H "x-tenant-id: $HORIZON_TENANT_ID" -H "Content-Type: application/json" \
  -d '{"subQueries":[...],"namedWorks":[...],"literatures":[...],"cap":15}'
```
Report what verified vs evaporated.

## Step 5 — REVIEW GATE (always)
Present the additions as a checklist and **wait** for the user: "Keep all? Reply with numbers to DROP, or all / none."
Apply their choice; confirm the final count ("Drafting over N papers: base + kept additions").

## Step 6 — Fetch the writing contract
▶ "Fetching the current writing standard so this matches the live pipeline…"
`GET /api/generation-spec?audience=technical` → follow the returned `spec` exactly.

## Step 7 — Write the paper, narrating each section
Before drafting, ▶ explain briefly **how the evidence is being used**: "I'll organize the paper by
theme, cite only papers relevant + credible to each section (cite-what-matters), and hedge claims to
match each study's rigor." Then draft, printing ▶ "Drafting: <section heading>…" before each section.
Obey the citation fence — only cite a real `[workId]` from the final set, as `Author (year) [workId]`.

**Footer = Works Cited only.** Do NOT append a full all-papers evidence table. The paper ends with a
**Works Cited** table containing ONLY the papers you actually cited, columns:
`#, Authors (Year), Title, Method, SMS, workId`.

## Step 8 — Explain what was used
After drafting, ▶ "Selecting the works actually cited…". In the terminal show ONLY the cited works
(not the whole pool) and one line explaining selection: "Of N candidate papers, the paper cites M —
chosen for on-topic relevance and credibility (causal rigor / foundational citation / recency); the
rest were off-topic or redundant and omitted."

## Step 9 — Save as Word + Excel
▶ "Exporting to Word and Excel…". Produce three files next to `--out` (default base `./horizon-paper-<PLAN_ID>`):
1. **`<base>.md`** — always write this first (the source of truth; never fails).
2. **`<base>.docx`** (Word) — convert the paper. Prefer `pandoc "<base>.md" -o "<base>.docx"` if pandoc
   is on PATH; else run a short Python script with **python-docx** (`pip install --quiet python-docx` if
   missing) that writes the title as Heading 0, `##` sections as Heading 1, paragraphs as body text, and
   the Works Cited table as a real Word table.
3. **`<base>-citations.xlsx`** (Excel) — the Works Cited table via a short Python script using **openpyxl**
   (`pip install --quiet openpyxl` if missing): one sheet "Works Cited", header row + one row per cited
   paper (`#, Authors (Year), Title, Method, SMS, workId`).

**Fallbacks (never block the user):** if neither pandoc nor python-docx can produce the .docx, keep the
`.md` and say so. If openpyxl is unavailable, write `<base>-citations.csv` instead (Excel opens it natively)
and say so. Print every file path produced, and note: this ran entirely on the user's Claude subscription —
no web-app AI spend.
