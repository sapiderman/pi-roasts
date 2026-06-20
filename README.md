# 🔥 pi-roast

A [pi](https://github.com/earendil-works/pi-coding-agent) extension that roasts you while you code.

Every time you run a command, edit a file, switch models, or just sitting there waiting for 5 o'clock to come around, get a fresh roast in your widget area.

## Features

- **Curated insults** — 203 general, 59 failure-specific, and 30 contextual categories covering `rm -rf`, `sudo`, force push, `.env` files, YAML, and more
- **Context-aware roasts** — detects what you're doing and serves a targeted insult: editing `.env`? `rm -rf`? `git push --force`? Precision strikes
- **Model-switch roasts** — switching models with `/model` or Ctrl+P triggers a roast about your life choices (12-entry pool)
- **Failure roasts** — when a tool fails, you get roasted harder (50% chance)
- **Shuffle bag** — Fisher-Yates shuffle with draw-without-replacement and cross-cycle repeat prevention
- **Tool-triggered roasts** — `bash`, `write`, `edit` always roast; `read` roasts 30% of the time; unclassified tools roast 15% of the time
- **Turn-aware idle timer** — pauses during active agent turns, resumes when idle; random insults every 45–120 seconds of inactivity
- **Widget display** — insults appear in the widget area above the editor
- **`/roast` command** — toggle roasting on/off, state persisted within the session via `appendEntry`
- **`/roast-me` command** — on-demand insult (works even when muted!)
- **`/roast-color` command** — change the roast text color to any theme color
- **Minimal dependency design** — a small set of TypeScript modules plus `insults.json` in the `extensions/` directory; no runtime npm packages needed (`vitest` is dev-only, for the test suite)

## Installation

### Option 1: pi install

```bash
pi install npm:pi-roasts
```

pi will automatically download and install the extension to `~/.pi/agent/extensions/pi-roast.ts`.

### Option 2: Manual install

```bash
npm install pi-roasts
```

## Commands

| Command | Description |
| --------- | ------------- |
| `/roast` | Toggle pi-roast on/off |
| `/roast-me` | Get roasted on demand (works even when muted!) |
| `/roast-color <color>` | Set roast text color (see theme color options below) |

### `/roast-color` options

Valid theme color names: `text`, `accent`, `muted`, `dim`, `success`, `error`, `warning`, `border`, `borderAccent`, `borderMuted`

```bash
/roast-color error    # red roasts
/roast-color accent   # default
/roast-color muted    # subtle
```

## How It Works

| Trigger                       | Behavior                                                             |
| ----------------------------- | -------------------------------------------------------------------- |
| **Session starts**            | Notification: "🔥 pi-roast activated" + first insult in widget       |
| **`bash` / `write` / `edit`** | 100% chance of a roast; context-aware insult if pattern matches      |
| **`read`**                    | 30% chance of a roast                                                |
| **Other tools**               | 15% chance of a roast                                                |
| **Tool failure**              | 50% chance of a failure-specific roast                               |
| **Model switch**              | 100% chance of a model-switch roast                                  |
| **Idle time**                 | Random roast every 45–120s of inactivity (paused during agent turns) |
| **`/roast`**                  | Toggle on/off; clears widget when off                                |
| **`/roast-me`**               | Immediate roast, bypasses mute                                       |
| **Session ends / switch**     | Timer cleanup, widget cleared                                        |

## Security

Roasts are generated locally from a curated list of insults, contexts are triggered from pi tool usage. No external API calls or network requests are made. The extension does not read or transmit your code, files, or commands.

## Context-Aware Insults

The extension detects specific patterns in your tool calls and serves targeted insults:

| Pattern | Example Insult |
| -------- | ------------- |
| `rm -rf` | "rm -rf? I hope you meant that." |  
| `sudo` | "sudo: because normal permissions are for normal code." |
| `git push --force` / `git push -f` | "Force push? Bold move. Your teammates will love that." |
| `git commit` (bash or GitHub/Git wrapper tools) | "I hope that commit message is more than just 'fix'." |
| `npm install` / `yarn add` / `pnpm add` | "Another dependency. Your node_modules is already a small country." |
| `curl` | "Curling that URL like you know what it returns." |
| `chmod` | "chmod: when in doubt, make everything executable." |
| `docker` | "Docker: because 'it works on my machine' wasn't enough." |
| `kill` | "kill: the developer's way of saying 'I give up.'" |
| `docker-compose` | "docker-compose up: praying that all the services start in the right order." |
| `ssh` | "SSH into prod? Bold. Reckless. Inevitable." |
| `aws` | "Your AWS bill has more line items than your feature backlog." |
| `kubectl` / `helm` | "Your pod is in CrashLoopBackOff and you're reading the logs like they'll apologize." |
| `crontab` / cron dirs | "That cron job runs at midnight. Production disagrees with midnight." |
| `cargo` / `.rs` files | "The borrow checker is not being mean to you. It's being honest." |
| `go build`/`run`/`test` / `.go` files | "if err != nil { log.Fatal(err) } is not a retry strategy." |
| `make` / `makefile` | "A Makefile. Keeping the dream of 1977 alive." |
| `grep` | "Grepping for answers because reading your own code is too hard." |
| `python` | "Python: where indentation is load-bearing. You of all people should be careful." |
| `psql` / `mysql` / `sqlite3` | "SELECT * in production. Your DBA is writing a strongly-worded email." |
| AI tool names (`ask`/`prompt`/`ai_`/`llm_`/`gpt_`/`copilot`/`anthropic`/`gemini`) | "You asked the AI to write tests. For the AI-written code. We're in a recursion loop now." |
| `.env` files | "Touching .env? What could possibly go wrong." |
| `package.json` | "Touching package.json? This ends with npm install, doesn't it." |
| `.yaml` / `.yml` files | "YAML: yet another massive headache. Good luck with the indentation." |
| `temp`/`tmp`/`hack`/`wip`/`fix` files | "That file name is already an apology." |
| `README` | "Reading the README? First time?" |
| `config` files (excl. `node_modules`) | "Touching config files? Living dangerously." |
| `node_modules` | "You're reading node_modules. That's a cry for help." |
| Test files (`.test.` / `.spec.`) | "A test file! Proof that miracles still happen." |
| TypeScript files (`.ts` / `.tsx`) | "TypeScript: so you can be wrong with more precision." |

## Model-Switch Roasts

Switching models triggers a roast from a dedicated pool of 12:

```text
Switching models? Running from your problems again.
New model, same mistakes.
Good luck with that one. It'll need it.
The model changed but your code didn't.
Maybe this one can fix what you broke.
Different model, same skill issues.
A new model won't save you from yourself.
Opus called. They want their tokens back.
New model, same dev. Try harder.
No. No. Don't change models. Change developers!
What? You're calling ALL the models to help you.
New model? Have you tried baking instead of coding?
```

## Sample Insults

```text
Your code is why AI was invented. To do it properly.
That function has more arguments than your last relationship.
Another `sudo`? What are you, the root of all problems?
Your git history is a cry for help.
I've seen better state management in a goldfish.
That regex is a crime scene.
You write code like someone paying by the semicolon.
Love the confidence with which you wrote that bug.
```

## Failure Insults

When a tool command fails, you get special treatment:

```text
That command failed. Just like the last three.
Error: skill issue.
The process exited with sadness.
Even the stack trace is embarrassed.
Error 404: competence not found.
```

## Customization

Edit `insults.json` or the modules in `extensions/`:

- **Add/remove insults** — edit `insults.json` under `general`, `failures`, or `contextual`
- **Add new contextual categories** — add a key to `contextual` in `insults.json` and a matching rule to the `MATCH_RULES` table in `extensions/context-matcher.ts`
- **Change idle timing** — edit `idleMinMs`/`idleMaxMs` in the `createIdleScheduler({ ... })` call in `extensions/pi-roast.ts` (default: 45s–120s)
- **Change read roast chance** — edit `readInsultChance` in the `createRoastEngine({ config: { ... } })` call in `extensions/pi-roast.ts` (default: `0.3`)
- **Change failure roast chance** — edit `failureInsultChance` in the same config (default: `0.5`)
- **Change unclassified tool roast chance** — edit `unclassifiedToolChance` in the same config (default: `0.15`)
- **Add model-switch roasts** — add entries to the `modelRoasts` array in `extensions/pi-roast.ts` (wrapped into a `ShuffleBag`)
- **Change roast color** — use `/roast-color <name>` at runtime, or edit the `let color` default in `extensions/pi-roast.ts`

## Implementation Details

- **ShuffleBag** — Fisher-Yates shuffle with draw-without-replacement and cross-cycle repeat prevention
- **Turn-aware idle** — idle timer pauses on `turn_start`, resumes on `turn_end`/`agent_end`; avoids roasts while the agent is actively working
- **Widget display** — each roast is shown in the widget area above the editor via `setWidget()`
- **Context-aware roasts** — pattern matching on `bash` commands and file paths; also detects commits via GitHub/Git wrapper tools; falls back to generic shuffle bag
- **Failure detection** — checks `event.isError` and `event.result.isError` on tool results
- **Model-switch roasts** — drawn from `modelBag` (ShuffleBag, no-repeat) on `model_select`
- **Session persistence** — enabled state saved via `pi.appendEntry()` and restored from `sessionManager.getBranch()` on session start
- **Context lifecycle** — `currentUi` invalidated on `session_before_switch` and `session_shutdown` to prevent stale references; idle roast guard checks `enabled` before firing
- **Theme color validation** — `/roast-color` validates against the known `ThemeFgColor` union at runtime
- **Hooked events** — `session_start`, `turn_start`, `turn_end`, `agent_end`, `tool_call`, `tool_result`, `model_select`, `session_before_switch`, `session_shutdown`

## Uninstall

```bash
rm ~/.pi/agent/extensions/pi-roast.ts
```

Then `/reload` in pi or restart.

## Contributing

See [CONTRIBUTION.md](./CONTRIBUTION.md) for guidelines on adding insults, contextual categories, and submitting PRs.

## License

MIT
