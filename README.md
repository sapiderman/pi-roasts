# 🔥 pi-roast

A [pi](https://github.com/earendil-works/pi-coding-agent) extension that roasts you while you code.

Every time you run a command, edit a file, switch models, or just sit there idle, a fresh insult appears in your status bar and widget area to keep you from feeling like a coding god. No repeats until the full list cycles through.

## Features

- **Curated insults** — 129 general, 20 failure-specific, and 17 contextual categories covering `rm -rf`, `sudo`, force push, `.env` files, YAML, and more
- **Context-aware roasts** — detects what you're doing and serves a targeted insult: editing `.env`? `rm -rf`? `git push --force`? Precision strikes
- **Model-switch roasts** — switching models with `/model` or Ctrl+P triggers a roast about your life choices
- **Failure roasts** — when a tool fails, you get roasted harder (50% chance)
- **Shuffle bag** — Fisher-Yates shuffle with draw-without-replacement and cross-cycle repeat prevention
- **Tool-triggered roasts** — `bash`, `write`, `edit` always roast; `read` roasts 30% of the time
- **Idle timer pauses** — idle timer pauses during active agent turns, resumes when idle; random insults every 45–120 seconds of inactivity
- **Widget display** — insults appear in the widget area above the editor
- **`/roast` command** — toggle roasting on/off, state persisted within the session via `appendEntry`
- **`/roast-me` command** — on-demand insult (works even when muted!)
- **Minimal dependency design** — single TypeScript entry point plus `insults.json` in the `extensions/` directory, no npm packages needed

## Installation

### Option 1: Auto-discovery (recommended)

Copy the extension to pi's global extensions directory:

```bash
cp extensions/pi-roast.ts ~/.pi/agent/extensions/pi-roast.ts
```

Pi will auto-discover it on startup. Use `/reload` in pi to pick it up without restarting.

### Option 2: One-off test

```bash
pi -e ./extensions/pi-roast.ts
```

### Option 3: Project-local

Create `.pi/extensions/` in your project root and place `extensions/pi-roast.ts` there.

## Commands

| Command | Description |
| --------- | ------------- |
| `/roast` | Toggle pi-roast on/off |
| `/roast-me` | Get roasted on demand (works even when muted!) |

## How It Works

| Trigger | Behavior |
| --------- | ---------- |
| **Session starts** | Notification: "🔥 pi-roast activated" + first insult in footer & widget |
| **`bash` / `write` / `edit`** | 100% chance of a roast; context-aware insult if pattern matches |
| **`read`** | 30% chance of a roast |
| **Other tools** | 15% chance of a roast |
| **Tool failure** | 50% chance of a failure-specific roast |
| **Model switch** | 100% chance of a model-switch roast |
| **Idle time** | Random roast every 45–120s of inactivity (paused during agent turns) |
| **`/roast`** | Toggle on/off; clears footer & widget when off |
| **`/roast-me`** | Immediate roast, bypasses mute |
| **Session ends / switch** | Timer cleanup, footer & widget cleared |

## Context-Aware Insults

The extension detects specific patterns in your tool calls and serves targeted insults:

| Pattern | Example Insult |
| --------- | --------------- |  
| `rm -rf` | "rm -rf? I hope you meant that." |
| `sudo` | "sudo: because normal permissions are for normal code." |
| `git push --force` | "Force push? Bold move. Your teammates will love that." |
| `git commit` | "I hope that commit message is more than just 'fix'." |
| `npm install` | "Another dependency. Your node_modules is already a small country." |
| `curl` | "Curling that URL like you know what it returns." |
| `chmod` | "chmod: when in doubt, make everything executable." |
| `docker` | "Docker: because 'it works on my machine' wasn't enough." |
| `kill` | "kill: the developer's way of saying 'I give up.'" |
| `.env` files | "Touching .env? What could possibly go wrong." |
| `package.json` | "Touching package.json? This ends with npm install, doesn't it." |
| `.yaml` / `.yml` files | "YAML: yet another massive headache. Good luck with the indentation." |
| `temp`/`tmp`/`hack`/`wip` files | "That file name is already an apology." |
| `README` | "Reading the README? First time?" |
| `config` files | "Touching config files? Living dangerously." |
| `node_modules` | "You're reading node_modules. That's a cry for help." |
| Test files | "A test file! Proof that miracles still happen." |

## Model-Switch Roasts

Switching models triggers a roast from a dedicated pool:

```text
Switching models? Running from your problems again.
New model, same mistakes.
Good luck with that one. It'll need it.
The model changed but your code didn't.
Maybe this one can fix what you broke.
Different model, same skill issues.
A new model won't save you from yourself.
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

Edit `insults.json` or `pi-roast.ts`:

- **Add/remove insults** — edit `insults.json` under `general`, `failures`, or `contextual`
- **Add new contextual categories** — add a key to `contextual` in `insults.json` and a matching pattern in `getContextInsult()`
- **Change idle timing** — edit `idleMinMs` and `idleMaxMs` in `DEFAULT_CONFIG` (default: 45s–120s)
- **Change read roast chance** — edit `readInsultChance` in `DEFAULT_CONFIG` (default: `0.3`)
- **Change failure roast chance** — edit `failureInsultChance` in `DEFAULT_CONFIG` (default: `0.5`)
- **Change unclassified tool roast chance** — edit `unclassifiedToolChance` in `DEFAULT_CONFIG` (default: `0.15`)
- **Add model-switch roasts** — add entries to the `MODEL_ROASTS` array in `pi-roast.ts`

## Implementation Details

- **ShuffleBag** — Fisher-Yates shuffle with draw-without-replacement and cross-cycle repeat prevention
- **Turn-aware idle** — idle timer pauses on `turn_start`, resumes on `turn_end`/`agent_end`; avoids roasts while the agent is actively working
- **Widget display** — each roast is shown in the widget area above the editor via `setWidget()`
- **Context-aware roasts** — pattern matching on `bash` commands and file paths; falls back to generic shuffle bag
- **Failure detection** — checks `event.isError` and `event.result.isError` on tool results
- **Model-switch roasts** — random selection from `MODEL_ROASTS` on `model_select`
- **Session persistence** — enabled state saved via `pi.appendEntry()` and restored from `sessionManager.getBranch()` on session start
- **Context lifecycle** — `lastCtx` invalidated on session switch/shutdown to prevent stale references; idle timer guard checks `lastCtx` before firing

## Uninstall

```bash
rm ~/.pi/agent/extensions/pi-roast.ts
```

Then `/reload` in pi or restart.

## License

MIT
