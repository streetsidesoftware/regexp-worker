# Copilot Cloud Agent Onboarding

## Repository purpose
- `regexp-worker` runs RegExp operations in a background worker to avoid blocking the main thread.
- Node entrypoint exports are in `src/index.mts` (`src/RegExpWorkerNode.ts`); browser/Deno exports are in `src/browser.ts` (`src/RegExpWorkerBrowser.ts`).

## Workspace layout
- Root package (`/`): published library code.
- `website/`: Svelte site/playground.
- `examples/`: sample usage package.

## High-value code areas
- `src/RegExpWorker.ts`: core `RegExpWorkerBase` request API and timeout handling.
- `src/scheduler/`: request scheduling / worker lifecycle.
- `src/worker/`: Node/Web worker adapters and message handling.
- `src/Procedures/`: worker-executed procedure definitions.
- `src/helpers/`: regex normalization, conversion, and evaluation helpers.

## Build, lint, and test commands
- Use Node `>=22.18.0` (CI runs Node 22/24/26).
- Use pnpm via Corepack in fresh environments:
  - `corepack pnpm install`
  - `corepack pnpm run build`
  - `corepack pnpm run lint`
  - `corepack pnpm run test`
- Useful focused commands:
  - `corepack pnpm run test:vitest`
  - `corepack pnpm run coverage`
  - `corepack pnpm run test:attw`
- Website checks (when touching `website/**`):
  - `cd website && corepack pnpm install && corepack pnpm run lint && corepack pnpm run build:site`

## Generated and derived files
- Do not hand-edit generated worker DataURL files:
  - `src/worker/workerCodeNodeDataURL.ts`
  - `src/worker/workerCodeBrowserDataURL.ts`
- Regenerate them with root build:
  - `corepack pnpm run build` (runs `build:worker`, then `scripts/build-worker.js`).
- `dist/**`, `lib/**`, and `out/**` are build outputs.

## Change guidance
- Keep Node and browser implementations behaviorally aligned (`RegExpWorkerNode.ts` and `RegExpWorkerBrowser.ts`).
- Add/adjust tests close to changed code (`src/**/*.test.ts`, plus `examples/examples.test.ts` where relevant).
- If example blocks in `README.md` are changed, refresh injected content with `corepack pnpm run build:readme`.

## Errors encountered during onboarding and work-arounds
1. `pnpm` not found in PATH in this sandbox.
   - Work-around used: run pnpm through Corepack (`corepack pnpm ...`).
2. `corepack pnpm install` failed with `ERR_PNPM_META_FETCH_FAIL` to `https://npm.jsr.io/@jsr%2Fstreetsidesoftware__regexp-worker` (DNS `ENOTFOUND`), coming from workspace/example dependencies and lockfile policy checks.
   - Work-around attempts: `corepack pnpm install --filter regexp-worker` and direct script runs; these still trigger the same lockfile policy fetch.
   - Practical mitigation: run install/validation in an environment with access to `npm.jsr.io`.
