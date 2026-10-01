# Fastiva

Local only intermittent fasting tracker (mobile first, dark UI, no account, no backend).

## Stack

- **Language / Runtime**: TypeScript (strict), React Native 0.81, React 19
- **Framework**: Expo SDK 54, Expo Router 6 (file based routes, typed routes, React Compiler on)
- **Key dependencies**: zustand (state, persisted to AsyncStorage), expo-notifications, react-native-reanimated, react-native-svg, date-fns
- **Package manager**: npm
- **Builds**: EAS (`eas.json`: development, preview, production)

## Build approach

<TBD, set by /scope>

## Commands

```bash
# Install
npm install

# Dev server (Expo)
npm start        # or: npm run ios / npm run android / npm run web

# Lint
npm run lint

# Build
eas build --profile <development|preview|production>

# Test (Jest + jest-expo)
npm test
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Routes live in `app/` (tabs in `app/(tabs)/`: home, history, stats, settings). Keep screens thin, shared UI goes in `components/`.
- Import with the `@/` alias (maps to repo root), e.g. `@/store/fasting-store`.
- File names are kebab-case (`circular-progress-timer.tsx`). Components are named exports, except route files, which must default export.
- All app state lives in one zustand store, `store/fasting-store.ts`. Screens read it with selectors and call its actions, they do not touch AsyncStorage directly.
- Notifications, CSV export and other device side effects go through `services/`. Pure logic (stats, formatting) goes in `utils/`. Shared types in `types/index.ts`.
- Colors, spacing and type come from `constants/theme.ts`. Do not hardcode hex values in screens.
- Dark theme only (`userInterfaceStyle: dark`). Mobile first, test on a device or simulator, not just web.
- Tests sit beside the source as `*.test.ts` (settings in `test-preferences.json`). Logic in `utils/` and `store/` is covered, screens and components are not yet. Freeze the clock and mock `@/services/notifications` and AsyncStorage in store tests.
- Data is local only. Do not add accounts, a backend or network calls without approval.

## Gotchas

- Persisted store key is `fastiva-store-v1`. Changing the shape of persisted state needs a migration (`version` plus `migrate`), or existing users lose data.
- Demo data (`utils/demo-data.ts`, ids prefixed `demo-session-`) is only for the Settings demo tools, and is hidden in production. Never seed it automatically.
- Daily goal drives progress. The fasting plan (12/12 to 20/4) is optional and only drives scheduling. Changing the goal during an active fast asks: apply to current, apply to next, or cancel.
- History calendar shows only the longest fast per day. The session list shows every session.
- `store/index.ts` and `utils/index.ts` are empty (`export {}`). Import from the real files.
- `scripts/reset-project.js` is the Expo template reset script. Do not run it, it moves app code.

## Context files

<!-- Nested AGENTS.md files are listed here as they are created -->

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
