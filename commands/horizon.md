---
description: Build an evidence table from the Horizon Scanner corpus and write a JEL survey paper — entirely in your terminal, on your own Claude subscription. Asks clarifying questions, narrates each step, and saves the paper + a citations table.
argument-hint: <your research question — plain text, no quotes>  |  --plan <planId>  [--no-expand] [--no-clarify] [--out <path>]
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

Ask the SIX dimensions **ONE AT A TIME — one question per message**, mirroring the web app's
chat-style clarifier. For EACH dimension: print the dimension name, its **detected default**
(pre-fill from hints in the question, e.g. "Latin America" → Region = LAC), and the concrete
options; then **WAIT for the reply before asking the next**. NEVER batch them into one message.
NEVER silently apply a default without showing it. You MUST ask **#4 Recency** and **#5 Sources**
explicitly (spelling out the default source set) — these are the most often wrongly skipped.

**`defaults` escape:** at ANY question, if the user replies `defaults`, accept THAT dimension and
ALL REMAINING dimensions at their detected defaults, and proceed straight to retrieval. (It does
NOT change dimensions already answered.) `--no-clarify` still skips the whole sequence.

1. **Region** — *default:* `<detected, else No preference>`. Options: LAC · a specific other region (USA & Canada · Europe & Central Asia · Sub-Saharan Africa · South & SE Asia · MENA) · No preference.
2. **Population focus** — *default:* none. Options: children · adolescents · adults · women/girls · rural · urban · low-income · none.
3. **Evidence type** — *default:* both. Options: Causal (RCT/DiD/IV/RDD) · Foundational (seminal / high-cite) · both.
4. **Recency** — *default:* All years. Options: **Recent frontier (2020+)** · **From 2000 onwards** · **All years**. (ALWAYS ask — never assume the year range.)
5. **Sources** — *default:* the standard set, which you MUST spell out every time: **journals ABS 3+ · institutions IADB, World Bank, IMF, OECD · working papers NBER, IZA, CEPR/RePEc, SSRN**. Options: accept that default, OR choose specific journal tiers / repositories / document types (journal articles · working papers · reports & grey-lit · books). (ALWAYS show the default set AND offer to change it — never just say "using defaults".)
6. **Paper length** — *default:* Standard (~20 pages / ~10,000 words). Options: Brief (~10pg / ~5,000w) · Standard · Custom (give a word/page count).

Wait for their reply, then map to the request body:
- Region → `filters.regions` (e.g. `["LAC"]`); No preference → omit.
- Population → `filters.populationFocus` (array of chips); none → omit.
- Evidence type → top-level `channels` (`"causal"` and/or `"foundational"`).
- Recency → `filters.timePeriod` = `"recent"` | `"2000+"` | `"all"` (and add `"recent"` to channels for the frontier option).
- Sources → `filters.journalTiers` / `institutionalSources` / `workingPaperSources` / `publicationTypes`; defaults → omit (server applies defaults).
- Length → remember the **target word count** (Brief≈5,000 · Standard≈10,000 · Custom=their number). You draft locally, so this just sizes your output: aim for roughly that total across the sections, scaling the number/depth of thematic sections to fit. State the target back ("Targeting ~10,000 words / ~20 pages").

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
`GET /api/paper-plans/$PLAN_ID/bundle` → `{ workingQuestion, emphasis, evidence[] }`. Each row has
`workId, title, authors[], year, smsLevel, methodology, geography[], abstract, doi (canonical DOI or null),
citationCount, venue`. **Keep the `doi` field** — it's required for the references/citations below.
Show the user a numbered table of the base evidence with columns **# · Authors · Year · Venue · Title · SMS** — the bundle carries `venue` and `year` for every row, so ALWAYS include them (never drop venue/year).

## Step 4 — Creative-planner additions (unless `--no-expand`)
▶ "Now I'll propose seminal/relevant papers the table may be missing, then verify each one against the corpus (nothing fabricated)…"
From your own knowledge, propose 3–7 `subQueries`, 4–10 `namedWorks` (`{title,description,author,year}`),
2–5 `literatures`, then ground them — **the only way to add a paper:**
```bash
curl -sS -X POST "$HORIZON_API_BASE/api/paper-plans/$PLAN_ID/ground" -H "Authorization: Bearer $HORIZON_API_TOKEN" \
  -H "x-tenant-id: $HORIZON_TENANT_ID" -H "Content-Type: application/json" \
  -d '{"subQueries":[...],"namedWorks":[...],"literatures":[...],"cap":8}'
```
Report what verified vs evaporated.

