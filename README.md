# 🔥 pi-roast

A [pi](https://github.com/earendil-works/pi-coding-agent) extension that roasts you while you code.  

Every time you run a command, edit a file, or just sit there idle, a fresh insult appears in your footer status bar to keep you from feeling like a coding god. No repeats until the full list cycles through.

## Features

- **Curated insults** across 6 categories: deadpan/sarcastic, classic roast, passive-aggressive, tool-specific, extra spicy, and context-aware
- **Context-aware roasts** — edits to `.env`? `rm -rf`? `git push --force`? Precision strikes when we detect what you're doing
- **Failure roasts** — when a tool fails, you get roasted harder (50% chance)
- **Shuffle bag** — no back-to-back repeats; no cross-cycle repeats either
- **Tool-triggered roasts** — `bash`, `write`, `edit` always roast; `read` roasts 30% of the time
- **Idle roasts** — random insults every 45–120 seconds while you're not doing anything
- **Footer status bar** — insults linger in the footer until replaced by the next one
- **`/roast` command** — toggle roasting on/off, with state persisted across sessions
- **`/roast-me` command** — on-demand insult (works even when muted!)
- **Configurable behavior** — roast timing and probabilities can be adjusted via `pi-roast` settings
- **Minimal dependency design** — single TypeScript entry point plus `insults.json`, no npm packages needed

## Installation

### Option 1: Auto-discovery (recommended)

Copy the extension to pi's global extensions directory:

```bash
cp pi-roast.ts ~/.pi/agent/extensions/pi-roast.ts
```

Pi will auto-discover it on startup. Use `/reload` in pi to pick it up without restarting.

### Option 2: One-off test

```bash
pi -e ./pi-roast.ts
```

### Option 3: Project-local

Create `.pi/extensions/` in your project root and place `pi-roast.ts` there.

## Commands

| Command | Description |
|---------|-------------|
| `/roast` | Toggle pi-roast on/off |
| `/roast-me` | Get roasted on demand (works even when muted!) |

## How It Works

| Trigger | Behavior |
|---------|----------|
| **Session starts** | Notification: "🔥 pi-roast activated" + first insult in footer |
| **`bash` / `write` / `edit`** | 100% chance of a roast; context-aware insult if pattern matches |
| **`read`** | 30% chance of a roast |
| **Tool failure** | 50% chance of a failure-specific roast |
| **Idle time** | Random roast every 45–120 seconds |
| **`/roast`** | Toggle on/off; clears footer status when off |
| **`/roast-me`** | Immediate roast, bypasses mute |
| **Session ends / switch** | Timer cleanup, status cleared |

## Context-Aware Insults

The extension detects specific patterns in your tool calls and serves targeted insults:

| Pattern | Example Insult |
|---------|---------------|
| `rm -rf` | "rm -rf? I hope you meant that." |
| `sudo` | "sudo: because normal permissions are for normal code." |
| `git push --force` | "Force push? Bold move. Your teammates will love that." |
| `git commit` | "I hope that commit message is more than just 'fix'." |
| `npm install` | "Another dependency. Your node_modules is already a small country." |
| `.env` files | "Touching .env? What could possibly go wrong." |
| `package.json` | "Touching package.json? This ends with npm install, doesn't it." |
| `.yaml` / `.yml` files | "YAML: yet another massive headache. Good luck with the indentation." |
| `temp`/`tmp`/`hack`/`wip` files | "That file name is already an apology." |
| `README` | "Reading the README? First time?" |
| Test files | "A test file! Proof that miracles still happen." |

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

Edit `insults.json` or `pi-roast.ts`:

- **Add/remove insults** — edit `insults.json` under `general`, `failures`, or `contextual`
- **Change idle timing** — modify `pi-roast.idleMinMs` and `pi-roast.idleMaxMs` (default: 45s–120s)
- **Change read roast chance** — modify `pi-roast.readInsultChance` (default: `0.3`)
- **Change failure roast chance** — modify `pi-roast.failureInsultChance` (default: `0.5`)
- **Change unclassified tool roast chance** — modify `pi-roast.unclassifiedToolChance` (default: `0.15`)
- **Change status key** — modify `STATUS_KEY` in `pi-roast.ts` (default: `"pi-roast"`)

## Implementation Details

- **ShuffleBag** — Fisher-Yates shuffle with draw-without-replacement and cross-cycle repeat prevention
- **Idle timer reset** — tool-triggered roasts reset the idle timer to avoid awkward double-roasts
- **Context-aware roasts** — pattern matching on `bash` commands and file paths; falls back to generic shuffle bag
- **Failure detection** — checks `event.isError` on tool results; 50% chance of a failure-specific insult
- **Session lifecycle** — timer and status cleanly managed across session start, switch, and shutdown

## Uninstall

```bash
rm ~/.pi/agent/extensions/pi-roast.ts
```

Then `/reload` in pi or restart.

## License

MIT

