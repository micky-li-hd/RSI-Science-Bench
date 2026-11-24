# Public snapshot

`results.json` is generated from the independent 60-slot formal audit and the
15-slot second-attempt audit by `ruby scripts/export_leaderboard.rb`. It
contains only model/task IDs, public status, verifier speedup, non-sensitive
gate names and whether a remote Trace was captured. It contains no credentials,
hostnames, file paths or raw Traces. Second attempts are in `repeat_records`;
they never replace primary records or scores. All five ChemBERTa second
attempts use freshly copied workspaces with blank optimization reports and
work logs because the primary template contained prior notes.
`score` is populated only for complete, comparable model rows. It uses the
per-task logarithmic speedup normalization defined in `results.json` and a
0–50 equal-task aggregate; `score_provisional` stays true until all active
model rows have independent verdicts. It is not the original RSI-Infra ECI.