## Step 5 — Evidence gate (always; single round)
Run ONE review gate before drafting. Show base retrieved + planner-suggested papers **together**
as ONE numbered table — columns **`# · Authors (Year) · Venue · Title · Source`** (Source =
`📚 retrieved` / `➕ suggested`). **No SMS/Method columns here** — keep it scannable for the decision.
For each `➕ suggested` row, flag on-topic vs merely-adjacent (grounding can surface
same-keyword-different-literature papers). Note any `over_cap` finds the user could keep.

Then prompt ONCE for a batch of edits (the user may combine any of these in one reply):
- **Remove** — "drop 3, 7, 12": remove those rows from the working set (they are simply not passed to generation).
- **Find in corpus** — "add Jensen 2010 perceived returns; add Duflo teacher incentives": build a
  `namedWorks` array from these and call `/ground` (the Step 4 curl) — the ONLY way to add a corpus
  paper. Report which verified (added) vs not-in-corpus.
- **Upload my own** — "upload 10.1162/… " or a pasted citation/abstract of a paper NOT in the corpus:
  call **`POST /api/paper-plans/$PLAN_ID/uploads`** — first WITHOUT `confirm` to preview, then with
  `{"confirm":true,"uploadId":"<from preview>"}` to attach. These attach to `plan.uploads`, flagged
  **user-supplied · unverified**. (🔒 never writes the corpus.)
  ```bash
  curl -sS -X POST "$HORIZON_API_BASE/api/paper-plans/$PLAN_ID/uploads" \
    -H "Authorization: Bearer $HORIZON_API_TOKEN" -H "x-tenant-id: $HORIZON_TENANT_ID" \
    -H "Content-Type: application/json" -d '{"doiOrUrl":"<doi-or-url>"}'   # or {"pastedText":"<citation>"}
  ```

Apply ALL edits, then **show the FINAL table once** — HARD RULE — the complete set the paper draws
from, columns **`# · Authors (Year) · Venue · Title · Source`** (Source = `📚 retrieved` / `➕ added` /
`⬆ uploaded · unverified`). Then confirm "Drafting over N papers." If the user gave no edits, proceed.

▶ **Before generating, tell the user what they'll receive:** "I'll now write the paper (~<target> words).
You'll get a **Word document (.docx)** of the paper and an **Excel spreadsheet (.xlsx)** of the full
evidence table (with a Cited column), plus a Markdown source copy."

## Step 6 — Fetch the writing contract
▶ "Fetching the current writing standard so this matches the live pipeline…"
`GET /api/generation-spec?audience=technical` → follow the returned `spec` exactly.

## Step 7 — Write the paper, narrating each section
Before drafting, ▶ explain briefly **how the evidence is being used**: "I'll organize the paper by
theme, cite only papers relevant + credible to each section (cite-what-matters), and hedge claims to
match each study's rigor." Then draft, printing ▶ "Drafting: <section heading>…" before each section.
Obey the citation fence — only cite a real `[workId]` from the final set, as `Author (year) [workId]`.

🔑 **The `[workId]` tag is an INTERNAL citation fence, NOT for the reader.** Keep it inline *while you
draft and self-review* — it is how you (and the quality passes) verify every claim cites an in-set work
and how you build the Works Cited table. But it **MUST NOT appear in the final files** the user opens:
in the reader-facing prose a citation reads as **`Author (year)`** only, with the DOI appearing **just
once, in the Works Cited table**. You strip the tags at export time (Step 9) — do not strip them while
drafting, or the fence and the Works Cited build both break.

**Footer = Works Cited only.** Do NOT append a full all-papers evidence table. The paper ends with a
**Works Cited** table containing ONLY the papers you actually cited, columns:
`#, Authors (Year), Title, Method, SMS, DOI`.
Compute **DOI** per row as: the row's `doi` if present → render `https://doi.org/<doi>`; else if `workId`
starts with `10.` → `https://doi.org/<workId>`; else `—` (no DOI on record). This mirrors the app's
bibliography (`canonical_doi ?? (workId starts with 10. ? workId : null)`) so the references show real,
clickable DOIs instead of internal ids.

