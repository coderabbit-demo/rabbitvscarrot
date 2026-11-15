# CodeRabbit findings log

A running collection of real CodeRabbit review findings from this repo, kept to show where CodeRabbit is strong.
Every entry links to the actual review comment. Add new entries whenever a PR is merged.

**Scope note:** these are CodeRabbit-only observations. No competing tool has reviewed these PRs, so the "vs competition"
column is a prompt for a side-by-side run (same PR through another reviewer), not a claim. Fill it in only with evidence.

## Summary by category

| Category | Count | Best example |
|---|---|---|
| Security (DoS, path traversal, authz, XSS, weak randomness) | 7 | PR #1 |
| Logic / state bugs a linter can't see | 4 | PR #2, #4 |
| Accessibility | 3 | PR #1, #2 |
| Clean PR (no findings) | 1 | PR #3, #6 |

## Findings

### Security: found with reachability and CWE context (PR #1, online multiplayer)
Findings carry a reachability path, exploitability rating and CWE id, which goes beyond a pattern match.

| Finding | Severity | CWE | Why it matters |
|---|---|---|---|
| Path traversal in static file server: resolved path not confined to `ROOT` (`server/static.js`) | Critical | CWE-22 | Arbitrary file read from one request. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882378) |
| `decodeURIComponent` throws on `/%`, uncaught, kills the Node process (`server/static.js`) | Critical | CWE-248 | One HTTP request is a remote DoS. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882372) |
| `JSON.parse("null")` passes parsing then `msg.type` throws, uncaught (`server/index.js`) | Critical | CWE-248 | One valid WebSocket message crashes the server. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882335) |
| Client-controlled `msg.player` trusted in `applyMove`: wrong mark, out-of-turn, overwrite occupied cell | Major | CWE-862 | Authorization bypass in game logic. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882354) |
| Unvalidated `msg.index` extends `room.board` into a huge sparse array | Major | CWE-400 | Memory/CPU DoS; found in the same comment thread as the authz issue. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882354) |
| One socket can create unlimited rooms; disconnect frees only the last | Major | CWE-400 | Slow memory exhaustion. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882348) |
| 4-char `Math.random` room codes, no rate limit: rooms enumerable | Major | CWE-330 | Attacker joins as second player. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882366) |
| Chat `name`/`text` assigned via `innerHTML` (`src/online.js`) | Major | CWE-79 | Stored XSS across players; also flagged by an OpenGrep rule and a learned org rule. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882395) |

### Logic and state bugs (cross-file reasoning, edge cases)
- **Reconnect leaves the player in a dead room** (PR #1, `src/online.js`): the finding traced client `Net.connect` against server disconnect cleanup, in two files, using scripted repo searches. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882387)
- **Valid JSON with wrong types crashes later** (PR #2, `src/daily.js`): `{"lastWin":123}` parses fine, then `123.split` throws in `status()`; a string `streak` concatenates instead of incrementing. The `try/catch` around `JSON.parse` doesn't cover it. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/2#discussion_r4564228617)
- **Challenge won after midnight credits the wrong day** (PR #4, `src/ui.js`): a time-boundary bug. Fixed in `d0f284c`. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/4#discussion_r4551087579)
- **Stale streak display after Retry crosses midnight** (PR #4): follow-up on the previous fix. Fixed in `1179d01`. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/4#discussion_r4563676559)
- **Unsaved progress overwritten when `setItem` throws but `getItem` works** (PR #4, `src/daily.js`): a localStorage failure-mode that only shows up by reasoning about partial failure. Fixed in `2772233`. [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/4#discussion_r4563959256)

The PR #4 sequence is a good demo of iterative review: three successive reviews each found a deeper issue in the same feature, and each was marked addressed by the following commit.

### Accessibility
- Placeholder-only inputs without labels (PR #1; HTMLHint rule surfaced inside the review). [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882324)
- System-message contrast `#888` is about 3.5:1, below 4.5:1 (PR #1). [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/1#discussion_r4039882404)
- Status element has no `aria-live` region, so the delayed Carrot reply is silent for screen readers (PR #2, sourced from a learning). [comment](https://github.com/coderabbit-demo/rabbitvscarrot/pull/2#discussion_r4564228634)

### Clean reviews
- **PR #6 (play vs computer):** check passed, no review threads. Minimax logic, timer handling and localStorage persistence produced no findings. That is a useful data point on signal-to-noise: findings appear when there are real issues and not on every PR. The architecture section did label the PR "High" risk while listing no concerns, which is a calibration quirk worth noting honestly.
- **PR #3 (undo-last-move):** no review threads.

## Features worth demoing
- Findings arrive with severity, a category (Security, Functional Correctness, Stability) and a "Quick win" effort tag.
- Every comment ships a "Prompt for AI Agents" block, and many ship committable diffs.
- Security findings include reachability path, exploitability and CWE id.
- Static-analysis tools (OpenGrep, HTMLHint, ast-grep) run inside the review, and their output is merged with the model's findings.
- Learnings: a finding on PR #2 and one on PR #1 cite a learned rule ("Source: Learnings", "coderabbit-global-learning").
- Misfire to be aware of: on PR #4 an ast-grep rule about React `useState` was reported against plain JS `setMode(false)`. That is a tool false positive, not a CodeRabbit finding.

## Where to add side-by-side comparisons
For each PR above, run the same diff through another reviewer and record: found / missed / false positive, and whether
it cites reachability or cross-file context. Suggested seeds, since these have clear ground truth:
1. PR #1 path traversal and `decodeURIComponent` crash.
2. PR #2 valid-JSON-wrong-type crash.
3. PR #4 `setItem`-throws partial failure.

## Log template
```
### <PR #> <short title>  (<date merged>)
- Findings: <n> (<severity breakdown>)
- Standout: <finding + link>
- Misses / false positives: <honest notes>
- Competitor result on same diff: <n/a until run>
```

### PR #6 play vs computer (2026-11-15)
- Findings: 0. CodeRabbit check passed.
- Standout: none; clean review of minimax AI + UI timer logic.
- Misses / false positives: architecture risk labelled High with no concerns listed.
- Competitor result on same diff: n/a until run.
