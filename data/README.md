# Public snapshot

`results.json` is generated from the independent formal, 15-slot repeat,
Gemini budget-retry, and Gemini provider-retry audits by
`ruby scripts/export_leaderboard.rb`. It
contains only model/task IDs, public status, verifier speedup, non-sensitive
gate names and whether a remote Trace was captured. It contains no credentials,
hostnames, file paths or raw Traces. All five ChemBERTa clean second attempts
use freshly copied workspaces with blank optimization reports and work logs;
they replace template-contaminated first attempts for scoring. The excluded
first attempts and Gemini's Vertex-429 attempt remain in `superseded_records`.
The other ten attempts in `repeat_records` are sensitivity checks and never
replace scored records.
`score` is populated only for complete, comparable model rows. It uses the
per-task logarithmic speedup normalization defined in `results.json` and a
0–50 equal-task aggregate; `score_provisional` stays true until all active
model rows have independent verdicts. It is not the original RSI-Infra ECI.