## Step 7b — Quality self-review (always — the plugin's full guardrail pass)
▶ "Reviewing the draft — section completeness, claim audit, devil's advocate, coherence, citation spread, DOI check…"
Run the **complete QUALITY SELF-REVIEW** from the fetched spec over your draft, then **revise it**. This
mirrors the app's *entire* QA suite, done by one capable model:
- **Completeness / section recovery:** no blank, near-empty, or truncated sections; each ends cleanly.
- **Claim audit (all cited claims):** every claim traces to a cited `[workId]` whose evidence supports it — triage keep / soften / re-attribute / remove (removal last; when unsure, keep).
- **Devil's advocate:** attack overstatement (single-study-as-fact, causal language on observational results, ignored contradictions, over-claiming LAC from non-LAC evidence); hedge / balance / add counter-evidence.
- **Coherence:** one connected argument, consistent terms, abstract matches body, citations diversified.
- **Citation spread / cite-what-matters + corpus-gap weaving:** cite the CORE set + each active channel; fill thin sections with uncited in-set papers, never inventions.
- **Citation-retention:** revisions must not strip `[workId]` tags.
- **DOI / Kris check:** every cited workId is in the set and renders a real DOI; flag any that can't resolve.
- **Attribution:** author names verbatim from evidence.
- **Final review:** each section delivers a clear "so what"; IADB-grade; nothing fabricated.
Briefly report what you changed (e.g. "softened 3 over-strong claims, added 1 counter-finding, balanced citations across 6 more papers, re-drafted 1 thin section").

## Step 8 — Explain what was used
After drafting, ▶ "Selecting the works actually cited…". In the terminal show ONLY the cited works
(not the whole pool) and one line explaining selection: "Of N candidate papers, the paper cites M —
chosen for on-topic relevance and credibility (causal rigor / foundational citation / recency); the
rest were off-topic or redundant and omitted."

## Step 9 — Save as Word + Excel
▶ "Exporting to Word and Excel…". Produce three files next to `--out` (default base `./horizon-paper-<PLAN_ID>`):

🔑 **STRIP the citation-fence tags from the prose first.** Before writing any file, remove every inline
`[workId]` tag from the body prose so a citation reads as **`Author (year)`** alone — the reader never
sees a bracketed DOI/workId next to a name. Apply the same rule the app uses: delete each tag and the one
space before it (regex `\s*\[[^\]]{3,}\]` → ``). This touches **prose only** — the **Works Cited table is
untouched** (its DOIs are full `https://doi.org/…` URLs, not bracketed tags, so the regex never matches
them). Do the stripping in the Python/export step on the markdown string, AFTER the self-review has used
the tags to verify claims and AFTER you have built the Works Cited table from them. (The web app does
exactly this at render and download time — the plugin must match it.)

1. **`<base>.md`** — always write this first (the source of truth; never fails). Write the **tag-stripped**
   prose + the Works Cited table.
2. **`<base>.docx`** (Word) — convert the paper. Prefer `pandoc "<base>.md" -o "<base>.docx"` if pandoc
   is on PATH; else run a short Python script with **python-docx** (`pip install --quiet python-docx` if
   missing) that writes the title as Heading 0, `##` sections as Heading 1, paragraphs as body text, and
   the Works Cited table as a real Word table.
3. **`<base>-evidence.xlsx`** (Excel) — the **FULL evidence table** (one row per paper in the final
   set, NOT cited-only) via a short Python script using **openpyxl** (`pip install --quiet openpyxl`
   if missing). One sheet "Evidence", header row + one row per paper, columns mirroring the web app's
   evidence export **plus Abstract**:
   `Ref · Cited · WorkID · Title · Authors · Year · Region · Source · Type · Methodology · SMS ·
   ABSRating · RePEcPercentile · CitationCount · DOI · URL · Unverified · Abstract`
   - `Cited` = "yes" if the paper's workId appears in the drafted prose's citation fence, else "no".
   - `Region` = derived from the row's `geography[]` (use the LAC/region rollup token if present, else
     the first geography entry, else "—").
   - `Source` = `venue` (or `sourceFamily` if venue is null). `Type` = `methodology`. `SMS` = `smsLevel`.
   - `ABSRating`/`RePEcPercentile`/`URL` from the bundle fields (empty if null — never block).
   - `DOI` = `doi` → `https://doi.org/<doi>`; else `10.`-workId → doi.org; else `—` (same rule as prose).
   - `Unverified` = "yes" for uploaded (user-supplied) rows, else "no".
   - Uploaded papers (`plan.uploads` / the upload previews collected in Step 5) are INCLUDED as rows.

**Fallbacks (never block the user):** if neither pandoc nor python-docx can produce the .docx, keep the
`.md` and say so. If openpyxl is unavailable, write `<base>-evidence.csv` instead (Excel opens it natively)
and say so. Print every file path produced, and note: this ran entirely on the user's Claude subscription —
no web-app AI spend.
