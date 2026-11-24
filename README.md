# RSI-Science-Bench leaderboard

[Open the live leaderboard](https://micky-li-hd.github.io/RSI-Science-Bench/)

This is a science-domain companion to [RSI-Infra Bench](https://ai4ai-for-anything.github.io/blog/rsi-infra-bench/leaderboard/index.html), not a directly comparable score. It shows one frozen workload per project across ten protein, molecule, genomics and physics tasks on NVIDIA H20 GPUs. The snapshot was independently audited on 2026-11-24 (China Standard Time).

Only strict independent-verifier PASS results count in the ranking. Rejected speedups, agent errors, provider cooldown, user cancellation and unstarted trials are displayed separately. The 36,000-second agent ceiling and model–harness versions are shown on the page. Results are static until the audited snapshot in `data/results.json` is regenerated and committed.

Raw agent traces, remote paths, machine names and credentials are not published in this repository. The original RSI-Infra ECI score and API-cost chart are not reused because the tasks and hardware differ.
