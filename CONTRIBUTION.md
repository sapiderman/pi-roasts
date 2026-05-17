# Contributing to pi-roast

Looking to contribute to `pi-roast`? Why?! haha. This project is intentionally small and simple, so contributions are most welcome in the form of new insults, bug fixes, and quality-of-life changes.

## What to contribute

- New insults or contextual categories in `insults.json`
- Improved context detection or roast behavior in `pi-roast.ts`
- Better documentation in `README.md` or `CONTRIBUTION.md`
- Bug fixes or performance improvements for the extension logic

## Getting started

1. Fork the repository and clone it locally.
2. Create a feature branch with a descriptive name, e.g. `add-npm-context-roasts`.
3. Make your changes in `insults.json`, `pi-roast.ts`, and/or documentation files.
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

If you add a new contextual category, also update `pi-roast.ts` so the extension can match that context and return the new insults.

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

- This project does not currently include an automated test suite, so manual verification is the primary validation method. Will add tests when i get round to it.
- If you update contextual insults, double-check the matching logic in `pi-roast.ts`.
- Will add multi language support.

Thanks for helping make `pi-roast` better and more entertaining! 🎯
