# Public snapshot

`results.json` is generated from the independent formal, 15-slot repeat,
Gemini budget-retry, Gemini provider-retry, and targeted 2026-11-26/27 redo audits by
`ruby scripts/export_leaderboard.rb`. It
contains only model/task IDs, public status, verifier speedup, non-sensitive
gate names and whether a remote Trace was captured. It contains no credentials,
hostnames, file paths or raw Traces. All five ChemBERTa clean second attempts
use freshly copied workspaces with blank optimization reports and work logs;
they replace template-contaminated first attempts for scoring. The excluded
first attempts and Gemini's Vertex-429 attempt remain in `superseded_records`.
The other ten attempts in `repeat_records` are sensitivity checks and never
replace scored records. The targeted 2026-11-26/27 redos in `redo_records` are
also sensitivity checks: none replaces a single-attempt scored cell, even if
its independent verifier passes. The redo statuses and Traces remain preserved
separately. The only scored replacements repair invalid templates or provider
failures under the original protocol.
`score` is populated only for complete, comparable model rows. It uses the
per-task logarithmic speedup normalization defined in `results.json` and a
0–50 equal-task aggregate; `score_provisional` stays true until all active
model rows have independent verdicts. It is not the original RSI-Infra ECI.
