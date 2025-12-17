# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the extension code: `background.ts` (lifecycle/permissions), `content-script.ts`, UI surfaces (`popup.tsx`, `prompt.tsx`, `options.tsx`), and feature modules under `components/`, `services/`, `stores/`, `providers/`, `hooks/`, and `styles/`.
- `manifest/` contains browser-targeted manifest assets; `dist/` is the compiled output created by the build scripts (do not edit by hand).
- `script/` has the esbuild-based bundler (`build.js`) and packaging helper (`package.sh`).
- `test/` supplies a local Bifrost signing node and relay (`test/src/*`) plus scripts (`test/scripts/*`) and `config.example.json` for local credentials.
- Path alias `@/*` resolves to `src/*` (see `tsconfig.json`); prefer it over long relative paths.

## Build, Test, and Development Commands
- Install once: `npm install`.
- Build Chrome bundle: `npm run build`; Firefox variant: `npm run build:firefox`; production-minified builds: `npm run build:prod` or `npm run build:firefox:prod`. Outputs land in `dist/`.
- Package zips for store uploads: `npm run package[:chrome|:firefox]` (archives in `build/`).
- Run local signing node/relay for integration: `npm run start dev` (both), or `npm run start:node` / `npm run start:relay`; edit `test/config.json` from the provided example before starting.
- Generate FROST shares for testing: `npm run keygen [<nsec>]`.
- Firefox live run/lint: `npm run firefox:run` (launches `web-ext run -s dist`) and `npm run firefox:lint`.

## Coding Style & Naming Conventions
- TypeScript, strict mode, ESNext/NodeNext modules; favor named exports.
- 2-space indentation, no trailing semicolons, and aligned imports where it aids readability; keep existing spacing patterns.
- Use camelCase for functions/variables, PascalCase for React components, and UPPER_SNAKE_CASE for shared constants in `const.ts`; keep filenames lowercase with dashes or the existing pattern.
- Reuse shared types in `schema.ts` / `types/` and helper utilities in `lib/` and `services/`; avoid duplicating parsing or permission logic.

## Testing Guidelines
- Automated unit tests are not present; rely on build-time type checks plus manual flows.
- Smoke test after changes: `npm run build`, then load `dist/` as an unpacked extension in Chrome (or use `npm run firefox:run`) and exercise NIP-07 signing, prompts, and options save/load.
- For node/relay features, bring up the local services (`npm run start dev`) and confirm event signing/relay traffic; keep `test/config.json` out of version control.

## Commit & Pull Request Guidelines
- Write concise, imperative commits (e.g., “fix prompt queue ordering”); prefixes like `fix:` are acceptable when meaningful. Keep subjects ≲72 chars; add a short body for rationale or risk.
- PRs should include: summary of change and motivation, test notes (commands + browsers used), linked issues, and screenshots/GIFs for UI-facing updates (popup/options/prompt). Mention any manifest/version impacts.
- Commit source only—exclude `dist/`, packaged archives, and private config or key material.

## Security & Configuration Tips
- Never commit secrets (nsec shares, group credentials, API keys). Populate `test/config.json` locally from `config.example.json` and ensure it stays untracked.
- When sharing logs or repro steps, redact signer IDs and relay URLs unless they are public test values.***
