import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Generic Insult Pool ──────────────────────────────────────────────────────
// Mixed tones: deadpan/sarcastic, classic roast, passive-aggressive
// Rules: under 80 chars, playful only, no LLM-confusing content

const INSULTS: string[] = [
  // ── Deadpan / Sarcastic ──
  "Wow, another console.log. Bold debugging strategy.",
  "The docs called. They said you never visit.",
  "Love how you skipped the error handling like it's optional.",
  "That variable name really tells a story. A bad one.",
  "have you tried turning it off and on again?",
  "So courageous of you to write that without checking the types.",
  "Ah yes, the classic 'it works on my machine' defense.",
  "Your code and the requirements doc are in different timelines.",
  "Impressive. You managed to use git wrong.",
  "That TODO comment has been there since 2023, hasn't it.",
  "The linter just sighed audibly.",
  "Copy-paste is not an architecture pattern.",
  "Your stack overflow answer is from 2014. Just saying.",
  "Ah, the 'I'll refactor this later' comment. Sure you will.",
  "That function is doing way too much for its own good.",
  "Did you just hard-code that API key? No judgment. Okay, some judgment.",
  "Your code review would like a word.",
  "The compiler is doing its best with what you gave it.",
  "That merge conflict resolution was... optimistic.",
  "You're really testing the limits of 'any' as a type, huh.",
  "Your code reads like you were distracted. You were, weren't you.",
  "Ah, another npm install that'll bloat node_modules further.",
  "That callback hell is architecturally... ambitious.",
  "Your IDE must be really earning its linting badge today.",
  "You wrote a 200-line function and not a single comment. Hero.",
  "The type system called. It wants to press charges.",
  "I see you're using ! to silence the compiler. That'll end well.",
  "Your code has more workarounds than actual code.",
  "That's a lot of // eslint-disable-next-line for one file.",
  "The runtime called. It's filing for emancipation.",

  // ── Classic Roast ──
  "I've seen better code written by a caffeinated squirrel.",
  "Your keyboard called. It wants a vacation.",
  "That bug was you. It was always you.",
  "Your code is like onion — every layer makes me cry.",
  "You write code like someone paying by the semicolon.",
  "Even the syntax highlighter is confused.",
  "That's a big if statement. Emotional damage included.",
  "Your function has more branches than a bank.",
  "I'd explain why that's wrong but you'd just argue.",
  "Your test coverage called in sick today.",
  "That regex is a crime scene.",
  "You really said 'it's fine' and committed, didn't you.",
  "Your git history is a cry for help.",
  "That's not a bug, that's your personality.",
  "Your code reviews must be gripping. Short, but gripping.",
  "The interpreter is judging you. We all are.",
  "You deployed that on a Friday. Absolute madlad.",
  "That variable has more scope than a telescope.",
  "Your exceptions are the exception to good code.",
  "Writing code and praying is not a methodology.",
  "Your commit messages are just 'fix' and 'stuff'. Inspiring.",
  "You're the reason linters were invented.",
  "That function is so nested it needs a mailing address.",
  "Your code is the reason Stack Overflow has a downvote button.",
  "I've seen better structured code in a bowl of spaghetti.",
  "Your error handling is just... hope, isn't it.",
  "You type `any` the way some people type 'I love you' — too often.",
  "That's not legacy code. That's your code from Tuesday.",
  "Your authentication flow has more holes than Swiss cheese.",
  "The garbage collector called. It's overwhelmed.",

  // ── Passive-Aggressive ──
  "Love the confidence with which you wrote that bug.",
  "So brave of you to commit without testing.",
  "Your code works! In the same way a broken clock is right twice a day.",
  "What a creative interpretation of the requirements.",
  "I admire your commitment to not reading the docs.",
  "That's certainly one way to implement it.",
  "Your variable names are like modern art — open to interpretation.",
  "Interesting choice to handle errors by not handling them.",
  "Your code runs. Let's not examine how.",
  "The bug you just introduced has real main character energy.",
  "I see you chose violence with that regex.",
  "That's a very... personal approach to naming conventions.",
  "Your code is like a surprise party. Nobody asked for most of it.",
  "How charitable of you to leave so many bugs for the next person.",
  "Your deploys are like horror movies — full of jump scares.",
  "The spec says one thing. Your code says 'I do what I want.'",
  "I see you've chosen performance via wishful thinking.",
  "Your error messages are very... mysterious. Like a fortune cookie.",
  "What an adventurous approach to state management.",
  "Your code is technically correct. The worst kind of correct.",
  "I love how every function is 'temp' and every variable is 'data.'",
  "Your approach to caching is really more of an approach to not caching.",
  "That's a lovely try-catch block. Shame it catches nothing.",
  "Your type definitions are more suggestions than rules.",
  "I see you've discovered the 'delete everything and pray' workflow.",
  "Your architecture diagram and your code are in couples therapy.",
  "That env var name is basically a cry for help.",
  "You're using === but your logic is === nothing.",
  "Your README is just the word 'TODO' in bold.",
  "That dependency chain goes deeper than your commitment issues.",

  // ── Tool-specific ──
  "That bash command had real main character energy.",
  "Reading the docs first? Unheard of strategy.",
  "Another edit. The file really needed that.",
  "The file system appreciates your... enthusiasm.",
  "Bold of you to assume that write would work first try.",
  "Your terminal called. It's concerned.",
  "That read was purely decorative, wasn't it.",
  "So you're just going to run that bash command without thinking?",
  "The file opened itself out of self-defense after that edit.",
  "Your shell history is a safety audit waiting to happen.",
  "What a fascinating choice of arguments for that command.",
  "You read that file and learned nothing. Respect.",
  "That bash command is doing way too much. Kind of like your functions.",
  "You edited the same file three times. Consistency is a vibe.",
  "The file you just wrote is already outdated. Time marches on.",
  "That chmod command is giving me anxiety.",
  "You read the error message but understood nothing. Classic.",
  "Another `sudo`? What are you, the root of all problems?",
  "That `rm` command is giving me trust issues.",
  "You really typed `cd ..` five times instead of just using the full path.",

  // ── Extra Spicy ──
  "Your code is why AI was invented. To do it properly.",
  "You're the person who writes `// TODO: fix this` and ghosted.",
  "That function has more arguments than your last relationship.",
  "Your database queries called. They'd like a word about N+1.",
  "I've seen better state management in a goldfish.",
  "Your code is like amaze — amazing, but also a maze. A bad maze.",
  "You don't write bugs. You write features nobody asked for.",
  "That's the kind of code that makes architects reconsider their career.",
  "Your app has more memory leaks than your actual memory.",
  "Every time you push, a CI pipeline cries.",
  "Your code has more edge cases than a razor blade factory.",
  "That's not a monolith, that's a cry for architectural help.",
  "You write code like you're being timed and the timer is angry.",
  "Your linting config is just 'off' for everything, isn't it.",
  "That's the kind of solution that creates three new problems.",
  "Your branch strategy is 'push to main and hope.'",
  "You're one `!important` away from a CSS crime scene.",
  "Your Docker container has more layers than a wedding cake.",
  "That's not refactoring. That's rearranging deck chairs on the Titanic.",
  "Your PR has more comments than lines of code. Let that sink in.",
];

