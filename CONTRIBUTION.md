# Contributing to pi-roast

Looking to contribute to `pi-roast`? Why?! haha. This project is intentionally small and simple, so contributions are most welcome in the form of new insults, bug fixes, and quality-of-life changes.

## What to contribute

- New insults or contextual categories in `insults.json`
- Improved context detection in `extensions/context-matcher.ts` or roast dispatch behavior in `extensions/roast-engine.ts`
- Better documentation in `README.md` or `CONTRIBUTION.md`
- Bug fixes or performance improvements for the extension logic

## Getting started

1. Fork the repository and clone it locally.
2. Create a feature branch with a descriptive name, e.g. `add-npm-context-roasts`.
3. Make your changes in `insults.json`, the relevant module(s) under `extensions/`, and/or documentation files.
4. Verify your change manually by loading the extension in Pi:

```bash
pi -e ./pi-roast.ts
```

If you prefer the project-local install flow, copy the file into `.pi/extensions/` inside your project root.

## Adding or editing insults

- `insults.json` contains the roast data.
- `general` is the default insult pool.
- `failures` is used when a tool command fails.
- `contextual` holds category-specific insult arrays.

If you add a new contextual category, also add a matching rule to the `MATCH_RULES` table in `extensions/context-matcher.ts` so the extension can match that context and return the new insults.

## Style guidelines

- Keep roasts short, punchy, and readable.
- Prefer humor over cruelty.
- Avoid offensive, hateful, or discriminatory language.
- Keep the tone consistent with the existing project style.
- No profanity or explicit content (for now).
- Racism, sexism, ableism, and other forms of bigotry are a no no. Let's be nice (even to your food stealing coworker).

## Submitting changes

1. Commit your changes with a clear message.
2. Push your branch to your fork.
3. Open a pull request against the main repository.
4. In your PR description, explain what changed and why.

## Notes

- Run tests with `npm test`. Tests use vitest and cover the core modules (ShuffleBag, context matcher, roast engine, etc.).
- If you update contextual insults, double-check the matching rules in `extensions/context-matcher.ts` and consider adding a test to `extensions/__tests__/context-matcher.test.ts`.
- Will add multi language support.

Thanks for helping make `pi-roast` better and more entertaining! 🎯