// ─── Failure Insults ──────────────────────────────────────────────────────────

const FAILURE_INSULTS: string[] = [
  "That command failed. Just like the last three.",
  "The error message is more readable than your code.",
  "Exit code: not zero. Just like your test coverage.",
  "Even the terminal is disappointed.",
  "That error has real main character energy.",
  "The command line said no. I agree with it.",
  "That failed exactly the way everyone expected.",
  "Error: skill issue.",
  "The process exited with sadness.",
  "That's not a bug, it's a feature demonstration.",
  "Your code threw an exception and kept living like nothing happened.",
  "The error output is longer than your documentation.",
  "Failed. Like your deployment on a Friday afternoon.",
  "That command returned an error code and a personal insult.",
  "The shell just gave up. Same energy as the rest of this project.",
  "Even the stack trace is embarrassed.",
  "That error was so bad, the terminal is blushing.",
  "The command failed. Maybe try Stack Overflow. They miss you.",
  "Error 404: competence not found.",
  "That failed so hard it's almost impressive.",
];

// ─── Context-Aware Insult Matchers ────────────────────────────────────────────

const CONTEXT_INSULTS = {
  // bash command patterns
  rm_rf: [
    "rm -rf? I hope you meant that.",
    "rm -rf: the command that separates devs from ex-devs.",
    "That rm -rf is a one-way ticket to rebuild city.",
  ],
  sudo: [
    "sudo: because normal permissions are for normal code.",
    "sudo make me a sandwich. Wait, wrong command.",
    "Another sudo? What are you, the root of all problems?",
  ],
  force_push: [
    "Force push? Bold move. Your teammates will love that.",
    "git push --force: rewriting history since forever.",
    "Force pushing. The nuclear option of collaboration.",
  ],
  npm_install: [
    "Another dependency. Your node_modules is already a small country.",
    "npm install: adding weight to a sinking ship.",
    "That dependency will outlive your project.",
  ],
  curl: [
    "Curling that URL like you know what it returns.",
    "curl and pray. The developer's creed.",
  ],
  chmod: [
    "chmod: when in doubt, make everything executable.",
    "That chmod is giving me anxiety.",
  ],
  docker: [
    "Docker: because it works on your machine wasn't enough.",
    "Your Docker container has more layers than a wedding cake.",
  ],
  kill: [
    "kill: the developer's way of saying 'I give up.'",
    "That kill signal is just you avoiding the real problem.",
  ],

  // file path patterns
  env_file: [
    "Touching .env? What could possibly go wrong.",
    "Editing .env. Bold move in production.",
    "That .env file is one typo away from an incident report.",
  ],
  package_json: [
    "Editing package.json. Here we go.",
    "Touching package.json? This ends with npm install, doesn't it.",
    "package.json: the gift that keeps on giving. Dependencies.",
  ],
  temp_file: [
    "Editing a temp file. The filename says everything.",
    "temp, tmp, hack, wip — the four horsemen of bad filenames.",
    "That file name is already an apology.",
  ],
  readme: [
    "Reading the README? First time?",
    "The README! A novel you've been avoiding.",
  ],
  config: [
    "Touching config files? Living dangerously.",
    "Config changes: the gift that keeps on breaking.",
  ],
  node_modules: [
    "You're reading node_modules. That's a cry for help.",
    "node_modules: the folder that ate your disk space.",
  ],
  test_file: [
    "Testing? How responsible of you. Didn't see that coming.",
    "A test file! Proof that miracles still happen.",
  ],
} as const;

function getContextInsult(toolName: string, input: unknown): string | null {
  if (typeof input !== "object" || input === null) return null;
  const inp = input as Record<string, unknown>;
  const command = typeof inp.command === "string" ? inp.command : "";
  const path = typeof inp.path === "string" ? inp.path : "";

  // Bash command patterns
  if (toolName === "bash" && command) {
    if (/\brm\s+-rf\b/.test(command)) return pick(CONTEXT_INSULTS.rm_rf);
    if (/git\s+push\s+--(-force|f)\b/.test(command)) return pick(CONTEXT_INSULTS.force_push);
    if (/\bsudo\b/.test(command)) return pick(CONTEXT_INSULTS.sudo);
    if (/\b(npm\s+install|yarn\s+add|pnpm\s+add)\b/.test(command)) return pick(CONTEXT_INSULTS.npm_install);
    if (/\bcurl\b/.test(command)) return pick(CONTEXT_INSULTS.curl);
    if (/\bchmod\b/.test(command)) return pick(CONTEXT_INSULTS.chmod);
    if (/\bdocker\b/.test(command)) return pick(CONTEXT_INSULTS.docker);
    if (/\bkill\b/.test(command)) return pick(CONTEXT_INSULTS.kill);
  }

  // File path patterns
  if (path) {
    if (/\.env\b/.test(path)) return pick(CONTEXT_INSULTS.env_file);
    if (/package\.json$/.test(path)) return pick(CONTEXT_INSULTS.package_json);
    if (/\/(temp|tmp|hack|wip|fix)\./i.test(path) || /\/(temp|tmp|hack|wip|fix)\//i.test(path)) return pick(CONTEXT_INSULTS.temp_file);
    if (/README/i.test(path)) return pick(CONTEXT_INSULTS.readme);
    if (/config/i.test(path) && !/node_modules/.test(path)) return pick(CONTEXT_INSULTS.config);
    if (/node_modules/.test(path)) return pick(CONTEXT_INSULTS.node_modules);
    if (/\.(test|spec)\./i.test(path)) return pick(CONTEXT_INSULTS.test_file);
  }

  return null;
}

// ─── ShuffleBag ─────────────────────────────────────────────────────────────────

class ShuffleBag<T> {
  private pool: T[];
  private remaining: T[];
  private lastDrawn: T | null = null;

  constructor(items: T[]) {
    this.pool = [...items];
    this.remaining = [];
  }

  next(): T {
    if (this.remaining.length === 0) {
      this.remaining = [...this.pool];
      this.shuffle();
      // Prevent cross-cycle repeat
      if (this.lastDrawn !== null && this.remaining.length > 1) {
        const lastIdx = this.remaining.length - 1;
        if (this.remaining[lastIdx] === this.lastDrawn) {
          const swapIdx = Math.floor(Math.random() * (this.remaining.length - 1));
          [this.remaining[lastIdx], this.remaining[swapIdx]] = [
            this.remaining[swapIdx],
            this.remaining[lastIdx],
          ];
        }
      }
    }
    const item = this.remaining.pop()!;
    this.lastDrawn = item;
    return item;
  }

  private shuffle(): void {
    for (let i = this.remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.remaining[i], this.remaining[j]] = [
        this.remaining[j],
        this.remaining[i],
      ];
    }
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const STATUS_KEY = "pi-roast";
const IDLE_MIN_MS = 45_000; // 45 seconds
const IDLE_MAX_MS = 120_000; // 120 seconds
const READ_INSULT_CHANCE = 0.3;
const FAILURE_INSULT_CHANCE = 0.5;

const HIGH_PRIORITY_TOOLS = new Set(["bash", "write", "edit"]);
const LOW_PRIORITY_TOOLS = new Set(["read"]);

// ─── Extension ──────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const bag = new ShuffleBag(INSULTS);
  const failureBag = new ShuffleBag(FAILURE_INSULTS);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let lastCtx: ExtensionContext | null = null;
  let enabled = true;

  // ── Core roast functions ──

  function roast(insult?: string): void {
    if (!lastCtx || !enabled) return;
    lastCtx.ui.setStatus(STATUS_KEY, insult ?? bag.next());
  }

  function roastAndResetIdle(insult?: string): void {
    roast(insult);
    scheduleIdleRoast();
  }

  // ── Idle timer ──

  function scheduleIdleRoast(): void {
    stopIdleRoast();
    const delay = randomBetween(IDLE_MIN_MS, IDLE_MAX_MS);
    idleTimer = setTimeout(() => {
      if (enabled) roast();
      scheduleIdleRoast();
    }, delay);
  }

  function stopIdleRoast(): void {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function clearStatus(): void {
    if (lastCtx) {
      lastCtx.ui.setStatus(STATUS_KEY, "");
    }
  }

  // ── Commands ──

  pi.registerCommand("roast", {
    description: "Toggle pi-roast on/off",
    handler: async (_args, ctx) => {
      lastCtx ??= ctx;
      enabled = !enabled;
      if (enabled) {
        ctx.ui.notify("🔥 pi-roast activated", "info");
        roast();
        scheduleIdleRoast();
      } else {
        ctx.ui.notify("🔇 pi-roast muted", "info");
        stopIdleRoast();
        clearStatus();
      }
    },
  });

  pi.registerCommand("roast-me", {
    description: "Get roasted on demand (works even when muted)",
    handler: async (_args, ctx) => {
      lastCtx ??= ctx;
      // Always roasts, even when muted — that's the point
      ctx.ui.setStatus(STATUS_KEY, bag.next());
    },
  });

  // ── Events ──

  // Session starts — activate pi-roast
  pi.on("session_start", async (_event, ctx) => {
    lastCtx = ctx;
    enabled = true;
    ctx.ui.notify("🔥 pi-roast activated", "info");
    roast();
    scheduleIdleRoast();
  });

  // Tool calls — probability-weighted roast, with context-aware insults
  pi.on("tool_call", async (event, ctx) => {
    lastCtx = ctx;
    if (!enabled) return;

    // Try context-aware insult first, fall back to shuffle bag
    const contextInsult = getContextInsult(event.toolName, event.input);

    if (HIGH_PRIORITY_TOOLS.has(event.toolName)) {
      roastAndResetIdle(contextInsult ?? undefined);
    } else if (LOW_PRIORITY_TOOLS.has(event.toolName)) {
      if (Math.random() < READ_INSULT_CHANCE) {
        roastAndResetIdle(contextInsult ?? undefined);
      }
    }
  });

  // Tool failures — bonus roast on errors
  pi.on("tool_result", async (event, ctx) => {
    lastCtx = ctx;
    if (!enabled) return;

    // Check for error indicators (event shape varies by tool)
    const isError = Boolean(
      (event as Record<string, unknown>).isError ??
      ((event as Record<string, unknown>).result as Record<string, unknown> | undefined)?.isError
    );

    if (isError && Math.random() < FAILURE_INSULT_CHANCE) {
      roastAndResetIdle(failureBag.next());
    }
  });

  // Session switching — clean up
  pi.on("session_before_switch", async () => {
    stopIdleRoast();
    clearStatus();
  });

  // Session ends — clean up
  pi.on("session_shutdown", async () => {
    stopIdleRoast();
    clearStatus();
  });
}